CREATE TABLE IF NOT EXISTS "user_xp" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "total_xp" integer NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "minor_consents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "minor_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "parent_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "consented_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "minor_consents_pair_uq" ON "minor_consents" USING btree ("minor_user_id", "parent_user_id");