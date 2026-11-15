import DOMPurify from 'dompurify';

/**
 * تنظيف المدخلات من أي HTML/JavaScript خبيث
 * يستخدم DOMPurify للحماية من XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // لا نسمح بأي HTML tags
    ALLOWED_ATTR: [], // لا نسمح بأي attributes
    KEEP_CONTENT: true, // نحتفظ بالنص فقط
  });
}

/**
 * تنظيف التعليقات بشكل أكثر ليونة (يسمح ببعض التنسيق البسيط)
 */
export function sanitizeComment(input: string): string {
  if (!input) return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * تنظيف اسم العميل
 */
export function sanitizeName(input: string): string {
  if (!input) return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}