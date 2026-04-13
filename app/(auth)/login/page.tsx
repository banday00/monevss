'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';

// ─── Captcha generator ─────────────────────────────────────────────
function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;   // 1–9
  const b = Math.floor(Math.random() * 9) + 1;   // 1–9
  const ops = ['+', '-'] as const;
  const op  = ops[Math.floor(Math.random() * ops.length)];

  // Ensure result is always ≥ 1
  const [n1, n2] = op === '-' && b > a ? [b, a] : [a, b];
  const answer   = op === '+' ? n1 + n2 : n1 - n2;

  return { n1, n2, op, answer };
}

// ─── Login Form ────────────────────────────────────────────────────
function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get('callbackUrl') || '/';

  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  // null on server, set after mount to avoid SSR/client Math.random() mismatch
  const [captcha,       setCaptcha]       = useState<ReturnType<typeof generateCaptcha> | null>(null);
  const [captchaInput,  setCaptchaInput]  = useState('');
  const [captchaError,  setCaptchaError]  = useState('');
  const [captchaShake,  setCaptchaShake]  = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);

  // Generate captcha only on client after mount
  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  // Reset captcha on client (safe — only called from event handlers)
  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  }, []);

  // Shake animation helper
  const shake = useCallback(() => {
    setCaptchaShake(true);
    setTimeout(() => setCaptchaShake(false), 600);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate captcha (captcha is always set by the time user submits)
    const parsed = parseInt(captchaInput.trim());
    if (!captcha || isNaN(parsed) || parsed !== captcha.answer) {
      setCaptchaError('Jawaban captcha salah. Coba lagi.');
      shake();
      refreshCaptcha();
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Username atau password salah');
      setLoading(false);
      refreshCaptcha(); // force new captcha on failed login
    } else {
      router.push(callbackUrl);
      router.refresh(); // Force server re-render agar layout membaca session baru → Sidebar muncul
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-scale-in">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon" style={{ background: 'transparent' }}>
            <Image 
              src="/logo_kota_bogor.png" 
              alt="Logo Kota Bogor" 
              width={48} 
              height={48}
              priority
              unoptimized
            />
          </div>
          <h1>Satu Data Bogor</h1>
          <p>Dashboard Monitoring Portal Data</p>
        </div>

        {/* Error banner */}
        {error && <div className="form-error" id="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              className="form-input"
              type="text"
              id="username"
              name="username"
              placeholder="Masukkan username"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Masukkan password"
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1,
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* ─── Math Captcha ─── */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Verifikasi</span>
              <button
                type="button"
                onClick={refreshCaptcha}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4,
                }}
                title="Ganti soal"
              >
                🔄 Ganti soal
              </button>
            </label>

            {/* Captcha display box */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                animation: captchaShake ? 'captchaShake 0.5s ease' : 'none',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '10px 18px', borderRadius: 10, minWidth: 160,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.12))',
                border: '1px solid rgba(99,102,241,0.35)',
                userSelect: 'none', flexShrink: 0, minHeight: 46,
              }}>
                {captcha === null ? (
                  /* Skeleton while waiting for client mount */
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Memuat soal...</span>
                ) : (
                  <>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#818cf8', fontFamily: 'monospace', letterSpacing: 1, textShadow: '0 0 10px rgba(129,140,248,0.5)' }}>
                      {captcha.n1}
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: captcha.op === '+' ? '#34d399' : '#f87171', textShadow: captcha.op === '+' ? '0 0 8px rgba(52,211,153,0.5)' : '0 0 8px rgba(248,113,113,0.5)' }}>
                      {captcha.op}
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#818cf8', fontFamily: 'monospace', letterSpacing: 1, textShadow: '0 0 10px rgba(129,140,248,0.5)' }}>
                      {captcha.n2}
                    </span>
                    <span style={{ fontSize: 20, color: 'var(--text-muted)', fontWeight: 700 }}>=</span>
                    <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>?</span>
                  </>
                )}
              </div>

              {/* Answer input */}
              <input
                className="form-input"
                type="number"
                id="captcha-answer"
                value={captchaInput}
                onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(''); }}
                placeholder="Jawaban"
                required
                min={0}
                max={99}
                autoComplete="off"
                style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700 }}
              />
            </div>

            {/* Captcha error */}
            {captchaError && (
              <div style={{
                marginTop: 6, fontSize: 12, color: '#f87171',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span>❌</span> {captchaError}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            id="login-submit"
            disabled={loading}
          >
            {loading ? '⏳ Memproses...' : '🔐 Masuk Dashboard'}
          </button>
        </form>

        {/* Footer note */}
        <p style={{
          marginTop: 20, textAlign: 'center', fontSize: 11,
          color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          Akses terbatas untuk admin &amp; pengelola Satu Data Kota Bogor
        </p>
      </div>

      {/* Captcha shake keyframes */}
      <style>{`
        @keyframes captchaShake {
          0%, 100% { transform: translateX(0); }
          15%  { transform: translateX(-6px); }
          30%  { transform: translateX(6px);  }
          45%  { transform: translateX(-4px); }
          60%  { transform: translateX(4px);  }
          75%  { transform: translateX(-2px); }
          90%  { transform: translateX(2px);  }
        }
      `}</style>
    </div>
  );
}

// ─── Page wrapper ──────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="login-page">
        <div className="login-card animate-scale-in">
          <div className="login-logo">
            <div className="login-logo-icon" style={{ background: 'transparent' }}>
              <Image 
                src="/logo_kota_bogor.png" 
                alt="Logo Kota Bogor" 
                width={48} 
                height={48}
                priority
                unoptimized
              />
            </div>
            <h1>Satu Data Bogor</h1>
            <p>Memuat...</p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
