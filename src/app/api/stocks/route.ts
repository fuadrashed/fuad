import { NextResponse } from "next/server";
import { SAUDI_STOCK_UNIVERSE, getBatchQuotes, getStockHistory, analyzeStock, filterUniverse } from "@/lib/finance";

// Cache for 10 minutes
let cachedResponse: { data: unknown; timestamp: number; key: string } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "500");
  const minMarketCap = parseFloat(searchParams.get("minMarketCap") || "100000000");
  const minScore = parseFloat(searchParams.get("minScore") || "20");
  const rating = searchParams.get("rating") || "all";
  const limit = parseInt(searchParams.get("limit") || "80");
  const minPrice = parseFloat(searchParams.get("minPrice") || "1");

  const cacheKey = `${maxPrice}-${minMarketCap}-${minScore}-${rating}-${limit}-${minPrice}`;

  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL && cachedResponse.key === cacheKey) {
    return NextResponse.json(cachedResponse.data);
  }

  try {
    // Step 1: Fetch quotes for all stocks in universe
    const quotes = await getBatchQuotes(SAUDI_STOCK_UNIVERSE);
    const totalScanned = Object.keys(quotes).length;

    // Step 2: Filter by price and market cap
    const qualified = filterUniverse(quotes, maxPrice, minMarketCap, minPrice);

    if (qualified.length === 0) {
      return NextResponse.json({
        stocks: [],
        total: 0,
        scanned: totalScanned,
        message: "لا توجد أسهم تطابق المعايير. حاول تقليل الحد الأدنى للقيمة السوقية أو رفع أقصى سعر.",
      });
    }

    // Step 3: Get history for all qualifying stocks (in parallel batches)
    const symbols = qualified.map(q => q.symbol);
    const historyData: Record<string, { date: string; open: number; high: number; low: number; close: number; volume: number }[]> = {};
    const batchSize = 10;

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (sym) => {
          try {
            const history = await getStockHistory(sym, "1d", 60);
            if (history && history.length > 10) {
              historyData[sym] = history;
            }
          } catch {
            // skip failed history fetches
          }
        })
      );
    }

    // Step 4: Analyze each stock
    const analyses: ReturnType<typeof analyzeStock>[] = [];
    for (const quote of qualified) {
      const history = historyData[quote.symbol] || [];
      if (history.length < 10) continue;

      const analysis = analyzeStock(quote, history);
      analyses.push(analysis);
    }

    // Step 5: Filter by rating and score, then sort
    let filtered = analyses;
    if (rating === "promising") {
      filtered = filtered.filter((a) => a.rating === "واعد" || a.rating === "ذهبي");
    } else if (rating === "golden") {
      filtered = filtered.filter((a) => a.rating === "ذهبي");
    }

    filtered = filtered.filter((a) => a.score >= minScore);
    filtered.sort((a, b) => b.score - a.score);
    filtered = filtered.slice(0, limit);

    const response = {
      stocks: filtered,
      total: filtered.length,
      scanned: totalScanned,
      analyzed: analyses.length,
      timestamp: new Date().toISOString(),
    };

    cachedResponse = { data: response, timestamp: Date.now(), key: cacheKey };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Stock screener error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحليل الأسهم", stocks: [], total: 0 },
      { status: 500 }
    );
  }
}
