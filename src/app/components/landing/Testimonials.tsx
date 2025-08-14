"use client";
import React, { useState } from "react";
import Slider from "react-slick";
import Newsletter from "./Newsletter";
import StarRating from "./StarRating";
import Image from "next/image";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Testimonial {
  name: string;
  feedback: string;
  rating: number;
  image: string;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    {
      name: "Priya Sharma",
      feedback:
        "Sawariya Vegetable has transformed my cooking! The produce is unbelievably fresh, and the convenience of home delivery is a lifesaver. Highly recommend!",
      rating: 5,
      image: "/images/priya.jpg",
    },
    {
      name: "Rahul Singh",
      feedback:
        "I've never had such fresh vegetables delivered to my home. The quality is consistent, and the variety is excellent. This is my go-to for groceries now.",
      rating: 5,
      image: "/images/rahul.jpg",
    },
    {
      name: "Anjali Devi",
      feedback:
        "Outstanding service and even better produce! The organic selection is fantastic, and everything arrives perfectly. Couldn't ask for more.",
      rating: 4,
      image: "https://media.istockphoto.com/id/1961053928/photo/testimonial-portrait-of-a-handsome-mature-man.jpg?s=612x612&w=0&k=20&c=MJq7K4S8Hihi7p4f4-Ja4_II9X8HRsBGusOcJ7uJLbc=",
    },
  ]);

  const [newName, setNewName] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [newRating, setNewRating] = useState(5);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newFeedback) return;
    setTestimonials([
      ...testimonials,
      {
        name: newName,
        feedback: newFeedback,
        rating: newRating,
        image: "/images/default.jpg",
      },
    ]);
    setNewName("");
    setNewFeedback("");
    setNewRating(5);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 bg-[var(--background-color)] overflow-hidden">
      <h2 className="text-3xl font-bold text-center mb-8">
        What Our Customers Say
      </h2>

      {/* Slider */}
      <Slider {...settings} className="!overflow-hidden">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="px-4 box-border md:px-3 sm:px-2 h-65"
          >
            <div className="border border-[var(--border-color)] rounded-xl p-6 shadow-md bg-white h-full">
              <div className="flex mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-[var(--star-color)]">★</span>
                ))}
                {Array.from({ length: 5 - t.rating }).map((_, i) => (
                  <span key={i} className="text-[var(--star-empty-color)]">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-[var(--text-light)] mb-4 h-30">{t.feedback}</p>
              <div className="flex items-center gap-3">
                <Image
                  width={40}
                  height={40}
                  src={t.image}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-semibold">{t.name}</span>
              </div>
            </div>
          </div>
        ))}
      </Slider>

      {/* Feedback + Newsletter Row */}
      <div className="mt-12 flex flex-col lg:flex-row gap-6">
        {/* Feedback Form */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow-md border border-[var(--border-color)]">
          <h3 className="text-xl font-bold mb-4">Leave Your Feedback</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2"
            />
            <textarea
              placeholder="Your Feedback"
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2"
            ></textarea>
            <div>
              <label className="block mb-1 font-medium">Rating:</label>
              <StarRating rating={newRating} onChange={setNewRating} />
            </div>
            <button
              type="submit"
              className="w-full bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white py-2 rounded-lg"
            >
              Submit Feedback
            </button>
          </form>
        </div>

        {/* Newsletter */}
        <div className="flex-1">
          <Newsletter />
        </div>
      </div>
    </div>
  );
}
