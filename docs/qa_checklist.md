# QA Checklist (P0)

Date: 2026-03-14

## Tenant Isolation

1. Sign in as `provider@virtualhealth.local` and open `/org/sunrise-virtual-clinic/patients`.
2. Confirm only Sunrise patients are listed.
3. Try opening `/org/harbor-telehealth-group/patients` with the same account.
4. Expected: redirected to `/unauthorized`.

## Patient Access Guard

1. Sign in as `patient@virtualhealth.local`.
2. Open own chart from `/org/sunrise-virtual-clinic/patients`.
3. Manually change URL to another patient id from a different org.
4. Expected: chart not available message or unauthorized redirect.

## Provider Tenant Scope

1. Sign in as `provider@virtualhealth.local`.
2. Open `/org/sunrise-virtual-clinic/appointments`.
3. Confirm Harbor appointment records are not visible.

## Appointment Lifecycle

1. Sign in as patient and book a slot from `/org/sunrise-virtual-clinic/appointments/book`.
2. Sign in as provider and open the new appointment detail page.
3. Move status through `checked_in -> in_progress -> completed`.
4. Confirm corresponding audit log rows are created in `audit_logs`.

## SOAP Note Flow

1. Open `/org/sunrise-virtual-clinic/appointments/[appointmentId]/notes` as provider.
2. Submit all SOAP fields.
3. Confirm note appears on patient chart page.
4. Confirm encounter is closed and appointment status is completed.

## UX State Coverage

1. Verify loading skeleton appears on org route transitions.
2. Verify empty states render on list pages with no rows.
3. Verify error boundary shows retry UI if a loader throws.
