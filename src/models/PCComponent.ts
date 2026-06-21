import mongoose, { Schema, Document } from 'mongoose';

export interface IPCComponentDocument extends Document {
  name: string;
  type: 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Motherboard' | 'PSU' | 'Case' | 'Cooler';
  brand: string;
  price: number;
  image: string;
  specifications: Map<string, string>;
  compatibility: string[];
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PCComponentSchema = new Schema<IPCComponentDocument>({
  name: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    required: true,
    enum: ['CPU', 'GPU', 'RAM', 'Storage', 'Motherboard', 'PSU', 'Case', 'Cooler']
  },
  brand: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  specifications: { type: Map, of: String, default: {} },
  compatibility: [{ type: String }],
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

PCComponentSchema.index({ type: 1 });
PCComponentSchema.index({ brand: 1 });
PCComponentSchema.index({ price: 1 });

const PCComponent = mongoose.models.PCComponent || mongoose.model<IPCComponentDocument>('PCComponent', PCComponentSchema);

export default PCComponent;
