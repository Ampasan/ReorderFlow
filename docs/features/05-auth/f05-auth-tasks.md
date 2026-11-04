# Implementasi dan Validasi: FRD-05 Autentikasi

## Status Implementasi

Backend menyediakan login email/password, JWT, profil pengguna, dan pembatasan role. Akun admin dan manager dibuat dari environment variable saat backend mulai.

- `/api/auth/login` bersifat publik; `/api/auth/me` dan endpoint data memerlukan JWT.
- `manager` dapat membaca dashboard, stok, PO, draf, dan ringkasan penerimaan.
- Aksi scan, koreksi stok, perubahan atau regenerasi draf, submit, dan pencatatan penerimaan hanya menerima role `admin`.
- Persetujuan PO tetap melalui tautan email publik. Dashboard tidak menyediakan aksi approve/reject.
- Frontend menyimpan token dan profil di `localStorage`, menghapus sesi setelah `401`, dan menampilkan pesan setelah `403`.
- Backend menerapkan batas request per IP untuk login, persetujuan, API, dan analisis Gemini.

## Validasi

Perintah pengujian backend:

```text
go test ./...
```

Hasil pengujian login, role, dan endpoint perlu dicatat saat dijalankan pada environment yang sesuai. Uji manual pada layanan terpasang belum dicatat di repositori.
