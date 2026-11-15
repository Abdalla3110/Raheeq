"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";

const INTRO_KEY = "misk:intro-seen";

export default function IntroScreen() {
  const { lang } = useUIPrefs();
  const tr = t[lang];
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<"logo" | "line" | "subtitle" | "exit">("logo");

  const dismiss = useCallback(() => {
    setShow(false);
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      // تجاهل
    }
  }, []);

  useEffect(() => {
    // لا تظهر المقدمة لو شافها المستخدم قبل كده
    try {
      if (localStorage.getItem(INTRO_KEY)) return;
    } catch {
      // تجاهل
    }

    setShow(true);

    // Animation timeline (1.8s total)
    const logoTimer = setTimeout(() => setPhase("line"), 500);
    const lineTimer = setTimeout(() => setPhase("subtitle"), 900);
    const subtitleTimer = setTimeout(() => setPhase("exit"), 1300);
    const exitTimer = setTimeout(() => dismiss(), 1800);

    // أي ضغطة زر بتخطي المقدمة
    const onKeyDown = () => dismiss();
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(lineTimer);
      clearTimeout(subtitleTimer);
      clearTimeout(exitTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: "easeIn" }}
          className="fixed inset-0 z-[100] bg-[#0E0D0C] flex items-center justify-center"
        >
          <div className="text-center">
            {/* Logo 3D Flip */}
            <motion.div
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1
              }}
              style={{ perspective: "1200px" }}
              className="mb-8"
            >
              <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-[#FAF9F6] tracking-[0.3em]">
                ✦ R A H E E Q ✦
              </h1>
              <p className="text-xs sm:text-sm text-[#C8A97E] tracking-[0.4em] mt-3 uppercase">
                Haute Parfumerie • Paris
              </p>
            </motion.div>

            {/* Gold Line */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={phase === "line" || phase === "subtitle" || phase === "exit" ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-px w-48 mx-auto bg-gradient-to-r from-transparent via-[#C8A97E] to-transparent origin-center"
            />

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={phase === "subtitle" || phase === "exit" ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-xs sm:text-sm text-[#A89F93] tracking-[0.2em] mt-8 uppercase"
            >
              {tr.introTagline}
            </motion.p>
          </div>

          {/* زرار التخطي */}
          <button
            onClick={dismiss}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] sm:text-xs uppercase tracking-[0.3em] text-[#A89F93] hover:text-[#C8A97E] transition-colors"
          >
            {tr.introSkip}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
