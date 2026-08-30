export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'customer';
  phone?: string;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice?: number;
  category: string | ICategory;
  brand: string;
  images: string[];
  specifications: Record<string, string>;
  stock: number;
  featured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentCategory?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: string | IUser;
  items: IOrderItem[];
  shippingAddress: IAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'abandoned';
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
  refundState?: 'none' | 'processing' | 'initiated' | 'offline';
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date | string;
  statusHistory?: IOrderStatusEvent[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderStatusEvent {
  status: string;
  note?: string;
  timestamp: Date | string;
}

export interface IOrderItem {
  product: string | IProduct;
  itemType?: 'product' | 'component';
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type PCComponentType = 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Motherboard' | 'PSU' | 'Case' | 'Cooler';

export interface IPCComponent {
  _id: string;
  name: string;
  type: PCComponentType;
  brand: string;
  price: number;
  image: string;
  specifications: Record<string, string>;
  compatibility: string[];
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  productId: string;
  /** Which catalogue this line came from — build parts are not products. */
  itemType?: 'product' | 'component';
  name: string;
  price: number;
  quantity: number;
  image: string;
  maxStock: number;
}

export interface IPCBuild {
  [key: string]: IPCComponent | null;
  CPU: IPCComponent | null;
  GPU: IPCComponent | null;
  RAM: IPCComponent | null;
  Storage: IPCComponent | null;
  Motherboard: IPCComponent | null;
  PSU: IPCComponent | null;
  Case: IPCComponent | null;
  Cooler: IPCComponent | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
