import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  // Handle CORS preflight (penting untuk Android WebView & browser)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'No image provided' }),
      };
    }

    // Cek ukuran payload — Netlify limit 1MB (base64 ~33% lebih besar dari binary)
    const payloadSizeKB = Math.round((imageBase64.length * 3) / 4 / 1024);
    if (payloadSizeKB > 900) {
      return {
        statusCode: 413,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `Gambar terlalu besar (${payloadSizeKB}KB). Maksimal 900KB. Coba kompres gambar dulu.`,
        }),
      };
    }

    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.0-flash' },
      { apiVersion: 'v1' }
    );

    const prompt = `
      Analyze this transaction receipt/screenshot image and extract the following information.
      Return ONLY a valid JSON object (no markdown, no code fences, no extra text before or after) with exactly these keys:
      - merchant: string (the store/merchant name, e.g. "Indomaret", "GrabFood", "Starbucks")
      - amount: number (total amount paid, in the original currency as a plain number, no dots/commas)
      - date: string (format: YYYY-MM-DD, e.g. "2024-11-16")
      - time: string (format: HH:mm in 24h, e.g. "14:30") or null if not visible
      - category: string (pick ONE from this exact list: "Food & Drinks", "Transport", "Shopping", "Bills", "Kesehatan", "Hiburan", "Pendidikan", "Other")
      - confidence: number between 0 and 1 (your overall confidence in the reading accuracy)
      - note: string or null (any additional info like order number, payment method)

      Category selection guide:
      - Food & Drinks: restaurants, cafes, food delivery, groceries, coffee shops, Indomaret, Alfamart
      - Transport: Gojek, Grab ride, taxi, fuel/SPBU, toll, parking, bus, train, KRL, MRT
      - Shopping: clothing, electronics, marketplace, fashion stores, Shopee, Tokopedia
      - Bills: electricity (PLN), water (PDAM), phone credit (pulsa), internet, streaming subscriptions
      - Kesehatan: pharmacy (apotek), clinic, hospital, medical, Halodoc
      - Hiburan: cinema, games, entertainment, sports, Netflix, Spotify
      - Pendidikan: books, courses, school fees, tutoring, Ruangguru
      - Other: anything else

      If you cannot read a value clearly, return null for that field (except category, default to "Other").
      Start your response DIRECTLY with { — no preamble text.
    `;

    // Strip data URL prefix if present
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const resolvedMime = (mimeType || 'image/jpeg') as string;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageData, mimeType: resolvedMime } },
    ]);

    const text = result.response.text().trim();

    // Robust JSON extraction — handle markdown fences AND raw JSON AND text+JSON
    let jsonStr = '';

    // Priority 1: markdown code fence ```json ... ```
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    } else {
      // Priority 2: find first { to last } in response
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = text.slice(firstBrace, lastBrace + 1);
      } else {
        jsonStr = text;
      }
    }

    const data = JSON.parse(jsonStr);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error scanning receipt:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Gagal memproses gambar struk',
        details: String(error),
      }),
    };
  }
};
