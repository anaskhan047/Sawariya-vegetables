'use client';
import React, { useState, useEffect } from 'react';
import StarRating from '@/app/components/landing/StarRating';
import Swal from 'sweetalert2';

interface Testimonial {
  _id: string;
  name: string;
  email: string;
  message: string;
  rating?: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminTestimonials() {
  const [list, setList] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '', rating: 5 });
  const [editing, setEditing] = useState<Testimonial | null>(null);

  // Fetch all testimonials
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/testimonials');
      if (!res.ok) throw new Error('Failed to fetch testimonials');
      const data = await res.json();
      setList(data);
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error', text: (err as Error).message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Add new testimonial (pending)
  const addNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'All fields are required' });
      return;
    }
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating: Number(form.rating) }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || 'Failed to add testimonial');
      }
      Swal.fire({ icon: 'success', title: 'Added', text: 'Testimonial added successfully (pending)' });
      setForm({ name: '', email: '', message: '', rating: 5 });
      fetchList();
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error', text: (err as Error).message || 'Something went wrong' });
    }
  };

  // Approve or Reject testimonial
  const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update testimonial status');
      Swal.fire({ icon: 'success', title: 'Updated', text: `Testimonial ${status}` });
      fetchList();
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error', text: (err as Error).message || 'Something went wrong' });
    }
  };

  // Delete testimonial
  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete?',
      text: 'Are you sure you want to delete this testimonial?',
      showCancelButton: true,
    });
    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete testimonial');
        Swal.fire({ icon: 'success', title: 'Deleted', text: 'Testimonial deleted' });
        fetchList();
      } catch (err: unknown) {
        Swal.fire({ icon: 'error', title: 'Error', text: (err as Error).message || 'Something went wrong' });
      }
    }
  };

  // Open testimonial for editing
  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      name: t.name,
      email: t.email,
      message: t.message,
      rating: Number(t.rating) || 5,
    });
  };

  // Submit testimonial edit
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`/api/testimonials/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating: Number(form.rating) }),
      });
      if (!res.ok) throw new Error('Failed to update testimonial');
      Swal.fire({ icon: 'success', title: 'Saved', text: 'Testimonial updated successfully' });
      setEditing(null);
      setForm({ name: '', email: '', message: '', rating: 5 });
      fetchList();
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error', text: (err as Error).message || 'Something went wrong' });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Admin — Testimonials</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Testimonial Form */}
        <form onSubmit={addNew} className="bg-white p-4 rounded shadow flex flex-col gap-3">
          <h2 className="font-semibold mb-2 text-lg">Add Testimonial</h2>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border p-2 rounded"
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border p-2 rounded"
          />
          <textarea
            placeholder="Message"
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            className="w-full border p-2 rounded"
          />
          <div>
            <label className="block mb-1 font-medium">Rating:</label>
            <StarRating rating={Number(form.rating)} onChange={r => setForm({ ...form, rating: r })} />
          </div>
          <button type="submit" className="bg-[var(--primary-color)] text-white py-2 rounded mt-2 w-full">
            Add (pending)
          </button>
        </form>

        {/* Testimonials List */}
        <div className="lg:col-span-2 bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-4 text-lg">All Testimonials</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-3">
              {list.map(t => (
                <div
                  key={t._id}
                  className="border p-3 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="font-semibold">
                      {t.name} <span className="text-[var(--text-light)]">({t.email})</span>
                    </div>
                    <div className="text-[var(--text-light)] mb-1">{t.message}</div>
                    <StarRating rating={Number(t.rating) || 1} onChange={() => {}} readOnly />
                    <div className="mt-1 text-xs text-[var(--text-light)]">
                      Status: <strong>{t.status}</strong>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                    <button
                      disabled={t.status === 'approved'}
                      onClick={() => handleApprove(t._id, 'approved')}
                      className={`px-3 py-1 rounded text-white ${
                        t.status === 'approved' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      disabled={t.status === 'rejected'}
                      onClick={() => handleApprove(t._id, 'rejected')}
                      className={`px-3 py-1 rounded text-white ${
                        t.status === 'rejected' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      Reject
                    </button>
                    <button onClick={() => openEdit(t)} className="px-3 py-1 rounded border hover:bg-gray-100">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(t._id)} className="px-3 py-1 rounded border text-red-600 hover:bg-gray-100">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-3">Edit Testimonial</h3>
            <form onSubmit={submitEdit} className="flex flex-col gap-3">
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <div>
                <label className="block mb-1 font-medium">Rating:</label>
                <StarRating rating={Number(form.rating)} onChange={r => setForm({ ...form, rating: r })} />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3 py-1 rounded border hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-[var(--primary-color)] text-white hover:bg-[var(--secondary-color)]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
