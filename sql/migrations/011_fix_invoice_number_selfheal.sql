-- 011 — Numeración de facturas: self-heal del contador
--
-- get_next_invoice_number usa la tabla atómica invoice_counters, pero si el
-- contador quedaba por detrás del número de factura más alto ya existente en la
-- org/año (facturas seed o creadas fuera del contador), generaba un número
-- duplicado y el INSERT fallaba con:
--   duplicate key value violates unique constraint
--   "invoices_organization_id_invoice_number_key"
-- Este error crudo se filtraba a la UI. Ahora el contador se sincroniza con el
-- máximo existente antes de generar el siguiente número.

CREATE OR REPLACE FUNCTION public.get_next_invoice_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  curr_year INT := EXTRACT(YEAR FROM NOW())::INT;
  max_existing INT;
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(substring(invoice_number FROM '(\d+)$')::INT), 0)
    INTO max_existing
    FROM invoices
   WHERE organization_id = org_id
     AND invoice_number ~ ('^INV-' || curr_year || '-\d+$');

  INSERT INTO invoice_counters (organization_id, year, last_number)
  VALUES (org_id, curr_year, GREATEST(1, max_existing + 1))
  ON CONFLICT (organization_id, year) DO UPDATE
    SET last_number = GREATEST(invoice_counters.last_number + 1, max_existing + 1)
  RETURNING last_number INTO next_num;

  RETURN 'INV-' || curr_year || '-' || lpad(next_num::TEXT, 3, '0');
END;
$function$;
