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
    status VARCHAR(30) NOT NULL CHECK (status IN ('DRAFT', 'SENT', 'REJECTED', 'REQUIRES_MANUAL_REVIEW')),
    tautan_pdf TEXT NOT NULL,
    token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_po_token ON po_log(token);
CREATE INDEX IF NOT EXISTS idx_po_supplier_status ON po_log(id_pemasok, status);
CREATE INDEX IF NOT EXISTS idx_po_status_created ON po_log(status, created_at);

CREATE TABLE IF NOT EXISTS po_detail (
    id SERIAL PRIMARY KEY,
    po_id INT NOT NULL REFERENCES po_log(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL REFERENCES stok(sku),
    jumlah_order INT NOT NULL CHECK (jumlah_order > 0)
);

CREATE INDEX IF NOT EXISTS idx_po_detail_po_id ON po_detail(po_id);
CREATE INDEX IF NOT EXISTS idx_po_detail_sku ON po_detail(sku);
