import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { api, apiPrivate, getDashboardSummary } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  description: z.string().min(1, "กรุณากรอกรายละเอียดสินค้า"),
  price: z.number().min(0, "ราคาต้องไม่น้อยกว่า 0"),
  stock: z.number().min(0, "จำนวนซัพพลายต้องไม่น้อยกว่า 0"),
});

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface DashboardSummary {
  total_products: number;
  total_value: number;
  low_stock_count: number;
  total_users?: number;
  system_logs?: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const fetchData = async () => {
    setLoading(true);
    setSummaryLoading(true);
    try {
      const [productsRes, summaryRes] = await Promise.all([
        api.get("/products"),
        getDashboardSummary().catch(() => null),
      ]);
      setProducts(productsRes.data.data.items || []);
      if (summaryRes && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    form.reset();
  };

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
    },
    validators: {
      onChange: productSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (editingId) {
          await apiPrivate.patch(`/products/${editingId}`, value);
        } else {
          await apiPrivate.post("/products", value);
        }
        setIsModalOpen(false);
        resetForm();
        fetchData();
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          alert(err.response?.data?.error || "เกิดข้อผิดพลาด");
        } else {
          alert("เกิดข้อผิดพลาดที่ไม่รู้จัก");
        }
      }
    },
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?")) return;
    try {
      await apiPrivate.delete(`/products/${id}`);
      fetchData(); // Refreshes both
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
    form.setFieldValue("name", p.name);
    form.setFieldValue("description", p.description);
    form.setFieldValue("price", p.price);
    form.setFieldValue("stock", p.stock);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl relative animate-in fade-in duration-500">
      {/* Dynamic Background Elements */}
      <div className="fixed top-20 right-[-5%] w-120 h-120 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 left-[-10%] w-120 h-120 bg-chart-2/5 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>

      {/* --- Dashboard Summary Widgets --- */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          ภาพรวมคลังสินค้า
        </h2>

        {summaryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-card/60 rounded-2xl border shadow-sm animate-pulse"
              ></div>
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:grid-cols-4">
            {/* Widget: Total Products */}
            <div className="flex flex-col p-6 bg-card/60 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors"></div>
              <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>{" "}
                สินค้าทั้งหมด
              </span>
              <span className="text-4xl font-black text-foreground relative z-10 tracking-tight">
                {summary.total_products.toLocaleString()}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  รายการ
                </span>
              </span>
            </div>

            <div className="flex flex-col p-6 bg-card/60 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-colors"></div>
              <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>{" "}
                มูลค่ารวม (บาท)
              </span>
              <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 relative z-10 tracking-tight">
                ฿
                {summary.total_value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex flex-col p-6 bg-card/60 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-colors"></div>
              <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${summary.low_stock_count > 0 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-muted"}`}
                ></span>{" "}
                สต็อกเหลือน้อย
              </span>
              <span className="text-4xl font-black text-foreground relative z-10 tracking-tight">
                <span
                  className={
                    summary.low_stock_count > 0 ? "text-amber-500" : ""
                  }
                >
                  {summary.low_stock_count.toLocaleString()}
                </span>{" "}
                <span className="text-base font-normal text-muted-foreground">
                  รายการ
                </span>
              </span>
            </div>

            {isAdmin && summary.total_users !== undefined && (
              <div className="flex flex-col p-6 bg-primary/5 backdrop-blur-2xl rounded-3xl border border-primary/20 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-colors"></div>
                <span className="text-[13px] font-bold text-primary/80 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]"></span>{" "}
                  ผู้ใช้งานทั้งหมด (Admin)
                </span>
                <span className="text-4xl font-black text-primary relative z-10 tracking-tight">
                  {summary.total_users.toLocaleString()}{" "}
                  <span className="text-base font-normal opacity-70">คน</span>
                </span>
              </div>
            )}

            {isAdmin && summary.system_logs !== undefined && (
              <div className="flex flex-col p-6 bg-destructive/5 backdrop-blur-2xl rounded-3xl border border-destructive/20 shadow-xl shadow-destructive/5 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group col-span-full xl:col-span-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-destructive/30 transition-colors"></div>
                <span className="text-[13px] font-bold text-destructive/80 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive shadow-[0_0_10px_var(--color-destructive)]"></span>{" "}
                  ระบบขัดข้อง (24h)
                </span>
                <span className="text-4xl font-black text-destructive relative z-10 tracking-tight">
                  {summary.system_logs.toLocaleString()}{" "}
                  <span className="text-base font-normal opacity-70">
                    รายการ
                  </span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            ไม่สามารถโหลดข้อมูลสรุปได้ (อาจไม่มีสิทธิ์เข้าถึง)
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-card/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-linear-to-r from-primary to-indigo-500 bg-clip-text text-transparent inline-block pb-1">
            จัดการคลังสินค้า
          </h1>
          <p className="text-muted-foreground mt-2 font-medium text-[15px]">
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

      <div className="border border-white/20 dark:border-white/5 rounded-[2rem] bg-card/60 backdrop-blur-3xl overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-middle">
            <thead className="text-[13px] text-muted-foreground/80 font-bold uppercase tracking-widest bg-muted/40 border-b border-border/50">
              <tr>
                <th className="px-8 py-6 w-24">ID</th>
                <th className="px-8 py-6">ชื่อสินค้า</th>
                <th className="px-8 py-6">ราคา</th>
                <th className="px-8 py-6">สต็อก</th>
                <th className="px-8 py-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
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
                    className="group hover:bg-muted/30 transition-colors duration-200"
                  >
                    <td className="px-8 py-6 font-mono text-muted-foreground/60 font-medium tracking-wider">
                      #{p.id}
                    </td>
                    <td className="px-8 py-6 font-bold text-[15px] group-hover:text-primary transition-colors">
                      {p.name}
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex py-1.5 px-3.5 items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 font-bold border border-emerald-500/20">
                        ฿{p.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-flex py-1.5 px-3.5 items-center rounded-xl font-bold border ${p.stock > 0 ? "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400" : "bg-destructive/10 text-destructive border-destructive/20"}`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-1.5 group">
                    <label className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors">
                      ชื่อสินค้า
                    </label>
                    <input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-input transition-all"
                      placeholder="เช่น รองเท้าผ้าใบ"
                    />
                    {field.state.meta.errors ? (
                      <em
                        role="alert"
                        className="text-[13px] text-destructive font-medium block mt-1"
                      >
                        {field.state.meta.errors
                          .map((e) =>
                            typeof e === "string"
                              ? e
                              : (e as { message?: string })?.message ||
                                String(e),
                          )
                          .join(", ")}
                      </em>
                    ) : null}
                  </div>
                )}
              />

              <form.Field
                name="description"
                children={(field) => (
                  <div className="space-y-1.5 group">
                    <label className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors">
                      รายละเอียด
                    </label>
                    <textarea
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="flex min-h-[100px] w-full rounded-xl border border-input/50 bg-background/50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-input transition-all resize-none"
                      placeholder="คำอธิบายสินค้า..."
                    />
                    {field.state.meta.errors ? (
                      <em
                        role="alert"
                        className="text-[13px] text-destructive font-medium block mt-1"
                      >
                        {field.state.meta.errors
                          .map((e) =>
                            typeof e === "string"
                              ? e
                              : (e as { message?: string })?.message ||
                                String(e),
                          )
                          .join(", ")}
                      </em>
                    ) : null}
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="price"
                  children={(field) => (
                    <div className="space-y-1.5 group">
                      <label className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors">
                        ราคา (บาท)
                      </label>
                      <input
                        type="number"
                        min="0"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        className="flex h-11 w-full rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-input transition-all"
                      />
                      {field.state.meta.errors ? (
                        <em
                          role="alert"
                          className="text-[13px] text-destructive font-medium block mt-1"
                        >
                          {field.state.meta.errors
                            .map((e) =>
                              typeof e === "string"
                                ? e
                                : (e as { message?: string })?.message ||
                                  String(e),
                            )
                            .join(", ")}
                        </em>
                      ) : null}
                    </div>
                  )}
                />

                <form.Field
                  name="stock"
                  children={(field) => (
                    <div className="space-y-1.5 group">
                      <label className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors">
                        จำนวนซัพพลาย
                      </label>
                      <input
                        type="number"
                        min="0"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        className="flex h-11 w-full rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-input transition-all"
                      />
                      {field.state.meta.errors ? (
                        <em
                          role="alert"
                          className="text-[13px] text-destructive font-medium block mt-1"
                        >
                          {field.state.meta.errors
                            .map((e) =>
                              typeof e === "string"
                                ? e
                                : (e as { message?: string })?.message ||
                                  String(e),
                            )
                            .join(", ")}
                        </em>
                      ) : null}
                    </div>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold rounded-xl hover:bg-muted transition-colors"
                >
                  ยกเลิก
                </button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSubmitting ? "กำลังบันทึก..." : "บันทึกสินค้า"}
                    </button>
                  )}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
