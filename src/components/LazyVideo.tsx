"use client";

import { useEffect, useRef, useState } from "react";

/**
 * فيديو lazy — مبيتحمّلش غير لما يقرب من الـ viewport
 * بيوفّر بيانات الـ mobile بشكل كبير
 */
export default function LazyVideo({
  src,
  webmSrc,
  className = "",
  preload = "none",
}: {
  src: string;
  webmSrc?: string;
  className?: string;
  preload?: "none" | "metadata" | "auto";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`absolute inset-0 ${className}`} aria-hidden="true">
      {visible && (
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload={preload}>
          {webmSrc && <source src={webmSrc} type="video/webm" />}
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
