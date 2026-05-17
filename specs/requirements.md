# Dokumen Persyaratan — TensiMenu

## Pendahuluan

TensiMenu adalah aplikasi web sistem rekomendasi makanan lokal harian untuk penderita hipertensi yang berbasis prinsip DASH Diet (*Dietary Approaches to Stop Hypertension*). Sistem ini menjawab kesenjangan antara panduan diet klinis internasional dengan realitas kuliner Nusantara, di mana masakan daerah (Minang, Jawa, Sunda, Batak, Bugis, Papua) kerap mengandung natrium, lemak jenuh, dan santan dalam kadar tinggi.

TensiMenu memungkinkan pengguna memasukkan profil kesehatan pribadi, menerima rekomendasi makanan lokal yang dipersonalisasi setiap hari, memantau skor kepatuhan DASH, serta melacak riwayat tekanan darah dan progres kesehatan mereka. Sistem dibangun di atas pipeline ML berbasis *Content-Based Filtering* dengan dataset nutrisi lokal Indonesia (DKPI, USDA FoodData Central, Nutrisurvey) dan data klinis anonim.

---

## Glosarium

- **TensiMenu**: Nama sistem aplikasi web rekomendasi makanan berbasis DASH Diet untuk penderita hipertensi.
- **Pengguna**: Individu penderita atau berisiko hipertensi yang menggunakan TensiMenu.
- **Profil_Pengguna**: Kumpulan data kesehatan dan preferensi makanan yang dimasukkan oleh Pengguna, termasuk target nutrisi personal yang dihitung dari data tersebut.
- **Target_Nutrisi_Personal**: Nilai target atau batas nutrisi harian yang dihitung secara individual berdasarkan usia, jenis kelamin, berat badan, tinggi badan, tekanan darah, dan komorbid Pengguna; digunakan sebagai dasar semua perhitungan DASH_Score dan validasi rekomendasi.
- **Sistem_Rekomendasi**: Komponen ML berbasis *Content-Based Filtering* yang menghasilkan rekomendasi makanan menggunakan cosine similarity antara vektor kebutuhan nutrisi Pengguna dan vektor fitur nutrisi Makanan_Lokal.
- **DASH_Score**: Nilai numerik (0–100) yang mengukur tingkat kepatuhan suatu sajian atau rencana makan harian terhadap Target_Nutrisi_Personal Pengguna, dihitung menggunakan formula proporsional yang terdokumentasi.
- **Rencana_Makan**: Kumpulan rekomendasi makanan lokal untuk satu hari penuh (sarapan, makan siang, makan malam, camilan).
- **Makanan_Lokal**: Hidangan kuliner Nusantara yang terdaftar dalam database TensiMenu beserta data komposisi nutrisinya.
- **Tracker_Progres**: Fitur pencatatan dan visualisasi perkembangan kesehatan Pengguna dari waktu ke waktu.
- **Riwayat_Tekanan_Darah**: Catatan historis nilai tekanan darah sistolik dan diastolik Pengguna.
- **Log_Rekomendasi**: Catatan historis Rencana_Makan yang pernah diterima atau dikonsumsi Pengguna; digunakan oleh Sistem_Rekomendasi untuk menerapkan aturan anti-repetisi.
- **Komorbid**: Kondisi penyakit penyerta selain hipertensi (misalnya diabetes, gagal ginjal, dislipidemia) yang mempengaruhi Target_Nutrisi_Personal dan filter rekomendasi.
- **Nutrisi_DASH**: Nutrisi kunci dalam DASH Diet: natrium, kalium, kalsium, magnesium, serat, lemak jenuh, dan lemak total.
- **Autentikasi**: Proses verifikasi identitas Pengguna melalui NextAuth.js.
- **API_Backend**: Antarmuka REST API yang dibangun dengan FastAPI untuk menghubungkan frontend dengan logika bisnis dan database.
- **Database**: Sistem penyimpanan data berbasis Supabase (PostgreSQL).
- **Model_ML**: Model machine learning yang dilatih untuk menghasilkan rekomendasi makanan yang dipersonalisasi menggunakan Content-Based Filtering dengan cosine similarity.
- **DKPI**: Dataset Komposisi Pangan Indonesia — sumber data nutrisi makanan lokal Indonesia.
- **Validator_Nutrisi**: Komponen yang memverifikasi bahwa rekomendasi memenuhi Target_Nutrisi_Personal Pengguna dan menghitung DASH_Score menggunakan formula yang terdokumentasi.
- **Data_Estimasi**: Flag pada item Makanan_Lokal yang menandakan bahwa nilai nutrisinya bukan dari sumber primer melainkan diestimasi dari makanan referensi dalam kategori yang sama; ditampilkan sebagai label peringatan di antarmuka pengguna.

---

## Persyaratan

---

### Persyaratan 1: Registrasi dan Autentikasi Pengguna

**User Story:** Sebagai calon Pengguna, saya ingin mendaftar dan masuk ke TensiMenu, agar saya dapat mengakses fitur rekomendasi makanan yang dipersonalisasi secara aman.

#### Kriteria Penerimaan

1. THE TensiMenu SHALL menyediakan halaman registrasi dengan formulir yang memuat kolom nama lengkap, alamat email, dan kata sandi.
2. WHEN Pengguna mengirimkan formulir registrasi dengan email yang sudah terdaftar, THEN THE Autentikasi SHALL menampilkan pesan kesalahan "Email sudah terdaftar" tanpa membuat akun baru.
3. WHEN Pengguna mengirimkan formulir registrasi dengan data valid, THE Autentikasi SHALL membuat akun baru, menyimpan kata sandi dalam bentuk hash, dan mengarahkan Pengguna ke halaman pengisian Profil_Pengguna.
4. WHEN Pengguna memasukkan kombinasi email dan kata sandi yang valid, THE Autentikasi SHALL membuat sesi terautentikasi dan mengarahkan Pengguna ke halaman utama.
5. WHEN Pengguna memasukkan kombinasi email atau kata sandi yang tidak valid, THEN THE Autentikasi SHALL menampilkan pesan kesalahan generik "Email atau kata sandi salah" tanpa mengungkap detail spesifik.
6. WHEN sesi Pengguna tidak aktif selama 30 menit, THE Autentikasi SHALL mengakhiri sesi dan mengarahkan Pengguna ke halaman login.
7. WHERE fitur login sosial diaktifkan, THE Autentikasi SHALL mendukung login melalui akun Google menggunakan protokol OAuth 2.0.
8. WHEN Pengguna meminta reset kata sandi dengan email terdaftar, THE Autentikasi SHALL mengirimkan tautan reset yang kedaluwarsa dalam 60 menit ke alamat email tersebut.

---

### Persyaratan 2: Pengisian dan Pengelolaan Profil Pengguna

**User Story:** Sebagai Pengguna, saya ingin mengisi dan memperbarui profil kesehatan saya, agar sistem dapat menghasilkan rekomendasi makanan yang sesuai dengan kondisi saya.

#### Kriteria Penerimaan

1. THE TensiMenu SHALL menyediakan formulir Profil_Pengguna dengan kolom: usia (tahun), jenis kelamin, berat badan (kg), tinggi badan (cm), nilai tekanan darah sistolik terakhir (mmHg), nilai tekanan darah diastolik terakhir (mmHg), daftar Komorbid, dan preferensi makanan.
2. WHEN Pengguna memasukkan usia di luar rentang 18–90 tahun, THEN THE TensiMenu SHALL menampilkan pesan validasi "Usia harus berada di antara 18 hingga 90 tahun".
3. WHEN Pengguna memasukkan nilai tekanan darah sistolik di luar rentang 70–250 mmHg, THEN THE TensiMenu SHALL menampilkan pesan validasi "Nilai tekanan darah sistolik tidak valid".
4. WHEN Pengguna memasukkan nilai tekanan darah diastolik di luar rentang 40–150 mmHg, THEN THE TensiMenu SHALL menampilkan pesan validasi "Nilai tekanan darah diastolik tidak valid".
5. WHEN Pengguna menyimpan Profil_Pengguna yang valid, THE Database SHALL menyimpan data profil dan THE TensiMenu SHALL mengarahkan Pengguna ke halaman rekomendasi harian.
6. THE TensiMenu SHALL memungkinkan Pengguna memilih satu atau lebih Komorbid dari daftar: diabetes tipe 2, gagal ginjal kronis, dislipidemia, obesitas, dan "tidak ada".
7. THE TensiMenu SHALL memungkinkan Pengguna menandai preferensi makanan berupa pantangan (misalnya alergi kacang, tidak makan daging babi) dan preferensi regional (misalnya masakan Jawa, Sunda, Minang).
8. WHEN Pengguna memperbarui Profil_Pengguna, THE Sistem_Rekomendasi SHALL menggunakan data profil terbaru pada siklus rekomendasi berikutnya.
9. IF Profil_Pengguna belum diisi lengkap, THEN THE TensiMenu SHALL menampilkan notifikasi pengingat dan membatasi akses ke fitur rekomendasi hingga profil dilengkapi.
10. WHEN Profil_Pengguna tersimpan, THE Sistem_Rekomendasi SHALL menghitung target nutrisi harian personal menggunakan formula berikut sebagai dasar semua rekomendasi dan perhitungan DASH_Score:
    - **Kebutuhan energi basal (BMR)** dihitung dengan rumus Mifflin-St Jeor: laki-laki = (10 × BB) + (6,25 × TB) - (5 × usia) + 5; perempuan = (10 × BB) + (6,25 × TB) - (5 × usia) - 161; satuan kkal/hari.
    - **Target natrium**: 2.300 mg/hari untuk semua pengguna; diturunkan menjadi 1.500 mg/hari jika sistolik ≥ 150 mmHg atau terdapat Komorbid gagal ginjal kronis.
    - **Target kalium**: 3.500 mg/hari untuk pengguna umum; dibatasi maksimal 2.000 mg/hari jika terdapat Komorbid gagal ginjal kronis.
    - **Target serat**: 25 g/hari untuk perempuan; 38 g/hari untuk laki-laki.
    - **Target kalsium**: 1.000 mg/hari untuk usia 18–50 tahun; 1.200 mg/hari untuk usia > 50 tahun.
    - **Target magnesium**: 310 mg/hari untuk perempuan; 400 mg/hari untuk laki-laki.
    - **Batas lemak jenuh**: maksimal 7% dari total kebutuhan energi harian (dalam gram = kebutuhan_energi × 0,07 / 9).
11. THE Sistem_Rekomendasi SHALL menyimpan target nutrisi personal yang telah dihitung ke Database bersama Profil_Pengguna, sehingga target tersebut dapat digunakan langsung oleh Validator_Nutrisi tanpa menghitung ulang setiap permintaan.

---

### Persyaratan 3: Generasi Rekomendasi Makanan Lokal Harian

**User Story:** Sebagai Pengguna, saya ingin menerima rekomendasi makanan lokal harian yang dipersonalisasi, agar saya dapat menjalani pola makan sehat sesuai DASH Diet tanpa meninggalkan kuliner Nusantara.

#### Kriteria Penerimaan

1. WHEN Pengguna mengakses halaman rekomendasi harian, THE Sistem_Rekomendasi SHALL menghasilkan Rencana_Makan yang terdiri dari minimal 3 waktu makan (sarapan, makan siang, makan malam) dan 1 pilihan camilan.
2. THE Sistem_Rekomendasi SHALL menggunakan algoritma *Content-Based Filtering* dengan mempertimbangkan Profil_Pengguna, data Nutrisi_DASH dari DKPI, dan riwayat preferensi Pengguna.
3. WHEN Sistem_Rekomendasi menghasilkan Rencana_Makan, THE Validator_Nutrisi SHALL memverifikasi bahwa total asupan natrium harian tidak melebihi target natrium personal Pengguna yang tersimpan di Profil_Pengguna.
4. WHEN Sistem_Rekomendasi menghasilkan Rencana_Makan, THE Validator_Nutrisi SHALL memverifikasi bahwa total asupan kalium harian berada dalam rentang target kalium personal Pengguna yang tersimpan di Profil_Pengguna.
5. WHEN Pengguna memiliki Komorbid gagal ginjal kronis, THE Sistem_Rekomendasi SHALL membatasi total asupan kalium harian di bawah 2.000 mg dan total asupan fosfor di bawah 800 mg.
6. WHEN Pengguna memiliki Komorbid diabetes tipe 2, THE Sistem_Rekomendasi SHALL memprioritaskan makanan dengan indeks glikemik rendah (di bawah 55) dalam Rencana_Makan.
7. THE Sistem_Rekomendasi SHALL menghasilkan Rencana_Makan baru dalam waktu tidak lebih dari 5 detik setelah permintaan diterima.
8. WHEN Pengguna menolak suatu rekomendasi makanan, THE Sistem_Rekomendasi SHALL menyediakan minimal 3 alternatif makanan lokal dengan profil nutrisi serupa.
9. THE TensiMenu SHALL menampilkan setiap item makanan dalam Rencana_Makan beserta: nama makanan, asal daerah, ukuran porsi (gram), dan ringkasan Nutrisi_DASH per sajian.
10. IF database Makanan_Lokal tidak memiliki cukup item yang memenuhi semua batasan profil Pengguna, THEN THE Sistem_Rekomendasi SHALL menampilkan pesan informatif dan merekomendasikan item terbaik yang tersedia beserta catatan nutrisi yang perlu diperhatikan.
11. THE Sistem_Rekomendasi SHALL menerapkan aturan anti-repetisi: makanan yang telah dikonfirmasi dikonsumsi oleh Pengguna dalam 3 hari kalender terakhir (berdasarkan Log_Rekomendasi) TIDAK boleh muncul kembali sebagai rekomendasi utama, kecuali jumlah kandidat yang memenuhi semua batasan nutrisi dan komorbid kurang dari 4 item.
12. WHEN aturan anti-repetisi aktif dan kandidat yang tersedia kurang dari 4 item, THEN THE Sistem_Rekomendasi SHALL mengabaikan aturan anti-repetisi, menampilkan makanan yang paling lama tidak dikonsumsi, dan menambahkan label "Sudah pernah direkomendasikan" pada kartu makanan tersebut.

---

### Persyaratan 4: Perhitungan dan Tampilan DASH Compliance Score

**User Story:** Sebagai Pengguna, saya ingin mengetahui skor kepatuhan DASH dari setiap sajian dan rencana makan harian saya, agar saya dapat memahami seberapa baik pilihan makanan saya mendukung pengelolaan hipertensi.

#### Kriteria Penerimaan

1. THE Validator_Nutrisi SHALL menghitung DASH_Score untuk setiap item makanan individual menggunakan formula berikut secara deterministik:
    - Untuk setiap **nutrisi positif** (kalium, kalsium, magnesium, serat): `skor_komponen = min(nilai_aktual_per_sajian / target_harian_personal, 1.0)`
    - Untuk setiap **nutrisi negatif** (natrium, lemak jenuh): `skor_komponen = max(1.0 - nilai_aktual_per_sajian / batas_maksimal_personal, 0.0)`
    - `DASH_Score_item = (rata-rata semua skor_komponen) × 100`, dibulatkan ke 1 desimal.
    - Target harian personal yang digunakan adalah nilai yang tersimpan di Profil_Pengguna (Req. 2.10), bukan angka flat.
2. THE Validator_Nutrisi SHALL menghitung DASH_Score agregat harian sebagai rata-rata tertimbang berdasarkan berat porsi (gram): `DASH_Score_harian = Σ(DASH_Score_item × porsi_gram) / Σ(porsi_gram)`, dibulatkan ke 1 desimal.
3. WHEN Pengguna membuka halaman rekomendasi atau tracker, THE TensiMenu SHALL menampilkan DASH_Score setiap item makanan dengan label kategori: "Sangat Baik" (80–100), "Baik" (60–79), "Cukup" (40–59), dan "Perlu Perhatian" (0–39).
4. WHEN Pengguna membuka halaman dashboard, THE TensiMenu SHALL menampilkan DASH_Score harian secara visual menggunakan indikator grafis (gauge chart atau progress bar) dengan nilai numerik dan label kategori yang terlihat jelas.
5. WHEN DASH_Score harian Pengguna berada di bawah 40, THE TensiMenu SHALL menampilkan 3 nutrisi yang paling jauh dari target personal (selisih terbesar antara nilai aktual dan target) beserta saran makanan lokal spesifik yang dapat meningkatkan nutrisi tersebut.
6. THE Validator_Nutrisi SHALL menggunakan formula dan target personal yang sama secara konsisten untuk setiap perhitungan, sehingga input nutrisi yang identik dengan profil yang sama selalu menghasilkan DASH_Score yang identik.
7. WHEN item makanan dalam database memiliki field `data_estimasi: true`, THE Validator_Nutrisi SHALL tetap menghitung DASH_Score menggunakan data yang tersedia, namun THE TensiMenu SHALL menampilkan label "Data Estimasi" pada kartu makanan tersebut agar Pengguna mengetahui tingkat kepercayaan data.

---

### Persyaratan 5: Tracker Progres Harian

**User Story:** Sebagai Pengguna, saya ingin melacak progres kesehatan saya dari waktu ke waktu, agar saya dapat melihat dampak perubahan pola makan terhadap kondisi hipertensi saya.

#### Kriteria Penerimaan

1. THE Tracker_Progres SHALL mencatat Log_Rekomendasi setiap kali Pengguna mengonfirmasi konsumsi Rencana_Makan harian.
2. THE TensiMenu SHALL menampilkan grafik tren DASH_Score harian Pengguna untuk periode 7 hari, 30 hari, dan 90 hari terakhir.
3. WHEN Pengguna mencatat konsumsi makanan selama 7 hari berturut-turut, THE Tracker_Progres SHALL menampilkan ringkasan mingguan yang memuat rata-rata DASH_Score, total asupan natrium, dan total asupan kalium.
4. THE TensiMenu SHALL menampilkan statistik kepatuhan kumulatif berupa persentase hari di mana DASH_Score harian Pengguna mencapai nilai 60 atau lebih.
5. WHEN Pengguna tidak mencatat konsumsi makanan selama 2 hari berturut-turut, THE TensiMenu SHALL mengirimkan notifikasi pengingat melalui antarmuka aplikasi.
6. THE Tracker_Progres SHALL menyimpan Log_Rekomendasi Pengguna di Database dengan retensi data minimal 12 bulan.
7. IF data Log_Rekomendasi untuk periode yang diminta tidak tersedia, THEN THE Tracker_Progres SHALL menampilkan pesan "Belum ada data untuk periode ini" tanpa menampilkan grafik kosong yang menyesatkan.

---

### Persyaratan 6: Pencatatan dan Visualisasi Riwayat Tekanan Darah

**User Story:** Sebagai Pengguna, saya ingin mencatat dan melihat riwayat tekanan darah saya, agar saya dapat memantau perkembangan kondisi hipertensi saya seiring perubahan pola makan.

#### Kriteria Penerimaan

1. THE TensiMenu SHALL menyediakan formulir pencatatan tekanan darah dengan kolom: nilai sistolik (mmHg), nilai diastolik (mmHg), tanggal, waktu pengukuran, dan catatan opsional.
2. WHEN Pengguna memasukkan nilai sistolik di luar rentang 70–250 mmHg atau nilai diastolik di luar rentang 40–150 mmHg, THEN THE TensiMenu SHALL menampilkan pesan validasi dan menolak penyimpanan data.
3. THE TensiMenu SHALL menampilkan grafik tren tekanan darah sistolik dan diastolik Pengguna untuk periode 7 hari, 30 hari, dan 90 hari terakhir.
4. THE TensiMenu SHALL menampilkan garis referensi pada grafik tekanan darah yang menunjukkan ambang batas hipertensi (sistolik ≥ 130 mmHg atau diastolik ≥ 80 mmHg) sesuai panduan JNC 8.
5. WHEN nilai tekanan darah yang dicatat Pengguna menunjukkan sistolik ≥ 180 mmHg atau diastolik ≥ 120 mmHg, THE TensiMenu SHALL menampilkan peringatan untuk segera berkonsultasi dengan tenaga medis.
6. THE Riwayat_Tekanan_Darah SHALL disimpan di Database dengan retensi data minimal 12 bulan.
7. THE TensiMenu SHALL memungkinkan Pengguna mengekspor Riwayat_Tekanan_Darah dalam format CSV untuk keperluan konsultasi medis.

---

### Persyaratan 7: Database Makanan Lokal dan Komposisi Nutrisi

**User Story:** Sebagai sistem, saya membutuhkan database makanan lokal yang akurat dan lengkap, agar rekomendasi yang dihasilkan dapat dipercaya secara nutrisi dan relevan secara budaya.

#### Kriteria Penerimaan

1. THE Database SHALL memuat minimal 200 item Makanan_Lokal dari berbagai daerah di Indonesia, mencakup representasi dari masakan Minang, Jawa, Sunda, Batak, Bugis, dan Papua.
2. THE Database SHALL menyimpan data Nutrisi_DASH untuk setiap item Makanan_Lokal, meliputi: energi (kkal), protein (g), lemak total (g), lemak jenuh (g), karbohidrat (g), serat (g), natrium (mg), kalium (mg), kalsium (mg), dan magnesium (mg) per 100 gram.
3. THE Database SHALL mencantumkan sumber data nutrisi untuk setiap item Makanan_Lokal (DKPI, USDA FoodData Central, atau Nutrisurvey).
4. WHEN data nutrisi suatu item Makanan_Lokal diperbarui, THE Database SHALL menyimpan versi sebelumnya dalam log perubahan yang memuat: `food_item_id`, `changed_at` (timestamp), `old_data` (JSON seluruh nilai nutrisi sebelumnya), dan `changed_by` (identifier pengguna atau proses yang melakukan perubahan).
5. THE Validator_Nutrisi SHALL menolak penyimpanan item Makanan_Lokal baru yang tidak memiliki data lengkap untuk semua 10 komponen Nutrisi_DASH yang diwajibkan, kecuali item tersebut menggunakan mekanisme estimasi (kriteria 7).
6. FOR ALL item Makanan_Lokal dalam database, mengurai data nutrisi ke format JSON kemudian memuat kembali ke objek Makanan_Lokal SHALL menghasilkan objek dengan nama field, tipe data, dan nilai yang identik hingga 2 desimal dengan objek asal.
7. WHEN data nutrisi suatu Makanan_Lokal tidak tersedia dari sumber primer (DKPI, USDA FoodData Central, Nutrisurvey), THE Database SHALL menyimpan item tersebut menggunakan nilai nutrisi dari makanan referensi dalam kategori yang sama (misalnya: "Gulai Tambusu" menggunakan data "Gulai Kambing" sebagai proxy; "Soto Lamongan" menggunakan data "Soto Ayam" sebagai proxy), dengan field `data_estimasi: true`, `makanan_referensi: "<nama makanan proxy>"`, dan `confidence_level: "rendah"`.
8. WHEN item Makanan_Lokal memiliki `data_estimasi: true`, THE TensiMenu SHALL menampilkan label "⚠ Data Estimasi" pada kartu rekomendasi makanan tersebut, sehingga Pengguna mengetahui bahwa nilai nutrisi yang ditampilkan adalah perkiraan berbasis makanan serupa.

---

### Persyaratan 8: Model Machine Learning dan Pipeline Rekomendasi

**User Story:** Sebagai tim pengembang, saya ingin membangun pipeline ML yang andal, agar Sistem_Rekomendasi dapat menghasilkan rekomendasi yang akurat dan dapat direproduksi.

#### Kriteria Penerimaan

1. THE Model_ML SHALL dilatih menggunakan algoritma *Content-Based Filtering* dengan mekanisme kerja sebagai berikut:
    - Setiap item Makanan_Lokal direpresentasikan sebagai **vektor fitur nutrisi** berisi 7 komponen Nutrisi_DASH (natrium, kalium, kalsium, magnesium, serat, lemak jenuh, energi), dinormalisasi menggunakan Min-Max Scaling terhadap seluruh dataset.
    - Setiap Pengguna direpresentasikan sebagai **vektor kebutuhan nutrisi** berisi target personal yang tersimpan di Profil_Pengguna (Req. 2.10), dinormalisasi dengan skala yang sama.
    - Skor kemiripan dihitung menggunakan **cosine similarity** antara vektor kebutuhan Pengguna dan vektor fitur setiap Makanan_Lokal.
    - Makanan yang melanggar batasan komorbid atau pantangan Pengguna **difilter terlebih dahulu** sebelum perhitungan similarity, bukan setelah.
    - Hasil akhir adalah daftar Makanan_Lokal diurutkan dari similarity tertinggi ke terendah, dengan makanan yang sudah dikonsumsi dalam 3 hari terakhir diturunkan prioritasnya (bukan dihapus, kecuali aturan Req. 3.11 berlaku).
2. THE Model_ML SHALL mencapai nilai *precision@10* minimal 0,70 pada dataset validasi, diukur berdasarkan kesesuaian rekomendasi dengan batasan nutrisi DASH untuk profil Pengguna yang diberikan.
3. WHEN Model_ML dilatih ulang dengan dataset yang sama, parameter yang sama, dan random seed yang sama, THE Model_ML SHALL menghasilkan urutan rekomendasi yang identik untuk input profil yang identik.
4. THE API_Backend SHALL menyediakan endpoint `POST /api/v1/recommendations` yang menerima `user_id` dan mengembalikan Rencana_Makan dalam format JSON dengan waktu respons tidak lebih dari 5 detik.
5. THE API_Backend SHALL menyediakan endpoint `POST /api/v1/dash-score` yang menerima daftar item makanan beserta porsi (gram) dan mengembalikan DASH_Score per item dan DASH_Score agregat harian berdasarkan target personal Pengguna.
6. IF Model_ML gagal menghasilkan rekomendasi karena kesalahan internal, THEN THE API_Backend SHALL mengembalikan kode status HTTP 500 beserta pesan kesalahan terstruktur dalam format JSON: `{"error": "<pesan>", "code": "<kode_internal>"}` tanpa mengekspos stack trace.
7. THE Model_ML SHALL menyimpan artefak model (bobot, parameter normalisasi, versi, random seed) di sistem penyimpanan yang dapat diakses oleh API_Backend untuk inferensi tanpa perlu melatih ulang.
8. WHEN `user_id` yang diterima endpoint `POST /api/v1/recommendations` tidak ditemukan di Database, THEN THE API_Backend SHALL mengembalikan kode status HTTP 404 beserta pesan `{"error": "Pengguna tidak ditemukan", "code": "USER_NOT_FOUND"}` tanpa memproses rekomendasi.

---

### Persyaratan 9: Antarmuka Pengguna dan Aksesibilitas

**User Story:** Sebagai Pengguna, saya ingin antarmuka yang mudah digunakan dan dapat diakses dari berbagai perangkat, agar saya dapat menggunakan TensiMenu dengan nyaman kapan saja.

#### Kriteria Penerimaan

1. THE TensiMenu SHALL menampilkan antarmuka yang responsif dan dapat digunakan dengan baik pada perangkat dengan lebar layar minimal 320px (smartphone) hingga 1920px (desktop).
2. THE TensiMenu SHALL memuat halaman utama dalam waktu tidak lebih dari 3 detik pada koneksi jaringan dengan kecepatan unduh minimal 10 Mbps.
3. THE TensiMenu SHALL menggunakan kontras warna minimum 4,5:1 antara teks dan latar belakang untuk semua elemen teks utama, sesuai panduan WCAG 2.1 Level AA.
4. THE TensiMenu SHALL menyediakan teks alternatif (alt text) yang deskriptif untuk semua gambar makanan dan ikon yang memiliki makna fungsional.
5. THE TensiMenu SHALL menampilkan semua konten dalam Bahasa Indonesia sebagai bahasa utama.
6. WHEN Pengguna menggunakan perangkat dengan koneksi lambat atau luring sementara, THE TensiMenu SHALL menampilkan indikator loading yang jelas dan pesan kesalahan yang informatif, bukan halaman kosong.
7. THE TensiMenu SHALL memungkinkan navigasi antar halaman utama (Beranda, Rekomendasi, Tracker, Riwayat, Profil) melalui menu navigasi yang konsisten di semua halaman.

---

### Persyaratan 10: Keamanan dan Privasi Data

**User Story:** Sebagai Pengguna, saya ingin data kesehatan saya disimpan dan diproses dengan aman, agar privasi informasi medis saya terlindungi.

#### Kriteria Penerimaan

1. THE TensiMenu SHALL mengenkripsi semua komunikasi antara frontend dan API_Backend menggunakan protokol HTTPS/TLS 1.2 atau lebih tinggi.
2. THE Database SHALL menyimpan data Profil_Pengguna dan Riwayat_Tekanan_Darah dalam tabel yang terisolasi per pengguna dengan kontrol akses berbasis baris (*Row Level Security*) di Supabase.
3. WHEN API_Backend menerima permintaan ke endpoint yang memerlukan autentikasi, THE API_Backend SHALL memvalidasi token JWT dan menolak permintaan dengan kode status HTTP 401 jika token tidak valid atau kedaluwarsa.
4. THE API_Backend SHALL menerapkan pembatasan laju (*rate limiting*) sebesar maksimal 100 permintaan per menit per pengguna terautentikasi untuk mencegah penyalahgunaan.
5. THE TensiMenu SHALL tidak menyimpan atau mengirimkan data identitas pribadi Pengguna ke layanan pihak ketiga tanpa persetujuan eksplisit Pengguna.
6. IF terjadi kegagalan autentikasi sebanyak 5 kali berturut-turut dari alamat IP yang sama dalam 10 menit, THEN THE Autentikasi SHALL memblokir sementara percobaan login dari IP tersebut selama 15 menit.
7. THE TensiMenu SHALL menyediakan halaman kebijakan privasi yang menjelaskan jenis data yang dikumpulkan, tujuan penggunaan, dan hak Pengguna atas datanya.

---

### Persyaratan 11: Performa dan Keandalan Sistem

**User Story:** Sebagai Pengguna, saya ingin sistem yang andal dan responsif, agar pengalaman menggunakan TensiMenu tidak terganggu oleh masalah teknis.

#### Kriteria Penerimaan

1. THE API_Backend SHALL memiliki ketersediaan (*uptime*) minimal 99% dalam periode 30 hari kalender, tidak termasuk jendela pemeliharaan terjadwal.
2. THE API_Backend SHALL menangani minimal 50 permintaan rekomendasi bersamaan tanpa degradasi waktu respons melebihi 8 detik.
3. WHEN API_Backend mengalami kegagalan koneksi ke Database, THEN THE API_Backend SHALL mencoba kembali koneksi sebanyak 3 kali dengan jeda eksponensial sebelum mengembalikan kode status HTTP 503.
4. THE TensiMenu SHALL menyimpan log kesalahan (*error log*) untuk setiap permintaan yang menghasilkan kode status HTTP 4xx atau 5xx, memuat: timestamp, endpoint, kode status, dan pesan kesalahan.
5. WHILE sistem dalam kondisi beban tinggi (lebih dari 80% kapasitas CPU), THE API_Backend SHALL memprioritaskan permintaan rekomendasi aktif di atas permintaan pembaruan data historis.

---

### Persyaratan 12: Integrasi API dan Manajemen Data

**User Story:** Sebagai tim pengembang, saya ingin API yang terstruktur dengan baik, agar integrasi antara frontend Next.js dan backend FastAPI berjalan lancar dan dapat dipelihara.

#### Kriteria Penerimaan

1. THE API_Backend SHALL mengikuti konvensi REST API dengan penamaan endpoint yang konsisten menggunakan format `/api/v1/{resource}`.
2. THE API_Backend SHALL menyediakan dokumentasi API interaktif melalui antarmuka Swagger UI yang dapat diakses di endpoint `/docs`.
3. WHEN API_Backend menerima data input yang tidak sesuai skema yang ditetapkan, THE API_Backend SHALL mengembalikan kode status HTTP 422 beserta daftar field yang tidak valid dalam format JSON.
4. THE API_Backend SHALL mendukung pembuatan versi API (*API versioning*) sehingga perubahan pada versi baru tidak merusak integrasi klien yang menggunakan versi sebelumnya.
5. FOR ALL endpoint API yang mengembalikan daftar data, mengurai respons JSON kemudian memuat kembali ke struktur data yang sama SHALL menghasilkan data yang identik dengan respons asal (properti round-trip serialisasi JSON).
6. THE API_Backend SHALL menyediakan endpoint kesehatan (*health check*) di `/api/v1/health` yang mengembalikan status sistem dan konektivitas Database dalam format JSON.
