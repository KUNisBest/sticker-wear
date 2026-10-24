import { useState, useRef, useCallback, useEffect } from 'react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';

const PHONE_STORAGE_KEY = 'sticker_wear_phone';

interface LoginProps {
  onClose: () => void;
}

type LoginMode = 'password' | 'sms';

export default function Login({ onClose }: LoginProps) {
  const { setToken } = useAuth();

  // --- Shared state ---
  const [mode, setMode] = useState<LoginMode>('password');
  const [phone, setPhone] = useState(() => {
    return localStorage.getItem(PHONE_STORAGE_KEY) || '';
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Password login state ---
  const [password, setPassword] = useState('');

  // --- SMS login state ---
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Set password after SMS login ---
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pendingToken, setPendingToken] = useState('');

  // --- Remember phone ---
  const [rememberPhone, setRememberPhone] = useState(true);

  // Save phone to localStorage
  const savePhone = useCallback((value: string) => {
    setPhone(value);
    if (rememberPhone) {
      localStorage.setItem(PHONE_STORAGE_KEY, value);
    }
  }, [rememberPhone]);

  // Clear saved phone when unchecking
  useEffect(() => {
    if (!rememberPhone) {
      localStorage.removeItem(PHONE_STORAGE_KEY);
    } else if (phone) {
      localStorage.setItem(PHONE_STORAGE_KEY, phone);
    }
  }, [rememberPhone]);

  // ==================== Mutations ====================

  // Password login
  const passwordLoginMutation = trpc.auth.loginPassword.useMutation({
    onSuccess: (data) => {
      if (data.success && data.token) {
        setSuccess('登录成功！');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 600);
      } else {
        setError(data.message || '登录失败');
      }
    },
    onError: (err) => {
      setError(err.message || '登录失败，请重试');
    },
  });

  // SMS: send code
  const sendCodeMutation = trpc.auth.sendCode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const resp = data as unknown as { success: boolean; message: string; code?: string };
        if (resp.code) {
          setSentCode(resp.code);
          setCode(resp.code);
          setSuccess(`验证码已自动填充: ${resp.code}`);
        } else {
          setSuccess('验证码已发送，请注意查收');
        }
        setCountdown(60);
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.message || '发送失败');
      }
    },
    onError: (err) => {
      setError(err.message || '发送失败，请重试');
    },
  });

  // SMS: verify code
  const verifyMutation = trpc.auth.verifyCode.useMutation({
    onSuccess: (data) => {
      if (data.success && data.token) {
        // Check if user has password set
        const resp = data as unknown as { success: boolean; token: string; hasPassword?: boolean };
        if (!resp.hasPassword) {
          // Prompt to set password
          setPendingToken(data.token);
          setShowSetPassword(true);
          setSuccess('登录成功！建议设置密码，下次可直接登录');
        } else {
          setToken(data.token);
          setSuccess('登录成功！');
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 800);
        }
      } else {
        setError(data.message || '验证码错误');
      }
    },
    onError: (err) => {
      setError(err.message || '验证失败，请重试');
    },
  });

  // Set password
  const setPasswordMutation = trpc.auth.setPassword.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setToken(pendingToken);
        setSuccess('密码设置成功，登录中...');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 800);
      } else {
        setError(data.message || '设置失败');
      }
    },
    onError: (err) => {
      setError(err.message || '设置失败，请重试');
    },
  });

  // ==================== Handlers ====================

  const handleSendCode = useCallback(() => {
    setError('');
    setSuccess('');
    if (!phone.match(/^1[3-9]\d{9}$/)) {
      setError('请输入正确的11位手机号');
      return;
    }
    sendCodeMutation.mutate({ phone });
  }, [phone, sendCodeMutation]);

  const handlePasswordLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      if (!phone.match(/^1[3-9]\d{9}$/)) {
        setError('请输入正确的11位手机号');
        return;
      }
      if (password.length < 6) {
        setError('请输入密码（至少6位）');
        return;
      }
      passwordLoginMutation.mutate({ phone, password });
    },
    [phone, password, passwordLoginMutation]
  );

  const handleSmsLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      if (!phone.match(/^1[3-9]\d{9}$/)) {
        setError('请输入正确的11位手机号');
        return;
      }
      if (!code.match(/^\d{6}$/)) {
        setError('请输入6位验证码');
        return;
      }
      verifyMutation.mutate({ phone, code });
    },
    [phone, code, verifyMutation]
  );

  const handleSkipPassword = useCallback(() => {
    setToken(pendingToken);
    onClose();
    window.location.reload();
  }, [pendingToken, setToken, onClose]);

  const handleSetPassword = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      if (newPassword.length < 6) {
        setError('密码至少6位');
        return;
      }
      // Temporarily set token so the request is authenticated
      localStorage.setItem("auth_token", pendingToken);
      setPasswordMutation.mutate({ password: newPassword });
    },
    [newPassword, pendingToken, setPasswordMutation]
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ==================== Render ====================

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-[420px] p-8"
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(212, 175, 55, 0.2)',
        }}
      >
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="font-display text-gold text-xl tracking-wider mb-2">
            STICKER WEAR
          </div>
          <div className="font-mono-data text-white/40 text-xs tracking-[3px]">
            {mode === 'password' ? 'PASSWORD LOGIN' : 'PHONE LOGIN'}
          </div>
        </div>

        {/* ========== Set Password Prompt (overrides everything) ========== */}
        {showSetPassword ? (
          <form onSubmit={handleSetPassword} className="space-y-5">
            <div className="text-center font-mono-data text-xs" style={{ color: 'rgba(212, 175, 55, 0.7)' }}>
              设置密码后，下次可直接用密码登录
            </div>
            <div>
              <label className="block font-mono-data text-white/50 text-[10px] tracking-wider mb-2">
                设置密码
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-transparent px-4 py-2.5 text-white text-sm focus:outline-none transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                placeholder="至少6位密码"
                autoFocus
              />
            </div>
            {error && (
              <div className="font-mono-data text-xs text-center" style={{ color: '#ff6666' }}>{error}</div>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={setPasswordMutation.isPending}
                className="flex-1 py-3 text-xs font-mono-data tracking-[4px] transition-all duration-300"
                style={{
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: '#d4af37',
                  background: 'rgba(212, 175, 55, 0.05)',
                }}
              >
                {setPasswordMutation.isPending ? '设置中...' : '设置密码并登录'}
              </button>
              <button
                type="button"
                onClick={handleSkipPassword}
                className="px-6 py-3 text-xs font-mono-data tracking-wider transition-colors"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                跳过
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* ========== Mode Tabs ========== */}
            <div className="flex mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { setMode('password'); setError(''); setSuccess(''); }}
                className="flex-1 pb-3 text-xs font-mono-data tracking-[2px] transition-all"
                style={{
                  color: mode === 'password' ? '#d4af37' : 'rgba(255,255,255,0.25)',
                  borderBottom: mode === 'password' ? '2px solid #d4af37' : '2px solid transparent',
                }}
              >
                密码登录
              </button>
              <button
                onClick={() => { setMode('sms'); setError(''); setSuccess(''); }}
                className="flex-1 pb-3 text-xs font-mono-data tracking-[2px] transition-all"
                style={{
                  color: mode === 'sms' ? '#d4af37' : 'rgba(255,255,255,0.25)',
                  borderBottom: mode === 'sms' ? '2px solid #d4af37' : '2px solid transparent',
                }}
              >
                验证码登录
              </button>
            </div>

            {/* ========== Password Login Form ========== */}
            {mode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                {/* Phone */}
                <div>
                  <label className="block font-mono-data text-white/50 text-[10px] tracking-wider mb-2">
                    手机号
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => savePhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full bg-transparent px-4 py-2.5 text-white text-sm focus:outline-none transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    placeholder="请输入11位手机号"
                    maxLength={11}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block font-mono-data text-white/50 text-[10px] tracking-wider mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent px-4 py-2.5 text-white text-sm focus:outline-none transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                </div>

                {/* Remember phone checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberPhone}
                    onChange={(e) => setRememberPhone(e.target.checked)}
                    className="accent-gold"
                    style={{ accentColor: '#d4af37' }}
                  />
                  <span className="font-mono-data text-white/30 text-[10px] tracking-wider">
                    记住手机号
                  </span>
                </label>

                {/* Messages */}
                {error && (
                  <div className="font-mono-data text-xs text-center" style={{ color: '#ff6666' }}>{error}</div>
                )}
                {success && (
                  <div className="font-mono-data text-xs text-center" style={{ color: '#d4af37' }}>{success}</div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={passwordLoginMutation.isPending}
                  className="w-full py-3 text-xs font-mono-data tracking-[4px] transition-all duration-300"
                  style={{
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    color: '#d4af37',
                    background: 'rgba(212, 175, 55, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                  }}
                >
                  {passwordLoginMutation.isPending ? '登录中...' : '登 录'}
                </button>

                <div className="text-center">
                  <span
                    onClick={() => setMode('sms')}
                    className="font-mono-data text-white/20 text-[10px] tracking-wider cursor-pointer hover:text-gold/60 transition-colors"
                  >
                    首次使用？验证码登录并设置密码
                  </span>
                </div>
              </form>
            )}

            {/* ========== SMS Login Form ========== */}
            {mode === 'sms' && (
              <form onSubmit={handleSmsLogin} className="space-y-5">
                {/* SMS notice */}
                <div
                  className="px-3 py-2 text-center font-mono-data text-[10px] tracking-wider"
                  style={{
                    color: 'rgba(212, 175, 55, 0.5)',
                    border: '1px solid rgba(212, 175, 55, 0.15)',
                    background: 'rgba(212, 175, 55, 0.05)',
                  }}
                >
                  {sentCode
                    ? `验证码已自动填充: ${sentCode}（模拟模式）`
                    : '点击"获取验证码"后自动填充（开发环境）'}
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-mono-data text-white/50 text-[10px] tracking-wider mb-2">
                    手机号
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => savePhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full bg-transparent px-4 py-2.5 text-white text-sm focus:outline-none transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    placeholder="请输入11位手机号"
                    maxLength={11}
                  />
                </div>

                {/* Code + Send Button */}
                <div>
                  <label className="block font-mono-data text-white/50 text-[10px] tracking-wider mb-2">
                    验证码
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="flex-1 bg-transparent px-4 py-2.5 text-white text-sm focus:outline-none transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                      placeholder="6位验证码"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || sendCodeMutation.isPending}
                      className="px-4 py-2.5 text-xs font-mono-data tracking-wider whitespace-nowrap transition-all duration-300"
                      style={{
                        border: countdown > 0
                          ? '1px solid rgba(255,255,255,0.1)'
                          : '1px solid rgba(212, 175, 55, 0.4)',
                        color: countdown > 0 ? 'rgba(255,255,255,0.3)' : '#d4af37',
                        background: countdown > 0 ? 'transparent' : 'rgba(212, 175, 55, 0.05)',
                        cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>

                {/* Remember phone checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberPhone}
                    onChange={(e) => setRememberPhone(e.target.checked)}
                    style={{ accentColor: '#d4af37' }}
                  />
                  <span className="font-mono-data text-white/30 text-[10px] tracking-wider">
                    记住手机号
                  </span>
                </label>

                {/* Messages */}
                {error && (
                  <div className="font-mono-data text-xs text-center" style={{ color: '#ff6666' }}>{error}</div>
                )}
                {success && (
                  <div className="font-mono-data text-xs text-center" style={{ color: '#d4af37' }}>{success}</div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={verifyMutation.isPending}
                  className="w-full py-3 text-xs font-mono-data tracking-[4px] transition-all duration-300"
                  style={{
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    color: '#d4af37',
                    background: 'rgba(212, 175, 55, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                  }}
                >
                  {verifyMutation.isPending ? '验证中...' : '登 录'}
                </button>
              </form>
            )}
          </>
        )}

        {/* Footer tip */}
        <div className="mt-6 text-center">
          <span className="font-mono-data text-white/20 text-[10px] tracking-wider">
            首次登录将自动注册账号
          </span>
        </div>
      </div>
    </div>
  );
}
