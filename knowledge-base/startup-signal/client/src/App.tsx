import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AreaChart,
  DonutChart,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@databricks/appkit-ui/react';
import {
  Activity,
  CircleDollarSign,
  Database,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';

// ---- Types ----------------------------------------------------------------
type Overview = {
  total_customers: number;
  active_customers: number;
  trial_customers: number;
  churned_customers: number;
  mrr: number;
  arpa: number;
};
type TrendRow = { month: string; new_mrr: number; new_customers: number; cumulative_mrr: number };
type PlanRow = { plan: string; customers: number; mrr: number };
type Customer = {
  id: number;
  name: string;
  email: string;
  company: string;
  plan: string;
  mrr: number;
  status: string;
  created_at: string;
};
type WhoAmI = { user: string; dbUser: string; database: string };

const PLANS = ['Free', 'Starter', 'Pro', 'Team', 'Enterprise'];
const PLAN_DEFAULT_MRR: Record<string, number> = { Free: 0, Starter: 49, Pro: 199, Team: 499, Enterprise: 1499 };
const STATUSES = ['active', 'trial', 'churned'];

// ---- Formatting -----------------------------------------------------------
const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdExact = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const num = (n: number) => n.toLocaleString('en-US');
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ---- Data helpers ---------------------------------------------------------
function readError(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const e = (body as { error?: unknown }).error;
    if (typeof e === 'string') return e;
  }
  return `Request failed (${status})`;
}

function useApi<T>(url: string, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(url)
      .then(async (r) => {
        const body: unknown = await r.json().catch(() => null);
        if (!r.ok) throw new Error(readError(body, r.status));
        return body as T;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  return { data, loading, error };
}

// ---- Small building blocks ------------------------------------------------
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function StatusBadge({ status }: { status: string }) {
  const variant: BadgeVariant =
    status === 'active' ? 'default' : status === 'trial' ? 'secondary' : 'destructive';
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

function KpiCard({
  label,
  icon,
  value,
  sub,
  loading,
}: {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {loading ? <Skeleton className="h-8 w-28" /> : value}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">
        {loading ? <Skeleton className="h-4 w-32" /> : sub}
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[280px] w-full" />;
}

function InlineError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Couldn't load data</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// ---- Add customer dialog --------------------------------------------------
function AddCustomerDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('Pro');
  const [mrr, setMrr] = useState<string>(String(PLAN_DEFAULT_MRR['Pro']));
  const [status, setStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setCompany('');
    setEmail('');
    setPlan('Pro');
    setMrr(String(PLAN_DEFAULT_MRR['Pro']));
    setStatus('active');
    setError(null);
  };

  const handlePlan = (p: string) => {
    setPlan(p);
    setMrr(String(PLAN_DEFAULT_MRR[p] ?? 0));
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, plan, mrr: Number(mrr), status }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readError(body, res.status));
      setOpen(false);
      reset();
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const valid = name.trim() && company.trim() && /.+@.+\..+/.test(email) && Number(mrr) >= 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>Writes a new row to Postgres as the signed-in user.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-company">Company</Label>
            <Input id="c-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Analytical Engines" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ada@example.com" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2 col-span-1">
              <Label>Plan</Label>
              <Select value={plan} onValueChange={handlePlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 col-span-1">
              <Label htmlFor="c-mrr">MRR ($)</Label>
              <Input id="c-mrr" type="number" min={0} value={mrr} onChange={(e) => setMrr(e.target.value)} />
            </div>
            <div className="grid gap-2 col-span-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <InlineError message={error} />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!valid || submitting}>
            {submitting ? 'Saving…' : 'Create customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- KPI row --------------------------------------------------------------
function KpiRow({ version }: { version: number }) {
  const { data, loading, error } = useApi<Overview>('/api/overview', [version]);
  const { data: trend } = useApi<TrendRow[]>('/api/mrr-trend', [version]);

  const mrrDelta = useMemo(() => {
    if (!trend || trend.length < 2) return null;
    const last = trend[trend.length - 1].cumulative_mrr;
    const prev = trend[trend.length - 2].cumulative_mrr;
    return last - prev;
  }, [trend]);

  if (error) return <InlineError message={error} />;

  const churnRate =
    data && data.active_customers + data.churned_customers > 0
      ? (data.churned_customers / (data.active_customers + data.churned_customers)) * 100
      : 0;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Monthly recurring revenue"
        icon={<CircleDollarSign className="h-4 w-4" />}
        loading={loading}
        value={data ? usd(data.mrr) : null}
        sub={
          mrrDelta !== null ? (
            <span className="inline-flex items-center gap-1" style={{ color: mrrDelta >= 0 ? 'var(--success)' : 'var(--destructive)' }}>
              <TrendingUp className="h-3.5 w-3.5" />
              {mrrDelta >= 0 ? '+' : ''}
              {usd(mrrDelta)} vs last month
            </span>
          ) : (
            'Active subscriptions'
          )
        }
      />
      <KpiCard
        label="Active customers"
        icon={<Users className="h-4 w-4" />}
        loading={loading}
        value={data ? num(data.active_customers) : null}
        sub={data ? `${num(data.trial_customers)} on trial` : null}
      />
      <KpiCard
        label="Avg revenue / account"
        icon={<Activity className="h-4 w-4" />}
        loading={loading}
        value={data ? usd(data.arpa) : null}
        sub="Paying accounts only"
      />
      <KpiCard
        label="Churn rate"
        icon={<UserRound className="h-4 w-4" />}
        loading={loading}
        value={data ? `${churnRate.toFixed(1)}%` : null}
        sub={data ? `${num(data.churned_customers)} churned of ${num(data.total_customers)} total` : null}
      />
    </div>
  );
}

// ---- Charts ---------------------------------------------------------------
function ChartsRow({ version }: { version: number }) {
  const { data: trend, loading: tLoading, error: tError } = useApi<TrendRow[]>('/api/mrr-trend', [version]);
  const { data: plans, loading: pLoading, error: pError } = useApi<PlanRow[]>('/api/plan-breakdown', [version]);

  const revenueByPlan = useMemo(() => (plans ?? []).filter((p) => p.mrr > 0), [plans]);

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Cumulative active MRR</CardTitle>
          <CardDescription>Sum of MRR from currently active customers, by signup month · last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {tError ? (
            <InlineError message={tError} />
          ) : tLoading ? (
            <ChartSkeleton />
          ) : (
            <AreaChart
              data={trend ?? []}
              xKey="month"
              yKey="cumulative_mrr"
              height={280}
              colorPalette="categorical"
              valueFormatter={(v) => usd(Number(v))}
              ariaLabel="Cumulative monthly recurring revenue over the last 12 months"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by plan</CardTitle>
          <CardDescription>Share of active MRR</CardDescription>
        </CardHeader>
        <CardContent>
          {pError ? (
            <InlineError message={pError} />
          ) : pLoading ? (
            <ChartSkeleton />
          ) : revenueByPlan.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No revenue yet</EmptyTitle>
                <EmptyDescription>Add a paid customer to see the plan mix.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DonutChart
              data={revenueByPlan}
              xKey="plan"
              yKey="mrr"
              height={280}
              showLegend
              colorPalette="categorical"
              valueFormatter={(v) => usd(Number(v))}
              ariaLabel="Active monthly recurring revenue by plan"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Customers panel ------------------------------------------------------
function CustomersPanel({ version, onChanged }: { version: number; onChanged: () => void }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [plan, setPlan] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const qs = new URLSearchParams();
  if (debounced) qs.set('search', debounced);
  if (plan !== 'all') qs.set('plan', plan);
  if (status !== 'all') qs.set('status', status);
  const url = `/api/customers?${qs.toString()}`;

  const { data, loading, error } = useApi<Customer[]>(url, [version]);
  const rows = data ?? [];

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Live from Postgres · searchable &amp; filterable</CardDescription>
          </div>
          <AddCustomerDialog onCreated={onChanged} />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, or email…"
              className="pl-8"
            />
          </div>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {PLANS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <InlineError message={error} />
        ) : loading ? (
          <div className="space-y-2">
            {['r1', 'r2', 'r3', 'r4', 'r5', 'r6'].map((k) => (
              <Skeleton key={k} className="h-11 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No customers match</EmptyTitle>
              <EmptyDescription>Try clearing the search or filters, or add a new customer.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </TableCell>
                    <TableCell>{c.company}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{usdExact(c.mrr)}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{fmtDate(c.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {rows.length} customer{rows.length === 1 ? '' : 's'} (max 200).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Page -----------------------------------------------------------------
export default function App() {
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const { data: who } = useApi<WhoAmI>('/api/whoami', []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Startup Signal</h1>
              <p className="text-sm text-muted-foreground">Live SaaS metrics, straight from Lakebase Postgres</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {who && (
              <Badge variant="secondary" className="gap-1.5">
                <UserRound className="h-3.5 w-3.5" />
                {who.user}
              </Badge>
            )}
            <Button variant="outline" size="icon" onClick={reload} aria-label="Refresh data">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          <span>
            Querying <span className="font-medium text-foreground">{who?.database ?? 'databricks_postgres'}</span> on
            behalf of <span className="font-medium text-foreground">{who?.dbUser ?? 'you'}</span> · data is live
          </span>
        </div>

        <KpiRow version={version} />
        <ChartsRow version={version} />
        <Separator />
        <CustomersPanel version={version} onChanged={reload} />

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Demo data is generated on first load. Every read &amp; write runs as the signed-in Databricks user (OBO) —
          the "art of the possible" for an app backed by your own Postgres.
        </p>
      </main>
    </div>
  );
}
