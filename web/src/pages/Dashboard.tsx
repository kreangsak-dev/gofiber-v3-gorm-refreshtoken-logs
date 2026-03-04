import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { api, apiPrivate } from "../lib/api";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
  });

  const fetchProducts = () => {
    api
      .get("/products")
      .then((res) => setProducts(res.data.data.items || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiPrivate.patch(`/products/${editingId}`, formData);
      } else {
        await apiPrivate.post("/products", formData);
      }
      setIsModalOpen(false);
      resetForm();
      setLoading(true);
      fetchProducts();
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        alert(err.response?.data?.error || "เกิดข้อผิดพลาด");
      } else {
        alert("เกิดข้อผิดพลาดที่ไม่รู้จัก");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?")) return;
    try {
      await apiPrivate.delete(`/products/${id}`);
      setLoading(true);
      fetchProducts();
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        alert(err.response?.data?.error || "ลบไม่สำเร็จ");
      } else {
        alert("เกิดข้อผิดพลาดที่ไม่รู้จัก");
      }
    }
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", price: 0, stock: 0 });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl relative animate-in fade-in duration-500">
      {/* Dynamic Background Elements */}
      <div className="fixed top-20 right-[-5%] w-120 h-120 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 left-[-10%] w-120 h-120 bg-chart-2/5 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-primary to-chart-1 bg-clip-text text-transparent inline-block">
            จัดการคลังสินค้า
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            เพิ่มลบแก้ไขสินค้าในระบบ แบบเรียลไทม์
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="group relative inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden h-11 px-6 shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          <span className="absolute inset-0 bg-linear-to-r from-primary to-chart-2 opacity-90 group-hover:opacity-100 transition-opacity"></span>
          <span className="relative text-white flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            เพิ่มสินค้าใหม่
          </span>
        </button>
      </div>

      <div className="border rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden shadow-lg border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-5 font-semibold tracking-wider">ไอดี</th>
                <th className="px-6 py-5 font-semibold tracking-wider">
                  ชื่อสินค้า
                </th>
                <th className="px-6 py-5 font-semibold tracking-wider">ราคา</th>
                <th className="px-6 py-5 font-semibold tracking-wider">
                  สต็อก
                </th>
                <th className="px-6 py-5 font-semibold tracking-wider text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                      <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-medium animate-pulse">
                        กำลังโหลดข้อมูล...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="w-24 h-24 mb-6 opacity-30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      </div>
                      <p className="text-xl font-semibold mb-2">
                        ไม่มีสินค้าในโกดัง
                      </p>
                      <p>กดปุ่มเพิ่มสินค้าใหม่เพื่อเริ่มต้นขายสินค้า</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-muted/40 transition-colors group"
                  >
                    <td className="px-6 py-5 font-mono text-muted-foreground/70">
                      {p.id}
                    </td>
                    <td className="px-6 py-5 font-semibold group-hover:text-primary transition-colors">
                      {p.name}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex py-1 px-3 items-center rounded-full bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                        ฿{p.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex py-1 px-3 items-center rounded-full font-bold border ${p.stock > 0 ? "bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" : "bg-destructive/10 text-destructive border-destructive/20"}`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="w-full max-w-md bg-card border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl p-8 relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-extrabold mb-6 tracking-tight">
              {editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 group">
                <label className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors">
                  ชื่อสินค้า
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="flex h-11 w-full rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-input transition-all"
                  placeholder="เช่น รองเท้าผ้าใบ"
                />
              </div>
              <div className="space-y-1.5 group">
                <label className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors">
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="flex min-h-[100px] w-full rounded-xl border border-input/50 bg-background/50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-input transition-all resize-none"
                  placeholder="คำอธิบายสินค้า..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 group">
                  <label className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors">
                    ราคา (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="flex h-11 w-full rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-input transition-all"
                  />
                </div>
                <div className="space-y-1.5 group">
                  <label className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors">
                    จำนวนซัพพลาย
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: Number(e.target.value),
                      })
                    }
                    className="flex h-11 w-full rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-input transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold rounded-xl hover:bg-muted transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
