-- Seed demo grosir/sembako UMKM.
-- Aman dijalankan berulang: data transaksi dan master dikosongkan lebih dulu,
-- lalu diisi ulang dari awal. Akun users tidak disentuh karena dibuat dari
-- ADMIN_EMAIL dan MANAGER_EMAIL saat server start.
-- Termasuk tiga PO demo: dua DRAFT yang belum dikirim ke manajer, dan satu SENT
-- yang sudah selesai. Tidak ada email yang dikirim oleh seed ini.

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

INSERT INTO po_log (id, nomor_po, id_pemasok, status, tautan_pdf, token, submitted_at, created_at, updated_at) VALUES
    (1001, 'PO-20261029-101-001', 101, 'DRAFT', '', NULL, NULL,
     CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    (1002, 'PO-20261027-103-001', 103, 'SENT', '', NULL,
     CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '2 days',
     CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (1003, 'PO-20261029-102-001', 102, 'DRAFT', '', NULL, NULL,
     CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours');

INSERT INTO po_detail (po_id, sku, jumlah_order) VALUES
    (1001, 'SKU-BRS-01', 20),
    (1001, 'SKU-BRS-04', 12),
    (1001, 'SKU-BRS-05', 30),
    (1002, 'SKU-MKN-01', 5),
    (1002, 'SKU-MKN-02', 5),
    (1002, 'SKU-MKN-05', 20),
    (1003, 'SKU-MYK-01', 24),
    (1003, 'SKU-MYK-04', 12);

SELECT setval(pg_get_serial_sequence('po_log', 'id'), (SELECT MAX(id) FROM po_log));
