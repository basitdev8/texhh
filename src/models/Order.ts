import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderDocument extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: {
    product: mongoose.Types.ObjectId;
    itemType: 'product' | 'component';
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
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
  stockReservationState?: 'unreserved' | 'reserving' | 'reserved' | 'releasing' | 'released';
  stockReservedAt?: Date;
  stockReleasedAt?: Date;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  statusHistory: {
    status: string;
    note?: string;
    timestamp: Date;
  }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, required: true },
  // Which catalogue the line came from. PC build parts live in their own
  // collection, so the id alone is not enough to resolve or restock a line.
  itemType: { type: String, enum: ['product', 'component'], default: 'product' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
}, { _id: false });

const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  note: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const ShippingAddressSchema = new Schema({
  fullName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'IN' },
  phone: { type: String, required: true },
}, { _id: false });

const OrderSchema = new Schema<IOrderDocument>({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  shippingAddress: ShippingAddressSchema,
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded', 'abandoned'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: 'cash_on_delivery' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpayRefundId: { type: String },
  refundState: {
    type: String,
    enum: ['none', 'processing', 'initiated', 'offline'],
    default: 'none',
  },
  // COD and bank-transfer orders are deliberately not reserved at checkout.
  // An admin reserves stock when confirming the order; cancellation can then
  // release it exactly once.
  stockReservationState: {
    type: String,
    enum: ['unreserved', 'reserving', 'reserved', 'releasing', 'released'],
    default: 'unreserved',
  },
  stockReservedAt: { type: Date },
  stockReleasedAt: { type: Date },
  trackingNumber: { type: String },
  carrier: { type: String },
  estimatedDelivery: { type: Date },
  statusHistory: { type: [StatusHistorySchema], default: [] },
  notes: { type: String },
}, { timestamps: true });

OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default Order;
