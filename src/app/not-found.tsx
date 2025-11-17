"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center px-6 bg-gray-50">
      <h1 className="text-6xl font-bold text-green-600">404</h1>
      <h2 className="text-2xl font-semibold mt-4">Page Not Found</h2>

      <p className="text-gray-600 mt-3 max-w-md">
        Oops! The page you are looking for does not exist or may have been moved.
      </p>

      <li
       onClick={() => router.back()}
        className="mt-6 inline-block bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition"
      >
        Go Back Home
      </li>

      <div className="mt-10">
        <img
          src="/404.png"
          alt="Not Found"
          className="w-72 opacity-90"
        />
      </div>
    </div>
  );
}
