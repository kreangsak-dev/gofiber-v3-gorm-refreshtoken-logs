import { useEffect, useState, useRef } from "react";
import { isAxiosError } from "axios";
import { apiPrivate } from "../lib/api";

export default function Logs() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [logType, setLogType] = useState<"system" | "auth">("system");
  const logContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async (type: "system" | "auth") => {
    setLoading(true);
    setLogType(type);
    try {
      const res = await apiPrivate.get(`/logs/${type}`);
      setLogs(res.data.data || []);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        console.error(err.response?.data?.error || "เกิดข้อผิดพลาด");
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs("system");
  }, []);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl relative animate-in fade-in duration-500 min-h-screen">
      {/* Background Elements (Zustand demo inspired) */}
      <div className="fixed top-20 right-[-5%] w-120 h-120 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 left-[-10%] w-120 h-120 bg-emerald-500/10 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-[#252b37] text-white p-6 rounded-[10px] shadow-[0_16px_40px_-5px_rgba(0,0,0,0.8)] border border-white/5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-primary to-emerald-400 bg-clip-text text-transparent inline-block">
            บันทึกระบบ (Logs)
          </h1>
          <p className="text-white/60 mt-1 font-medium text-sm">
            ตรวจสอบการทำงานและประวัติการเข้าเรียนของระบบแบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center gap-3 bg-black/20 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => fetchLogs("system")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              logType === "system"
                ? "bg-white text-black shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            System Logs
          </button>
          <button
            onClick={() => fetchLogs("auth")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              logType === "auth"
                ? "bg-white text-black shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            Auth Logs
          </button>
        </div>
      </div>

      <div className="bg-[#252b37] rounded-[10px] shadow-[0_16px_40px_-5px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden flex flex-col h-[600px]">
        {/* Terminal Header */}
        <div className="bg-black/30 px-6 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/40 font-mono text-xs">
              {logType}.log
            </span>
            <button
              onClick={() => fetchLogs(logType)}
              className="text-white/40 hover:text-white transition-colors"
              title="Refresh Logs"
            >
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
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Log Content */}
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed"
        >
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 gap-4">
              <div className="size-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="animate-pulse">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40">
              <p>ไม่มีข้อมูล Log ในระบบ</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((line, index) => {
                // Simple syntax highlighting for logs
                let lineClass = "text-white/80";
                if (line.includes("ERROR") || line.includes("error")) {
                  lineClass = "text-red-400";
                } else if (
                  line.includes("INFO") ||
                  line.includes("[SYSTEM]") ||
                  line.includes("[AUTH]")
                ) {
                  lineClass = "text-emerald-400/90";
                }

                return (
                  <div
                    key={index}
                    className={`break-all ${lineClass} hover:bg-white/5 px-2 py-0.5 rounded transition-colors`}
                  >
                    <span className="text-white/30 mr-4 select-none">
                      {(index + 1).toString().padStart(4, "0")}
                    </span>
                    {line}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
