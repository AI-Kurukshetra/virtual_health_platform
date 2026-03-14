# Step 1 Route Inventory

Source plan: `docs/mvp_features_architecture_and_schema.md` -> Section `9) Step-by-Step To-Do`, Step 1.

## 1) Route Map

### Public + Auth
- `/`
- `/login`
- `/signup`
- `/auth/callback`
- `/unauthorized`
- `/forbidden`

### Patient Dashboard
- `/patient`
- `/patient/onboarding`
- `/patient/appointments`
- `/patient/appointments/[appointmentId]`
- `/patient/records`
- `/patient/messages`
- `/patient/consents`

### Provider Dashboard
- `/provider`
- `/provider/queue`
- `/provider/schedule`
- `/provider/appointments/[appointmentId]`
- `/provider/patients/[patientId]`
- `/provider/patients/[patientId]/notes`
- `/provider/workflows`

### Admin Dashboard
- `/admin`
- `/admin/organizations`
- `/admin/rbac`
- `/admin/integrations`
- `/admin/compliance/audit-logs`
- `/admin/compliance/policy-health`
- `/admin/developer/api-usage`

## 2) Route -> Server Ownership

Owner mapping is defined in:
- `src/server/services/route-ownership.ts`

Service ownership rule:
- Auth routes map to `auth` service.
- Patient routes map to `patients`, `appointments`, `medicalRecords`, `messages`, `consents`.
- Provider routes map to `providerQueue`, `appointments`, `patients`, `clinicalNotes`, `workflows`.
- Admin routes map to `organizations`, `rbac`, `audit`, `integrations`, `apiGovernance`, `compliance`.

## 3) Shared Types Module

Core contracts created in:
- `src/types/contracts.ts`

Contains:
- role/app context types
- API response envelope types
- dashboard navigation contract
- page template contract
- route ownership contract

## 4) Output Check

- Route inventory created: yes
- Server ownership mapping created: yes
- Shared types module created: yes
- UI wireframe/template spec created: yes (see `docs/step1_dashboard_wireframes.md`)
