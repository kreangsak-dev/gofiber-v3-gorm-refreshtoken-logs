import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data.data.items || []))
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent sm:text-6xl mb-4">
          สินค้าทั้งหมดของเรา
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          เลือกดูรายการสินค้าคุณภาพเยี่ยมที่เราคัดสรรมาให้คุณ
          พร้อมระบบจัดการหลังบ้านที่รวดเร็ว
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl bg-muted/30">
          <p className="text-muted-foreground mb-4 text-lg">
            ยังไม่มีสินค้าในระบบ
          </p>
          <img
            src="https://illustrations.popsy.co/gray/crashed-error.svg"
            className="w-64 h-64 mx-auto opacity-70"
            alt="empty"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h3 className="font-semibold text-xl leading-tight group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  <div
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.stock > 0
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {p.stock > 0 ? `มี ${p.stock} ชิ้น` : "สินค้าหมด"}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                  {p.description || "ไม่มีรายละเอียด"}
                </p>
              </div>
              <div className="p-6 pt-0 mt-auto flex items-center justify-between">
                <div className="text-2xl font-bold">
                  ฿{p.price.toLocaleString()}
                </div>
                <button
                  disabled={p.stock <= 0}
                  className="rounded-md bg-primary/10 text-primary px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  หยิบใส่ตะกร้า
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
