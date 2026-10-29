-- Skema ReorderFlow. Aman dijalankan berulang pada database yang sudah ada.

CREATE TABLE IF NOT EXISTS pemasok (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stok (
    sku VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    stok_saat_ini INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 0,
    qty_min_order INT NOT NULL DEFAULT 1,
    id_pemasok INT NOT NULL REFERENCES pemasok(id) ON DELETE RESTRICT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stok_rop ON stok (stok_saat_ini, reorder_point);

CREATE TABLE IF NOT EXISTS po_log (
    id SERIAL PRIMARY KEY,
    nomor_po VARCHAR(50) NOT NULL UNIQUE,
    id_pemasok INT NOT NULL REFERENCES pemasok(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL,
    tautan_pdf TEXT NOT NULL,
    token VARCHAR(64) UNIQUE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE po_log ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE po_log DROP CONSTRAINT IF EXISTS po_log_status_check;

ALTER TABLE po_log ADD CONSTRAINT po_log_status_check
    CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'SENT', 'REJECTED', 'REQUIRES_MANUAL_REVIEW'));

CREATE INDEX IF NOT EXISTS idx_po_token ON po_log(token);
CREATE INDEX IF NOT EXISTS idx_po_supplier_status ON po_log(id_pemasok, status);
CREATE INDEX IF NOT EXISTS idx_po_status_created ON po_log(status, created_at);
CREATE INDEX IF NOT EXISTS idx_po_status_submitted ON po_log(status, submitted_at);

CREATE TABLE IF NOT EXISTS po_detail (
    id SERIAL PRIMARY KEY,
    po_id INT NOT NULL REFERENCES po_log(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL REFERENCES stok(sku),
    jumlah_order INT NOT NULL CHECK (jumlah_order > 0)
);

CREATE INDEX IF NOT EXISTS idx_po_detail_po_id ON po_detail(po_id);
CREATE INDEX IF NOT EXISTS idx_po_detail_sku ON po_detail(sku);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nama VARCHAR(150),
    role VARCHAR(30) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS stok_opname (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL REFERENCES stok(sku) ON DELETE RESTRICT,
    stok_sebelum INT NOT NULL,
    stok_sesudah INT NOT NULL,
    alasan VARCHAR(30) NOT NULL CHECK (alasan IN ('DAMAGED', 'MISCOUNT', 'RETURN')),
    actor_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stok_opname_sku ON stok_opname(sku);
CREATE INDEX IF NOT EXISTS idx_stok_opname_created ON stok_opname(created_at);
