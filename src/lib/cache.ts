/**
 * بسيط caching layer باستخدام Next.js cache API
 * يستخدم للحد من استعلامات الداتابيز المتكررة
 * 
 * @module cache
 */

const CACHE_PREFIX = 'misk-cache:';

/**
 * جلب بيانات محفوظة في cache أو جلبها من المصدر وحفظها
 * 
 * @template T - نوع البيانات
 * @param {string} key - مفتاح فريد للبيانات
 * @param {() => Promise<T>} fetcher - دالة لجلب البيانات من المصدر
 * @param {number} ttl - مدة الصلاحية بالثواني (افتراضي: 300 ثانية = 5 دقائق)
 * @returns {Promise<T>} البيانات المحفوظة أو المجلوبة
 * 
 * @example
 * const products = await getCachedData('products-all', fetchProducts, 600);
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 دقائق افتراضياً
): Promise<T> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  
  try {
    // محاولة جلب البيانات من cache
    const cached = await getCachedItem<T>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // إذا لم توجد في cache، جلب من المصدر
    const data = await fetcher();
    
    // خزن في cache
    await setCachedItem(cacheKey, data, ttl);
    
    return data;
  } catch (error) {
    console.error(`Cache error for key ${key}:`, error);
    // في حالة خطأ، جلب مباشرة من المصدر
    return fetcher();
  }
}

async function getCachedItem<T>(key: string): Promise<T | null> {
  try {
    const cached = await caches.open('misk-cache');
    const response = await cached.match(key);
    
    if (!response) return null;
    
    const data = await response.json();
    const expiresAt = data.expiresAt;
    
    // التحقق من انتهاء الصلاحية
    if (Date.now() > expiresAt) {
      await cached.delete(key);
      return null;
    }
    
    return data.value;
  } catch {
    return null;
  }
}

async function setCachedItem<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    const cache = await caches.open('misk-cache');
    const data = {
      value,
      expiresAt: Date.now() + (ttl * 1000),
    };
    
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    await cache.put(key, response);
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    const cache = await caches.open('misk-cache');
    await cache.delete(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const cache = await caches.open('misk-cache');
    const keys = await cache.keys();
    
    for (const key of keys) {
      if (key.url.includes(pattern)) {
        await cache.delete(key);
      }
    }
  } catch (error) {
    console.error('Error invalidating cache pattern:', error);
  }
}