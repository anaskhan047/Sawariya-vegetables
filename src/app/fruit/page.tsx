import type { Metadata } from "next";
import FruitBanner from "../components/fruit/fruitbanner";
import FruitsPage from "../components/fruit/fruitcard";

/* =========================
   SEO CONSTANTS
========================= */

const SITE_URL = "https://www.shrisawariyamart.com";
const PAGE_URL = `${SITE_URL}/fruit`;
const SITE_NAME = "Shri Sawariya Mart";

const TITLE =
  "Fresh Fruits in Indore | Online Fruit Delivery – Shri Sawariya Mart";

const DESCRIPTION =
  "Order fresh and seasonal fruits online in Indore from Shri Sawariya Mart. Farm-fresh quality, organic options, and same-day home delivery.";

const KEYWORDS = [
  "fruits in indore",
  "fresh fruits indore",
  "online fruit delivery indore",
  "organic fruits indore",
  "seasonal fruits indore",
  "fruit shop indore",
  "fruit mart indore",
  "buy fruits online indore",
  "home delivery fruits indore",
  "apple banana mango indore",
  "healthy fruits indore",
  "Shri Sawariya Mart fruits",
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
        url: `${SITE_URL}/og-fruits.png`,
        width: 1200,
        height: 630,
        alt: "Fresh fruits online in Indore",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-fruits.png`],
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
      about: { "@type": "Thing", name: "Fresh Fruits" },
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
          name: "Fruits",
          item: PAGE_URL,
        },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${PAGE_URL}#fruit-list`,
      name: "Fresh Fruits Available in Indore",
      itemListOrder: "http://schema.org/ItemListOrderAscending",
      numberOfItems: 40,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Apple" },
        { "@type": "ListItem", position: 2, name: "Banana" },
        { "@type": "ListItem", position: 3, name: "Mango" },
        { "@type": "ListItem", position: 4, name: "Orange" },
        { "@type": "ListItem", position: 5, name: "Grapes" },
        { "@type": "ListItem", position: 6, name: "Papaya" },
        { "@type": "ListItem", position: 7, name: "Pomegranate" },
        { "@type": "ListItem", position: 8, name: "Watermelon" },
        { "@type": "ListItem", position: 9, name: "Muskmelon" },
        { "@type": "ListItem", position: 10, name: "Pineapple" },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${PAGE_URL}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Do you deliver fruits only in Indore?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Yes, Shri Sawariya Mart delivers fresh fruits only within Indore city.",
          },
        },
        {
          "@type": "Question",
          name: "Are the fruits fresh and seasonal?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Yes, all fruits are sourced fresh daily and include seasonal varieties.",
          },
        },
        {
          "@type": "Question",
          name: "Is same-day fruit delivery available?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Yes, same-day home delivery is available for most areas in Indore.",
          },
        },
      ],
    },
  ],
};

/* =========================
   PAGE
========================= */

export default function Fruit() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLD) }}
      />

      <main>
        <FruitBanner />
        <FruitsPage />
      </main>
    </>
  );
}
