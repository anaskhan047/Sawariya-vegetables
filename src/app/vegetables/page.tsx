import type { Metadata } from "next";
import VegeBanner from "../components/vegetables/Vegesbanner";
import VegetablePage from "../components/vegetables/vegesGrid";

/* =========================
   SEO CONSTANTS
========================= */

const SITE_URL = "https://www.shrisawariyamart.com";
const PAGE_URL = `${SITE_URL}/vegetables`;
const SITE_NAME = "Shri Sawariya Mart";

const TITLE =
  "Fresh Vegetables in Indore | Online Vegetable Delivery – Shri Sawariya Mart";

const DESCRIPTION =
  "Buy fresh vegetables online in Indore from Shri Sawariya Mart. Seasonal, organic, and farm-fresh vegetables with same-day home delivery.";

const KEYWORDS = [
  "vegetables in indore",
  "fresh vegetables indore",
  "online vegetable delivery indore",
  "organic vegetables indore",
  "seasonal vegetables indore",
  "green vegetables indore",
  "sabji delivery indore",
  "sabji online indore",
  "vegetable shop indore",
  "vegetable mart indore",
  "farm fresh vegetables indore",
  "daily vegetables indore",
  "leafy vegetables indore",
  "root vegetables indore",
  "Shri Sawariya Mart vegetables",
];

/* =========================
   METADATA
========================= */

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-vegetables.png`,
        width: 1200,
        height: 630,
        alt: "Fresh vegetables online in Indore",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-vegetables.png`],
  },
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
};

/* =========================
   JSON-LD STRUCTURED DATA
========================= */

const jsonLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}#website` },
      about: { "@type": "Thing", name: "Fresh Vegetables" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${PAGE_URL}#breadcrumbs`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Vegetables",
          item: PAGE_URL,
        },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${PAGE_URL}#vegetable-list`,
      name: "Fresh Vegetables Available in Indore",
      itemListOrder: "http://schema.org/ItemListOrderAscending",
      numberOfItems: 50,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Potato" },
        { "@type": "ListItem", position: 2, name: "Onion" },
        { "@type": "ListItem", position: 3, name: "Tomato" },
        { "@type": "ListItem", position: 4, name: "Cauliflower" },
        { "@type": "ListItem", position: 5, name: "Cabbage" },
        { "@type": "ListItem", position: 6, name: "Spinach" },
        { "@type": "ListItem", position: 7, name: "Lady Finger" },
        { "@type": "ListItem", position: 8, name: "Brinjal" },
        { "@type": "ListItem", position: 9, name: "Capsicum" },
        { "@type": "ListItem", position: 10, name: "Carrot" },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${PAGE_URL}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Do you deliver vegetables only in Indore?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Yes, Shri Sawariya Mart delivers fresh vegetables only within Indore city.",
          },
        },
        {
          "@type": "Question",
          name: "Are the vegetables fresh and seasonal?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Yes, all vegetables are farm-fresh, seasonal, and sourced daily.",
          },
        },
        {
          "@type": "Question",
          name: "Do you provide same-day vegetable delivery?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Yes, same-day home delivery is available for most locations in Indore.",
          },
        },
      ],
    },
  ],
};

/* =========================
   PAGE
========================= */

export default function Vegetable() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLD) }}
      />

      <main>
        <VegeBanner />
        <VegetablePage />
      </main>
    </>
  );
}
