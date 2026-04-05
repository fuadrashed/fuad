import { NextResponse } from "next/server";
import { getAllTickers, filterStocks, getBatchQuotes, getStockHistory, analyzeStock } from "@/lib/finance";

// Cache for 10 minutes
let cachedResponse: { data: unknown; timestamp: number; key: string } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "10");
  const minMarketCap = parseFloat(searchParams.get("minMarketCap") || "500000000");
  const minScore = parseFloat(searchParams.get("minScore") || "20");
  const rating = searchParams.get("rating") || "all";
  const limit = parseInt(searchParams.get("limit") || "80");
  const minPrice = parseFloat(searchParams.get("minPrice") || "0.10");

  const cacheKey = `${maxPrice}-${minMarketCap}-${minScore}-${rating}-${limit}-${minPrice}`;

  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL && cachedResponse.key === cacheKey) {
    return NextResponse.json(cachedResponse.data);
  }

  try {
    // Step 1: Scan pages SEQUENTIALLY to find cheap qualifying stocks
    // API returns stocks sorted by market cap (highest first)
    // Cheap stocks ($1-$10) with decent market cap are scattered across pages 1-20+
    const qualifiedStocks: { symbol: string; name: string; lastsale: string; netchange: string; pctchange: string; marketCap: string }[] = [];
    const maxPages = 20;
    const maxQualified = 200;
    const seenSymbols = new Set<string>();
    let totalScanned = 0;

    for (let page = 1; page <= maxPages; page++) {
      if (qualifiedStocks.length >= maxQualified) break;

      try {
        const tickers = await getAllTickers(page, "STOCKS");
        if (!tickers || tickers.length === 0) continue;

        totalScanned += tickers.length;

        const filtered = filterStocks(
          tickers as { symbol: string; name: string; lastsale: string; netchange: string; pctchange: string; marketCap: string }[],
          maxPrice,
          minMarketCap,
          minPrice
        );

        for (const stock of filtered) {
          if (!seenSymbols.has(stock.symbol)) {
            seenSymbols.add(stock.symbol);
            qualifiedStocks.push(stock);
          }
        }
      } catch {
        // Skip failed pages, continue scanning
        console.warn(`Skipping page ${page} due to error`);
      }

      // Small delay between page fetches to avoid rate limiting
      if (page < maxPages && qualifiedStocks.length < maxQualified) {
        await new Promise(r => setTimeout(r, 150));
      }
    }

    if (qualifiedStocks.length === 0) {
      return NextResponse.json({
        stocks: [],
        total: 0,
        scanned: totalScanned,
        message: "لا توجد أسهم تطابق المعايير. حاول تقليل الحد الأدنى للقيمة السوقية أو رفع أقصى سعر.",
      });
    }

    // Step 2: Get batch quotes for all found symbols
    const symbols = qualifiedStocks.map((t) => t.symbol);
    const quotes = await getBatchQuotes(symbols);

    if (Object.keys(quotes).length === 0) {
      return NextResponse.json({
        stocks: [],
        total: 0,
        scanned: totalScanned,
        message: "فشل في جلب البيانات التفصيلية من السوق",
      });
    }

    // Step 3: Get history for all quoted stocks (in parallel batches)
    const quoteEntries = Object.entries(quotes);
    const historyData: Record<string, { date: string; open: number; high: number; low: number; close: number; volume: number }[]> = {};
    const batchSize = 12;

    for (let i = 0; i < quoteEntries.length; i += batchSize) {
      const batch = quoteEntries.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async ([sym]) => {
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

    // Step 4: Analyze each stock with history data
    const analyses: ReturnType<typeof analyzeStock>[] = [];
    for (const [symbol, quote] of quoteEntries) {
      const history = historyData[symbol] || [];
      if (history.length < 10) continue;

      // Re-verify price filter with actual quote price
      const price = quote.regularMarketPrice || 0;
      if (price < minPrice || price > maxPrice) continue;

      const analysis = analyzeStock(quote, history);
      analyses.push(analysis);
    }

    // Step 5: Filter by rating and score, then sort
    let filtered = analyses;
    if (rating === "promising") {
      filtered = filtered.filter((a) => a.rating === "\u0648\u0627\u0639\u062F" || a.rating === "\u0630\u0647\u0628\u064A");
    } else if (rating === "golden") {
      filtered = filtered.filter((a) => a.rating === "\u0630\u0647\u0628\u064A");
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
