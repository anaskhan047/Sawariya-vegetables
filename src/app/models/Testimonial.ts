import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonial extends Document {
  name: string;
  email: string;
  message: string;
  rating?: number;
  status: 'pending' | 'approved' | 'rejected';
  creditedAt: Date;
  updatedAt?: Date;
}

const TestimonialSchema = new Schema<ITestimonial>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  creditedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

export default mongoose.models.Testimonial || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);
