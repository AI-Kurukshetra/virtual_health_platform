# Demo Walkthrough Script

Use this exact sequence for the hackathon demo.

## Seeded Credentials

- Org admin: `admin@virtualhealth.local`
- Provider: `provider@virtualhealth.local`
- Patient: `patient@virtualhealth.local`
- Password: `ChangeMe123!`

## Walkthrough

1. Sign in as org admin.
2. Open admin dashboard: `/org/sunrise-virtual-clinic/dashboard`.
3. Open patient intake: `/org/sunrise-virtual-clinic/patients/new`.
4. Create a new patient with intake + consent checked.
5. Open provider availability: `/org/sunrise-virtual-clinic/providers/availability`.
6. Add a weekly availability window.
7. Sign out and sign in as patient.
8. Open booking page: `/org/sunrise-virtual-clinic/appointments/book`.
9. Book one generated slot.
10. Open room page from appointments list and click the hosted meeting link.
11. Sign out and sign in as provider.
12. Open appointment detail and set status to `in_progress`.
13. Open SOAP notes and submit all sections.
14. Confirm status is `completed` and note is visible in patient chart.
15. Return to dashboard to show role-specific summaries.

## Optional Isolation Proof

1. Sign in as Sunrise provider.
2. Try opening Harbor org routes directly.
3. Show unauthorized redirect.
