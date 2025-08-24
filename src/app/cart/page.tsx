'use client';

import { useMemo, useState } from 'react';

type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  mrp?: number;
  qty: number;
  unit: string;
};

const initialItems: CartItem[] = [
  {
    id: '1',
    name: 'Fresh Tomatoes',
    image: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQ7UH64K2_JbWj--JEDbWcTUfrwSvo7Xuk1tm4NYExO2VhZTWm8Qs1YdW1IctLimuJqONWxfLEUk3IIrtluNW1nDg',
    price: 45,
    mrp: 60,
    qty: 2,
    unit: '500g',
  },
  {
    id: '2 ',
    name: 'Potato (New Crop)',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1BPTx1JMtuUs1JxjjhtvnO2FW6InTUoumUg&s',
    price: 30,
    qty: 1,
    unit: '1kg',
  },
  {
    id: '2',
    name: 'Potato (New Crop)',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1BPTx1JMtuUs1JxjjhtvnO2FW6InTUoumUg&s',
    price: 30,
    qty: 1,
    unit: '1kg',
  },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const priceSummary = useMemo(() => {
    const subTotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const mrpTotal = items.reduce((sum, it) => sum + (it.mrp ?? it.price) * it.qty, 0);
    const savings = Math.max(0, mrpTotal - subTotal);
    const delivery = subTotal >= 299 ? 0 : 29;
    const total = subTotal + delivery;
    return { subTotal, mrpTotal, savings, delivery, total };
  }, [items]);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it))
    );
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  return (
    <div className="bg-[var(--background-color)] text-[var(--text-color)] px-4 py-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border border-[var(--border-color)] rounded-xl p-4 bg-white"
            >
              <img
                src={it.image}
                alt={it.name}
                className="w-28 h-24 object-cover rounded-lg border border-[var(--border-color)]"
              />
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:justify-between w-full">
                  <div>
                    <h3 className="font-semibold">{it.name}</h3>
                    <p className="text-sm text-[var(--text-light)]">Pack: {it.unit}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-lg font-bold text-[var(--primary-color)]">₹ {it.price}</span>
                      {it.mrp && it.mrp > it.price && (
                        <span className="text-sm text-[var(--text-light)] line-through">₹ {it.mrp}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <button
                      onClick={() => updateQty(it.id, -1)}
                      className="px-2 py-1 border border-[var(--border-color)] rounded-lg hover:bg-[var(--secondary-color)] hover:text-white"
                    >
                      -
                    </button>
                    <span className="px-3">{it.qty}</span>
                    <button
                      onClick={() => updateQty(it.id, +1)}
                      className="px-2 py-1 border border-[var(--border-color)] rounded-lg hover:bg-[var(--secondary-color)] hover:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(it.id)}
                  className="mt-2 text-sm text-[var(--secondary-color)] hover:text-[var(--primary-color)]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border border-[var(--border-color)] rounded-xl p-4 bg-white h-fit">
          <h2 className="text-lg font-semibold mb-4">Bill Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Items total</span>
              <span>₹ {priceSummary.subTotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{priceSummary.delivery === 0 ? 'Free' : `₹ ${priceSummary.delivery}`}</span>
            </div>
            {priceSummary.savings > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Savings</span>
                <span>- ₹ {priceSummary.savings}</span>
              </div>
            )}
            <div className="border-t border-[var(--border-color)] my-2"></div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹ {priceSummary.total}</span>
            </div>
          </div>
          <button className="mt-4 w-full rounded-lg bg-[var(--primary-color)] py-2 text-white hover:bg-[var(--secondary-color)] transition">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
