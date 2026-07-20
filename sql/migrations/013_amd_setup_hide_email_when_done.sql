-- 013 — No filtrar el email de setup AMD a visitantes anónimos
--
-- is_amd_setup() se invoca sin autenticación desde /login y devolvía el email de
-- la cuenta de setup a cualquier visitante, que además se mostraba en la UI
-- (fuga de dato personal). Ahora solo devuelve el email durante el setup inicial
-- (needsSetup = true); una vez completado el setup, retorna email NULL.

CREATE OR REPLACE FUNCTION public.is_amd_setup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_email TEXT;
  v_signed_in BOOLEAN;
  v_setup_done BOOLEAN;
  v_needs_setup BOOLEAN;
BEGIN
  SELECT email, last_sign_in_at IS NOT NULL,
         COALESCE((raw_app_meta_data->>'amd_setup_done')::boolean, false)
  INTO v_email, v_signed_in, v_setup_done
  FROM auth.users
  WHERE id = 'a0000000-0000-0000-0000-000000000001';

  v_needs_setup := NOT (v_signed_in OR v_setup_done);

  RETURN jsonb_build_object(
    'needsSetup', v_needs_setup,
    'email', CASE WHEN v_needs_setup THEN v_email ELSE NULL END
  );
END;
$function$;
