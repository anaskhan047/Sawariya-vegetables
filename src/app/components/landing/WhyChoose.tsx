"use client";

import { CheckCircle, Truck, Users, Calendar } from "lucide-react";
import React from "react";

interface Feature {
  icon: React.ReactElement;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <CheckCircle size={40} color="var(--primary-color)" />,
    title: "Fresh Produce",
    description: "Hand-picked daily from local farms for peak freshness.",
  },
  {
    icon: <Truck size={40} color="var(--primary-color)" />,
    title: "Fast Delivery",
    description: "Your order delivered to your doorstep, fast and fresh.",
  },
  {
    icon: <Users size={40} color="var(--primary-color)" />,
    title: "Trusted Customers",
    description: "Join thousands of satisfied customers who love our service.",
  },
  {
    icon: <Calendar size={40} color="var(--primary-color)" />,
    title: "Daily Harvest",
    description: "We ensure daily harvest to bring you the best quality.",
  },
];

export default function WhyChoose() {
  return (
    <section className="bg-[var(--background-color)] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-center text-3xl font-bold text-[var(--text-color)] mb-10">
          Why Choose Sawariya Vegetable?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#F9FAFB] rounded-xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--text-light)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
