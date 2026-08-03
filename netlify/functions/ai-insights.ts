import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { transactions } = JSON.parse(event.body || '{}');

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No transactions provided' }),
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build compact summary to reduce token usage
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const todayTx = transactions.filter((t: { date: string }) => t.date === todayStr);
    const weekTx = transactions.filter((t: { date: string }) => t.date >= weekAgo);
    const monthTx = transactions.filter((t: { date: string }) => t.date.startsWith(monthStr));

    const prompt = `
      Kamu adalah AI financial advisor yang membantu pengguna aplikasi pencatat pengeluaran bernama AturAja.
      Analisis data transaksi berikut dan berikan insight dalam Bahasa Indonesia yang ramah dan informatif.

      Data ringkasan:
      - Hari ini (${todayStr}): ${todayTx.length} transaksi, total Rp${todayTx.reduce((s: number, t: { amount: number }) => s + t.amount, 0).toLocaleString('id-ID')}
      - 7 hari terakhir: ${weekTx.length} transaksi, total Rp${weekTx.reduce((s: number, t: { amount: number }) => s + t.amount, 0).toLocaleString('id-ID')}
      - Bulan ini: ${monthTx.length} transaksi, total Rp${monthTx.reduce((s: number, t: { amount: number }) => s + t.amount, 0).toLocaleString('id-ID')}

      Detail transaksi (maks 50 terbaru):
      ${JSON.stringify(transactions.slice(0, 50).map((t: { date: string; merchant: string; amount: number; category: string }) => ({
        date: t.date, merchant: t.merchant, amount: t.amount, category: t.category
      })))}

      Kembalikan HANYA JSON valid (tanpa markdown) dengan struktur berikut:
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
        "recommendations": ["string", "string", "string"] (2-4 saran hemat yang spesifik dan actionable dalam Bahasa Indonesia),
        "estimatedMonthlyExpense": number (estimasi total pengeluaran bulan ini berdasarkan tren)
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON — handle markdown code fences
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
    console.error('Error generating insights:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate insights', details: String(error) }),
    };
  }
};
