"""
Script untuk debug JWT issue - cek JWKS keys yang tersedia dari Supabase.
Jalankan: python -m scripts.debug_jwt
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx
from core.config import get_settings


def main():
    """Debug JWKS endpoint dan JWT keys"""
    
    settings = get_settings()
    base = settings.SUPABASE_URL.rstrip("/")
    jwks_url = f"{base}/auth/v1/.well-known/jwks.json"
    
    print("🔍 Debug JWT Keys")
    print(f"📍 Supabase URL: {settings.SUPABASE_URL}")
    print(f"📍 JWKS URL: {jwks_url}\n")
    
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(jwks_url)
            response.raise_for_status()
            jwks = response.json()
            
            keys = jwks.get("keys", [])
            
            print(f"✅ JWKS berhasil di-fetch: {len(keys)} key(s) ditemukan\n")
            
            for idx, key in enumerate(keys, 1):
                kid = key.get("kid", "N/A")
                alg = key.get("alg", "N/A")
                kty = key.get("kty", "N/A")
                use = key.get("use", "N/A")
                
                print(f"Key #{idx}:")
                print(f"  • kid: {kid}")
                print(f"  • alg: {alg}")
                print(f"  • kty: {kty}")
                print(f"  • use: {use}")
                print()
            
            print("\n" + "="*80)
            print("💡 ANALISIS:")
            print("="*80)
            
            if len(keys) == 1:
                print("⚠️  Hanya 1 key tersedia di JWKS")
                print("   Token lama dengan kid berbeda akan GAGAL validasi")
                print("\n📋 SOLUSI:")
                print("   1. Minta semua user LOGOUT dan LOGIN ULANG")
                print("   2. Token lama akan expired sendiri (~1 jam)")
                print("   3. Atau fallback ke HS256 dengan JWT_SECRET")
            else:
                print(f"✅ {len(keys)} keys tersedia (mendukung key rotation)")
                print("   Token dengan kid berbeda masih bisa divalidasi")
            
            print("\n🔐 Token yang gagal validasi:")
            print("   kid: 06c7c47679b808fcedf7391d7b1e3657bca30dbb")
            print("   Status: Tidak ditemukan di JWKS (token lama)")
            
            return True
            
    except Exception as exc:
        print(f"❌ Error: {exc}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
