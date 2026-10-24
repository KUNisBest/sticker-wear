import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = ["精选", "潮服", "鞋类", "配饰", "数码", "美妆", "家居", "包袋"];
const ORDER_STATUS: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
};

// ============================================
// Product Management
// ============================================
function ProductManager() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", price: 149.9, stock: 100, category: "精选", image: "", description: "", sortOrder: 0 });
  const [msg, setMsg] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const utils = trpc.useUtils();
  const { data: productList, isLoading } = trpc.admin.listProducts.useQuery();

  const createMut = trpc.admin.createProduct.useMutation({
    onSuccess: (d) => {
      if (d.success) { setMsg("✅ " + d.message); setShowDialog(false); setForm({ name: "", price: 149.9, stock: 100, category: "精选", image: "", description: "", sortOrder: 0 }); utils.admin.listProducts.invalidate(); }
      else setMsg("❌ " + (d.message || "失败"));
    },
    onError: (e) => setMsg("❌ " + e.message),
  });

  const updateMut = trpc.admin.updateProduct.useMutation({
    onSuccess: (d) => {
      if (d.success) { setMsg("✅ " + d.message); setShowDialog(false); setEditingId(null); utils.admin.listProducts.invalidate(); }
      else setMsg("❌ " + (d.message || "失败"));
    },
    onError: (e) => setMsg("❌ " + e.message),
  });

  const deleteMut = trpc.admin.deleteProduct.useMutation({
    onSuccess: (d) => {
      if (d.success) setMsg("✅ " + d.message); else setMsg("❌ " + (d.message || "失败"));
      utils.admin.listProducts.invalidate();
    },
    onError: (e) => setMsg("❌ " + e.message),
  });

  const openAdd = () => { setEditingId(null); setForm({ name: "", price: 149.9, stock: 100, category: "精选", image: "", description: "", sortOrder: 0 }); setShowDialog(true); setMsg(""); };
  const openEdit = (p: any) => { setEditingId(p.id); setForm({ name: p.name, price: p.price, stock: p.stock ?? 0, category: p.category, image: p.image, description: p.description || "", sortOrder: p.sortOrder || 0 }); setShowDialog(true); setMsg(""); };

  const handleSave = () => {
    if (!form.name.trim()) { setMsg("❌ 商品名不能为空"); return; }
    if (form.price <= 0) { setMsg("❌ 价格必须大于0"); return; }
    if (form.stock < 0) { setMsg("❌ 库存不能为负"); return; }
    editingId ? updateMut.mutate({ id: editingId, ...form }) : createMut.mutate(form);
  };

  const handleToggle = (p: any) => updateMut.mutate({ id: p.id, status: p.status === "active" ? "inactive" : "active" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold" style={{ color: "#000" }}>商品管理</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 font-mono-data text-xs tracking-[2px]" style={{ background: "#000", color: "#fff", border: "none", cursor: "pointer" }}>
          + 添加商品
        </button>
      </div>

      {msg && <div className={`mb-4 px-4 py-2 font-mono-data text-xs ${msg.startsWith("✅") ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>{msg}</div>}

      {isLoading ? <div className="font-mono-data text-xs text-center py-20" style={{ color: "#bbb" }}>加载中...</div> : (
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              {["图片","名称","价格","库存","分类","状态","操作"].map(h => <th key={h} className="text-left py-3 px-3 font-mono-data text-[10px] tracking-wider" style={{ color: "#999" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {productList?.map((p: any) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <td className="py-3 px-3">{p.image ? <img src={p.image} alt="" className="w-10 h-10 object-cover rounded" style={{ background: "#f5f5f5" }} /> : <div className="w-10 h-10 rounded" style={{ background: "#f5f5f5" }} />}</td>
                <td className="py-3 px-3"><span className="text-sm font-medium" style={{ color: "#333" }}>{p.name}</span></td>
                <td className="py-3 px-3"><span className="text-sm font-bold font-mono-data" style={{ color: "#d4af37" }}>¥{p.price}</span></td>
                <td className="py-3 px-3"><span className="text-xs font-mono-data" style={{ color: p.stock > 0 ? "#666" : "#cc3333" }}>{p.stock > 0 ? p.stock : "缺货"}</span></td>
                <td className="py-3 px-3"><span className="text-xs font-mono-data" style={{ color: "#666" }}>{p.category}</span></td>
                <td className="py-3 px-3">
                  <button onClick={() => handleToggle(p)} className="text-[10px] px-2 py-0.5 font-mono-data" style={{ color: p.status === "active" ? "#22aa55" : "#999", background: p.status === "active" ? "rgba(34,170,85,0.08)" : "rgba(0,0,0,0.04)", border: "none", cursor: "pointer" }}>{p.status === "active" ? "上架" : "下架"}</button>
                </td>
                <td className="py-3 px-3">
                  <button onClick={() => openEdit(p)} className="text-xs font-mono-data px-3 py-1 mr-1" style={{ color: "#666", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>编辑</button>
                  <button onClick={() => { if (window.confirm("确定删除？")) deleteMut.mutate({ id: p.id }); }} className="text-xs font-mono-data px-3 py-1" style={{ color: "#cc3333", border: "1px solid #fdd", background: "#fff", cursor: "pointer" }}>删除</button>
                </td>
              </tr>
            ))}
            {(!productList || productList.length === 0) && <tr><td colSpan={7} className="py-20 text-center font-mono-data text-xs" style={{ color: "#bbb" }}>暂无商品</td></tr>}
          </tbody>
        </table>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-[480px] bg-white p-8" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h3 className="font-display text-lg font-bold mb-6" style={{ color: "#000" }}>{editingId ? "编辑商品" : "添加商品"}</h3>
            <div className="space-y-4">
              <div><label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: "#999" }}>商品名称</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black" /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: "#999" }}>价格 (¥)</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black" /></div>
                <div className="flex-1"><label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: "#999" }}>库存</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black" /></div>
                <div className="flex-1"><label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: "#999" }}>分类</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black bg-white">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: "#999" }}>图片路径</label><input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black" placeholder="/assets/images/xxx.jpg" />{form.image && <div className="mt-2 w-16 h-16 rounded overflow-hidden"><img src={form.image} alt="preview" className="w-full h-full object-cover" /></div>}</div>
              <div><label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: "#999" }}>描述</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black resize-none" rows={3} /></div>
              <div><label className="block font-mono-data text-[10px] tracking-wider mb-1" style={{ color: "#999" }}>排序</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm text-black border border-gray-200 focus:outline-none focus:border-black" /></div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { setShowDialog(false); setEditingId(null); }} className="px-6 py-2 text-xs font-mono-data" style={{ color: "#666", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>取消</button>
              <button onClick={handleSave} className="px-6 py-2 text-xs font-mono-data" style={{ color: "#fff", background: "#000", border: "none", cursor: "pointer" }}>{editingId ? "保存修改" : "添加"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Order Management
// ============================================
function OrderManager() {
  const [msg, setMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailOrder, setDetailOrder] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: orders } = trpc.order.listAll.useQuery();

  const updateStatusMut = trpc.order.updateStatus.useMutation({
    onSuccess: (d) => {
      if (d.success) { setMsg("✅ " + d.message); utils.order.listAll.invalidate(); }
      else setMsg("❌ " + (d.message || "失败"));
    },
    onError: (e) => setMsg("❌ " + e.message),
  });

  const filtered = filterStatus === "all" ? orders : orders?.filter((o: any) => o.status === filterStatus);

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-6" style={{ color: "#000" }}>订单管理</h2>
      {msg && <div className={`mb-4 px-4 py-2 font-mono-data text-xs ${msg.startsWith("✅") ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>{msg}</div>}

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterStatus("all")} className="px-3 py-1 font-mono-data text-[10px] tracking-wider"
          style={{ background: filterStatus === "all" ? "#000" : "transparent", color: filterStatus === "all" ? "#fff" : "#999", border: filterStatus === "all" ? "1px solid #000" : "1px solid #ddd", cursor: "pointer" }}>全部</button>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <button key={k} onClick={() => setFilterStatus(k)} className="px-3 py-1 font-mono-data text-[10px] tracking-wider"
            style={{ background: filterStatus === k ? "#000" : "transparent", color: filterStatus === k ? "#fff" : "#999", border: filterStatus === k ? "1px solid #000" : "1px solid #ddd", cursor: "pointer" }}>{v}</button>
        ))}
      </div>

      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #eee" }}>
            {["订单号","用户","商品","金额","状态","时间","操作"].map(h => <th key={h} className="text-left py-3 px-3 font-mono-data text-[10px] tracking-wider" style={{ color: "#999" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {filtered?.map((o: any) => (
            <tr key={o.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
              <td className="py-3 px-3"><span className="font-mono-data text-xs font-bold" style={{ color: "#333" }}>#{o.id}</span></td>
              <td className="py-3 px-3"><span className="text-xs" style={{ color: "#666" }}>{o.userNickname || o.userPhone}</span></td>
              <td className="py-3 px-3"><span className="text-xs" style={{ color: "#666" }}>{o.items?.length || 0} 件</span></td>
              <td className="py-3 px-3"><span className="font-mono-data text-xs font-bold" style={{ color: "#d4af37" }}>¥{o.totalPrice}</span></td>
              <td className="py-3 px-3">
                <span className="text-[10px] px-2 py-0.5 font-mono-data" style={{
                  color: o.status === "shipped" ? "#3b82f6" : o.status === "completed" ? "#22aa55" : o.status === "cancelled" ? "#999" : o.status === "paid" ? "#f59e0b" : "#666",
                  background: `${o.status === "shipped" ? "#3b82f6" : o.status === "completed" ? "#22aa55" : o.status === "cancelled" ? "#999" : o.status === "paid" ? "#f59e0b" : "#666"}10`,
                }}>{ORDER_STATUS[o.status] || o.status}</span>
              </td>
              <td className="py-3 px-3"><span className="text-[10px] font-mono-data" style={{ color: "#bbb" }}>{new Date(o.createdAt).toLocaleDateString("zh-CN")}</span></td>
              <td className="py-3 px-3">
                <button onClick={() => setDetailOrder(o)} className="text-xs font-mono-data px-2 py-1 mr-1" style={{ color: "#666", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>详情</button>
                {o.status === "paid" && <button onClick={() => updateStatusMut.mutate({ orderId: o.id, status: "shipped" })} className="text-xs font-mono-data px-2 py-1" style={{ color: "#3b82f6", border: "1px solid #3b82f640", background: "#3b82f608", cursor: "pointer" }}>发货</button>}
                {o.status === "shipped" && <button onClick={() => updateStatusMut.mutate({ orderId: o.id, status: "completed" })} className="text-xs font-mono-data px-2 py-1" style={{ color: "#22aa55", border: "1px solid #22aa5540", background: "#22aa5508", cursor: "pointer" }}>完成</button>}
              </td>
            </tr>
          ))}
          {(!filtered || filtered.length === 0) && <tr><td colSpan={7} className="py-20 text-center font-mono-data text-xs" style={{ color: "#bbb" }}>暂无订单</td></tr>}
        </tbody>
      </table>

      {/* Order Detail Dialog */}
      {detailOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-[520px] bg-white p-8" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold" style={{ color: "#000" }}>订单 #{detailOrder.id}</h3>
              <span className="text-[10px] px-2 py-0.5 font-mono-data"
                style={{ color: detailOrder.status === "shipped" ? "#3b82f6" : "#666", background: `${detailOrder.status === "shipped" ? "#3b82f6" : "#666"}10` }}>{ORDER_STATUS[detailOrder.status]}</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm"><span className="font-mono-data text-[10px] tracking-wider" style={{ color: "#999" }}>用户</span><span style={{ color: "#333" }}>{detailOrder.userNickname} ({detailOrder.userPhone})</span></div>
              <div className="flex justify-between text-sm"><span className="font-mono-data text-[10px] tracking-wider" style={{ color: "#999" }}>收货人</span><span style={{ color: "#333" }}>{detailOrder.shippingName} {detailOrder.shippingPhone}</span></div>
              <div className="flex justify-between text-sm"><span className="font-mono-data text-[10px] tracking-wider" style={{ color: "#999" }}>地址</span><span style={{ color: "#333" }}>{detailOrder.shippingAddress}</span></div>
              <div className="flex justify-between text-sm"><span className="font-mono-data text-[10px] tracking-wider" style={{ color: "#999" }}>时间</span><span style={{ color: "#333" }}>{new Date(detailOrder.createdAt).toLocaleString("zh-CN")}</span></div>
              {detailOrder.note && <div className="flex justify-between text-sm"><span className="font-mono-data text-[10px] tracking-wider" style={{ color: "#999" }}>备注</span><span style={{ color: "#333" }}>{detailOrder.note}</span></div>}
            </div>

            <div className="mb-6">
              <div className="font-mono-data text-[10px] tracking-wider mb-2" style={{ color: "#999" }}>商品明细</div>
              {detailOrder.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between py-2" style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <span className="text-sm" style={{ color: "#333" }}>{item.productName} x{item.quantity}</span>
                  <span className="text-sm font-bold" style={{ color: "#d4af37" }}>¥{item.price}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 mt-2" style={{ borderTop: "1px solid #eee" }}>
                <span className="text-sm font-bold" style={{ color: "#000" }}>合计</span>
                <span className="text-sm font-bold" style={{ color: "#d4af37" }}>¥{detailOrder.totalPrice}</span>
              </div>
            </div>

            <button onClick={() => setDetailOrder(null)} className="w-full py-2.5 font-mono-data text-xs tracking-[3px]" style={{ color: "#666", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Admin Page
// ============================================
export default function Admin() {
  const { isLoggedIn } = useAuth();
  const [tab, setTab] = useState<"products" | "orders">("products");
  const { data: adminCheck } = trpc.admin.checkAdmin.useQuery(undefined, { enabled: isLoggedIn });

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-full flex items-center justify-center bg-white pt-20">
        <div className="text-center">
          <div className="font-mono-data text-5xl mb-4" style={{ color: "#ccc" }}>403</div>
          <p className="font-mono-data text-sm" style={{ color: "#999", letterSpacing: "2px" }}>{!isLoggedIn ? "请先登录管理员账号" : "无管理员权限"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white" style={{ paddingTop: "24px" }}>
      <div className="px-6" style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-black tracking-wider" style={{ color: "#000" }}>管理后台</h1>
            <p className="font-mono-data text-[10px] tracking-[2px] mt-1" style={{ color: "#999" }}>ADMIN PANEL</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8" style={{ borderBottom: "2px solid #eee" }}>
          <button onClick={() => setTab("products")} className="px-6 py-3 font-mono-data text-xs tracking-[3px] transition-all"
            style={{ color: tab === "products" ? "#000" : "#999", borderBottom: tab === "products" ? "2px solid #000" : "2px solid transparent", background: "transparent", cursor: "pointer" }}>商品管理</button>
          <button onClick={() => setTab("orders")} className="px-6 py-3 font-mono-data text-xs tracking-[3px] transition-all"
            style={{ color: tab === "orders" ? "#000" : "#999", borderBottom: tab === "orders" ? "2px solid #000" : "2px solid transparent", background: "transparent", cursor: "pointer" }}>订单管理</button>
        </div>

        {tab === "products" && <ProductManager />}
        {tab === "orders" && <OrderManager />}
      </div>
      <div className="h-16" />
    </div>
  );
}
