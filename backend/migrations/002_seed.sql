INSERT INTO pemasok (id, nama, email) VALUES
    (101, 'PT Kopi Nusantara', 'supplier@example.com'),
    (102, 'PT Teh Sejahtera', 'order@tehsejahtera.com'),
    (103, 'PT Plastik Jaya', 'sales@plastikjaya.com'),
    (104, 'PT Sembako Berkah', 'cs@sembakoberkah.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stok (sku, nama, stok_saat_ini, reorder_point, qty_min_order, id_pemasok) VALUES
    ('SKU-KOP-01', 'Kopi Arabika 250g', 5, 10, 20, 101),
    ('SKU-KOP-02', 'Kopi Robusta 500g', 8, 12, 15, 101),
    ('SKU-KOP-03', 'Kopi Luwak 100g', 25, 10, 10, 101),
    ('SKU-KOP-04', 'Kopi Decaf 250g', 30, 12, 12, 101),
    ('SKU-TEH-01', 'Teh Hijau Premium 50g', 2, 5, 20, 102),
    ('SKU-TEH-02', 'Teh Hitam Celup 25s', 15, 8, 10, 102),
    ('SKU-TEH-03', 'Teh Melati 50g', -2, 10, 10, 102),
    ('SKU-TEH-04', 'Teh Chamomile 30g', 12, 6, 8, 102),
    ('SKU-PL-01', 'Botol PET 500ml', 3, 10, 100, 103),
    ('SKU-PL-02', 'Tutup Botol 500ml', 4, 10, 100, 103),
    ('SKU-PL-03', 'Sedotan Bambu 100s', 40, 20, 25, 103),
    ('SKU-PL-04', 'Kantong Plastik 1kg', 60, 30, 50, 103),
    ('SKU-SEM-01', 'Beras Premium 5kg', 6, 15, 20, 104),
    ('SKU-SEM-02', 'Minyak Goreng 2L', 10, 12, 24, 104),
    ('SKU-SEM-03', 'Gula Pasir 1kg', 0, 5, 30, 104),
    ('SKU-SEM-04', 'Tepung Terigu 1kg', 18, 10, 20, 104),
    ('SKU-SEM-05', 'Telur Ayam 1kg', 22, 10, 15, 104),
    ('SKU-SEM-06', 'Kecap Manis 620ml', 14, 8, 12, 104),
    ('SKU-SEM-07', 'Saus Sambal 335ml', 9, 8, 12, 104),
    ('SKU-SEM-08', 'Sabun Mandi 100g', 25, 10, 24, 104)
ON CONFLICT (sku) DO NOTHING;
