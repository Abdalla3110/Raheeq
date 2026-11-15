/**
 * دوال validation للبيانات المختلفة
 */

/**
 * التحقق من رقم الموبايل المصري
 * يقبل الأرقام التي تبدأ بـ 01 وتبعه 10 أرقام
 */
export function validateEgyptianPhone(phone: string): boolean {
  // إزالة أي مسافات
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Regex محسّن للأرقام المصرية
  const egyptianPhoneRegex = /^01[0125]\d{8}$/;
  
  return egyptianPhoneRegex.test(cleanPhone);
}

/**
 * التحقق من البريد الإلكتروني
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * التحقق من الاسم (حروف عربية أو إنجليزية فقط)
 */
export function validateName(name: string): boolean {
  const nameRegex = /^[\u0600-\u06FFa-zA-Z\s\-']{2,60}$/;
  return nameRegex.test(name);
}

/**
 * التحقق من العنوان
 */
export function validateAddress(address: string): boolean {
  return address.trim().length >= 5 && address.trim().length <= 500;
}

/**
 * التحقق من SKU (أحرف إنجليزية وأرقام فقط)
 */
export function validateSKU(sku: string): boolean {
  const skuRegex = /^[A-Z0-9\-_]{1,20}$/;
  return skuRegex.test(sku);
}