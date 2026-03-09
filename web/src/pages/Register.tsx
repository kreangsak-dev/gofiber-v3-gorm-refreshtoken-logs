import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const registerSchema = z
  .object({
    username: z.string().min(3, "ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร"),
    password: z.string().min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านอีกครั้ง"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export default function Register() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }) => {
      setError("");
      setLoading(true);

      try {
        await api.post("/auth/register", {
          username: value.username,
          password: value.password,
        });
        // We don't get tokens in data anymore, they are set as HttpOnly cookies automatically.
        // The backend will return { success: true, message: ..., data: { user_id: ... } } based on our earlier change.
        setAuth({ id: 0, username: value.username, role: "user" }); // Simplified, normally backend returns user.id

        navigate("/dashboard");
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          setError(err.response?.data?.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
        } else {
          setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background selection:bg-primary/30">
      {/* Premium Decorative Background */}
      <div className="absolute top-[-15%] right-[-10%] w-160 h-160 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-180 h-180 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="bg-card/70 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[2rem] shadow-2xl shadow-black/5 dark:shadow-black/40 p-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-linear-to-br from-indigo-600 to-emerald-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20 -rotate-3 hover:-rotate-6 hover:scale-105 transition-all duration-300">
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3 text-foreground">
              สร้างบัญชีใหม่
            </h1>
            <p className="text-muted-foreground font-medium text-[15px]">
              เริ่มต้นจัดการคลังสินค้าแบบมืออาชีพ
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            <form.Field
              name="username"
              children={(field) => (
                <div className="space-y-2 group">
                  <label
                    className="text-sm font-bold text-foreground/80 group-focus-within:text-primary transition-colors block ml-1"
                    htmlFor={field.name}
                  >
                    ชื่อผู้ใช้
                  </label>
                  <div className="relative">
                    <input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="flex h-14 w-full rounded-2xl border-2 border-border/50 bg-background/50 px-5 text-[15px] font-medium transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/40 hover:border-border hover:bg-background shadow-sm"
                      placeholder="กรอกชื่อผู้ใช้..."
                    />
                  </div>
                  {field.state.meta.errors ? (
                    <em
                      role="alert"
                      className="text-[13px] text-destructive font-medium block ml-2 mt-1"
                    >
                      {field.state.meta.errors
                        .map((e) =>
                          typeof e === "string"
                            ? e
                            : (e as { message?: string })?.message || String(e),
                        )
                        .join(", ")}
                    </em>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="password"
              children={(field) => (
                <div className="space-y-2 group">
                  <label
                    className="text-sm font-bold text-foreground/80 group-focus-within:text-primary transition-colors block ml-1"
                    htmlFor={field.name}
                  >
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="flex h-14 w-full rounded-2xl border-2 border-border/50 bg-background/50 px-5 text-[15px] font-medium transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/40 hover:border-border hover:bg-background shadow-sm tracking-widest"
                      placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                    />
                  </div>
                  {field.state.meta.errors ? (
                    <em
                      role="alert"
                      className="text-[13px] text-destructive font-medium block ml-2 mt-1"
                    >
                      {field.state.meta.errors
                        .map((e) =>
                          typeof e === "string"
                            ? e
                            : (e as { message?: string })?.message || String(e),
                        )
                        .join(", ")}
                    </em>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="confirmPassword"
              children={(field) => (
                <div className="space-y-2 group">
                  <label
                    className="text-sm font-bold text-foreground/80 group-focus-within:text-primary transition-colors block ml-1"
                    htmlFor={field.name}
                  >
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="flex h-14 w-full rounded-2xl border-2 border-border/50 bg-background/50 px-5 text-[15px] font-medium transition-all focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/40 hover:border-border hover:bg-background shadow-sm tracking-widest"
                      placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                    />
                  </div>
                  {field.state.meta.errors ? (
                    <em
                      role="alert"
                      className="text-[13px] text-destructive font-medium block ml-2 mt-1"
                    >
                      {field.state.meta.errors
                        .map((e) =>
                          typeof e === "string"
                            ? e
                            : (e as { message?: string })?.message || String(e),
                        )
                        .join(", ")}
                    </em>
                  ) : null}
                </div>
              )}
            />

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || Boolean(isSubmitting) || loading}
                  className="group relative flex items-center justify-center whitespace-nowrap rounded-2xl text-[15px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 overflow-hidden h-14 px-8 w-full mt-2 shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.98] border border-white/10"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-transform duration-500 group-hover:scale-105"></div>
                  <span className="relative text-white flex items-center gap-3 tracking-wide">
                    {isSubmitting || loading ? (
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
                        กำลังสร้างบัญชี...
                      </>
                    ) : (
                      "สร้างบัญชีใหม่"
                    )}
                  </span>
                </button>
              )}
            />
          </form>

          <div className="mt-10 pt-6 border-t border-border/40 text-center text-[15px] font-medium text-muted-foreground/80">
            มีบัญชีผู้ใช้งานอยู่แล้ว?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:text-emerald-500 font-bold transition-colors ml-1 hover:underline underline-offset-4"
            >
              เข้าสู่ระบบที่นี่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
