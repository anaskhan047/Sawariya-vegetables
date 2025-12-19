import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import NavbarFooterWrapper from "./layout/NavFooterWrapper";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import CartFloatingButton from "./components/CartFloatingButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* =========================
   SITE CONSTANTS
========================= */

const SITE_URL = "https://www.shrisawariyamart.com";
const SITE_NAME = "Shri Sawariya Mart";
const DESCRIPTION =
  "Shri Sawariya Mart is Indore’s trusted online vegetables and fruits store. Fresh produce, same-day delivery, affordable prices.";

const KEYWORDS = [
  "shri sawariya mart",
  "sawariya mart indore",
  "vegetable mart indore",
  "fruit mart indore",
  "online vegetable mart",
  "online fruit mart",
  "local vegetable mart",
  "local fruit shop indore",
  "sabji mandi online indore",
  "fal mandi online indore",

  "fresh vegetables",
  "organic vegetables",
  "green vegetables",
  "daily vegetables",
  "seasonal vegetables",
  "leafy vegetables",
  "root vegetables",
  "exotic vegetables",
  "local vegetables",
  "farm fresh vegetables",

  "fresh fruits",
  "organic fruits",
  "seasonal fruits",
  "imported fruits",
  "local fruits",
  "fresh cut fruits",
  "healthy fruits",
  "daily fruits",
  "farm fresh fruits",
  "natural fruits",

  "vegetables in indore",
  "fresh vegetables indore",
  "organic vegetables indore",
  "green vegetables indore",
  "local vegetables indore",
  "sabji indore",
  "sabji delivery indore",
  "sabji online indore",
  "sabji shop indore",
  "sabji mart indore",

  "fruits in indore",
  "fresh fruits indore",
  "organic fruits indore",
  "fruit delivery indore",
  "online fruits indore",
  "fruit shop indore",
  "fruit mart indore",
  "seasonal fruits indore",
  "healthy fruits indore",

  "vegetable delivery indore",
  "online vegetable delivery indore",
  "same day vegetable delivery indore",
  "fresh vegetable delivery indore",
  "fruit delivery indore",
  "online fruit delivery indore",
  "same day fruit delivery indore",
  "home delivery vegetables indore",
  "home delivery fruits indore",
  "grocery delivery indore",

  "buy vegetables online",
  "buy fruits online",
  "order vegetables online",
  "order fruits online",
  "vegetable shopping online",
  "fruit shopping online",
  "online grocery shopping",
  "online sabji order",
  "online fal order",
  "online vegetable store",

  "spinach indore",
  "palak indore",
  "methi indore",
  "dhaniya indore",
  "lettuce indore",
  "cabbage indore",
  "broccoli indore",
  "leafy vegetables indore",

  "potato indore",
  "onion indore",
  "tomato indore",
  "ginger indore",
  "garlic indore",
  "carrot indore",
  "beetroot indore",
  "radish indore",
  "sweet potato indore",

  "cauliflower indore",
  "capsicum indore",
  "brinjal indore",
  "lady finger indore",
  "cucumber indore",
  "bottle gourd indore",
  "ridge gourd indore",
  "pumpkin indore",
  "beans indore",
  "peas indore",

  "apple indore",
  "banana indore",
  "mango indore",
  "orange indore",
  "grapes indore",
  "papaya indore",
  "pineapple indore",
  "watermelon indore",
  "muskmelon indore",
  "pomegranate indore",

  "healthy vegetables indore",
  "healthy fruits indore",
  "organic food indore",
  "chemical free vegetables",
  "naturally grown vegetables",
  "farm vegetables indore",
  "fresh farm produce indore",
  "organic fruit shop indore",
  "organic vegetable shop indore",

  "daily vegetables indore",
  "daily fruits indore",
  "kitchen vegetables indore",
  "home grocery indore",
  "family grocery delivery indore",
  "daily sabji delivery indore",
  "fresh food indore",
  "household grocery indore",

  "best vegetable shop indore",
  "best fruit shop indore",
  "trusted vegetable mart indore",
  "local vegetable seller indore",
  "nearby vegetable shop indore",
  "nearby fruit shop indore",
  "best grocery indore",
  "cheap vegetables indore",
  "affordable fruits indore",
  "quality vegetables indore"
];

/* =========================
   METADATA (Next.js)
========================= */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shri Sawariya Mart | Fresh Vegetables & Fruits in Indore",
    template: "%s | Shri Sawariya Mart",
  },
  description: DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Shri Sawariya Mart – Fresh Vegetables Delivered in Indore",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Fresh vegetables and fruits in Indore",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-IN": SITE_URL,
    },
  },
};

/* =========================
   JSON-LD STRUCTURED DATA
========================= */

const jsonLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: SITE_NAME,
      alternateName: "SSM",
      url: SITE_URL,
      logo: `${SITE_URL}/logo/logo.png`,
      sameAs: [
        "https://www.facebook.com/yourpage",
        "https://www.instagram.com/yourpage",
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}#localbusiness`,
      name: SITE_NAME,
      url: SITE_URL,
      image: `${SITE_URL}/logo/logo.png`,
      telephone: "+91-9301893055",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Indore",
        addressRegion: "Madhya Pradesh",
        addressCountry: "IN",
      },
      areaServed: {
        "@type": "City",
        name: "Indore",
      },
      priceRange: "₹₹",
      openingHours: "Mo-Su 07:00-21:00",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/shop?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${SITE_URL}#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
        { "@type": "ListItem", position: 3, name: "Vegetables", item: `${SITE_URL}/vegetables` },
        { "@type": "ListItem", position: 4, name: "Fruits", item: `${SITE_URL}/fruit` },
        { "@type": "ListItem", position: 5, name: "Contact", item: `${SITE_URL}/contact` },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Do you deliver vegetables only in Indore?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Shri Sawariya Mart delivers vegetables and fruits only within Indore city.",
          },
        },
        {
          "@type": "Question",
          name: "Are vegetables fresh?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "All vegetables and fruits are sourced fresh daily and delivered the same day.",
          },
        },
        {
          "@type": "Question",
          name: "Can I order fruits online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, fruits and vegetables both are available for online ordering.",
          },
        },
      ],
    },
    {
      "@type": "HowTo",
      "@id": `${SITE_URL}#howto`,
      name: "How to order vegetables online in Indore",
      step: [
        { "@type": "HowToStep", name: "Browse", text: "Browse vegetables and fruits." },
        { "@type": "HowToStep", name: "Add to cart", text: "Add selected items to cart." },
        { "@type": "HowToStep", name: "Checkout", text: "Enter delivery details and place order." },
        { "@type": "HowToStep", name: "Delivery", text: "Get fresh delivery at your doorstep." },
      ],
    },
  ],
};

/* =========================
   ROOT LAYOUT
========================= */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA – unchanged */}
        <meta name="theme-color" content="#10B981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />

        <link rel="icon" href="/logo/logo.png" />
        <link rel="apple-touch-icon" href="/logo/logo.png" />

        <link rel="canonical" href={SITE_URL} />
        <link rel="alternate" hrefLang="en-IN" href={SITE_URL} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLD) }}
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <CartProvider>
            <NavbarFooterWrapper>
              {children}
              <CartFloatingButton />
            </NavbarFooterWrapper>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
