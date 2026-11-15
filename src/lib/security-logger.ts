/**
 * Security logging utility
 * يسجل الأحداث الأمنية المهمة لمراقبة المشروع
 */

export type SecurityEvent = 
  | "login_attempt"
  | "login_success"
  | "login_failure"
  | "rate_limit_exceeded"
  | "admin_access"
  | "admin_denied"
  | "order_created"
  | "order_validation_failed"
  | "invalid_request"
  | "csrf_protection_triggered";

interface SecurityLogEntry {
  event: SecurityEvent;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  details?: Record<string, any>;
}

/**
 * تسجيل حدث أمني
 * في الإنتاج، يجب إرسال هذه البيانات إلى خدمة logging خارجية
 */
export function logSecurityEvent(event: SecurityEvent, details?: Record<string, any>) {
  const entry: SecurityLogEntry = {
    event,
    timestamp: new Date().toISOString(),
    details,
  };

  // Console logging للـ development
  if (process.env.NODE_ENV === "development") {
    console.log(`[SECURITY] ${event}`, entry);
  }

  // في الإنتاج، يمكن إرسال إلى:
  // - Supabase table
  // - External logging service (Sentry, LogRocket, etc.)
  // - Cloud logging (AWS CloudWatch, GCP Cloud Logging)
  
  // مثال: حفظ في localStorage للـ demo
  try {
    const logs = JSON.parse(localStorage.getItem("security-logs") || "[]");
    logs.push(entry);
    // احتفظ بآخر 100 حدث فقط
    if (logs.length > 100) logs.shift();
    localStorage.setItem("security-logs", JSON.stringify(logs));
  } catch {
    // تجاهل أخطاء localStorage
  }
}

/**
 * تسجيل محاولة تسجيل دخول
 */
export function logLoginAttempt(ip: string, userAgent: string, success: boolean, userId?: string) {
  logSecurityEvent(
    success ? "login_success" : "login_failure",
    { ip, userAgent, userId }
  );
}

/**
 * تسجيل تجاوز rate limit
 */
export function logRateLimitExceeded(ip: string, action: string) {
  logSecurityEvent("rate_limit_exceeded", { ip, action });
}

/**
 * تسجيل محاولة وصول غير مصرح بها للأدمن
 */
export function logAdminAccessDenied(ip: string, userId?: string) {
  logSecurityEvent("admin_denied", { ip, userId });
}

/**
 * تسجيل إنشاء طلب
 */
export function logOrderCreated(orderId: string, total: number, userId?: string) {
  logSecurityEvent("order_created", { orderId, userId, total });
}