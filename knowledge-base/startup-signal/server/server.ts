import { createApp, server, lakebase } from '@databricks/appkit';
import type { Request, Response } from 'express';
import type { QueryResult, QueryResultRow } from 'pg';
import express from 'express';
import { z } from 'zod';

/**
 * Startup Signal — a live SaaS metrics dashboard backed by Lakebase Postgres.
 *
 * Auth model: this app runs in an OBO ("on-behalf-of user") app space, so every
 * database call goes through `appkit.lakebase.asUser(req)`. Queries execute as
 * the signed-in Databricks user (in preview, the editor identity). The app
 * service principal is never used for data access.
 */

interface Db {
  query<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
}

const PLAN_CATALOG = [
  { plan: 'Free', mrr: 0, weight: 18 },
  { plan: 'Starter', mrr: 49, weight: 30 },
  { plan: 'Pro', mrr: 199, weight: 28 },
  { plan: 'Team', mrr: 499, weight: 17 },
  { plan: 'Enterprise', mrr: 1499, weight: 7 },
] as const;

const PLAN_NAMES = PLAN_CATALOG.map((p) => p.plan);
const STATUSES = ['active', 'trial', 'churned'] as const;

// ---- Deterministic demo-data generator ------------------------------------
type SeedRow = {
  name: string;
  email: string;
  company: string;
  plan: string;
  mrr: number;
  status: string;
  created_at: string;
};

function generateSeed(): SeedRow[] {
  // Small LCG so the seeded dataset is stable across restarts.
  let s = 20260117;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  const weightedPlan = () => {
    const total = PLAN_CATALOG.reduce((a, p) => a + p.weight, 0);
    let r = rand() * total;
    for (const p of PLAN_CATALOG) {
      if ((r -= p.weight) <= 0) return p;
    }
    return PLAN_CATALOG[0];
  };
  const weightedStatus = () => {
    const r = rand();
    if (r < 0.74) return 'active';
    if (r < 0.86) return 'trial';
    return 'churned';
  };

  const first = ['Ava', 'Liam', 'Noah', 'Emma', 'Olivia', 'Sofia', 'Mason', 'Ethan', 'Mia', 'Lucas', 'Amelia', 'Harper', 'Elijah', 'Aria', 'Leo', 'Nora', 'Isla', 'Kai', 'Maya', 'Ruby', 'Ezra', 'Luna', 'Finn', 'Ivy', 'Theo', 'Nina', 'Omar', 'Priya', 'Wei', 'Yuki', 'Diego', 'Zara', 'Hugo', 'Sana', 'Milo', 'Freya'];
  const last = ['Chen', 'Patel', 'Kim', 'Garcia', 'Nguyen', 'Smith', 'Johnson', 'Okafor', 'Rossi', 'Muller', 'Silva', 'Haddad', 'Kowalski', 'Tanaka', 'Ivanov', 'Dubois', 'Costa', 'Andersson', 'Reyes', 'Khan'];
  const companies = ['Northwind', 'Acme', 'Lumen', 'Orbit', 'Vertex', 'Cobalt', 'Nimbus', 'Quanta', 'Sable', 'Pike', 'Mossly', 'Harbor', 'Atlas', 'Beacon', 'Deltawave', 'Ember', 'Forge', 'Glint', 'Helix', 'Irident'];

  const rows: SeedRow[] = [];
  const now = new Date();
  let idx = 0;
  for (let m = 11; m >= 0; m--) {
    // Growth curve: recent months sign up more customers.
    const count = 3 + Math.round((12 - m) * 0.8) + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      idx += 1;
      const name = `${pick(first)} ${pick(last)}`;
      const company = pick(companies);
      const email = `${name.toLowerCase().replace(/ /g, '.')}.${idx}@${company.toLowerCase()}.com`;
      const p = weightedPlan();
      const status = weightedStatus();
      const day = 1 + Math.floor(rand() * 27);
      const hour = Math.floor(rand() * 24);
      const d = new Date(now.getFullYear(), now.getMonth() - m, day, hour, 0, 0);
      rows.push({ name, email, company, plan: p.plan, mrr: p.mrr, status, created_at: d.toISOString() });
    }
  }
  return rows;
}

// ---- Lazy, idempotent schema init + seed (runs once per process) ----------
// Schema creation (CREATE SCHEMA/TABLE, GRANT, seed INSERT) runs lazily on the
// first authenticated request. Because queries use OBO (asUser) credentials, the
// first visitor must have DDL privileges on the Lakebase project — the person
// who clicked Open in Databricks or ran bundle deploy. They own the Lakebase
// project and are the first to open the app.
let readyPromise: Promise<void> | null = null;

async function doSetup(db: Db): Promise<void> {
  await db.query(`CREATE SCHEMA IF NOT EXISTS app`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS app.customers (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      company     TEXT NOT NULL,
      plan        TEXT NOT NULL,
      mrr         NUMERIC NOT NULL DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'active',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  // Sample-only: PUBLIC covers every Postgres role in this Lakebase project,
  // not just app users. Tighten this for anything beyond a demo.
  await db.query(`GRANT USAGE ON SCHEMA app TO PUBLIC`);
  await db.query(`GRANT SELECT, INSERT ON app.customers TO PUBLIC`);
  await db.query(`GRANT USAGE ON SEQUENCE app.customers_id_seq TO PUBLIC`);

  const { rows } = await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM app.customers`);
  if (Number(rows[0].n) === 0) {
    const seed = generateSeed();
    const values: unknown[] = [];
    const tuples = seed.map((r, i) => {
      const b = i * 7;
      values.push(r.name, r.email, r.company, r.plan, r.mrr, r.status, r.created_at);
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7})`;
    });
    await db.query(
      `INSERT INTO app.customers (name,email,company,plan,mrr,status,created_at) VALUES ${tuples.join(',')}`,
      values,
    );
  }
}

async function ensureReady(db: Db): Promise<void> {
  if (!readyPromise) {
    readyPromise = doSetup(db).catch((err) => {
      readyPromise = null; // allow a retry on the next request
      throw err;
    });
  }
  return readyPromise;
}

// ---- Validation ------------------------------------------------------------
const NewCustomer = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  plan: z.enum(PLAN_NAMES as [string, ...string[]]),
  mrr: z.number().min(0).max(1_000_000),
  status: z.enum(STATUSES).default('active'),
});

function fail(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[startup-signal]', message);
  res.status(500).json({ error: 'Internal server error' });
}

/** Safely coerce an Express query param (string | string[] | ParsedQs) to a trimmed string. */
function queryStr(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * In preview (NODE_ENV=development) the Databricks SDK authenticates as the
 * editor identity, but the platform also injects DATABRICKS_CLIENT_ID (the app
 * service principal). Left alone, the service-principal pool would try to log
 * in as the SP client id using an OAuth token minted for the editor — a
 * username/token mismatch. Aligning the pool user with the editor identity
 * makes local dev work. In production this stays unset, so all data access
 * flows through the OBO (`asUser`) per-user pools.
 */
async function resolveDevUser(): Promise<string | undefined> {
  if (process.env.NODE_ENV !== 'development') return undefined;
  try {
    const { WorkspaceClient } = await import('@databricks/sdk-experimental');
    const me = await new WorkspaceClient({}).currentUser.me();
    return me.userName ?? undefined;
  } catch (err) {
    console.warn('[startup-signal] could not resolve dev user:', err instanceof Error ? err.message : err);
    return undefined;
  }
}

/**
 * Resolve PGHOST from LAKEBASE_ENDPOINT if the platform hasn't injected it.
 * LAKEBASE_ENDPOINT is the resource path (e.g. projects/starter/branches/production/endpoints/primary).
 * We authenticate with the app service principal's OAuth client credentials
 * (DATABRICKS_CLIENT_ID / DATABRICKS_CLIENT_SECRET — both injected by the platform)
 * and call the Postgres REST API to fetch the endpoint's host. This makes the DAB
 * portable — no hardcoded host, works in any workspace.
 *
 * Note: the SDK's built-in credential providers were tried first but crashed at
 * runtime due to header/token mismatches in the AppKit runtime context. This direct
 * fetch approach is more reliable here and has no extra dependencies.
 */
async function resolvePgHost(): Promise<void> {
  if (process.env.PGHOST) return; // Platform already injected it.

  const endpointPath = process.env.LAKEBASE_ENDPOINT;
  if (!endpointPath) {
    throw new Error('PGHOST not set and LAKEBASE_ENDPOINT not set — cannot resolve Postgres host');
  }

  let host = process.env.DATABRICKS_HOST;
  if (!host) throw new Error('DATABRICKS_HOST not set — cannot call Postgres API');
  if (!host.startsWith('http')) host = `https://${host}`;

  const clientId = process.env.DATABRICKS_CLIENT_ID;
  const clientSecret = process.env.DATABRICKS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('DATABRICKS_CLIENT_ID / DATABRICKS_CLIENT_SECRET not set — cannot authenticate to Postgres API');
  }

  console.log('[startup-signal] resolving PGHOST from', endpointPath);

  // OAuth client-credentials token exchange (standard Databricks OIDC endpoint).
  const tokenRes = await fetch(`${host}/oidc/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'all-apis',
    }),
  });
  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`OAuth token exchange failed (${tokenRes.status}): ${body}`);
  }
  const tokenData = (await tokenRes.json()) as { access_token: string };

  // Fetch the endpoint — the host is in the response body.
  const res = await fetch(`${host}/api/2.0/postgres/${endpointPath}`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Postgres API ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { status?: { hosts?: { host?: string } } };
  const pgHost = data.status?.hosts?.host;
  if (!pgHost) throw new Error(`could not resolve host from endpoint ${endpointPath}`);
  process.env.PGHOST = pgHost;
  console.log('[startup-signal] resolved PGHOST =', pgHost);
}

try {
  await resolvePgHost();
} catch (err) {
  console.error('[startup-signal] Failed to resolve PGHOST:', err instanceof Error ? err.message : err);
  process.exit(1);
}

const devUser = await resolveDevUser();

await createApp({
  plugins: [server(), lakebase(devUser ? { pool: { user: devUser } } : {})],
  onPluginsReady(appkit) {
    const getDb = (req: Request): Db => appkit.lakebase.asUser(req);

    appkit.server.extend((app) => {
      app.use(express.json());

      // Who is the query running as? Demonstrates OBO execution identity.
      app.get('/api/whoami', async (req: Request, res: Response) => {
        try {
          const db = getDb(req);
          const { rows } = await db.query<{ who: string; db: string }>(
            'SELECT current_user AS who, current_database() AS db',
          );
          const forwarded = req.header('x-forwarded-email') || req.header('x-forwarded-preferred-username');
          res.json({ user: forwarded || rows[0].who, dbUser: rows[0].who, database: rows[0].db });
        } catch (err) {
          fail(res, err);
        }
      });

      // Headline KPIs.
      app.get('/api/overview', async (req: Request, res: Response) => {
        try {
          const db = getDb(req);
          await ensureReady(db);
          const { rows } = await db.query(`
            SELECT
              COUNT(*)::int                                            AS total_customers,
              (COUNT(*) FILTER (WHERE status = 'active'))::int         AS active_customers,
              (COUNT(*) FILTER (WHERE status = 'trial'))::int          AS trial_customers,
              (COUNT(*) FILTER (WHERE status = 'churned'))::int        AS churned_customers,
              COALESCE(SUM(mrr) FILTER (WHERE status = 'active'), 0)::float8 AS mrr,
              COALESCE(AVG(mrr) FILTER (WHERE status = 'active' AND mrr > 0), 0)::float8 AS arpa
            FROM app.customers
          `);
          res.json(rows[0]);
        } catch (err) {
          fail(res, err);
        }
      });

      // Cumulative active MRR by month (last 12 months).
      app.get('/api/mrr-trend', async (req: Request, res: Response) => {
        try {
          const db = getDb(req);
          await ensureReady(db);
          const { rows } = await db.query(`
            WITH months AS (
              SELECT generate_series(
                date_trunc('month', now()) - interval '11 months',
                date_trunc('month', now()),
                interval '1 month'
              ) AS month
            )
            SELECT
              to_char(m.month, 'Mon ''YY')                                      AS month,
              (COALESCE(SUM(c.mrr) FILTER (WHERE c.status = 'active'), 0))::float8 AS new_mrr,
              (COUNT(c.id) FILTER (WHERE c.status = 'active'))::int               AS new_customers,
              (
                SELECT COALESCE(SUM(c2.mrr), 0)::float8
                FROM app.customers c2
                WHERE c2.status = 'active'
                  AND date_trunc('month', c2.created_at) <= m.month
              ) AS cumulative_mrr
            FROM months m
            LEFT JOIN app.customers c
              ON date_trunc('month', c.created_at) = m.month
            GROUP BY m.month
            ORDER BY m.month
          `);
          res.json(rows);
        } catch (err) {
          fail(res, err);
        }
      });

      // Revenue + customer mix by plan.
      app.get('/api/plan-breakdown', async (req: Request, res: Response) => {
        try {
          const db = getDb(req);
          await ensureReady(db);
          const { rows } = await db.query(`
            SELECT
              plan,
              COUNT(*)::int                                                  AS customers,
              (COALESCE(SUM(mrr) FILTER (WHERE status = 'active'), 0))::float8 AS mrr
            FROM app.customers
            GROUP BY plan
            ORDER BY mrr DESC, customers DESC
          `);
          res.json(rows);
        } catch (err) {
          fail(res, err);
        }
      });

      // Searchable / filterable customer list.
      app.get('/api/customers', async (req: Request, res: Response) => {
        try {
          const db = getDb(req);
          await ensureReady(db);
          const search = queryStr(req.query.search);
          const plan = queryStr(req.query.plan);
          const status = queryStr(req.query.status);
          const { rows } = await db.query(
            `
            SELECT id, name, email, company, plan, mrr::float8 AS mrr, status, created_at
            FROM app.customers
            WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR company ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
              AND ($2 = '' OR plan = $2)
              AND ($3 = '' OR status = $3)
            ORDER BY created_at DESC
            LIMIT 200
          `,
            [search, plan, status],
          );
          res.json(rows);
        } catch (err) {
          fail(res, err);
        }
      });

      // Create a customer (live write-back to Postgres).
      app.post('/api/customers', async (req: Request, res: Response) => {
        const parsed = NewCustomer.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
          return;
        }
        try {
          const db = getDb(req);
          await ensureReady(db);
          const c = parsed.data;
          const { rows } = await db.query(
            `INSERT INTO app.customers (name, email, company, plan, mrr, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, email, company, plan, mrr::float8 AS mrr, status, created_at`,
            [c.name, c.email, c.company, c.plan, c.mrr, c.status],
          );
          res.status(201).json(rows[0]);
        } catch (err) {
          fail(res, err);
        }
      });
    });
  },
}).catch(console.error);
