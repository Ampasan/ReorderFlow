ALTER TABLE po_detail
    ADD COLUMN IF NOT EXISTS ai_priority VARCHAR(10) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS ai_reason TEXT NOT NULL DEFAULT '';

ALTER TABLE po_detail DROP CONSTRAINT IF EXISTS po_detail_ai_priority_check;
ALTER TABLE po_detail ADD CONSTRAINT po_detail_ai_priority_check
    CHECK (ai_priority IN ('', 'TINGGI', 'SEDANG', 'RENDAH'));
