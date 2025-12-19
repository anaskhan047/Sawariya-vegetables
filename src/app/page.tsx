import React from "react";
import Head from "next/head";

import AboutUs from "./components/landing/About";
import Categories from "./components/landing/Category";
import Grade from "./components/landing/Grade";
import HeroSection from "./components/landing/HeroSection";
import ProductGrid from "./components/landing/ProductGrd";
import Testimonials from "./components/landing/Testimonials";
import WhyChoose from "./components/landing/WhyChoose";

export default function Home() {
  const siteUrl = "https://www.shrisawariyamart.com";
  const siteTitle =
    "Shri Sawariya Mart | Fresh Vegetables & Fruits Online in Indore";
  const siteDescription =
    "Order fresh vegetables and fruits online in Indore from Shri Sawariya Mart. Same-day delivery, affordable prices, farm-fresh quality.";
  const siteKeywords =
    "vegetables in indore, online vegetable delivery indore, fresh fruits indore, sabji delivery indore, grocery delivery indore";

  /* =========================
     STRUCTURED DATA
  ========================== */

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Shri Sawariya Mart",
    url: siteUrl,
    logo: `${siteUrl}/logo/logo.png`,
    sameAs: [
      "https://www.facebook.com/yourpage",
      "https://www.instagram.com/yourpage",
    ],
  };

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}#localbusiness`,
    name: "Shri Sawariya Mart",
    image: `${siteUrl}/logo/logo.png`,
    url: siteUrl,
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
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Shri Sawariya Mart",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
      {
        "@type": "ListItem",
        position: 3,
        name: "Vegetables",
        item: `${siteUrl}/vegetables`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Fruits",
        item: `${siteUrl}/fruit`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Contact",
        item: `${siteUrl}/contact`,
      },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do you deliver vegetables only in Indore?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes, Shri Sawariya Mart currently delivers fresh vegetables and fruits only within Indore city.",
        },
      },
      {
        "@type": "Question",
        name: "Are vegetables fresh and same-day delivered?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes, vegetables and fruits are sourced fresh daily and delivered on the same day.",
        },
      },
      {
        "@type": "Question",
        name: "Can I order fruits online from Shri Sawariya Mart?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes, you can order both fresh vegetables and fruits online through our website.",
        },
      },
    ],
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to order vegetables online in Indore",
    step: [
      {
        "@type": "HowToStep",
        name: "Browse categories",
        text: "Browse vegetables and fruits from available categories.",
      },
      {
        "@type": "HowToStep",
        name: "Add to cart",
        text: "Select required items and add them to cart.",
      },
      {
        "@type": "HowToStep",
        name: "Checkout",
        text: "Enter delivery details and place your order.",
      },
      {
        "@type": "HowToStep",
        name: "Get delivery",
        text: "Receive fresh vegetables at your doorstep in Indore.",
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="keywords" content={siteKeywords} />
        <meta name="author" content="Shri Sawariya Mart" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={siteUrl} />

        {/* OpenGraph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Shri Sawariya Mart" />
        <meta property="og:image" content={`${siteUrl}/og-image.png`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={`${siteUrl}/og-image.png`} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      </Head>

      {/* UI — unchanged */}
      <HeroSection />
      <Categories />
      <AboutUs />
      <Grade />
      <ProductGrid />
      <WhyChoose />
      <Testimonials />
    </>
  );
}
