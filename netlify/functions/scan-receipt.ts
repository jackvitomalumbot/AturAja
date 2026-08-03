import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { imageBase64, mimeType } = JSON.parse(event.body || '{}');

    if (!imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image provided' }) };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Analyze this transaction receipt/screenshot image and extract the following information.
      Return ONLY a valid JSON object (no markdown, no code fences) with exactly these keys:
      - merchant: string (the store/merchant name, e.g. "Indomaret", "GrabFood", "Starbucks")
      - amount: number (total amount paid, in the original currency as a plain number)
      - date: string (format: YYYY-MM-DD, e.g. "2024-11-16")
      - time: string (format: HH:mm in 24h, e.g. "14:30")
      - category: string (pick ONE from this exact list: "Food & Drinks", "Transport", "Shopping", "Bills", "Kesehatan", "Hiburan", "Pendidikan", "Other")
      - confidence: number between 0 and 1 (your overall confidence in the reading accuracy)
      - note: string or null (any additional info like order number, payment method)

      Category selection guide:
      - Food & Drinks: restaurants, cafes, food delivery, groceries, coffee shops
      - Transport: Gojek, Grab ride, taxi, fuel/SPBU, toll, parking, bus, train
      - Shopping: clothing, electronics, marketplace, fashion stores
      - Bills: electricity, water, phone credit, internet, streaming subscriptions
      - Kesehatan: pharmacy, clinic, hospital, medical
      - Hiburan: cinema, games, entertainment, sports
      - Pendidikan: books, courses, school fees, tutoring
      - Other: anything else

      If you cannot read a value clearly, return null for that field.
      The confidence should reflect how clearly readable the receipt is overall.
    `;

    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageData, mimeType: mimeType || 'image/jpeg' } },
    ]);

    const text = result.response.text().trim();

    // Extract JSON — handle markdown code fences if present
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else if (text.startsWith('{')) {
      jsonStr = text;
    }

    const data = JSON.parse(jsonStr);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error scanning receipt:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to process receipt', details: String(error) }),
    };
  }
};
