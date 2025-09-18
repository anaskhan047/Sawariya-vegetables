"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ProductImage {
  url: string;
  public_id: string;
}

interface Product {
  _id: string;
  id: string;
  name: string;
  inHindi?: string;
  description: string;
  price: number;
  category: string;
  stockQty: number;
  unit: string;
  minQty: number;
  maxQty: number;
  images: ProductImage[];
  popular?: boolean;
  grade?: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        if (data.success && data.products) {
          setProducts(data.products);

          // initialize quantities with minQty
          const initialQuantities: { [key: string]: number } = {};
          data.products.forEach((p: Product) => {
            initialQuantities[p.id] = p.minQty || 0.5;
          });
          setQuantities(initialQuantities);
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantities[product.id] || product.minQty || 1,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
      } else {
        alert(data.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8 text-center">Our Products</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const imgUrl =
            product.images && product.images.length > 0
              ? product.images[0].url
              : "/placeholder.png";

          const minQty = product.minQty || 0.5;
          const maxQty = product.maxQty || 10;

          return (
            <div
              key={product._id}
              className="border border-gray-200 rounded-lg p-4 flex flex-col items-center shadow-sm 
  hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-white group"
            >
              {/* Product Image */}
              <div className="relative w-full h-40 overflow-hidden rounded-md">
                <Image
                  width={300}
                  height={160}
                  src={imgUrl}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-md group-hover:scale-110 transition-transform duration-500"
                />

                {/* Out of Stock Badge */}
                {product.stockQty <= 0 && (
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                    Out of Stock
                  </span>
                )}

                {/* Popular Badge */}
                {product.popular && (
                  <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md flex items-center space-x-1">
                    <span>⭐</span>
                    <span>Popular</span>
                  </span>
                )}

                {/* Grade Badge */}
                {product.grade && (
                  <span
                    className={`absolute right-2 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md flex items-center space-x-1 ${product.popular ? "top-12" : "top-2"
                      } ${product.grade === "Standard" ? "bg-gray-500" :
                        product.grade === "Silver" ? "bg-slate-400" :
                          product.grade === "Gold" ? "bg-yellow-400" :
                            product.grade === "Premium" ? "bg-purple-600" :
                              "bg-blue-500"
                      }`}
                  >
                    <span>⭐</span>
                    <span>{product.grade}</span>
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h3 className="mt-3 text-lg font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                {product.name} / {product.inHindi}
              </h3>

              {/* Price */}
              <p className="text-green-700 font-bold mt-1">
                ₹{product.price} /
                <span className="text-sm text-gray-500 font-normal ml-1">
                  {product.unit}
                </span>
              </p>

              {/* Quantity Control */}
              <div className="flex items-center mt-3">
                <button
                  onClick={() =>
                    setQuantities((prev) => {
                      const step = product.unit === "kg" ? 0.5 : 1;
                      return {
                        ...prev,
                        [product.id]: Math.max(
                          (prev[product.id] || minQty) - step,
                          minQty
                        ),
                      };
                    })
                  }
                  className="px-2 py-1 bg-gray-200 rounded-l hover:bg-gray-300 transition-colors"
                >
                  -
                </button>

                <input
                  type="number"
                  step={product.unit === "kg" ? 0.5 : 1}
                  min={minQty}
                  max={maxQty}
                  value={quantities[product.id] || minQty}
                  onChange={(e) =>
                    setQuantities((prev) => {
                      const step = product.unit === "kg" ? 0.5 : 1;
                      const val = parseFloat(e.target.value) || minQty;
                      // Ensure step alignment
                      const alignedVal =
                        product.unit === "kg"
                          ? Math.round(val * 2) / 2 // rounds to nearest 0.5
                          : Math.round(val); // rounds to nearest integer
                      return {
                        ...prev,
                        [product.id]: Math.min(Math.max(alignedVal, minQty), maxQty),
                      };
                    })
                  }
                  className="w-16 text-center border-t border-b border-gray-300"
                />

                <button
                  onClick={() =>
                    setQuantities((prev) => {
                      const step = product.unit === "kg" ? 0.5 : 1;
                      return {
                        ...prev,
                        [product.id]: Math.min(
                          (prev[product.id] || minQty) + step,
                          maxQty
                        ),
                      };
                    })
                  }
                  className="px-2 py-1 bg-gray-200 rounded-r hover:bg-gray-300 transition-colors"
                >
                  +
                </button>
              </div>


              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stockQty <= 0}
                className={`mt-4 w-full py-2 rounded text-white font-semibold transition-all duration-300 transform 
      ${product.stockQty > 0
                    ? "bg-green-600 hover:bg-green-700 hover:scale-105"
                    : "bg-gray-400 cursor-not-allowed"
                  }`}
              >
                Add to Cart
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
