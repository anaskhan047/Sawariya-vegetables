import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    console.log("Body received:", body);

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // MyMemory API URL
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|hi`
    );

    const data = await res.json();
    console.log("API response:", data);

    const translatedText = data?.responseData?.translatedText || "";

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Server crash reason:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
