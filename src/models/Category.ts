import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentCategory?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDocument>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  parentCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;
