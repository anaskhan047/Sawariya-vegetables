'use client';
import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import Newsletter from './Newsletter';
import StarRating from './StarRating';
import Swal from 'sweetalert2';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface Testimonial {
  _id: string;
  name: string;
  email?: string;
  message: string;
  rating: number ;
  status?: 'pending' | 'approved' | 'rejected';
  image?: string;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1, arrows: false } },
    ],
  };

  // Fetch approved testimonials
  useEffect(() => {
    setLoading(true);
    fetch('/api/testimonials?status=approved')
      .then(res => (res.ok ? res.json() : Promise.reject('Failed to load testimonials')))
      .then(data => {
        setTestimonials(data);
        setError(null);
      })
      .catch(err => {
        setError(err.toString());
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newMessage.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill all fields before submitting',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          message: newMessage,
          rating: Number(newRating),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || 'Submission failed');
      }

      Swal.fire({
        icon: 'success',
        title: 'Thank You!',
        text: 'Your testimonial is submitted and pending approval.',
      });

      setNewName('');
      setNewEmail('');
      setNewMessage('');
      setNewRating(5);
      // Optional: Refresh testimonials or let admin approve first
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error', text: (err as Error).message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 bg-[var(--background-color)]">
      <h2 className="text-3xl font-bold text-center mb-8">What Our Customers Say</h2>

      {loading && <p className="text-center mb-4">Loading testimonials...</p>}
      {error && <p className="text-center text-red-600 mb-4">{error}</p>}

      {!loading && testimonials.length > 0 && (
        <Slider {...settings} className="!overflow-hidden">
          {testimonials.map(t => (
            <div key={t._id} className="px-4 sm:px-2">
              <div className="border rounded-xl p-6 shadow-md bg-white h-full flex flex-col justify-between">
                <StarRating rating={t.rating} readOnly />
                <p className="text-[var(--text-light)] my-4">{t.message}</p>
                <span className="font-semibold">{t.name}</span>
              </div>
            </div>
          ))}
        </Slider>
      )}

      <div className="mt-12 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white p-6 rounded-xl shadow-md border border-[var(--border-color)]">
          <h3 className="text-xl font-bold mb-4">Leave Your Feedback</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
            <input
              type="email"
              placeholder="Your Email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
            <textarea
              placeholder="Your Feedback"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
              minLength={10}
              maxLength={212}
            />
            <div>
              <label className="block mb-1 font-medium">Rating:</label>
              <StarRating rating={newRating} onChange={setNewRating} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white py-2 rounded-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        <div className="flex-1">
          <Newsletter />
        </div>
      </div>
    </div>
  );
}
