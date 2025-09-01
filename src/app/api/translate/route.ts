import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Encode text safely
    const encodedText = encodeURIComponent(text);

    // Call MyMemory API
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|hi`);
    if (!res.ok) {
      return NextResponse.json({ error: "Translation service unavailable" }, { status: res.status });
    }

    const data = await res.json();
    const translatedText = data?.responseData?.translatedText || "";

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
