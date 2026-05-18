import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus diisi."
  );
}

// Supabase client untuk digunakan di browser (Client Components).
// Menggunakan anon key - dimana Row Level Security (RLS) berlaku penuh.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Membuat Supabase client baru untuk digunakan di Server Components atau API Routes. 
 * Menggunakan anon key dengan sesi yang diteruskan dari request header jika tersedia.
 
 * Untuk operasi admin (bypass RLS), gunakan service role key hanya di server-side dan jangan pernah ekspos ke browser.
 */
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
