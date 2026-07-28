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
| 009_provision_storage_buckets.sql | Provisión versionada de buckets de Storage + hardening de trip-documents | APPLIED |
| 010_round_trips.sql | Soporte de viajes ida y regreso (dos tramos vinculados) | APPLIED |
| 011_fix_invoice_number_selfheal.sql | Numeración de facturas: self-heal del contador | APPLIED |
| 012_set_nuggkitch_org_type_kitchen.sql | Corrige el tipo de organización de "nugget kitchen" | APPLIED |
| 013_amd_setup_hide_email_when_done.sql | No filtrar el email de setup AMD a visitantes anónimos | APPLIED |
| 014_invoice_attachments_private.sql | Adjuntos de factura: bucket privado + SELECT org-scoped | APPLIED |
| 015_superadmin_write_via_helpers.sql | Super admins pueden operar (leer y escribir) en cualquier organización | APPLIED |
| 016_private_trip_terrain_buckets.sql | Buckets privados: trip-documents + terrain-receipts | APPLIED |
| 017_kitchen_recipe_costing.sql | Costeo de recetas para organizaciones tipo kitchen | APPLIED |
| 018_trip_date_cargo_customer_value.sql | Fecha, carga, cliente y valor por tramo de viaje | APPLIED |
| 019_contacts_roles.sql | Columna `contacts.roles text[]`, backfill desde `role` (que se conserva) | APPLIED |
| 020_contacts_drop_role.sql | Borra `contacts.role`; `contacts.roles` pasa a NOT NULL | APPLIED |
| 021_contacts_role_shim.sql | **HOTFIX DE INCIDENTE**: 019/020 se aplicaron antes del deploy; repone `contacts.role` y la sincroniza con `roles` vía trigger para que código viejo y nuevo convivan | APPLIED |
| 022_contacts_drop_role_shim.sql | Retira el shim del 021 (trigger + columna `role`). Se aplicó después del deploy de #89, con el código nuevo ya arriba | APPLIED |
