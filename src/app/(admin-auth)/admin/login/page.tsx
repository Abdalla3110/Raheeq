"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { SITE_NAME } from "@/lib/constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState("");

  async function checkRateLimit(ip: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const { data } = await supabase.rpc("check_rate_limit", {
        p_identifier: ip,
        p_action_type: "login_attempt",
        p_max_count: 5, // 5 محاولات في الساعة
        p_window_minutes: 60,
      });

      if (data && data.length > 0) {
        const allowed = data[0].allowed;
        if (!allowed) {
          const resetAt = data[0].reset_at;
          const resetTime = new Date(resetAt).toLocaleTimeString('ar-EG');
          setRateLimitError(`محاولات كثيرة - جرب بعد ${resetTime}`);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error("Rate limit check failed:", err);
      return true; // السماح بالدخول في حالة فشل rate limiting
    }
  }

  async function getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setRateLimitError("");
    setLoading(true);

    // Rate limiting check
    const clientIP = await getClientIP();
    const rateLimitAllowed = await checkRateLimit(clientIP);

    if (!rateLimitAllowed) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("البريد أو كلمة السر غير صحيحة");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-gold text-3xl mb-2">✦</div>
          <h1 className="text-2xl font-extrabold text-cream">
            لوحة تحكم {SITE_NAME}
          </h1>
          <p className="text-cream/50 text-sm mt-1">دخول الأدمن</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-charcoal rounded-3xl p-6 space-y-4 border border-cream/10"
        >
          <div>
            <label className="text-sm text-cream/70 block mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink border border-cream/15 rounded-xl px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="text-sm text-cream/70 block mb-1.5">
              كلمة السر
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink border border-cream/15 rounded-xl px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold"
              dir="ltr"
              required
            />
          </div>

          {rateLimitError && (
            <div className="bg-amber-500/10 text-amber-400 text-sm rounded-xl p-3 text-center">
              {rateLimitError}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm rounded-xl p-3 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-ink font-bold py-3.5 rounded-xl hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
