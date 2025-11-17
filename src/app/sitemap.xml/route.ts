import { NextResponse } from "next/server";

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://www.shrisawariyamart.com/</loc></url>
    <url><loc>https://www.shrisawariyamart.com/shop</loc></url>
    <url><loc>https://www.shrisawariyamart.com/vegetables</loc></url>
    <url><loc>https://www.shrisawariyamart.com/fruit</loc></url>
    <url><loc>https://www.shrisawariyamart.com/contact</loc></url>
  </urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
