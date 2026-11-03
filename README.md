# DAWH

DAWH is a multi-branch application. The Warehouse ERP is implemented; the target direction adds a separate Sales & Customer Receivables domain for staff-entered offline transactions and manually recorded customer payments, while Organization & People remains focused on organization, members, employees, roles, and access. Customer installment rules are not implemented yet; employees are transaction operators, not borrowers.

## Documentation

Read the consolidated project guide at [docs/DAWH.md](docs/DAWH.md). Older designs, handoffs, reports, and snapshots are preserved in [docs/history](docs/history).

## Local development

```bash
npm install
npm run dev
```

Other available scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`. Runtime setup and required environment variables are described in the consolidated guide.
