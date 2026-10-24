import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';

const ORDER_STATUS: Record<string, string> = {
  pending: "待支付", paid: "已支付", shipped: "已发货", completed: "已完成", cancelled: "已取消",
};

export default function Profile() {
  const { user, isLoggedIn } = useAuth();

  const displayName = user?.nickname || (isLoggedIn ? `用户${user?.phone.slice(-4)}` : '未登录');

  return (
    <div className="min-h-full bg-white" style={{ paddingTop: '8px' }}>
      {/* ====== Top User Section ====== */}
      <div className="px-6 py-5 flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{
            background: isLoggedIn ? 'rgba(212, 175, 55, 0.12)' : 'rgba(0,0,0,0.05)',
            border: isLoggedIn ? '2px solid rgba(212, 175, 55, 0.3)' : '2px solid rgba(0,0,0,0.08)',
            color: isLoggedIn ? '#d4af37' : '#999',
          }}
        >
          {user?.nickname?.charAt(0) || (isLoggedIn ? user?.phone.slice(-1) : '?')}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold truncate" style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>
              {displayName}
            </span>
            {isLoggedIn && (
              <span
                className="text-[10px] px-2 py-0.5 rounded font-mono-data"
                style={{ background: 'rgba(212,175,55,0.1)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)' }}
              >
                Lv.1
              </span>
            )}
          </div>
          {isLoggedIn && (
            <span className="text-xs" style={{ color: '#999' }}>
              信誉良好
            </span>
          )}
        </div>

        {/* Home Page Arrow */}
        {isLoggedIn && (
          <button className="flex items-center gap-1 px-4 py-2 rounded-full transition-colors" style={{ border: '1px solid rgba(0,0,0,0.08)', color: '#666' }}>
            <span className="text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>主页</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Spacer line */}
      <div className="h-2" style={{ background: '#f5f5f5' }} />

      {/* ====== Orders Section ====== */}
      <div className="px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-base font-bold" style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>订单</span>
          <button className="flex items-center gap-1 text-xs" style={{ color: '#999' }}>
            <span>全部</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Order Status Icons - 5 items */}
        <div className="flex items-center justify-around">
          <OrderIcon
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>}
            label="待付款"
          />
          <OrderIcon
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v13l4-4" /><circle cx="12" cy="12" r="9" /></svg>}
            label="待发货"
          />
          <OrderIcon
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="8" width="20" height="12" rx="2" /><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" /><circle cx="9" cy="17" r="1" /><circle cx="15" cy="17" r="1" /></svg>}
            label="待收货"
          />
          <OrderIcon
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>}
            label="评价"
          />
          <OrderIcon
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
            label="退款/售后"
          />
        </div>
      </div>

      {/* Spacer line */}
      <div className="h-2" style={{ background: '#f5f5f5' }} />

      {/* ====== Want / Have Section ====== */}
      <div className="px-6 py-5">
        <div className="flex items-center">
          {/* Want */}
          <div className="flex-1 flex items-center gap-3 border-r border-gray-100 pr-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#666' }}>
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: '#000' }}>想要</span>
                <span className="text-sm" style={{ color: '#999' }}>0</span>
              </div>
            </div>
          </div>

          {/* Have */}
          <div className="flex-1 flex items-center gap-3 pl-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#666' }}>
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: '#000' }}>我有</span>
                <span className="text-sm" style={{ color: '#999' }}>0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent items hint */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded flex items-center justify-center mb-1"
              style={{ background: '#f5f5f5' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            <span className="text-[10px]" style={{ color: '#bbb' }}>暂无商品</span>
          </div>
        </div>
      </div>

      {/* Spacer line */}
      <div className="h-2" style={{ background: '#f5f5f5' }} />

      {/* ====== My Orders ====== */}
      <OrderHistory />

      {/* Spacer line */}
      <div className="h-2" style={{ background: '#f5f5f5' }} />

      {/* ====== Other Menu Items ====== */}
      <div className="px-6">
        <MenuItem icon="📍" label="收货地址" />
        <MenuItem icon="⚙️" label="设置" />
      </div>

      <div className="h-16" />
    </div>
  );
}

/* ===== Order History ===== */
function OrderHistory() {
  const { isLoggedIn } = useAuth();
  const { data: orders } = trpc.order.myOrders.useQuery(undefined, { enabled: isLoggedIn });

  if (!isLoggedIn || !orders || orders.length === 0) return null;

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-bold" style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>我的订单</span>
        <span className="text-xs" style={{ color: '#999' }}>共 {orders.length} 单</span>
      </div>
      <div className="space-y-3">
        {orders.slice(0, 3).map((o: any) => (
          <div key={o.id} className="p-4" style={{ border: '1px solid #eee', background: '#fafafa' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono-data text-xs font-bold" style={{ color: '#333' }}>订单 #{o.id}</span>
              <span className="text-[10px] px-2 py-0.5 font-mono-data" style={{
                color: o.status === "shipped" ? "#3b82f6" : o.status === "completed" ? "#22aa55" : "#999",
                background: `${o.status === "shipped" ? "#3b82f6" : o.status === "completed" ? "#22aa55" : "#999"}10`,
              }}>{ORDER_STATUS[o.status] || o.status}</span>
            </div>
            <div className="space-y-1">
              {o.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span style={{ color: '#666' }}>{item.productName} x{item.quantity}</span>
                  <span style={{ color: '#d4af37' }}>¥{item.price}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '1px solid #eee' }}>
              <span className="text-[10px] font-mono-data" style={{ color: '#bbb' }}>{new Date(o.createdAt).toLocaleDateString("zh-CN")}</span>
              <span className="text-sm font-bold" style={{ color: '#000' }}>¥{o.totalPrice}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Sub Components ===== */

function OrderIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 group">
      <div
        className="w-11 h-11 flex items-center justify-center transition-colors"
        style={{ color: '#555' }}
      >
        {icon}
      </div>
      <span className="text-xs" style={{ color: '#666', fontFamily: 'Inter, sans-serif' }}>{label}</span>
    </button>
  );
}

function MenuItem({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <button className="w-full flex items-center justify-between py-4 border-b border-gray-50">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm" style={{ color: '#333', fontFamily: 'Inter, sans-serif' }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs" style={{ color: '#999' }}>{value}</span>}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}
