import mongoose, { Schema, Document } from 'mongoose';

export interface ISettingsDocument extends Document {
  key: string;
  freeShippingThreshold: number;
  flatShippingRate: number;
  gstRate: number;
  codEnabled: boolean;
  codMaxOrderAmount: number;
  bankTransferEnabled: boolean;
  shippingBannerText: string;
  heroProductId?: mongoose.Types.ObjectId;
  homeFeaturedProductIds: mongoose.Types.ObjectId[];
  homeFeatureSelectionConfigured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Single document, found by `key`, so there is never a second row to disagree with.
const SettingsSchema = new Schema<ISettingsDocument>({
  key: { type: String, required: true, unique: true, default: 'store' },
  freeShippingThreshold: { type: Number, required: true, default: 5000, min: 0 },
  flatShippingRate: { type: Number, required: true, default: 99, min: 0 },
  // Percent. Prices are GST-inclusive, so this only back-computes the disclosure figure.
  gstRate: { type: Number, required: true, default: 18, min: 0, max: 100 },
  codEnabled: { type: Boolean, default: true },
  codMaxOrderAmount: { type: Number, required: true, default: 10_000, min: 0 },
  bankTransferEnabled: { type: Boolean, default: false },
  shippingBannerText: {
    type: String,
    default: 'Free shipping on orders above ₹5,000. Dispatched in 1–2 business days.',
  },
  // Homepage placements are deliberately independent of the legacy Product.featured
  // flag: one product belongs in the hero, while the edit can contain many.
  heroProductId: { type: Schema.Types.ObjectId, ref: 'Product', default: undefined },
  homeFeaturedProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  homeFeatureSelectionConfigured: { type: Boolean, default: false },
}, { timestamps: true });

const Settings =
  mongoose.models.Settings ||
  mongoose.model<ISettingsDocument>('Settings', SettingsSchema);

export default Settings;
