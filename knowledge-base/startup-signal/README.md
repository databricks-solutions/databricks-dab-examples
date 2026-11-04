# Startup Signal: React + Lakebase Postgres App

A live SaaS metrics dashboard backed by Lakebase Postgres. One click deploys the app **and** provisions a fresh Lakebase Postgres instance into your workspace — no manual configuration, no hardcoded values. Designed as a one-click [Open in Databricks](https://docs.databricks.com/aws/en/dev-tools/bundles/open-in-databricks) starter for startups.

## What is Open in Databricks?

[Open in Databricks](https://docs.databricks.com/aws/en/dev-tools/bundles/open-in-databricks) is a one-click deployment flow for DABs hosted in a public GitHub repo. A user clicks the button, signs in at login.databricks.com, and lands in a workspace with the bundle imported and ready to run — no CLI, no local setup. The platform runs `databricks bundle deploy` for them.

A DAB (Declarative Automation Bundle) packages a whole project — notebooks, jobs, pipelines, dashboards, apps — into one deployable unit. Package a solution as a DAB, and a customer can deploy the whole thing with one click. Across developer tools, one-click consumption is the norm (Open in Colab, Deploy to Vercel, Deploy to Heroku); Open in Databricks brings the same to Databricks assets.

This bundle is designed for that flow: a single `bundle deploy` provisions the Lakebase Postgres project, branch, endpoint, and the Databricks App, then auto-starts the app via `lifecycle.started: true`. No `bundle run` or manual UI clicks are needed after deploy.

> **Workspace requirement:** Open in Databricks deploys into an existing Databricks workspace. Users who don't have one yet can sign up for a free trial at [login.databricks.com](https://login.databricks.com) — the Open in Databricks flow will prompt them to create or select a workspace during the flow.

[OPEN_IN_DATABRICKS_BUTTON]

## Architecture

This bundle deploys four resources in dependency order:

1. **Lakebase Postgres project** — pg_version 17, 7-day PITR
2. **Production branch** — protected, no expiry
3. **Read-write endpoint** — autoscaling 0.5–4 CU, suspend after 5 min
4. **Databricks App** — React + Express dashboard wired to the endpoint

All resource names are scoped to the deploying user via `${workspace.current_user.domain_friendly_name}`, so two people can deploy in the same workspace without colliding.

The app uses [AppKit](https://docs.databricks.com/aws/en/dev-tools/databricks-apps/appkit) with OBO ("on-behalf-of user") auth — every database query runs as the signed-in Databricks user. On first start, the app auto-seeds ~50 demo customers with realistic SaaS metrics (MRR, plans, churn). The app resolves the Postgres host dynamically at startup via the Databricks REST API using the platform-injected service principal credentials — no hardcoded host, works in any workspace.

> **First-run note:** Schema creation and seeding run lazily on the first authenticated request using the requesting user's OBO credentials. The account admin who deployed the bundle should open the app first to initialize the schema. After that, any user with access to the app can query and insert data.

## Project Structure

```
├── client/                    # React frontend (Vite + Tailwind)
│   └── src/
│       └── App.tsx            # Dashboard with KPI cards, charts, customer table
├── server/
│   └── server.ts              # Express API with OBO auth + PGHOST resolution
├── resources/                 # DAB resource definitions
│   ├── app.yml                # Databricks App resource
│   ├── lakebase.project.yml   # Lakebase Postgres project
│   ├── lakebase.branch.yml    # Production branch
│   └── lakebase.endpoint.yml  # Read-write endpoint
├── appkit.plugins.json        # AppKit plugin configuration (lakebase + server)
├── databricks.yml             # DAB bundle definition
└── package.json               # Node.js dependencies
```

## Deploy

### One-click: Open in Databricks

[OPEN_IN_DATABRICKS_BUTTON]

Deploys and starts automatically (~5 min).

### CLI

```bash
databricks bundle deploy
```

> Deploys and starts automatically (~5 min).
>
> If your username is longer than 26 characters, override the app name:
> `databricks bundle deploy --var app_name=your-short-name`

## Local Development

```bash
cp .env.example .env  # set DATABRICKS_HOST
npm install
npm run dev
```

> The app runs continuously (~0.5 DBU/hr). Stop it in Compute > Apps or run `databricks bundle destroy` when done.

## Tech Stack

- **Backend**: Node.js, Express, [AppKit](https://docs.databricks.com/aws/en/dev-tools/databricks-apps/appkit) lakebase plugin (OBO auth)
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Database**: [Lakebase Autoscaling Postgres](https://www.databricks.com/product/lakebase)
- **UI**: AppKit UI components, shadcn/ui

## Disclaimer

Please note the code in this project is provided for your exploration only, and are not formally supported by Databricks with Service Level Agreements (SLAs). They are provided AS-IS and we do not make any guarantees of any kind. Please do not submit a support ticket relating to any issues arising from the use of these projects. The source in this project is provided subject to the Databricks License. All included or referenced third party libraries are subject to the licenses set forth below.

Any issues discovered through the use of this project should be filed as GitHub Issues on the Repo. They will be reviewed as time permits, but there are no formal SLAs for support.
