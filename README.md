# SAE-Viz 📊
### Platform Komparasi & Visualisasi Hasil Small Area Estimation (Client-Side & Serverless)

[![Deploy to GitHub Pages](https://github.com/ridsonap/viz-sae/actions/workflows/deploy.yml/badge.svg)](https://github.com/ridsonap/viz-sae/actions/workflows/deploy.yml)
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**SAE-Viz** adalah aplikasi web interaktif berbasis browser murni (*client-side*) untuk menganalisis, membandingkan performa, dan memvisualisasikan hasil model **Small Area Estimation (SAE)** — seperti *Fay-Herriot*, *Spatial SAE*, *Hierarchical Bayes*, maupun *Battese-Harter-Fuller* — terhadap Penduga Langsung (*Direct Estimator*).

Dapat di-deploy secara instan dan gratis di **GitHub Pages** maupun **Vercel** tanpa memerlukan server atau backend database.

---

## ✨ Fitur Unggulan

1. **🔒 100% Client-Side Privacy:**
   - File Excel diproses langsung di peramban menggunakan Web API (`SheetJS`).
   - Tidak ada data wilayah atau angka survei yang dikirim ke server luar.
2. **📁 Smart Excel & CSV Ingestion:**
   - Unggah file `.xlsx`, `.xls`, atau `.csv` dengan berbagai struktur tabel.
   - Deteksi kolom otomatis (*Fuzzy Header Matching*) untuk Kode Wilayah, Nama Domain, Direct Estimate, RSE/SE, dan kolom-kolom model alternatif.
   - Dilengkapi *Interactive Column Mapping Modal* untuk penyesuaian kolom yang fleksibel.
3. **📈 Visualisasi Interaktif & Spesifik SAE:**
   - **Scatter Plot ($y = x$):** Garis identitas 45° dan tren regresi linear untuk menguji konsistensi estimasi tanpa bias sistematik.
   - **Caterpillar / Shrinkage Plot:** Memvisualisasikan efek penarikan estimasi model SAE terhadap Direct Estimate disertai interval kepercayaan 95% ($Est \pm 1.96 \times SE$).
   - **Komparasi Presisi (RSE / CV):** Grouped bar / multi-line dengan garis batas ambang **25% (Standar Reliabilitas BPS)** serta filter wilayah bermasalah.
   - **Distribusi Boxplot (RSE & MSE):** Analisis statistik 5-angka (Min, Q1, Median, Q3, Max) komparatif antar metode.
   - **Bland-Altman Mean-Difference Plot:** Diagnosis kesepakatan (*agreement*) dan Limits of Agreement ($\text{Mean} \pm 1.96 \text{ SD}$).
   - **Relative Efficiency (RE):** Grafik gain efisiensi model ($RE = \text{MSE}_{Direct} / \text{MSE}_{SAE}$) dengan batas baseline $RE = 1.0$.
4. **🎨 Kustomisasi & Ekspor Siap Publikasi:**
   - Pilihan palette warna: **Vibrant**, **Academic (Publikasi Ilmiah)**, **Emerald**, dan **Colorblind-Safe (Wong Palette)**.
   - Ekspor grafik ke **PNG Resolusi Tinggi (300 DPI)** dan **Vector SVG** tanpa pecah.
   - Ekspor tabel data gabungan ke format **Excel (.xlsx)** dan **CSV**.
   - Unduh template Excel format baku untuk pengisian data.
5. **📄 One-Click PDF Diagnostic Report:**
   - Cetak ringkasan evaluasi kualitas model langsung ke format PDF dengan satu klik.

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### Prasyarat
- Node.js (v18 atau lebih baru)
- npm / pnpm / yarn

### Instalasi & Menjalankan Dev Server
```bash
# Clone repository
git clone https://github.com/ridsonap/viz-sae.git
cd viz-sae

# Install dependensi
npm install

# Jalankan server pengembangan lokal
npm run dev
```
Buka browser di alamat `http://localhost:5173`.

### Membangun Versi Produksi (Static Build)
```bash
npm run build
```
Hasil build statis akan tersimpan di direktori `dist/` dan siap di-host di server statis mana pun.

---

## 🌐 Panduan Deployment

### 1. GitHub Pages (Otomatis via GitHub Actions)
1. Buka repositori di GitHub.
2. Masuk ke **Settings** > **Pages**.
3. Pada opsi **Build and deployment > Source**, pilih **GitHub Actions**.
4. Workflow yang disertakan di `.github/workflows/deploy.yml` akan secara otomatis melakukan build dan deploy setiap kali Anda melakukan push ke branch `main`.

### 2. Vercel
1. Masuk ke dashboard [Vercel](https://vercel.com).
2. Klik **Add New Project** dan impor repositori `viz-sae`.
3. Vercel akan secara otomatis mendeteksi preset Vite.
4. Klik **Deploy**.

---

## 📋 Struktur Format Excel yang Didukung

Aplikasi mendukung tabel Excel dengan header yang fleksibel. Contoh struktur yang direkomendasikan:

| Domain_ID | Domain_Name | Sample_Size | Direct_Est | Direct_RSE | FH_Est | FH_RSE | Spatial_Est | Spatial_RSE |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 3301 | Kab. Cilacap | 120 | 11.02 | 28.4 | 10.95 | 14.2 | 10.88 | 12.9 |
| 3302 | Kab. Banyumas | 140 | 12.84 | 26.2 | 12.52 | 13.8 | 12.45 | 12.1 |
| 3303 | Kab. Purbalingga | 95 | 15.30 | 32.1 | 14.85 | 15.6 | 14.72 | 13.9 |

> **Catatan:** Jika file Anda hanya mencantumkan nilai Estimasi dan SE (Standard Error) atau MSE, SAE-Viz akan menghitung RSE, Relative Efficiency, dan selisih Shrinkage secara otomatis.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Lucide React
- **Spreadsheet Parsing:** SheetJS (`xlsx`)
- **Charting Engine:** Apache ECharts (`echarts-for-react`)
- **Reporting & Export:** jsPDF, html2canvas, canvas-confetti

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi MIT. Bebas digunakan untuk keperluan penelitian, akademik, maupun instansi resmi.
