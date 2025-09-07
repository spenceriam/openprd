-- Fix numeric type issues by converting to REAL for decimal values
ALTER TABLE prds ALTER COLUMN cost_usd TYPE REAL;
ALTER TABLE generation_logs ALTER COLUMN cost_usd TYPE REAL;
