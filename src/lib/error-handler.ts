/**
 * توحيد error handling pattern للمشروع
 * يوفر طرق موحدة للتعامل مع الأخطاء
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  // أخطاء الأمان
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // أخطاء البيانات
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // أخطاء الستوك
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
  
  // أخطاء النظام
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export function handleSupabaseError(error: any): AppError {
  const message = error?.message || 'حدث خطأ غير متوقع';
  
  // تحويل أخطاء Supabase إلى AppError
  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return new AppError('بيانات مكررة', ErrorCodes.DUPLICATE_ENTRY, 409);
  }
  
  if (message.includes('foreign key') || message.includes('violates foreign key')) {
    return new AppError('بيانات مرتبطة غير موجودة', ErrorCodes.VALIDATION_ERROR, 400);
  }
  
  if (message.includes('check constraint')) {
    return new AppError('بيانات غير صحيحة', ErrorCodes.VALIDATION_ERROR, 400);
  }
  
  if (message.includes('permission denied') || message.includes('42501')) {
    return new AppError('ليس لديك صلاحية للقيام بهذا الإجراء', ErrorCodes.FORBIDDEN, 403);
  }
  
  // أخطاء عامة
  return new AppError(message, ErrorCodes.DATABASE_ERROR, 500);
}

export function handleApiError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof TypeError || error instanceof SyntaxError) {
    return new AppError('بيانات غير صحيحة', ErrorCodes.VALIDATION_ERROR, 400);
  }
  
  // التحقق من أخطاء الشبكة
  if (error?.name === 'NetworkError' || error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return new AppError('مشكلة في الاتصال', ErrorCodes.NETWORK_ERROR, 503);
  }
  
  return new AppError('حدث خطأ غير متوقع', ErrorCodes.UNKNOWN_ERROR, 500);
}

export function createErrorResponse(error: AppError) {
  return {
    error: error.message,
    code: error.code,
    ...(error.details && { details: error.details }),
  };
}

export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}