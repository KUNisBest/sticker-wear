import type { PageType } from '../App';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onLoginClick: () => void;
}

const navItems: { label: string; key: PageType }[] = [
  { label: '商城', key: 'shop' },
  { label: '社区', key: 'community' },
  { label: '我的', key: 'profile' },
];

export default function Navbar({ currentPage, onPageChange, onLoginClick }: NavbarProps) {
  const { user, isLoggedIn, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const textColor = '#333';
  const mutedColor = 'rgba(0,0,0,0.4)';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-start justify-between pointer-events-none"
      style={{
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Left: Login / User */}
      <div className="pointer-events-auto">
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#d4af37',
              }}
            >
              {user?.nickname?.charAt(0) || user?.phone.slice(-4) || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs" style={{ color: textColor, fontFamily: 'Inter, sans-serif' }}>
                {user?.nickname || `用户${user?.phone?.slice(-4)}`}
              </span>
              <button
                onClick={logout}
                className="text-[10px] text-left transition-opacity opacity-40 hover:opacity-70"
                style={{ color: textColor }}
              >
                退出登录
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 text-xs tracking-wider transition-opacity duration-300 hover:opacity-70"
            style={{ color: textColor, fontFamily: 'Inter, sans-serif' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            用户登录
          </button>
        )}
      </div>

      {/* Center: Navigation */}
      <div className="pointer-events-auto flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onPageChange(item.key)}
            className="font-mono-data text-sm tracking-[3px] transition-all duration-300 relative py-1"
            style={{
              color: currentPage === item.key ? '#d4af37' : mutedColor,
              textShadow: currentPage === item.key ? '0 0 10px rgba(212, 175, 55, 0.3)' : 'none',
            }}
          >
            {item.label}
            {currentPage === item.key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{ background: '#d4af37', boxShadow: '0 0 8px rgba(212,175,55,0.4)' }}
              />
            )}
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={() => onPageChange('admin')}
            className="font-mono-data text-sm tracking-[3px] transition-all duration-300 relative py-1"
            style={{
              color: currentPage === 'admin' ? '#d4af37' : mutedColor,
            }}
          >
            ADMIN
            {currentPage === 'admin' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{ background: '#d4af37', boxShadow: '0 0 8px rgba(212,175,55,0.4)' }}
              />
            )}
          </button>
        )}
      </div>
    </nav>
  );
}
