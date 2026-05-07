# SQL Migrations

Ordenadas cronológicamente. Todas las que figuran como APPLIED ya están en producción.

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| 001_initial_schema.sql | Schema inicial completo | APPLIED |
| 002_schema_expansion.sql | Expansión de tablas (vehicle_documents, etc.) | APPLIED |
| 003_fix_auth.sql | Fixes de autenticación y onboarding RLS | APPLIED |
| 004_add_invoice_attachment.sql | Columna attachment_url en invoices | APPLIED |
| 005_vehicle_documents.sql | Tabla vehicle_documents y alertas | APPLIED |
| 006_fix_finance_rls.sql | **CORRECCIÓN CRÍTICA**: RLS de financial_transactions ahora requiere owner/admin | APPLIED |
| 007_harden_security_advisories.sql | RLS en invoice_counters, search_path explícito en 6 funciones, drop de policies de listing en buckets | APPLIED |
| 008_revoke_public_exec_security_definer.sql | Revoke EXECUTE de PUBLIC en funciones SECURITY DEFINER, grant explícito a authenticated/anon según corresponda | APPLIED |
