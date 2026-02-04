-- =============================================================================
-- VEHICLE BODY TYPE + PLATFORM VIEWS
-- =============================================================================
-- Adds a normalized vehicle body type and a platform view used by super admin
-- dashboard charts.
-- =============================================================================

-- Add body_type to vehicles (optional, but enables accurate "Inventory by Type")
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS body_type TEXT;

-- Keep it flexible: allow NULL, but validate known values when provided
ALTER TABLE public.vehicles
DROP CONSTRAINT IF EXISTS vehicles_body_type_check;

ALTER TABLE public.vehicles
ADD CONSTRAINT vehicles_body_type_check
CHECK (
  body_type IS NULL OR body_type IN ('sedan','suv','hatchback','truck','van','other')
);

CREATE INDEX IF NOT EXISTS idx_vehicles_body_type ON public.vehicles(body_type);

-- Platform inventory breakdown (for super admin)
CREATE OR REPLACE VIEW public.platform_inventory_by_type AS
SELECT
  CASE
    WHEN body_type = 'sedan' THEN 'Sedan'
    WHEN body_type = 'suv' THEN 'SUV'
    WHEN body_type = 'hatchback' THEN 'Hatchback'
    WHEN body_type = 'truck' THEN 'Truck'
    WHEN body_type = 'van' THEN 'Van'
    WHEN body_type = 'other' THEN 'Other'
    ELSE 'Unknown'
  END AS type,
  COUNT(*)::INTEGER AS count
FROM public.vehicles
GROUP BY 1
ORDER BY count DESC;

GRANT SELECT ON public.platform_inventory_by_type TO authenticated;

