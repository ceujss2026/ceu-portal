# 🚀 Panduan Pelancaran & Deployment — CEU Portal v1.1
## Unit Pendidikan Kerjaya, Jabatan Sekolah-Sekolah (JSS)

Panduan ini disusun langkah-demi-langkah bagi membolehkan pegawai pentadbir melancarkan **Backend Google Apps Script** dan **Frontend GitHub Pages** dengan lancar dan selamat.

---

## 📋 Ringkasan Seni Bina
- **Backend**: Google Apps Script (REST API JSON tanpa iframe, ContentService)
- **Database**: Google Sheets (11 helaian berstruktur) + Google Drive
- **Frontend**: Single Page Application (SPA) HTML5 + Tailwind CSS + Vanilla JS di GitHub Pages
- **Autentikasi**: OTP 6-Digit via GmailApp + HMAC Stateless Token (12 Jam)

---

## 🛠️ BAHAGIAN 1: Deployment Backend (Google Apps Script)

### Langkah 1.1: Buka Google Apps Script
1. Buka pelayar web dan layari [script.google.com](https://script.google.com).
2. Log masuk menggunakan akaun Google rasmi UPK / MOE.
3. Klik butang **"New Project"** (Projek Baharu).
4. Namakan projek sebagai **`CEU_Portal_Backend`**.

### Langkah 1.2: Salin Fail-Fail Backend (.gs)
Cipta fail-fail berikut dalam editor Apps Script dan salin kod dari folder `backend/`:

| Nama Fail dalam Apps Script | Sumber Kod Tempatan |
|:---|:---|
| `Utils.gs` | `backend/Utils.gs` |
| `Cache.gs` | `backend/Cache.gs` |
| `Kode.gs` | `backend/Kode.gs` |
| `Setup.gs` | `backend/Setup.gs` |
| `Migrasi.gs` | `backend/Migrasi.gs` |

*(Tip: Klik ikon `+` di sebelah **Files** > pilih **Script**, namakan fail tanpa sambungan `.gs`)*

### Langkah 1.3: Jalankan Inisialisasi Automatik (`setupAppEnvironment`)
1. Di bahagian atas editor Apps Script, cari menu pilihan fungsi (dropdown function).
2. Pilih fungsi: **`setupAppEnvironment`**.
3. Klik butang **"Run"** (Jalankan).
4. Google akan meminta kebenaran (Authorization):
   - Klik **"Review permissions"**.
   - Pilih akaun Google anda.
   - Klik **"Advanced"** > Klik **"Go to CEU_Portal_Backend (unsafe)"**.
   - Klik **"Allow"**.
5. Tunggu fungsi selesai (10 - 20 saat).
   Fungsi ini secara automatik akan:
   - Mencipta Spreadsheet baharu **"CEU_Portal_Database"** dengan 11 helaian lengkap.
   - Mencipta folder Google Drive **"CEU_Portal_Files"** berserta sub-folder.
   - Menjana `SESSION_SECRET` HMAC selamat secara kriptografi.
   - Memasukkan data awal contoh (pentadbir, senarai sekolah, dan bengkel).
   - Menyimpan semua ID dalam **Script Properties**.

### Langkah 1.4: Deploy sebagai Web App
1. Di penjuru kanan atas editor, klik butang **"Deploy"** > pilih **"New deployment"**.
2. Klik ikon gear di sebelah kiri **Select type** > pilih **"Web app"**.
3. Tetapkan konfigurasi berikut:
   - **Description**: `CEU Portal Production v1.1`
   - **Execute as**: **`Me (emel anda)`** *(Wajib)*
   - **Who has access**: **`Anyone`** *(Wajib — diperlukan agar frontend GitHub Pages boleh memanggil REST API tanpa sekatan)*
4. Klik butang **"Deploy"**.
5. Salin **Web App URL** yang tertera (bermula dengan `https://script.google.com/macros/s/.../exec`).

---

## 🌐 BAHAGIAN 2: Konfigurasi & Deployment Frontend (GitHub Pages)

### Langkah 2.1: Kemaskini `config.js`
1. Buka fail `frontend/js/config.js` di komputer anda.
2. Gantikan URL contoh dengan URL Web App sebenar yang anda salin pada Langkah 1.4:
   ```javascript
   const GAS_URL = 'https://script.google.com/macros/s/AKfycbx.../exec';
   const APP_VERSION = '1.1.0';
   ```
3. Simpan fail tersebut.

### Langkah 2.2: Muat Naik ke GitHub
Buka PowerShell atau Terminal di direktori projek (`CEU apk`):

```powershell
# 1. Masuk ke direktori projek
cd "c:\Users\ACER\Desktop\CEU Portal\Application\CEU apk"

# 2. Inisialisasi Git (jika belum)
git init

# 3. Tambah semua fail frontend
git add frontend/

# 4. Buat komit pertama
git commit -m "feat: CEU Portal v1.1 Production Release"

# 5. Hubungkan ke repositori GitHub anda
# (Gantikan URL di bawah dengan URL repositori GitHub anda)
git remote add origin https://github.com/NAMA_PENGGUNA/ceu-portal.git
git branch -M main
git push -u origin main
```

### Langkah 2.3: Aktifkan GitHub Pages
1. Layari repositori anda di GitHub.
2. Klik tab **"Settings"** (Tetapan).
3. Di panel navigasi kiri, pilih **"Pages"**.
4. Di bawah seksyen **"Build and deployment"**:
   - **Source**: `Deploy from a branch`
   - **Branch**: Pilih `main` dan folder `/frontend` (atau `/root` jika anda meletakkan isi folder frontend di root repositori).
5. Klik **"Save"**.
6. Dalam masa 1 - 2 minit, portal anda akan bersiaran secara langsung di:
   `https://NAMA_PENGGUNA.github.io/ceu-portal/`

---

## 🔒 BAHAGIAN 3: Pengesahan & Akses Kali Pertama

1. **Log Masuk Pentadbir:**
   - Masukkan emel pentadbir lalai: `admin.upk@moe.bn`
   - Tekan **"Hantar Kod OTP"**.
   - Semak peti mel emel tersebut untuk 6-digit OTP, atau semak helaian **`Users`** dalam spreadsheet untuk melihat kod laluan.
   - Masukkan kod OTP dan klik **"Sahkan & Log Masuk"**.
   - Anda akan terus dibawa ke **Dashboard Eksekutif Pentadbir** (`#/admin`).

2. **Permohonan Guru Baharu:**
   - Guru-guru kerjaya boleh membuka portal di telefon pintar mereka.
   - Klik **"+ Mohon Capaian Guru Baharu"**.
   - Masukkan nama, emel `.moe.bn`, dan nama sekolah.
   - Pentadbir akan meluluskan permohonan melalui menu **"Kelulusan Guru Baharu"** (`#/admin/users`).

---

## 📦 BAHAGIAN 4: Migrasi Data Lama (Jika Berkenaan)

Jika UPK mempunyai fail spreadsheet terdahulu yang mengandungi senarai nama guru atau sekolah:
1. Buka editor Google Apps Script backend.
2. Buka fail **`Migrasi.gs`**.
3. Di bahagian bawah, jalankan fungsi:
   ```javascript
   pindaiMigrasi("ID_SPREADSHEET_LAMA_ANDA");
   ```
4. Semak Logs untuk melihat jumlah data yang akan di-upsert (Dry-run tanpa risiko).
5. Jika berpuas hati, jalankan fungsi:
   ```javascript
   jalankanMigrasi("ID_SPREADSHEET_LAMA_ANDA");
   ```
   Data akan diselaraskan secara idempoten tanpa duplikasi.
