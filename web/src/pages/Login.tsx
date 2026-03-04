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
      await api.post("/auth/login", { username, password });
      // We don't get tokens in data anymore, they are set as HttpOnly cookies automatically.
      // However, we still need basic user info to setAuth.
      // Usually the backend returns user object on success, or we can just fetch it / use username.
      setAuth({ id: 0, username: username }); // Simplified, normally backend returns user.id

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Premium Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-120 h-120 bg-chart-2/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 transition-all">
        <div className="bg-card/80 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-linear-to-br from-primary to-chart-1 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg rotate-3 hover:rotate-6 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary-foreground"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-linear-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
              ยินดีต้อนรับกลับมา
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              เข้าสู่ระบบเพื่อจัดการคลังสินค้าตลอดยี่สิบสี่ชั่วโมง
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-in zoom-in-95 duration-200 font-medium">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 group">
              <label
                className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors"
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
                  className="flex h-12 w-full rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/50 hover:border-input"
                  placeholder="กรอกชื่อผู้ใช้..."
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label
                className="text-sm font-semibold text-foreground/90 group-focus-within:text-primary transition-colors"
                htmlFor="password"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/50 hover:border-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden h-12 px-8 w-full mt-6 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-linear-to-r from-primary to-chart-1 opacity-90 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative text-white flex items-center gap-2">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  "ลงชื่อเข้าใช้"
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            ยังไม่มีบัญชี?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-chart-1 font-semibold transition-colors ml-1"
            >
              สมัครสมาชิกคลิกที่นี่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
