# Step 1 Dashboard Wireframes and Template Locks

Source plan: `docs/mvp_features_architecture_and_schema.md` -> Section `9) Step-by-Step To-Do`, Step 1.

## 1) Top-Level Navigation by Role

### Patient Navigation
- Dashboard
- Onboarding
- Appointments
- Records
- Messages
- Consents

### Provider Navigation
- Dashboard
- Queue
- Schedule
- Patients
- Notes
- Workflows

### Admin Navigation
- Dashboard
- Organizations
- RBAC
- Integrations
- Compliance
- API Usage

## 2) Page Template Locks

### List Page Template
- Header: title + subtitle + primary action
- Filter bar: search + status filter + date range
- Body: table or card list with pagination
- States: loading, empty, error

### Detail Page Template
- Header: entity name + status chip + quick actions
- Left column: primary details + timeline
- Right column: related artifacts + audit summary
- Footer actions: edit, archive, export

### Form Page Template
- Header: title + progress indicator (when multi-step)
- Sections: grouped fields with section captions
- Validation: inline field errors + top-level submission error
- Footer: secondary action + primary submit button

### Audit Page Template
- Header: title + compliance context
- Filter controls: actor, entity, action, date range
- Body: immutable event table
- Utilities: CSV export + event details drawer

## 3) Enterprise UI Direction (Step 1 Baseline)

- Keep a neutral clinical color system with semantic status colors only.
- Use readable typography with clear hierarchy and no decorative styles.
- Use consistent spacing rhythm for cards, forms, and tables.
- Keep interactions obvious: clear action labels and explicit confirmations.
- Keep dashboard shells consistent across patient/provider/admin.

## 4) Wireframe Notes (Textual)

### Patient Dashboard Shell
- Top bar: app identity, patient menu, sign out.
- Left nav: patient modules.
- Main panel: next appointment card, onboarding progress, recent updates.

### Provider Dashboard Shell
- Top bar: provider identity, quick patient search.
- Left nav: queue/schedule/patients/notes.
- Main panel: queue table with urgency/status chips and quick actions.

### Admin Dashboard Shell
- Top bar: org selector, environment tag.
- Left nav: org setup, RBAC, compliance, integrations.
- Main panel: KPI cards, policy health, recent audit events.
