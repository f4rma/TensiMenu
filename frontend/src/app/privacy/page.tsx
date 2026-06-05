import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi TensiMenu - bagaimana kami mengumpulkan, menggunakan, dan melindungi data kesehatan Anda.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      lastUpdated="30 Mei 2026"
      intro="Privasimu penting bagi kami. Halaman ini menjelaskan data apa yang TensiMenu kumpulkan, bagaimana data tersebut digunakan untuk personalisasi rekomendasi DASH, dan hak yang kamu miliki atas datamu."
      sections={[
        {
          heading: "Data yang Kami Kumpulkan",
          body: (
            <>
              <p>
                Untuk memberikan rekomendasi nutrisi yang dipersonalisasi, kami
                mengumpulkan data berikut yang kamu masukkan secara sukarela:
              </p>
              <ul>
                <li>
                  Data profil: nama, usia, jenis kelamin, berat badan, tinggi
                  badan, dan tingkat aktivitas.
                </li>
                <li>
                  Data kesehatan: tekanan darah, kondisi komorbid (mis.
                  hipertensi, CKD), serta pantangan atau preferensi makanan.
                </li>
                <li>
                  Data aktivitas: catatan konsumsi makanan harian dan riwayat
                  pengukuran tekanan darah.
                </li>
                <li>
                  Data akun: alamat email untuk autentikasi dan keamanan.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Bagaimana Data Digunakan",
          body: (
            <>
              <p>Data kamu digunakan semata-mata untuk:</p>
              <ul>
                <li>
                  Menghitung target nutrisi harian personal (energi, natrium,
                  kalium, kalsium, serat, lemak) berbasis rumus gizi standar.
                </li>
                <li>
                  Menyusun rekomendasi menu DASH yang sesuai dengan profil dan
                  kondisi medismu.
                </li>
                <li>
                  Menampilkan tren tekanan darah dan kepatuhan diet dari waktu
                  ke waktu.
                </li>
              </ul>
              <p>
                Kami tidak menjual, menyewakan, atau membagikan data pribadimu
                kepada pihak ketiga untuk tujuan pemasaran.
              </p>
            </>
          ),
        },
        {
          heading: "Penyimpanan & Keamanan",
          body: (
            <p>
              Data disimpan dengan aman menggunakan infrastruktur Supabase
              dengan enkripsi standar industri saat transit (HTTPS/TLS) dan saat
              disimpan. Akses ke datamu dilindungi melalui autentikasi token dan
              aturan keamanan tingkat baris (Row Level Security) sehingga hanya
              kamu yang dapat mengakses data milikmu.
            </p>
          ),
        },
        {
          heading: "Hak Atas Data Anda",
          body: (
            <>
              <p>Kamu memiliki hak penuh atas datamu, termasuk:</p>
              <ul>
                <li>Melihat dan memperbarui data profil kapan saja.</li>
                <li>
                  Mengekspor riwayat tekanan darah dalam format CSV dari halaman
                  Riwayat TD.
                </li>
                <li>
                  Meminta penghapusan akun beserta seluruh data terkait dengan
                  menghubungi kami.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Catatan Medis",
          body: (
            <p>
              TensiMenu memberikan rekomendasi berbasis pola makan DASH dan data
              gizi, namun bukan pengganti nasihat medis profesional. Keputusan
              terkait pengobatan atau diet khusus tetap harus dikonsultasikan
              dengan dokter atau ahli gizi.
            </p>
          ),
        },
        {
          heading: "Kontak",
          body: (
            <p>
              Untuk pertanyaan terkait privasi atau permintaan data, hubungi
              kami di{" "}
              <a href="mailto:tensimenu@gmail.com">tensimenu@gmail.com</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
