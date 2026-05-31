/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Foto makanan berasal dari banyak domain pihak ketiga (cpcdn, tokopedia,
    // bukalapak, wikimedia, dll) hasil matching dataset, plus Supabase Storage
    // untuk foto yang di-upload manual. Pakai wildcard HTTPS agar fleksibel.
    //
    // Catatan keamanan: hanya protokol HTTPS yang diizinkan. Untuk produksi,
    // pertimbangkan membatasi ke daftar domain spesifik bila semua foto sudah
    // dipindah ke Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
