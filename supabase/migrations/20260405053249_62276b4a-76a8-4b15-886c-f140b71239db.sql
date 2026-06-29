
CREATE OR REPLACE FUNCTION public.validate_material_type()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type NOT IN ('pdf', 'video', 'pyq') THEN
    RAISE EXCEPTION 'Invalid material type: %. Must be pdf, video, or pyq', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;
