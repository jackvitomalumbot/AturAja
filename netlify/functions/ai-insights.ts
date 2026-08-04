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
    const { transactions } = JSON.parse(event.body || '{}');

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'No transactions provided' }),
      };
    }

    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.0-flash' },
      { apiVersion: 'v1' }
    );

    // Build compact summary to reduce token usage
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const todayTx = transactions.filter((t: { date: string }) => t.date === todayStr);
    const weekTx = transactions.filter((t: { date: string }) => t.date >= weekAgo);
    const monthTx = transactions.filter((t: { date: string }) => t.date.startsWith(monthStr));

    const toRp = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
    const sumAmount = (arr: { amount: number }[]) => arr.reduce((s, t) => s + t.amount, 0);

    const prompt = `
      Kamu adalah AI financial advisor yang membantu pengguna aplikasi pencatat pengeluaran bernama AturAja.
      Analisis data transaksi berikut dan berikan insight dalam Bahasa Indonesia yang ramah dan informatif.

      Data ringkasan:
      - Hari ini (${todayStr}): ${todayTx.length} transaksi, total ${toRp(sumAmount(todayTx))}
      - 7 hari terakhir: ${weekTx.length} transaksi, total ${toRp(sumAmount(weekTx))}
      - Bulan ini: ${monthTx.length} transaksi, total ${toRp(sumAmount(monthTx))}

      Detail transaksi (maks 50 terbaru):
      ${JSON.stringify(transactions.slice(0, 50).map((t: { date: string; merchant: string; amount: number; category: string }) => ({
        date: t.date, merchant: t.merchant, amount: t.amount, category: t.category
      })))}

      Kembalikan HANYA JSON valid — mulai langsung dengan { tanpa teks apapun sebelumnya — dengan struktur:
      {
        "dailySummary": {
          "totalTransactions": number,
          "totalAmount": number,
          "topCategory": string,
          "topMerchant": string
        },
        "weeklySummary": {
          "totalTransactions": number,
          "totalAmount": number,
          "averageDaily": number,
          "topCategory": string,
          "topCategoryPercentage": number
        },
        "monthlySummary": {
          "totalTransactions": number,
          "totalAmount": number,
          "highestExpenseWeek": string,
          "topCategory": string
        },
        "analysis": "string (2-3 kalimat ringkasan pola pengeluaran dalam Bahasa Indonesia, ramah dan positif)",
        "recommendations": ["string", "string", "string"],
        "estimatedMonthlyExpense": number
      }
    `;

    const result = await model.generateContent(prompt);
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
    console.error('Error generating insights:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Gagal menghasilkan insight keuangan',
        details: String(error),
      }),
    };
  }
};
