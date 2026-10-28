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
