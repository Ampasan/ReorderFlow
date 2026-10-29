TRUNCATE TABLE po_detail, po_log, stok_opname, stok, pemasok RESTART IDENTITY CASCADE;

INSERT INTO pemasok (id, nama, email) VALUES
    (101, 'PT Sumber Beras Sejahtera', 'n.hajime.2915@gmail.com'),
    (102, 'PT Minyak & Bumbu Nusantara', 'n.hajime.2915@gmail.com'),
    (103, 'PT Makanan Instan Makmur', 'n.hajime.2915@gmail.com'),
    (104, 'PT Kebutuhan Rumah Tangga', 'n.hajime.2915@gmail.com');

INSERT INTO stok (sku, nama, stok_saat_ini, reorder_point, qty_min_order, id_pemasok) VALUES
    ('SKU-BRS-01', 'Beras Premium 5kg', 6, 15, 20, 101),
    ('SKU-BRS-02', 'Beras Medium 10kg', 12, 10, 15, 101),
    ('SKU-BRS-03', 'Tepung Terigu Serbaguna 1kg', 18, 12, 20, 101),
    ('SKU-BRS-04', 'Tepung Beras 500g', 9, 10, 12, 101),
    ('SKU-BRS-05', 'Gula Pasir 1kg', 0, 8, 30, 101),
    ('SKU-MYK-01', 'Minyak Goreng 2L', 10, 12, 24, 102),
    ('SKU-MYK-02', 'Minyak Goreng 1L', 20, 15, 24, 102),
    ('SKU-MYK-03', 'Kecap Manis 620ml', 14, 8, 12, 102),
    ('SKU-MYK-04', 'Saus Sambal 335ml', 9, 8, 12, 102),
    ('SKU-MYK-05', 'Garam Beryodium 500g', 30, 12, 24, 102),
    ('SKU-MKN-01', 'Mie Instan Goreng (dus isi 40)', 4, 10, 5, 103),
    ('SKU-MKN-02', 'Mie Instan Kuah (dus isi 40)', 7, 10, 5, 103),
    ('SKU-MKN-03', 'Telur Ayam 1kg', 22, 10, 15, 103),
    ('SKU-MKN-04', 'Susu Kental Manis 490g', 11, 8, 12, 103),
    ('SKU-MKN-05', 'Kopi Sachet (renceng isi 10)', 5, 12, 20, 103),
    ('SKU-RMT-01', 'Sabun Mandi 100g', 25, 10, 24, 104),
    ('SKU-RMT-02', 'Deterjen Bubuk 800g', 8, 10, 12, 104),
    ('SKU-RMT-03', 'Tisu Gulung (pack isi 10)', 6, 8, 10, 104),
    ('SKU-RMT-04', 'Pasta Gigi 190g', 15, 8, 12, 104),
    ('SKU-RMT-05', 'Sabun Cuci Piring 800ml', -1, 10, 12, 104);

SELECT setval(pg_get_serial_sequence('pemasok', 'id'), (SELECT MAX(id) FROM pemasok));
