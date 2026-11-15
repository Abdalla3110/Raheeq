// ── أنواع قاعدة البيانات ──────────────────────────────────────────

export type GenderCategory = "men" | "women" | "unisex";

export type ProductStatus = "draft" | "published" | "archived";

export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: GenderCategory;
  images: string[];
  meta_title: string | null;
  meta_description: string | null;
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size_ml: number;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  offer?: Offer | Offer[] | null; // Supabase join يرجع Array أحياناً
  /** سعر الوحدة بعد الخصم إن وجد (يُحسب عند القراءة) */
  final_price?: number;
}

export interface Offer {
  id: string;
  variant_id: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  verified_purchase: boolean;
  created_at: string;
}

export interface ShippingZone {
  id: string;
  governorate: string;
  delivery_fee: number;
  is_active: boolean;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string;
}

export interface OrderItemInput {
  variant_id: string;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes: string | null;
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_size_ml: number;
  variant_sku: string;
  unit_price: number;
  discount_amount: number;
  final_price: number;
  quantity: number;
}

export interface OrderStatusEvent {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export const CATEGORY_LABELS: Record<GenderCategory, string> = {
  men: "رجالي",
  women: "حريمي",
  unisex: "للجنسين",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  PREPARING: "جاري التحضير",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-amber-100 text-amber-800",
  PREPARING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};
