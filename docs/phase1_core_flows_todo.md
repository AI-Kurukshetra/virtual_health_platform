# Phase 1 TODO: Core Flows Implementation

Reference docs:
- `docs/mvp_features_architecture_and_schema.md`
- `docs/healthie_blueprint_summary.md`

## Goal
Deliver MVP core flows from the PDF scope: auth, onboarding, scheduling, provider dashboard, medical records, and clinical notes.

## Track A: Auth and Access Control
- [x] Create auth routes: `/login`, `/signup`, `/auth/callback`
- [x] Add server action handlers for sign-in/sign-up/sign-out
- [x] Add route protection in middleware for `(provider)`, `(patient)`, `(admin)` groups
- [x] Implement role resolution from `Users`, `Roles`, `Permissions`
- [x] Add unauthorized and forbidden pages (`401`, `403` UX)
- [x] Add session-expiry handling and redirect behavior

Acceptance criteria:
- User can sign in and reach only authorized route groups.
- Unauthorized access is blocked at middleware + server boundary.

## Track B: Tenant Context and Data Guards
- [x] Implement request context helper: `user_id`, `organization_id`, role list
- [x] Build typed repository layer for `Patients`, `Providers`, `Appointments`, `Medical_Records`, `Clinical_Notes`
- [x] Enforce tenant filter (`organization_id`) in every repository query
- [x] Add audit wrapper for all create/update/delete in core clinical tables

Acceptance criteria:
- Cross-tenant reads/writes are impossible from app code and blocked by RLS.
- Core mutations create corresponding `Audit_Logs` records.

## Track C: Patient Registration and Onboarding
- [x] Build patient create form (demographics + contact)
- [x] Insert into `Patients` and auto-bootstrap `Medical_Records`
- [x] Add validation with `zod` for create/update payloads
- [x] Add duplicate prevention check for MRN in tenant scope
- [x] Add patient profile read page

Acceptance criteria:
- Provider/admin can create a patient.
- A `Medical_Records` row exists per created patient.

## Track D: Appointment Scheduling + Video
- [ ] Build provider availability listing endpoint
- [ ] Build appointment create flow (`Appointments`)
- [ ] Add overlap validation (provider and patient conflict checks)
- [ ] Persist `video_url` creation/update lifecycle
- [ ] Add appointment status transitions: scheduled -> confirmed -> completed/cancelled/no_show
- [ ] Add appointment list pages for provider and patient views

Acceptance criteria:
- Appointment booking prevents overlap conflicts.
- Status transitions are valid and auditable.

## Track E: Provider Dashboard
- [ ] Build dashboard query for today queue and upcoming appointments
- [ ] Add cards for pending notes and recent patient activity
- [ ] Add filters by status/date/provider
- [ ] Add loading, empty, and error states

Acceptance criteria:
- Provider sees accurate queue within P95 response target for normal load.

## Track F: Clinical Documentation
- [ ] Create SOAP/progress note form
- [ ] Save notes in `Clinical_Notes` linked to appointment + medical record
- [ ] Add sign-off workflow (`signed_at`)
- [ ] Add notes timeline view per patient
- [ ] Add edit restrictions after sign-off (role-based)

Acceptance criteria:
- Provider can create and sign notes.
- Signed notes are immutable except by allowed roles.

## Track G: Quality, Testing, and Operations
- [ ] Add unit tests for auth guards and schema validators
- [ ] Add integration tests for onboarding + scheduling + notes
- [ ] Add E2E smoke test for provider core journey
- [ ] Add error logging for route handlers and server actions
- [ ] Add `.env` contract checks in CI

Acceptance criteria:
- CI passes lint, type-check, and test gates.
- Critical core flow has automated coverage.

## Suggested Execution Order
1. Track A
2. Track B
3. Track C
4. Track D
5. Track E
6. Track F
7. Track G

## Definition of Done (Phase 1)
- Core feature flows from MVP scope are executable end-to-end.
- All core tables used are from approved PDF entities only.
- Access control, tenancy, and auditing are demonstrably enforced.
