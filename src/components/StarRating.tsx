"use client";

/** عرض النجوم للقراءة فقط أو تفاعلية */
export default function StarRating({
  value,
  onChange,
  size = "text-base",
  interactive = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
  interactive?: boolean;
}) {
  return (
    <div className={`flex gap-0.5 ${size}`} dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={`${interactive ? "cursor-pointer hover:scale-125 transition-transform" : "cursor-default"} ${
            star <= value ? "text-gold" : "text-sand"
          }`}
          aria-label={`${star} نجوم`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
