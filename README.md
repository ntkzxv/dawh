# DAWH

DAWH is a multi-branch application. The Warehouse ERP and the Sales & Customer Receivables module are implemented: staff record offline cash and installment sales that deduct warehouse stock, manually record actual customer payments, and view receivables read-only. Organization & People remains focused on organization, members, employees, roles, and access. Employees are transaction operators, not borrowers.

## Documentation

Read the consolidated project guide at [docs/DAWH.md](docs/DAWH.md). Older designs, handoffs, reports, and snapshots are preserved in [docs/history](docs/history).

## Local development

```bash
npm install
npm run dev
```

Other available scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`. Runtime setup and required environment variables are described in the consolidated guide.
