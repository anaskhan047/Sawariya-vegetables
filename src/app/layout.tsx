// app/layout.tsx  (replace your existing RootLayout implementation)
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

export const metadata: Metadata = {
  title: "Shri Sawariya Mart",
  description: "Fresh and organic vegetables delivered to your doorstep",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Shri Sawariya Mart",
  "alternateName": "SSM",
  "url": "https://www.shrisawariyamart.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.shrisawariyamart.com/logo/logo.png",
    "width": 512,
    "height": 512
  },
  "sameAs": [
    "https://www.facebook.com/yourpage",
    "https://www.instagram.com/yourpage"
  ]
};


const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://www.shrisawariyamart.com",
  name: "Shri Sawariya Mart",
  image: "https://www.shrisawariyamart.com/logo/logo.png",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.shrisawariyamart.com/shop?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};


// basic homepage breadcrumbs (Google only needs canonical important pages)
// you can add page-specific breadcrumbs using the BreadcrumbJsonLd component below
const homepageBreadcrumbs = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.shrisawariyamart.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Shop",
      "item": "https://www.shrisawariyamart.com/shop"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Vegetables",
      "item": "https://www.shrisawariyamart.com/vegetables"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Fruit",
      "item": "https://www.shrisawariyamart.com/fruit"
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA + install support */}
        <meta name="theme-color" content="#10B981" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageBreadcrumbs) }}
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
