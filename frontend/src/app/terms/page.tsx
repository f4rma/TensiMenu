import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description:
    "Ketentuan layanan penggunaan aplikasi TensiMenu untuk pemantauan tekanan darah dan rekomendasi DASH Diet.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Ketentuan Layanan"
      lastUpdated="30 Mei 2026"
      intro="Dengan menggunakan TensiMenu, kamu menyetujui ketentuan berikut. Mohon baca dengan saksama sebelum menggunakan layanan kami."
      sections={[
        {
          heading: "Penerimaan Ketentuan",
          body: (
            <p>
              Dengan membuat akun dan menggunakan TensiMenu, kamu menyatakan
              telah membaca, memahami, dan menyetujui seluruh ketentuan yang
              tercantum di halaman ini. Jika tidak menyetujui, mohon untuk tidak
              menggunakan layanan.
            </p>
          ),
        },
        {
          heading: "Sifat Layanan",
          body: (
            <>
              <p>
                TensiMenu adalah aplikasi edukatif yang membantu pengguna
                menjalankan pola makan DASH dengan:
              </p>
              <ul>
                <li>Rekomendasi menu berbasis profil dan kondisi kesehatan.</li>
                <li>Pemantauan tekanan darah dan asupan nutrisi.</li>
                <li>Skor kepatuhan diet (DASH Score).</li>
              </ul>
              <p>
                Layanan ini merupakan proyek capstone berbasis riset dan
                disediakan apa adanya untuk tujuan edukasi.
              </p>
            </>
          ),
        },
        {
          heading: "Bukan Nasihat Medis",
          body: (
            <p>
              Rekomendasi yang diberikan TensiMenu bersifat informatif dan{" "}
              <strong className="font-semibold text-brand-charcoal">
                tidak menggantikan nasihat, diagnosis, atau perawatan medis
                profesional
              </strong>
              . Sebagian data nutrisi masakan merupakan estimasi yang perlu
              validasi ahli gizi. Selalu konsultasikan kondisi kesehatan,
              pengobatan, dan diet khususmu dengan dokter atau ahli gizi
              berlisensi.
            </p>
          ),
        },
        {
          heading: "Tanggung Jawab Pengguna",
          body: (
            <>
              <ul>
                <li>
                  Memberikan data profil dan kesehatan yang akurat agar
                  rekomendasi relevan.
                </li>
                <li>
                  Menjaga kerahasiaan kredensial akun dan tidak membagikannya
                  kepada orang lain.
                </li>
                <li>
                  Menggunakan layanan secara wajar dan tidak menyalahgunakannya.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Batasan Tanggung Jawab",
          body: (
            <p>
              TensiMenu tidak bertanggung jawab atas keputusan kesehatan yang
              diambil semata-mata berdasarkan rekomendasi aplikasi tanpa
              konsultasi medis. Penggunaan layanan sepenuhnya menjadi risiko dan
              tanggung jawab pengguna.
            </p>
          ),
        },
        {
          heading: "Perubahan Ketentuan",
          body: (
            <p>
              Kami dapat memperbarui ketentuan ini sewaktu-waktu. Perubahan
              akan dicantumkan di halaman ini dengan tanggal pembaruan terbaru.
              Penggunaan berkelanjutan setelah perubahan dianggap sebagai
              persetujuan atas ketentuan yang diperbarui.
            </p>
          ),
        },
        {
          heading: "Kontak",
          body: (
            <p>
              Pertanyaan terkait ketentuan layanan dapat diajukan ke{" "}
              <a href="mailto:tensimenu@gmail.com">tensimenu@gmail.com</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
