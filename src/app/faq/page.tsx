// src/app/faq/page.tsx
"use client";

import React, { JSX, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, Leaf, Truck, HelpCircle } from "lucide-react";

type FAQCategory =
  | "Ordering"
  | "Delivery"
  | "Payments & Pricing"
  | "Quality & Freshness"
  | "Account & Support";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  highlight?: boolean;
};

const faqs: FAQItem[] = [
  {
    id: "delivery-areas",
    question: "Kaun-kaun se areas mein delivery available hai?",
    answer:
      "Hum abhi selected local areas mein hi delivery dete hain. Aap apna full address checkout par fill karoge, agar hamari service area mein aata hai to delivery option automatically show ho jayega. Agar aapko doubt ho to WhatsApp ya call se confirm kar sakte ho.",
    category: "Delivery",
  },
  {
    id: "delivery-charges",
    question: "Delivery charges kitne lagenge?",
    answer:
      "Delivery charge ham order value, location aur operational cost ke hisaab se rakhte hain, jo time-to-time update ho sakta hai. Exact delivery charge aapko hamesha checkout page par payment se pehle clearly show hoga. Jab bhi hum price change karte hain, woh turant system mein update ho jata hai, isliye hamesha latest delivery charge checkout par hi dekhen.",
    category: "Delivery",
    highlight: true,
  },
  {
    id: "delivery-time",
    question: "Delivery kab tak mil jaayegi?",
    answer:
      "Hum zyadatar orders ko same-day ya next-day deliver karne ki koshish karte hain. Subah jaldi place kiye gaye orders aam taur par same-day slot mein chale jaate hain. Exact delivery slot aapko checkout par dikhega, aur koi delay hoga to team aapko contact karegi.",
    category: "Delivery",
  },
  {
    id: "min-order",
    question: "Kya minimum order value hai?",
    answer:
      "Haan, ek chhota sa minimum order value rakhte hain taaki delivery cost cover ho sake. Ye value time-to-time change ho sakti hai, lekin aapko hamesha cart aur checkout page par clearly dikhai degi. Agar aapka order minimum se kam hoga to system aapko bata dega.",
    category: "Ordering",
  },
  {
    id: "freshness",
    question: "Sabzi kitni fresh hoti hai?",
    answer:
      "Hamari koshish hoti hai ki maximum items same-day ya previous-day arrival se deliver karein. Hum officially expiry date wala grocery jaisa system nahi rakhte, lekin har batch ko quality check ke baad hi pack kiya jata hai. Agar kabhi aapko koi item stale ya kharab mile, to aap turant photo ke saath hume contact karein.",
    category: "Quality & Freshness",
  },
  {
    id: "wash-pack",
    question: "Kya sabzi dhokar pack ki jaati hai?",
    answer:
      "Zyadatar vegetables ko basic cleaning ke baad hi pack kiya jata hai, lekin hum recommend karte hain ki aap ghar par bhi achhi tarah se wash karke hi use karein. Leafy greens aur dhaniya jaise items ko hum carefully bundle karke rakhte hain taaki fresh rahein.",
    category: "Quality & Freshness",
  },
  {
    id: "organic",
    question: "Kya aap log organic vegetables bhi rakhte ho?",
    answer:
      "Hamare paas regular farm-fresh vegetables ke saath-saath kuch selected organic options bhi ho sakte hain, jo time-to-time availability par depend karta hai. Organic items par hum listing mein clearly mention karte hain. Agar aapko specific organic item chahiye ho to order se pehle confirm kar sakte ho.",
    category: "Quality & Freshness",
  },
  {
    id: "change-order",
    question: "Order place karne ke baad usme change ya cancel kar sakte hain?",
    answer:
      "Agar order abhi tak packing ya dispatch stage mein nahi gaya hai, to aap change ya cancel request kar sakte ho. Jaldi se hume call ya WhatsApp message karo order ID ke saath. Agar order already out for delivery hai, to cancellation possible nahi hoti, lekin exceptional cases mein team best possible help karegi.",
    category: "Ordering",
  },
  {
    id: "wrong-item",
    question: "Agar galat ya kharab item mil jaye to kya karna hoga?",
    answer:
      "Agar koi item galat, damaged ya quality mein issue wala milta hai, to please delivery ke 24 ghante ke andar hume photo ke saath contact karein. Hum replacement, wallet credit ya refund mein se best option aapke case ke hisaab se decide karke help karenge.",
    category: "Account & Support",
  },
  {
    id: "payment-methods",
    question: "Payment kaise kar sakte hain?",
    answer:
      "Aap UPI, net banking, card payment aur kabhi-kabhi cash on delivery (agar available ho) se pay kar sakte ho. Available payment options checkout par clearly show hote hain. Hamara system secure payment gateways use karta hai taaki aapke transaction safe rahein.",
    category: "Payments & Pricing",
  },
  {
    id: "price-changes",
    question: "Sabziyon ke rate baar-baar kyu change hote hain?",
    answer:
      "Vegetable market ka rate daily basis par mandi prices, season aur supply ke hisaab se change hota hai. Hum hamesha try karte hain ki aapko fair aur competitive pricing mile. Jo bhi current rate hota hai, woh website/app par real-time update ho jata hai, isliye order place karte waqt jo price dikh raha hai, wahi applicable hota hai.",
    category: "Payments & Pricing",
  },
  {
    id: "support",
    question: "Agar mujhe help chahiye ho to kisse contact karun?",
    answer:
      "Aap hume call, WhatsApp ya website/app ke contact form se easily reach kar sakte ho. Hamari support timing aam taur par store timing ke saath aligned hoti hai. Hum koshish karte hain ki jitni jaldi ho sake, aapke sawalon ka jawab dein.",
    category: "Account & Support",
  },
];

type FilterCategory = FAQCategory | "All";

export default function FAQPage(): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(faqs[0]?.id ?? null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("All");

  const categories = useMemo<FilterCategory[]>(
    () => ["All", ...Array.from(new Set(faqs.map((faq) => faq.category)))],
    []
  );

  const filteredFaqs = useMemo<FAQItem[]>(
    () =>
      faqs.filter((faq) => {
        const matchCategory =
          activeCategory === "All" ? true : faq.category === activeCategory;

        if (!matchCategory) return false;

        if (!searchTerm.trim()) return true;

        const value = searchTerm.toLowerCase();
        return (
          faq.question.toLowerCase().includes(value) ||
          faq.answer.toLowerCase().includes(value)
        );
      }),
    [activeCategory, searchTerm]
  );

  return (
    <main className="min-h-screen bg-[var(--background-color)] text-[var(--text-color)]">
      {/* Top section */}
      <section className="w-full border-b border-[var(--border-color)] bg-[var(--background-color)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:py-14">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--background-color)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--text-light)]">
              <Leaf size={14} />
              <span>Shri Sawariya Mart • Help Center</span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Frequently Asked Questions
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-light)] md:text-base">
              Sabzi, fruits aur grocery ke saare common questions ka ek hi jagah par jawab.
              Agar fir bhi koi doubt rahe, to hume seedha contact kar sakte ho.
            </p>

            <div className="flex flex-wrap gap-3 text-xs md:text-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--background-color)] px-3 py-1 text-[var(--text-light)]">
                <Truck size={14} />
                <span>Fast local delivery</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--background-color)] px-3 py-1 text-[var(--text-light)]">
                <HelpCircle size={14} />
                <span>Support during store hours</span>
              </div>
            </div>
          </div>

          {/* Highlight / quick info card */}
          <div className="mt-2 w-full max-w-xs rounded-2xl border border-[var(--border-color)] bg-[var(--background-color)] p-4 shadow-sm md:mt-0">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-color)] bg-opacity-10">
                  <Truck className="h-5 w-5 text-[var(--primary-color)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text-light)]">
                    Delivery info
                  </p>
                  <p className="text-sm font-semibold">
                    Charges & timing updated live
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-light)]">
              Delivery charges aur time slots market situation ke hisaab se update
              hote rehte hain. Hamesha latest details checkout par dekhen – wahi
              sabse accurate hota hai.
            </p>
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Search + filters */}
        <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Search className="h-4 w-4 text-[var(--text-light)]" />
            </div>
            <input
              type="text"
              placeholder="Search questions (e.g. delivery charges, timing, refund)…"
              value={searchTerm}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(event.target.value)
              }
              className="h-10 w-full rounded-xl border border-[var(--border-color)] bg-[var(--background-color)] pl-9 pr-3 text-sm text-[var(--text-color)] outline-none ring-0 focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-opacity-30"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {categories.map((category) => {
              const isActive = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={[
                    "rounded-full border px-3 py-1 font-medium transition-transform",
                    isActive
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-[var(--background-color)] shadow-sm"
                      : "border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-light)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]",
                  ].join(" ")}
                >
                  {category === "All" ? "All FAQs" : category}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ list */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-6">
          {/* Left: main accordion */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--background-color)] p-6 text-sm text-[var(--text-light)]">
                Koi result nahi mila. Dusra keyword try karein, jaise &quot;delivery&quot;,
                &quot;refund&quot; ya &quot;timing&quot;.
              </div>
            ) : (
              filteredFaqs.map((item) => (
                <FAQAccordionItem
                  key={item.id}
                  item={item}
                  isActive={activeId === item.id}
                  onToggle={() =>
                    setActiveId((current) => (current === item.id ? null : item.id))
                  }
                />
              ))
            )}
          </div>

          {/* Right: small helpful box / contact */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--background-color)] p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold">
                Jo dhoondh rahe ho nahi mila?
              </h2>
              <p className="mb-4 text-xs leading-relaxed text-[var(--text-light)]">
                Agar aapka sawal yahan list nahi hai, to aap direct hamari team se
                baat kar sakte ho. Hum aapko order, quality, delivery – har cheez
                mein guide karenge.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--background-color)] px-3 py-2">
                  <span className="font-medium">WhatsApp / Call</span>
                  <span className="text-[var(--text-light)]">Store timing ke beech</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--background-color)] px-3 py-2">
                  <span className="font-medium">In-store support</span>
                  <span className="text-[var(--text-light)]">Visit Shri Sawariya Mart</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--background-color)] p-5 text-xs leading-relaxed text-[var(--text-light)]">
              <p className="mb-2 font-semibold text-[var(--text-color)]">
                Important note
              </p>
              <p>
                Sab prices (including delivery charges) mandi rate, fuel cost aur
                operational cost se linked hote hain. Isliye actual applicable price
                hamesha cart aur checkout par jo dikh raha hai, wahi maana jayega.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

type FAQAccordionItemProps = {
  item: FAQItem;
  isActive: boolean;
  onToggle: () => void;
};

function FAQAccordionItem(props: FAQAccordionItemProps): JSX.Element {
  const { item, isActive, onToggle } = props;

  return (
    <div
      className={[
        "rounded-2xl border bg-[var(--background-color)] transition-shadow",
        item.highlight
          ? "border-[var(--accent-color)] shadow-sm"
          : "border-[var(--border-color)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left md:px-5 md:py-4"
        aria-expanded={isActive}
      >
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-sm font-semibold md:text-base">{item.question}</p>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-light)]">
            {item.category}
          </span>
        </div>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--background-color)]">
          {isActive ? (
            <ChevronUp className="h-4 w-4 text-[var(--text-light)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--text-light)]" />
          )}
        </div>
      </button>

      {isActive && (
        <div className="border-t border-[var(--border-color)] px-4 py-3 text-xs leading-relaxed text-[var(--text-light)] md:px-5 md:py-4">
          {item.answer}
        </div>
      )}
    </div>
  );
}
