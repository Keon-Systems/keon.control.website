-- Add activationTokenHash to ProvisioningRun
-- Raw activation tokens are never persisted (see ADR-0005).
-- Only the SHA-256 hash is stored.
--
-- Idempotency notes:
--   - DROP INDEX IF EXISTS handles any DB that received the v1 migration which
--     mistakenly created a field-level unique index on activationTokenHash alone.
--   - ADD COLUMN IF NOT EXISTS handles re-application on a DB where the column
--     was already created by the v1 migration.
--   - CREATE UNIQUE INDEX IF NOT EXISTS is safe to re-run.
--
-- Composite unique on (activationTokenHash, activationMode):
--   Same raw token + same mode  → one run (idempotency).
--   Same raw token + diff mode  → separate runs allowed (mirrors old in-memory check).

-- Remove v1 field-level unique index if it was ever applied
DROP INDEX IF EXISTS "ProvisioningRun_activationTokenHash_key";

-- Add column (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ProvisioningRun' AND column_name = 'activationTokenHash'
  ) THEN
    ALTER TABLE "ProvisioningRun" ADD COLUMN "activationTokenHash" TEXT;
  END IF;
END $$;

-- Composite unique index (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "ProvisioningRun_activationTokenHash_activationMode_key"
  ON "ProvisioningRun"("activationTokenHash", "activationMode");
