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
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 max-w-7xl mx-auto items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          Inventory
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                จัดการสินค้า
              </Link>
              <Link
                to="/logs"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                บันทึกระบบ
              </Link>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors"
                >
                  ออกระบบ
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
