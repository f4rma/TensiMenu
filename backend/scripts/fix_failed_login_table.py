"""
Script untuk memperbaiki tabel failed_login_attempts di Supabase.
Jalankan: python -m scripts.fix_failed_login_table
"""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.database import get_supabase


def main():
    """Jalankan migration untuk tabel failed_login_attempts"""
    
    print("🔧 Memperbaiki tabel failed_login_attempts...")
    
    # Baca file SQL migration
    migration_file = Path(__file__).parent.parent / "migrations" / "failed_login_attempts.sql"
    
    if not migration_file.exists():
        print(f"❌ File migration tidak ditemukan: {migration_file}")
        return False
    
    with open(migration_file, "r", encoding="utf-8") as f:
        sql_content = f.read()
    
    print(f"📄 Membaca migration dari: {migration_file}")
    
    # Dapatkan Supabase client
    supabase = get_supabase()
    
    try:
        # Execute SQL via Supabase RPC atau manual
        # Catatan: Supabase Python client tidak support raw SQL execution
        # Anda harus jalankan SQL ini manual di Supabase SQL Editor
        
        print("\n⚠️  CARA MENJALANKAN MIGRATION:")
        print("1. Buka Supabase Dashboard: https://app.supabase.com")
        print("2. Pilih project Anda")
        print("3. Klik menu 'SQL Editor' di sidebar kiri")
        print("4. Buat query baru")
        print("5. Copy-paste SQL berikut:\n")
        print("=" * 80)
        print(sql_content)
        print("=" * 80)
        print("\n6. Klik 'Run' untuk execute SQL")
        print("\n✅ Setelah selesai, restart backend Anda")
        
        return True
        
    except Exception as exc:
        print(f"❌ Error: {exc}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
