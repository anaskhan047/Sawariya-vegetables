"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import OrbitVegetableLoader from "../Loader/Loader";
import Swal from "sweetalert2";
import { postAddToCart } from "@/app/lib/client/addToCart";
import { getOrderableMaxQty } from "@/app/lib/stock";
import { productMatchesCategoryFilter } from "@/app/lib/productCategory";

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
  marketPrice: number;
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
  const [sortOrder, setSortOrder] = useState<"lowToHigh" | "highToLow">("lowToHigh");

  const { refreshCart } = useCart();
  const searchParams = useSearchParams();

  const selectedGrade = searchParams.get("grade");
  const selectedCategory = searchParams.get("category");
  const popularOnly = searchParams.get("popular") === "true";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        const data = await res.json();

        if (data.success && data.products) {
          let filteredProducts = data.products;

          const searchTerm = searchParams.get("search")?.toLowerCase() || "";
          const maxPrice = Number(searchParams.get("maxPrice")) || 1000;

          if (searchTerm) {
            filteredProducts = filteredProducts.filter((p: Product) => {
              const nameMatch = p.name.toLowerCase().includes(searchTerm);
              const hindiMatch = p.inHindi?.toLowerCase().includes(searchTerm);
              const categoryMatch = p.category?.toLowerCase().includes(searchTerm);
              return nameMatch || hindiMatch || categoryMatch;
            });
          }

          if (selectedGrade) {
            filteredProducts = filteredProducts.filter((p: Product) => p.grade === selectedGrade);
          }
          if (selectedCategory) {
            filteredProducts = filteredProducts.filter((p: Product) =>
              productMatchesCategoryFilter(p.category, selectedCategory)
            );
          }
          if (popularOnly) {
            filteredProducts = filteredProducts.filter((p: Product) => p.popular);
          }

          filteredProducts = filteredProducts.filter((p: Product) => p.price <= maxPrice);

          if (sortOrder === "lowToHigh") {
            filteredProducts.sort((a: Product, b: Product) => a.price - b.price);
          } else {
            filteredProducts.sort((a: Product, b: Product) => b.price - a.price);
          }

          setProducts(filteredProducts);
          const initialQuantities: { [key: string]: number } = {};
          filteredProducts.forEach((p: Product) => {
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
  }, [searchParams, selectedGrade, selectedCategory, popularOnly, sortOrder]);

  const handleAddToCart = async (product: Product) => {
    if (localStorage.getItem("token") === null) {
      Swal.fire({
        title: "You are not logged in",
        text: "Please log in to add items to your cart.",
        icon: "warning",
        confirmButtonText: "Login",
        cancelButtonText: "Cancel",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
      return;
    }

    try {
      const result = await postAddToCart({
        productId: product.id,
        quantity: quantities[product.id] || product.minQty || 1,
      });
      if (result.ok) {
        await refreshCart();
      } else {
        Swal.fire("Not available", result.error || "Failed to add to cart", "error");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center py-10">
        <OrbitVegetableLoader />
      </div>
    );
  }

  if (!products.length) return <p className="py-10 text-center">No products found</p>;

  return (
    <section className="container mx-auto px-2 py-2 sm:px-4 md:py-4">
      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
        <h2 className="text-center text-xl font-bold md:text-left md:text-3xl">Our Products</h2>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-medium text-gray-700 md:text-base">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "lowToHigh" | "highToLow")}
            className="rounded border border-gray-300 px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-green-600 md:px-3 md:text-sm"
          >
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {products.map((product) => {
          const imgUrl = product.images && product.images.length > 0 ? product.images[0].url : "/placeholder.png";
          const minQty = product.minQty || 0.5;
          const maxQty = getOrderableMaxQty(product);

          return (
            <div
              key={product._id}
              className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md md:p-3"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                <Image
                  width={300}
                  height={300}
                  src={imgUrl}
                  alt={product.name}
                  className="h-full w-full rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {product.stockQty <= 0 && (
                  <span className="absolute right-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white md:right-2 md:top-2 md:px-2 md:py-1 md:text-xs">
                    Out
                  </span>
                )}

                {product.popular && (
                  <span className="absolute right-1 top-1 rounded-full bg-yellow-500 px-1.5 py-0.5 text-[10px] font-semibold text-white md:right-2 md:top-2 md:px-2 md:py-1 md:text-xs">
                    Popular
                  </span>
                )}
              </div>

              <h3 className="mt-2 line-clamp-2 text-center text-[11px] font-semibold leading-4 text-gray-800 md:mt-3 md:text-sm">
                {product.name}
              </h3>
              {product.inHindi ? (
                <p className="line-clamp-1 text-center text-[10px] text-gray-500 md:text-xs">{product.inHindi}</p>
              ) : null}

              <p className="mt-1 text-center text-[11px] font-bold text-green-700 md:text-sm">
                <span className="mx-1 line-through text-[10px] text-red-500 md:mx-2 md:text-xs">Rs {product.marketPrice}</span>
                Rs {product.price}
                <span className="ml-1 text-[10px] font-normal text-gray-500 md:text-xs">/{product.unit}</span>
              </p>

              <div className="mt-2 flex items-center justify-center">
                <button
                  onClick={() =>
                    setQuantities((prev) => {
                      const step = product.unit === "kg" ? 0.5 : 1;
                      return {
                        ...prev,
                        [product.id]: Math.max((prev[product.id] || minQty) - step, minQty),
                      };
                    })
                  }
                  className="rounded-l bg-gray-200 px-1.5 py-1 text-xs transition-colors hover:bg-gray-300 md:px-2"
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
                      const val = parseFloat(e.target.value) || minQty;
                      const alignedVal = product.unit === "kg" ? Math.round(val * 2) / 2 : Math.round(val);
                      return {
                        ...prev,
                        [product.id]: Math.min(Math.max(alignedVal, minQty), maxQty),
                      };
                    })
                  }
                  className="w-9 border-y border-gray-300 text-center text-[11px] md:w-12 md:text-xs"
                />

                <button
                  onClick={() =>
                    setQuantities((prev) => {
                      const step = product.unit === "kg" ? 0.5 : 1;
                      return {
                        ...prev,
                        [product.id]: Math.min((prev[product.id] || minQty) + step, maxQty),
                      };
                    })
                  }
                  className="rounded-r bg-gray-200 px-1.5 py-1 text-xs transition-colors hover:bg-gray-300 md:px-2"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stockQty <= 0}
                className={`mt-2 w-full rounded-md py-1.5 text-[10px] font-semibold text-white transition-all duration-200 md:mt-3 md:py-2 md:text-sm
                  ${
                    product.stockQty > 0
                      ? "bg-green-600 hover:scale-105 hover:bg-green-700 active:scale-95 active:bg-green-800"
                      : "cursor-not-allowed bg-gray-400"
                  }`}
              >
                Add
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
