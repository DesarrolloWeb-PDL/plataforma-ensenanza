ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "file_key" text;
--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "answer_key_file_key" text;
--> statement-breakpoint
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "printable" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "worksheets" ALTER COLUMN "file_key" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "worksheets" DROP COLUMN IF EXISTS "version";
--> statement-breakpoint
ALTER TABLE "worksheets" DROP COLUMN IF EXISTS "source_md_path";
--> statement-breakpoint
ALTER TABLE "worksheets" DROP COLUMN IF EXISTS "pdf_asset_id";
--> statement-breakpoint
ALTER TABLE "worksheets" DROP COLUMN IF EXISTS "answer_key_asset_id";
--> statement-breakpoint
ALTER TABLE "worksheets" DROP COLUMN IF EXISTS "status";
--> statement-breakpoint
DROP INDEX IF EXISTS "worksheets_track_version_idx";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "worksheets_track_idx" ON "worksheets" USING btree ("track_id");