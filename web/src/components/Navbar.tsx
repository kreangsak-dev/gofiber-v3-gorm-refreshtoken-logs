import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { apiPrivate } from "../lib/api";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiPrivate.post("/auth/logout");
    } catch (e) {
      console.error("Logout failed", e);
    }
    logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-4 left-4 right-4 z-50">
      <div className="mx-auto max-w-7xl bg-background/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 supports-backdrop-filter:bg-background/40">
        <div className="flex h-16 items-center justify-between px-6">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-tight flex items-center gap-3 transition-transform hover:scale-105"
          >
            <div className="size-9 rounded-xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Inventory
            </span>
          </Link>
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-[15px] font-bold text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-8 decoration-2 decoration-primary/50"
                >
                  จัดการสินค้า
                </Link>
                <Link
                  to="/logs"
                  className="text-[15px] font-bold text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-8 decoration-2 decoration-primary/50"
                >
                  บันทึกระบบ
                </Link>
                {user.role === "super_admin" && (
                  <Link
                    to="/users"
                    className="text-[15px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hover:underline underline-offset-8 decoration-2 decoration-indigo-500/50"
                  >
                    จัดการผู้ใช้ (Admin)
                  </Link>
                )}
                <div className="h-6 w-px bg-border/50 mx-2" />
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[15px] font-bold text-foreground">
                      {user.username}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center size-9 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm active:scale-95"
                    title="ออกจากระบบ"
                  >
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
                      className="ml-0.5"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-[15px] font-bold text-foreground hover:text-primary transition-colors px-4 py-2"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  to="/register"
                  className="text-[15px] font-bold bg-primary text-white hover:bg-primary/90 px-5 py-2.5 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
