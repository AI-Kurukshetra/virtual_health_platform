# MVP Feature Ownership Matrix (Patient vs Provider vs Admin)

Reference source: `healthie_blueprint_20260309_193052.pdf` (Generated March 09, 2026)

## Purpose
Define where each MVP feature should live, which side owns it (patient, provider, admin/platform), and what "implemented" means.

## Dashboard Ownership

| # | MVP Feature (from PDF scope) | Primary Side | Dashboards / Routes | Feature Definition (MVP) |
|---|---|---|---|---|
| 1 | Patient Registration & Onboarding | Patient + Admin/Platform | `/(auth)/signup`, `/patient/onboarding`, `/admin/patients` | Patient creates account, enters intake details, and profile is stored with tenant-scoped identity and audit trail. |
| 2 | Appointment Scheduling | Patient + Provider | `/patient/appointments`, `/provider/schedule` | Patient can request/book slots; provider can publish/manage availability and appointment states. |
| 3 | Basic Video Consultations | Patient + Provider | `/patient/appointments/:id`, `/provider/appointments/:id` | Both sides can join a secure virtual visit from the appointment record. |
| 4 | Simple Clinical Documentation | Provider | `/provider/appointments/:id/notes`, `/provider/patients/:id` | Provider can capture SOAP/progress notes linked to medical record and appointment. |
| 5 | Patient Portal | Patient | `/patient` and nested routes | Patient can view personal records, visit history, messages, and upcoming appointments. |
| 6 | Provider Dashboard | Provider | `/provider` and nested routes | Provider sees daily queue, schedule, pending documentation, and patient context. |
| 7 | HIPAA-Compliant Infrastructure | Admin/Platform (cross-cutting) | Platform-wide (middleware, APIs, DB policies) | Access control, audit logging, encryption in transit, least-privilege data access, and tenant isolation are enforced. |
| 8 | Fundamental APIs (`auth`, `patients`, `appointments`, `medical records`) | Admin/Platform (consumed by Patient + Provider UIs) | `/api/auth/*`, `/api/patients/*`, `/api/appointments/*`, `/api/medical-records/*` | Typed, validated API contracts with role authorization and org-level isolation. |
| 9 | Multi-Tenant Architecture (from must-have list) | Admin/Platform | `/admin/organizations`, shared platform services | Tenant data isolation by `organization_id`, role model, and tenant-safe querying patterns. |
| 10 | Consent Management (early important) | Patient + Provider | `/patient/consents`, `/provider/patients/:id/consents` | Patient can review/sign/revoke consent; provider can verify consent state before care actions. |
| 11 | Insurance Verification (early important) | Patient + Admin/Platform | `/patient/onboarding`, `/admin/eligibility` | Capture insurance metadata and run eligibility checks with clear status outcomes. |
| 12 | Workflow Automation (early important) | Provider + Admin/Platform | `/provider/workflows`, `/admin/workflows` | Trigger task templates based on events (new patient, booked visit, signed note). |

## Side-by-Side Delivery Boundaries

### Patient Side (User Side)
- Account signup and secure login.
- Self-service onboarding and profile updates.
- Appointment booking and virtual visit join flow.
- Access to own records, notes summaries, and communication threads.
- Consent management and basic insurance intake.

### Provider Side
- Daily queue, schedule, and patient search.
- Appointment state management and visit launch.
- Clinical documentation and record updates.
- Care coordination signals and workflow task handling.

### Admin/Platform Side
- Tenant/org setup, roles, and permissions.
- Audit and compliance controls.
- API governance, observability, and policy enforcement.
- Integration configuration (video, notifications, insurance).

## Implementation Rule
If a feature touches PHI, auth, or cross-tenant data, implementation ownership defaults to Admin/Platform guardrails first, then Patient/Provider UI surfaces.
