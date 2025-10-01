import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Testimonial, { ITestimonial } from '@/app/models/Testimonial';
import { testimonialSchema } from '@/app/lib/schemas/testimonial';
import { FilterQuery } from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const filter: FilterQuery<ITestimonial> = {};
    if (status) filter.status = status;

    const testimonials = await Testimonial.find(filter).sort({ creditedAt: -1 });
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();

    // Ensure rating is a number if present (convert if necessary)
    if (data.rating !== undefined) {
      data.rating = Number(data.rating);
    }

    const parse = testimonialSchema.safeParse(data);
    if (!parse.success) {
      console.error('Validation error:', parse.error.flatten());
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const created = await Testimonial.create({
      ...parse.data,
      rating: parse.data.rating ?? 5,
      status: 'pending',
      creditedAt: new Date(),
    });

    return NextResponse.json({ success: true, testimonial: created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
