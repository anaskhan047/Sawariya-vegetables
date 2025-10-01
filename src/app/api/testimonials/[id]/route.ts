import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Testimonial from '@/app/models/Testimonial';
import { Types } from 'mongoose';
import { testimonialSchema } from '@/app/lib/schemas/testimonial';

interface Params {
  id: string;
}

export async function GET(req: NextRequest, context: { params: Promise<Params> }) {
  try {
    await dbConnect();
    const { id } = await context.params; // Awaiting the params Promise
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const t = await Testimonial.findById(id);
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(t);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    await dbConnect();
    const { id } = await params; // Awaiting the params Promise
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    if (body.rating !== undefined) {
      body.rating = Number(body.rating);
    }
    const parse = testimonialSchema.partial().safeParse(body);
    if (!parse.success) {
      console.error('Validation error:', parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const updated = await Testimonial.findByIdAndUpdate(id, { ...parse.data, updatedAt: new Date() }, { new: true });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, testimonial: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    await dbConnect();
    const { id } = await params; // Awaiting the params Promise
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const deleted = await Testimonial.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
