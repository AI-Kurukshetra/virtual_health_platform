# MVP Features, Architecture, Ownership, and Execution Plan

Reference source: `healthie_blueprint_20260309_193052.pdf` (Generated March 09, 2026)

## 1) MVP Scope (Traceable to PDF)

### In-Scope Core MVP Features
- Patient Registration and Onboarding
- Appointment Scheduling
- Basic Video Consultation
- Simple Clinical Documentation
- Patient Portal
- Provider Dashboard
- HIPAA-Compliant Infrastructure
- Fundamental APIs: auth, patients, appointments, medical records
- Multi-Tenant Architecture

### Early Post-Core MVP Features (Important)
- Insurance Verification
- Consent Management
- Workflow Automation
- API Management basics

### Deferred Until After MVP Validation
- Chronic care management
- Quality measures tracking
- Full claims/billing automation
- Full lab integrations
- AI-heavy differentiators

## 2) Feature-to-Dashboard Ownership

See canonical ownership file:
- `docs/mvp_feature_ownership_matrix.md`

Summary:
- Patient side: onboarding, self-service scheduling, portal access, consent actions
- Provider side: queue, schedule management, clinical documentation, visit execution
- Admin/platform side: tenant setup, compliance controls, policy enforcement, integrations

## 3) Architecture Baseline (Next.js + Supabase)

### Frontend Segmentation
- `(auth)`: login/signup/callback/recovery
- `(patient)`: onboarding, appointments, records, messages, consent
- `(provider)`: queue, schedule, notes, patient profile
- `(admin)`: org/tenant setup, RBAC, compliance/audit views

### Backend Segmentation
- Auth/session layer: Supabase Auth + Next.js middleware session refresh
- Data layer: Supabase Postgres with strict `organization_id` scoping
- Policy layer: RLS + role checks (`Users`, `Roles`, `Permissions`)
- Service layer: `src/server/services/*` for business logic
- API layer: route handlers/server actions with Zod validation

### Security and Compliance Requirements
- Enforce tenant isolation on every data access path.
- Log sensitive CRUD operations to `Audit_Logs`.
- Keep privileged secrets server-only.
- Never trust browser claims without server verification.

## 4) Detailed MVP Steps by Feature

### Feature 1: Patient Registration and Onboarding (Patient + Admin side)
1. Implement patient self-registration in `(auth)` with validated intake payload.
2. Create auth identity first, then user profile linkage, then patient record.
3. Add onboarding completion flow for demographics/consent/insurance intake.
4. Show clear status messaging: account created, onboarding pending, onboarding complete.
5. Add audit events for registration and onboarding completion.

### Feature 2: Appointment Scheduling (Patient + Provider side)
1. Provider defines availability and slot constraints.
2. Patient views only available slots and books visit type.
3. Enforce conflict prevention and tenant-safe provider mapping.
4. Add appointment lifecycle states: scheduled, confirmed, cancelled, completed.
5. Trigger reminder notifications for upcoming appointments.

### Feature 3: Basic Video Consultation (Patient + Provider side)
1. Generate video session metadata at appointment confirmation.
2. Expose join links only to the assigned patient/provider.
3. Track join timestamps and session outcome metadata.
4. Fail safely with fallback instructions if link generation fails.

### Feature 4: Simple Clinical Documentation (Provider side)
1. Create SOAP/progress-note templates.
2. Save notes against `Medical_Records` and `Appointments`.
3. Support draft and signed states.
4. Add audit events for note create/update/sign.

### Feature 5: Patient Portal (Patient side)
1. Build patient dashboard with upcoming appointments and recent notes summary.
2. Add records read views with tenant and ownership checks.
3. Provide messaging/notification center entry points.

### Feature 6: Provider Dashboard (Provider side)
1. Build daily queue cards: waiting, upcoming, overdue documentation.
2. Add patient search and quick chart access.
3. Provide direct actions for notes, follow-ups, and scheduling changes.

### Feature 7: HIPAA-Compliant Infrastructure (Admin/platform side)
1. Verify role path guards for all persona routes.
2. Validate all mutation endpoints with server-side schemas.
3. Confirm RLS policies cover read/write/delete per role and tenant.
4. Add operational audit dashboards and anomaly alerts.

### Feature 8: Fundamental APIs (Admin/platform side)
1. Standardize API contracts for `auth`, `patients`, `appointments`, `medical records`.
2. Add input validation, typed responses, and consistent error envelopes.
3. Add contract tests for role access and tenant boundaries.

## 5) Enterprise UI Direction by Dashboard

### Global Design System Rules
- Use a restrained, clinical palette (neutral surfaces, strong contrast text, semantic status colors).
- Use predictable spacing rhythm and consistent card/table primitives.
- Prioritize legibility for dense clinical data over visual decoration.
- Keep typography hierarchy explicit: page title, section title, field label, body/meta.
- Build robust empty/loading/error states for each major panel.

### Patient Dashboard Design
- Primary goals: clarity, trust, reduced cognitive load.
- Key modules: upcoming appointments, next actions, care team contacts, recent records.
- Interaction style: guided workflows, explicit progress indicators, plain-language labels.

### Provider Dashboard Design
- Primary goals: speed, context switching, queue efficiency.
- Key modules: today queue, patient snapshots, note shortcuts, urgent flags.
- Interaction style: compact data-dense layout with keyboard-friendly forms.

### Admin Dashboard Design
- Primary goals: control, visibility, compliance monitoring.
- Key modules: tenant settings, role matrix, integration health, audit overview.
- Interaction style: table-first layouts with strong filters and export-friendly views.

## 6) Delivery Plan with Milestones

### Phase 0: Foundation (Completed)
- Next.js + Supabase bootstrapped
- Core schema and seed setup
- Middleware session baseline

### Phase 1: Core Clinical MVP (Weeks 1-3)
- Self-registration and onboarding
- Appointment lifecycle
- Provider queue + documentation
- Patient portal base

### Phase 2: Compliance and Reliability (Weeks 4-5)
- Consent lifecycle and document handling
- Audit coverage expansion
- Policy hardening and security verification

### Phase 3: Important Extensions (Weeks 6-7)
- Insurance verification flow
- Workflow automation primitives
- API governance and usage metrics

### Phase 4: Pilot Readiness (Weeks 8-9)
- End-to-end workflow testing
- Performance and error-budget baselining
- Production runbook and pilot launch checklist

## 7) Required Quality Gates

- Tenant isolation tests pass for all protected entities.
- Role access tests pass for patient/provider/admin routes.
- Registration, scheduling, and note capture E2E scenarios pass.
- Audit logs emitted for all PHI-sensitive mutations.
- Lint/type checks and regression suite pass before release.

## 8) Entity Boundary Reminder

Only entities listed in the PDF data model are valid:
- Patients, Providers, Organizations, Appointments, Medical_Records, Prescriptions, Lab_Orders, Lab_Results, Insurance_Plans, Claims, Payments, Care_Plans, Clinical_Notes, Medications, Allergies, Vital_Signs, Diagnoses, Procedures, Referrals, Consent_Forms, Audit_Logs, Users, Roles, Permissions, Templates, Workflows, Notifications, Messages, Documents, Billing_Codes.

Implementation SQL references:
- `docs/mvp_supabase_schema.sql`
- `supabase/migrations/`

## 9) Step-by-Step To-Do (Code + UI)

This section is the implementation playbook. Follow steps in order.

### Progress Status
- Step 1: Completed
- Step 2: Pending
- Step 3: Pending
- Step 4: Pending
- Step 5: Pending
- Step 6: Pending
- Step 7: Pending
- Step 8: Pending
- Step 9: Pending
- Step 10: Pending
- Step 11: Pending
- Step 12: Pending

### Step 1: Finalize Information Architecture
- Code tasks:
- Create route map for `(auth)`, `(patient)`, `(provider)`, `(admin)`.
- Define server ownership for each route in `src/server/services`.
- Create a shared `types` module for API contracts and DB row projections.
- UI tasks:
- Define top-level navigation for each dashboard with role-specific menus.
- Lock page templates: list page, detail page, form page, audit page.
- Output:
- Route inventory doc and wireframe set approved.

### Step 2: Build RBAC and Tenant Guard Rails First
- Code tasks:
- Enforce middleware role path guards.
- Validate request context from `Users` + `Roles` tables for every protected page.
- Add RLS policy tests for patient/provider/admin and cross-tenant denial cases.
- UI tasks:
- Standardize `401`, `403`, and session-expired pages.
- Add clear recovery CTA buttons: `Sign in again`, `Return to dashboard`.
- Output:
- Unauthorized and forbidden experiences consistent across all dashboards.

### Step 3: Implement Patient Self-Registration and Onboarding
- Code tasks:
- Signup flow: create auth user, create `Users` row, create `Patients` row, link `user_id`.
- Validate payload with Zod on client and server.
- Write audit events for registration and onboarding completion.
- Keep mutation logic inside server action/service layer, not in UI component.
- UI tasks:
- Signup screen in `(auth)` with enterprise form UX:
- grouped fields, inline error text, password rules, disabled submit while loading.
- Onboarding page in patient dashboard with progress status (for example: `Account`, `Profile`, `Consent`).
- Add success banner and next-step CTA after completion.
- Output:
- New patient can register and reach patient home with completed onboarding state.

### Step 4: Implement Provider Dashboard Core
- Code tasks:
- Build provider queue query (`today`, `upcoming`, `needs documentation` buckets).
- Add patient lookup endpoint with tenant-safe search filters.
- Add server actions for queue status updates and follow-up tasks.
- UI tasks:
- Build data-dense queue cards/table with sorting and quick actions.
- Add sticky quick-filter bar (today, urgent, unassigned, completed).
- Include compact patient summary drawer for faster context switching.
- Output:
- Provider can triage and open a patient chart in two clicks.

### Step 5: Implement Appointment Scheduling Lifecycle
- Code tasks:
- Model availability and slot generation logic.
- Add booking, confirmation, cancellation, and completion mutations.
- Enforce conflict detection on create/update.
- Emit reminders through notification service hooks.
- UI tasks:
- Patient calendar view with only bookable slots.
- Provider schedule board with visual state chips.
- Clear cancellation and reschedule confirmation dialogs.
- Output:
- End-to-end appointment lifecycle functional for both patient and provider sides.

### Step 6: Implement Basic Video Visit Flow
- Code tasks:
- Generate video session metadata at appointment confirmation.
- Restrict join token visibility to assigned participants.
- Track session events (join time, end time, failure reason).
- UI tasks:
- Appointment detail page with primary `Join Visit` action.
- Fallback state cards: `connection issue`, `retry`, `contact support`.
- Output:
- Secure join flow available for scheduled virtual appointments.

### Step 7: Implement Clinical Documentation
- Code tasks:
- Add SOAP/progress note create/update/sign services.
- Attach notes to `Medical_Records` and optionally to `Appointments`.
- Add immutable audit entries for signed notes.
- UI tasks:
- Provider note editor with template toggle and autosave indicator.
- Signed-note status badge and read-only mode after signature.
- Output:
- Provider can create, revise drafts, and sign clinical notes safely.

### Step 8: Implement Patient Portal Read Surfaces
- Code tasks:
- Add read APIs for own appointments, records, notes summary, messages.
- Enforce ownership checks (`auth.uid()` linked patient only).
- UI tasks:
- Patient home with actionable cards: next visit, recent updates, pending items.
- Records page with clear timeline and section grouping.
- Output:
- Patient can self-serve key care information without provider intervention.

### Step 9: Add HIPAA and Compliance Controls
- Code tasks:
- Expand `Audit_Logs` coverage to all PHI-sensitive mutations.
- Add retention strategy and export path for audit events.
- Add policy verification scripts for RLS and role boundaries.
- UI tasks:
- Admin compliance page with audit filters, actor/entity drill-down, and export.
- Highlight suspicious patterns (failed access bursts, unusual role actions).
- Output:
- Compliance monitoring is observable and auditable from admin dashboard.

### Step 10: Standardize API Contracts
- Code tasks:
- Normalize API response envelope: `data`, `error`, `meta`.
- Add request validation and typed DTOs for auth/patients/appointments/medical-records.
- Add integration tests for expected success/failure contracts.
- UI tasks:
- Ensure all UI error states map to API error codes consistently.
- Output:
- Predictable API behavior and reduced frontend branching complexity.

### Step 11: Enterprise UI Polish Pass
- Code tasks:
- Extract shared UI primitives (table, filter bar, status pill, form section, alert banner).
- Add accessibility checks (focus order, labels, keyboard navigation, contrast).
- UI tasks:
- Patient side: calm and guided visuals.
- Provider side: dense and task-efficient layout.
- Admin side: table-first and oversight-focused layout.
- Apply consistent spacing, typography scale, and semantic colors.
- Output:
- Cohesive enterprise-grade visual system across all dashboards.

### Step 12: Testing, Release, and Rollout
- Code tasks:
- Run unit tests (validation, mappers, service edge cases).
- Run integration tests (RBAC, tenant isolation, scheduling conflicts).
- Run E2E flows for patient registration -> appointment -> video -> note -> portal view.
- UI tasks:
- Validate loading/error/empty states on all primary screens.
- Conduct usability smoke test for patient and provider paths.
- Output:
- MVP release candidate with known issues list, runbook, and rollback plan.

## 10) Definition of Done per Dashboard

### Patient Dashboard DoD
- User can register, complete onboarding, and view personal care data.
- User can book and join virtual visits.
- All patient routes deny cross-user/cross-tenant access.

### Provider Dashboard DoD
- Provider queue and schedule are actionable and performant.
- Provider can document care and sign notes.
- Provider can manage appointment states and launch visits.

### Admin Dashboard DoD
- Admin can manage org-level controls and visibility.
- Admin has audit trail access and compliance monitoring tools.
- Tenant and RBAC boundaries are verifiably enforced.
