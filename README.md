# Business Context Engine v0

A deliberately small foundation for the larger Business Brain vision.

## What this version does

- Multi-tenant business records.
- Products, customers, suppliers, accounts.
- Sales, purchases, payments, expenses and inventory movements.
- CSV imports for sales, purchases, payments, expenses and inventory.
- Raw source-record preservation.
- Evidence/provenance references.
- Deterministic business metrics.
- Five first decision categories:
  - restocking (gated: needs an opening stock count and 14+ days of fresh sales)
  - cash risk (only when the owner has set opening balances)
  - margin anomaly (only where cost is derivable from earlier purchases)
  - collections: DISABLED in v0 (receivables are not derivable without invoices)
- Evidence-backed recommendations with confidence.
- Decision approval/outcome recording.
- Audit log.
- Minimal browser UI for the X-Ray.
- Supabase/Postgres migration.
- Unit tests for the intelligence engine.

## Explicit non-goals

This is NOT yet:

- an ERP/POS/accounting system
- an autonomous payment system
- an autonomous purchasing agent
- a generic chatbot
- an internet research agent
- a credit scoring product
- a lending/insurance product

External research and autonomous actions should only be added after the core business-state model is validated.

## Architecture

```text
CSV/API/manual input
        |
        v
source_records + import_batches
        |
        v
normalized business entities
        |
        v
business state / metrics
        |
        v
anomaly + decision engine
        |
        v
recommendation + evidence
        |
        v
owner approval
        |
        v
outcome
```

## Requirements

- Node.js 22+
- Supabase project
- npm

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial.sql`, then `002_hardening.sql`, in the Supabase SQL editor (empty project).
   Then paste `tests/sql/verify_import.sql` and confirm it prints Success.
3. Copy `.env.example` to `.env`.
4. Add your Supabase URL, anon key and service-role key. Create a user in Supabase Auth, sign in once, then
   create a business (`POST /api/businesses`) or insert `users` + `business_members` rows for design partners.
   To get a real cash position, set `accounts.opening_balance` and `opening_balance_known = true` by SQL.
5. Install dependencies:

```bash
npm install
```

6. Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Important security note

The API uses the Supabase service-role key server-side only. Identity is a Supabase-verified JWT
(`Authorization: Bearer`); `X-Business-Id` only selects among businesses the caller is a member of (non-members get 404).
All public tables have RLS enabled with no policies and no grants to anon/authenticated: the Data API is closed, the
backend is the only door. Because the backend bypasses RLS, every query must stay scoped by the middleware-derived business id.

## CSV format

Supported import types and minimum columns:

Dates: `YYYY-MM-DD` (or `YYYY-MM-DD HH:mm`), interpreted in the business timezone. Numbers: plain decimals, max 2 decimals
for money. UTF-8. Max 5,000 rows / 2 MB. `inventory.csv` rows are stock COUNTS (stock on hand that day), not deltas.
Invalid rows are rejected with a reason (never silently dropped); re-uploading a file is safe.

### sales.csv
`date,customer,product,quantity,unit_price`

### purchases.csv
`date,supplier,product,quantity,unit_cost`

### payments.csv
`date,account,amount,method,customer,supplier[,status]` (a row with a customer is a receipt, with a supplier a payment out)

### expenses.csv
`date,description,amount,account`

### inventory.csv
`date,product,quantity,location`

The importer is intentionally conservative. Unknown rows are preserved as source records and reported rather than silently discarded.

## Review checklist for Claude

Ask Claude to aggressively review:

1. Tenant isolation / authorization.
2. SQL constraints and indexes.
3. Duplicate import handling.
4. Idempotency.
5. Currency handling.
6. Decimal precision and money arithmetic.
7. Time zones.
8. CSV formula injection / malicious input.
9. Entity resolution errors.
10. Inventory accounting correctness.
11. Recommendation correctness.
12. Evidence provenance.
13. Race conditions.
14. Service-role key exposure.
15. Rate limiting / upload limits.
16. PII handling.
17. Audit-log integrity.
18. Failure/retry behavior.
19. Database transaction boundaries.
20. Whether any LLM/AI claim can be made without evidence.

## Product validation

The intended experiment is not "get users."

For the first 10 real businesses measure:

- Can we ingest their existing records?
- Did we discover something they did not know?
- Did they take an action?
- Was the outcome measurable?
- Would they pay?

If these fail, change the product before expanding the architecture.