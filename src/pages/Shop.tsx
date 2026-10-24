import { useState } from 'react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  description?: string;
}

const categories = ['精选', '鞋类', '潮服', '数码', '美妆', '家居', '包袋', '配饰'];

export default function Shop() {
  const { isLoggedIn } = useAuth();
  const [activeCategory, setActiveCategory] = useState('精选');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [buyProduct, setBuyProduct] = useState<Product | null>(null);

  // Checkout form
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  const { data: products, isLoading } = trpc.admin.getPublicProducts.useQuery();
  const productList = (products as Product[] | undefined) || [];
  const utils = trpc.useUtils();

  const createOrder = trpc.order.create.useMutation({
    onSuccess: (d) => {
      if (d.success) {
        setMsg('✅ 下单成功！订单号：#' + d.orderId);
        utils.admin.getPublicProducts.invalidate();
        setTimeout(() => { setBuyProduct(null); setMsg(''); }, 2000);
      } else {
        setMsg('❌ ' + (d.message || '下单失败'));
      }
    },
    onError: (e) => setMsg('❌ ' + e.message),
  });

  const handleBuy = () => {
    if (!buyProduct) return;
    if (!shippingName.trim()) { setMsg('❌ 请填写收货人'); return; }
    if (!shippingPhone.match(/^1\d{10}$/)) { setMsg('❌ 手机号格式错误'); return; }
    if (!shippingAddress.trim()) { setMsg('❌ 请填写收货地址'); return; }

    createOrder.mutate({
      items: [{
        productId: buyProduct.id,
        quantity: 1,
      }],
      shippingName: shippingName.trim(),
      shippingPhone: shippingPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      note: note.trim(),
    });
  };

  const filtered = activeCategory === '精选'
    ? productList
    : productList.filter(p => p.category === activeCategory);

  return (
    <div className="w-full min-h-full bg-white" style={{ paddingTop: '8px' }}>
      {/* Category tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex items-center gap-0 px-6 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="relative flex-shrink-0 px-5 py-3 text-sm transition-all duration-200"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: activeCategory === cat ? 700 : 400,
                color: activeCategory === cat ? '#000000' : '#666666',
              }}
            >
              {cat}
              {activeCategory === cat && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-black rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="text-center py-20 font-mono-data text-xs" style={{ color: '#bbb' }}>加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 font-mono-data text-xs" style={{ color: '#bbb' }}>暂无商品</div>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group"
              >
                <div
                  onMouseEnter={() => setHoveredId(product.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="relative w-full overflow-hidden bg-gray-50 transition-all duration-300"
                  style={{
                    aspectRatio: '1 / 1',
                    transform: hoveredId === product.id ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500"
                    style={{
                      transform: hoveredId === product.id ? 'scale(1.05)' : 'scale(1)',
                    }}
                  />
                </div>

                <div className="mt-3 px-1">
                  <p className="text-sm leading-snug line-clamp-2" style={{ fontFamily: "'Inter', sans-serif", color: '#333333' }}>
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-bold" style={{ fontFamily: "'Inter', sans-serif", color: '#000000' }}>
                      ¥{product.price}
                    </span>
                    <span className="text-[10px] font-mono-data" style={{ color: product.stock > 0 ? '#999999' : '#cc3333' }}>
                      {product.stock > 0 ? `库存 ${product.stock}` : '已售罄'}
                    </span>
                    <button
                      onClick={() => {
                        if (!isLoggedIn) { alert('请先登录'); return; }
                        if (product.stock <= 0) { alert('已售罄'); return; }
                        setBuyProduct(product);
                        setMsg('');
                        setShippingName('');
                        setShippingPhone('');
                        setShippingAddress('');
                        setNote('');
                      }}
                      className="px-4 py-1.5 text-xs font-mono-data tracking-wider transition-all"
                      style={{ color: '#fff', background: product.stock > 0 ? '#000' : '#ccc', border: 'none', cursor: product.stock > 0 ? 'pointer' : 'not-allowed' }}
                    >
                      购买
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      {buyProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[480px] bg-white p-8" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 className="font-display text-lg font-bold mb-6" style={{ color: '#000' }}>确认下单</h3>

            {/* Product info */}
            <div className="flex items-center gap-4 mb-6 p-4" style={{ background: '#f9f9f9' }}>
              <div className="w-16 h-16 overflow-hidden flex-shrink-0" style={{ background: '#f5f5f5' }}>
                <img src={buyProduct.image} alt={buyProduct.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#333' }}>{buyProduct.name}</p>
                <p className="text-base font-bold mt-1" style={{ color: '#d4af37' }}>¥{buyProduct.price}</p>
              </div>
            </div>

            {/* Shipping form */}
            <div className="space-y-3 mb-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: '#999' }}>收货人</label>
                  <input type="text" value={shippingName} onChange={(e) => setShippingName(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black" placeholder="姓名" />
                </div>
                <div className="flex-1">
                  <label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: '#999' }}>手机号</label>
                  <input type="tel" value={shippingPhone} onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    const cleaned = digits.startsWith('86') && digits.length > 11 ? digits.slice(2) : digits;
                    setShippingPhone(cleaned.slice(0, 11));
                  }}
                    className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black" placeholder="11位手机号" maxLength={11} />
                </div>
              </div>
              <div>
                <label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: '#999' }}>收货地址</label>
                <input type="text" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black" placeholder="省/市/区/详细地址" />
              </div>
              <div>
                <label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: '#999' }}>备注（可选）</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black resize-none" rows={2} placeholder="如尺码、颜色等" />
              </div>
            </div>

            {msg && (
              <div className={`mb-4 px-4 py-2 font-mono-data text-xs ${msg.startsWith('✅') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {msg}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setBuyProduct(null)}
                className="px-6 py-2 text-xs font-mono-data" style={{ color: '#666', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
                取消
              </button>
              <button onClick={handleBuy}
                className="px-6 py-2 text-xs font-mono-data" style={{ color: '#fff', background: '#000', border: 'none', cursor: 'pointer' }}>
                提交订单 (¥{buyProduct.price})
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-16" />
    </div>
  );
}
