import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });
      // We don't get tokens in data anymore, they are set as HttpOnly cookies automatically.
      // We extract the user info (id, role) from the response data to keep the frontend UI updated.
      setAuth({
        id: res.data?.data?.user_id || 0,
        username: username,
        role: res.data?.data?.role || "user", // Default fallback just in case
      });

      navigate("/dashboard");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background selection:bg-primary/30">
      {/* Premium Decorative Background */}
      <div className="absolute top-[-15%] left-[-10%] w-160 h-160 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-180 h-180 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="bg-card/70 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[2rem] shadow-2xl shadow-black/5 dark:shadow-black/40 p-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-linear-to-br from-primary to-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-primary/20 rotate-3 hover:rotate-6 hover:scale-105 transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3 text-foreground">
              ยินดีต้อนรับกลับมา
            </h1>
            <p className="text-muted-foreground font-medium text-[15px]">
              เข้าสู่ระบบเพื่อจัดการคลังสินค้าตลอดยี่สิบสี่ชั่วโมง
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 text-[15px] text-destructive bg-destructive/5 border border-destructive/20 rounded-2xl animate-in shake duration-300 font-semibold flex items-center gap-3 shadow-sm">
              <div className="bg-destructive/10 p-1 rounded-full text-destructive">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label
                className="text-sm font-bold text-foreground/80 group-focus-within:text-primary transition-colors block ml-1"
                htmlFor="username"
              >
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex h-14 w-full rounded-2xl border-2 border-border/50 bg-background/50 px-5 text-[15px] font-medium transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/40 hover:border-border hover:bg-background shadow-sm"
                  placeholder="กรอกชื่อผู้ใช้..."
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center ml-1">
                <label
                  className="text-sm font-bold text-foreground/80 group-focus-within:text-primary transition-colors"
                  htmlFor="password"
                >
                  รหัสผ่าน
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-14 w-full rounded-2xl border-2 border-border/50 bg-background/50 px-5 text-[15px] font-medium transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/40 hover:border-border hover:bg-background shadow-sm tracking-widest"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex items-center justify-center whitespace-nowrap rounded-2xl text-[15px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 overflow-hidden h-14 px-8 w-full mt-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] border border-white/10"
            >
              <div className="absolute inset-0 bg-linear-to-r from-primary via-indigo-500 to-indigo-600 transition-transform duration-500 group-hover:scale-105"></div>
              <span className="relative text-white flex items-center gap-3 tracking-wide">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white/80"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  "ลงชื่อเข้าใช้ระบบ"
                )}
              </span>
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-border/40 text-center text-[15px] font-medium text-muted-foreground/80">
            ยังไม่มีบัญชีผู้ใช้งาน?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-indigo-500 font-bold transition-colors ml-1 hover:underline underline-offset-4"
            >
              สมัครสมาชิกที่นี่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
