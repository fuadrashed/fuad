const EODHD_API_KEY = "69dbe6f92f0a64.72326163";
const EODHD_BASE = "https://eodhd.com/api";

interface QuoteData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  averageDailyVolume3Month: number;
  averageDailyVolume10Day: number;
  marketCap: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  shortName: string;
  longName?: string;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  [key: string]: unknown;
}

interface HistoryCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const STOCK_UNIVERSE = [
  "AAPL","MSFT","GOOG","AMZN","NVDA","META","TSLA","JPM","V",
  "MA","HD","UNH","PG","JNJ","XOM","AVGO","LLY","CVX","MRK",
  "ABBV","PEP","KO","COST","ADBE","CRM","CSCO","ACN","AMD",
  "NFLX","CMCSA","INTC","ABT","COP","MCD","NKE","TXN","WMT","WFC",
  "QCOM","BMY","HON","NEE","AMGN","LOW","UPS","PM","BA",
  "DE","RTX","IBM","CAT","TJX","UNP","CVS",
  "GILD","MDLZ","ADP","ISRG","SYK","MO","LRCX","VRTX",
  "BSX","PLD","REGN","MU","ZTS","CL","DUK","SO",
  "BDX","CME","USB","SHW","ITW","APD","PGR",
  "ABEV","BBD","ITUB","NOK","MFG","LYG","PFE","VZ",
  "T","SIRI","AAL","BAC","WBA","C","NCLH","PLTR","SNAP",
  "UWMC","F","GM","RIVN","LCID","NIO","MARA","SLB","PARA","WBD",
  "DIS","UBER","LYFT","SQ","RBLX","CRWD","AI",
  "SOFI","HOOD","AFRM","UPST","LC","BMBL",
  "XPEV","LI","CCJ","GOLD","HBM","HL","HMY","KGC","MOS","NEM",
  "SAN","SVM","TECK","TEVA","WPM","X","ZIM","AG","AEM","CLF",
  "EMR","GGB","GFI","HES","HUM","MRO","MT","NUE","SLB",
  "STAG","TRGP","TX","UMC","VALE","VICI","VST","WLK",
  "ASTS","BTG","CEG","CVNA","DK","ENVX","EVGO","EXC",
  "FTNT","GRAB","HIMS","INMD","IRDM","JMIA","KDP","MNST","MRNA",
  "ON","PINS","PYPL","RIG","SBLK","SE","SMCI","SOFI",
  "TAL","TCOM","TLRY","TTD","TWLO","VNT","WDC","ZETA",
];

interface TickerData {
  symbol: string;
  name: string;
  lastsale: string;
  netchange: string;
  pctchange: string;
  marketCap: string;
}

export async function getAllTickers(_page = 1, _type = "STOCKS"): Promise<TickerData[]> {
  return [];
}

export async function getBatchQuotes(tickers: string[]): Promise<Record<string, QuoteData>> {
  if (tickers.length === 0) return {};
  const result: Record<string, QuoteData> = {};

  // EODHD real-time bulk endpoint supports multiple symbols
  const batchSize = 50;
  const batches: string[][] = [];
  for (let i = 0; i < tickers.length; i += batchSize) {
    batches.push(tickers.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    try {
      const symbols = batch.map(s => `${s}.US`).join(",");
      const url = `${EODHD_BASE}/real-time/${batch[0]}.US?api_token=${EODHD_API_KEY}&fmt=json&s=${symbols}`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) {
        console.warn("EODHD quote error:", res.status, await res.text());
        continue;
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [data];

      for (const q of arr) {
        if (!q || !q.code) continue;
        const sym = q.code.replace(".US", "");
        const price = parseFloat(q.close) || parseFloat(q.previousClose) || 0;
        const prevClose = parseFloat(q.previousClose) || price;
        const change = price - prevClose;
        const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

        result[sym] = {
          symbol: sym,
          regularMarketPrice: price,
          regularMarketChange: change,
          regularMarketChangePercent: changePct,
          regularMarketVolume: parseInt(q.volume) || 0,
          averageDailyVolume3Month: parseInt(q.volume) || 1,
          averageDailyVolume10Day: parseInt(q.volume) || 1,
          marketCap: parseFloat(q.marketCapitalization) || 0,
          fiftyTwoWeekLow: parseFloat(q["52WeekLow"]) || 0,
          fiftyTwoWeekHigh: parseFloat(q["52WeekHigh"]) || 0,
          shortName: sym,
          longName: sym,
          fiftyDayAverage: parseFloat(q.fifty_ma || q["50ma"]) || 0,
          twoHundredDayAverage: parseFloat(q.two_hundred_ma || q["200ma"]) || 0,
        };
      }
    } catch (err) {
      console.warn("Batch quote error:", err);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  return result;
}

export async function getStockHistory(
  symbol: string,
  _interval = "1d",
  limit = 60
): Promise<HistoryCandle[]> {
  try {
    const from = new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const url = `${EODHD_BASE}/eod/${symbol}.US?api_token=${EODHD_API_KEY}&fmt=json&from=${from}&period=d`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((c: { date: string; open: number; high: number; low: number; close: number; volume: number }) => ({
      date: c.date,
      open: c.open ?? 0,
      high: c.high ?? 0,
      low: c.low ?? 0,
      close: c.close ?? 0,
      volume: c.volume ?? 0,
    }));
  } catch (err) {
    console.warn(`History error for ${symbol}:`, err);
    return [];
  }
}

export function filterStocks(
  tickers: TickerData[],
  maxPrice: number = 50,
  minMarketCap: number = 500_000_000,
  minPrice: number = 0.10
): TickerData[] {
  return tickers.filter((t) => {
    if (t.symbol.includes("^")) return false;
    if (t.symbol.includes(".W")) return false;
    const price = parseFloat(t.lastsale.replace(/[$,]/g, "")) || 0;
    if (price < minPrice || price > maxPrice) return false;
    const mcap = parseFloat((t.marketCap || "0").replace(/[$,]/g, "")) || 0;
    return mcap >= minMarketCap;
  });
}

export function filterUniverse(
  quotes: Record<string, QuoteData>,
  maxPrice: number = 10,
  minMarketCap: number = 500_000_000,
  minPrice: number = 0.10
): QuoteData[] {
  return Object.values(quotes).filter((q) => {
    const price = q.regularMarketPrice || 0;
    const mcap = q.marketCap || 0;
    return price >= minPrice && price <= maxPrice && mcap >= minMarketCap;
  });
}

export { STOCK_UNIVERSE };

export interface StockAnalysis {
  symbol: string; name: string; price: number; change: number; changePercent: number;
  marketCap: number; rsi: number; sma20: number; sma50: number; sma200: number;
  ema12: number; ema26: number; macdLine: number; macdSignal: number; macdHistogram: number;
  bollingerUpper: number; bollingerLower: number; bollingerMiddle: number; atr: number;
  volume: number; avgVolume: number; volumeRatio: number;
  high52w: number; low52w: number; percentFromLow: number; percentFromHigh: number;
  nearSupport: boolean; nearResistance: boolean; consolidating: boolean; breakoutUp: boolean;
  oversold: boolean; overbought: boolean; goldenCross: boolean; deathCross: boolean;
  macdBullish: boolean; bollingerSqueeze: boolean;
  buyRangeLow: number; buyRangeHigh: number; target1: number; target2: number; target3: number;
  stopLoss: number; riskRewardRatio: number; expectedReturn: number; holdingPeriod: string;
  score: number; rating: string; signals: string[];
}

function calcSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const s = data.slice(-period);
  return s.reduce((a, b) => a + b, 0) / period;
}

function calcEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) { ema = data[i] * k + ema * (1 - k); }
  return ema;
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) { avgGain = (avgGain * (period - 1) + diff) / period; avgLoss = (avgLoss * (period - 1)) / period; }
    else { avgGain = (avgGain * (period - 1)) / period; avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period; }
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calcMACD(closes: number[]) {
  if (closes.length < 26) return { line: 0, signal: 0, histogram: 0 };
  const line = calcEMA(closes, 12) - calcEMA(closes, 26);
  const vals: number[] = [];
  for (let i = 26; i <= closes.length; i++) {
    vals.push(calcEMA(closes.slice(0, i), 12) - calcEMA(closes.slice(0, i), 26));
  }
  const signal = vals.length >= 9 ? calcEMA(vals, 9) : line;
  return { line, signal, histogram: line - signal };
}

function calcBollinger(closes: number[], period = 20) {
  if (closes.length < period) { const p = closes[closes.length - 1] || 0; return { upper: p * 1.02, middle: p, lower: p * 0.98 }; }
  const s = closes.slice(-period);
  const mid = s.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(s.reduce((sum, val) => sum + Math.pow(val - mid, 2), 0) / period);
  return { upper: mid + 2 * std, lower: mid - 2 * std, middle: mid };
}

function calcATR(candles: HistoryCandle[], period = 14): number {
  if (candles.length < period + 1) return 0;
  let sum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const c = candles[i]; const prev = candles[i - 1] ? candles[i - 1].close : c.open;
    sum += Math.max(c.high - c.low, Math.abs(c.high - prev), Math.abs(c.low - prev));
  }
  return sum / period;
}

export function analyzeStock(quote: QuoteData, history: HistoryCandle[]): StockAnalysis {
  const price = quote.regularMarketPrice || 0;
  const change = quote.regularMarketChange || 0;
  const changePercent = quote.regularMarketChangePercent || 0;
  const volume = quote.regularMarketVolume || 0;
  const avgVolume = quote.averageDailyVolume3Month || 1;
  const volumeRatio = volume / avgVolume;
  const closes = history.map((c) => c.close);

  const rsi = calcRSI(closes);
  const sma20 = calcSMA(closes, 20);
  const sma50 = quote.fiftyDayAverage || calcSMA(closes, 50);
  const sma200 = quote.twoHundredDayAverage || calcSMA(closes, 200);
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macd = calcMACD(closes);
  const bb = calcBollinger(closes);
  const atr = calcATR(history);

  const high52w = quote.fiftyTwoWeekHigh || 0;
  const low52w = quote.fiftyTwoWeekLow || 0;
  const range52 = high52w - low52w;
  const pctFromLow = range52 > 0 ? ((price - low52w) / range52) * 100 : 50;
  const pctFromHigh = range52 > 0 ? ((high52w - price) / range52) * 100 : 50;

  const nearSupport = price <= bb.lower * 1.02 || (sma200 > 0 && price <= sma200 * 1.03);
  const nearResistance = price >= bb.upper * 0.98 || (high52w > 0 && price >= high52w * 0.95);
  const consolidating = closes.length >= 20 && (bb.upper - bb.lower) / price < 0.06 && rsi > 35 && rsi < 65;
  const breakoutUp = volumeRatio > 1.5 && changePercent > 2 && price > bb.upper;
  const oversold = rsi < 30;
  const overbought = rsi > 70;
  const goldenCross = sma50 > 0 && sma200 > 0 && sma50 > sma200;
  const deathCross = sma50 > 0 && sma200 > 0 && sma50 < sma200;
  const macdBullish = macd.histogram > 0 && macd.line > macd.signal;
  const bollingerSqueeze = closes.length >= 20 && (bb.upper - bb.lower) / price < 0.04;

  const supportLevel = Math.max(low52w, bb.lower, sma200 > 0 ? sma200 : 0);
  const resistanceLevel = Math.min(high52w, bb.upper);
  const buyRangeLow = Math.max(0.01, Math.round((supportLevel * 0.98) * 100) / 100);
  const buyRangeHigh = Math.max(buyRangeLow + 0.01, Math.round((bb.middle * 0.99) * 100) / 100);
  const riskDist = price - buyRangeLow;
  const stopLoss = Math.max(0.01, Math.round((buyRangeLow - riskDist * 0.3) * 100) / 100);
  const target1 = Math.round((price + riskDist * 2) * 100) / 100;
  const target2 = Math.round((price + riskDist * 3) * 100) / 100;
  const target3 = Math.round(resistanceLevel * 100) / 100;
  const riskRewardRatio = riskDist > 0 ? (target1 - price) / riskDist : 0;
  const expectedReturn = price > 0 ? ((target1 - price) / price) * 100 : 0;

  let holdingPeriod = "3-5 أيام";
  if (expectedReturn > 30) holdingPeriod = "2-4 أسابيع";
  else if (expectedReturn > 15) holdingPeriod = "1-3 أسابيع";
  else if (expectedReturn > 8) holdingPeriod = "1-2 أسبوع";

  let score = 0;
  const signals: string[] = [];

  if (rsi < 30) { score += 20; signals.push("RSI تشبع بيعي"); }
  else if (rsi < 40) { score += 18; signals.push("RSI منخفض"); }
  else if (rsi < 50) { score += 14; signals.push("RSI محايد"); }
  else if (rsi < 60) { score += 10; }
  else if (rsi < 70) { score += 5; }
  else if (rsi > 75) { score -= 5; signals.push("RSI تشبع شرائي"); }

  if (volumeRatio > 3) { score += 18; signals.push("حجم تداول مرتفع جداً"); }
  else if (volumeRatio > 2) { score += 14; signals.push("ارتفاع ملحوظ في الحجم"); }
  else if (volumeRatio > 1.5) { score += 10; signals.push("حجم أعلى من المتوسط"); }
  else if (volumeRatio > 1.0) { score += 5; }

  if (goldenCross) { score += 15; signals.push("تقاطع ذهبي SMA50/200"); }
  else if (sma50 > sma200) { score += 10; signals.push("اتجاه صاعد"); }
  else if (deathCross) { score -= 10; signals.push("تقاطع الموت SMA50/200"); }

  if (price > sma20) { score += 10; } else if (price > sma50) { score += 5; }

  if (price <= bb.lower) { score += 15; signals.push("السعر عند الحد السفلي لبولنجر"); }
  else if (price <= bb.lower * 1.02) { score += 12; signals.push("قرب الحد السفلي لبولنجر"); }
  else if (bollingerSqueeze) { score += 10; signals.push("انضغاط بولنجر"); }

  if (macdBullish) { score += 10; signals.push("MACD إيجابي"); }
  else if (macd.histogram > 0) { score += 5; }

  if (nearSupport && !oversold) { score += 10; signals.push("قرب مستوى دعم قوي"); }
  else if (price < sma200 && sma200 > 0) { score += 5; }

  if (consolidating) { score += 10; signals.push("تذبذب ضيق (جاهز للانطلاق)"); }
  if (breakoutUp) { score += 10; signals.push("كسر مقاومة بحجم مرتفع"); }

  if (changePercent > 3 && volumeRatio > 1.5) { score += 10; signals.push("زخم قوي"); }
  else if (changePercent > 1.5 && volumeRatio > 1.0) { score += 6; signals.push("زخم متوسط"); }
  else if (changePercent > 0.5) { score += 3; }

  if (pctFromHigh > 40) { score += 12; signals.push("خصم كبير من أعلى 52 أسبوع"); }
  else if (pctFromHigh > 25) { score += 9; signals.push("خصم معتدل"); }
  else if (pctFromHigh > 15) { score += 5; }
  else if (pctFromHigh > 5) { score += 2; }

  if (price < 3) { score += 8; signals.push("سعر رخيص جداً (<$3)"); }
  else if (price < 5) { score += 5; signals.push("سعر منخفض (<$5)"); }
  else if (price < 10) { score += 3; }

  let rating = "متابعة";
  if (score >= 70) rating = "ذهبي";
  else if (score >= 55) rating = "واعد";
  else if (score >= 40) rating = "متابعة";
  else if (score >= 25) rating = "محايد";
  else rating = "بيع";

  score = Math.max(0, Math.min(100, score));

  return {
    symbol: quote.symbol,
    name: quote.shortName || quote.longName || quote.symbol,
    price, change, changePercent,
    marketCap: quote.marketCap || 0,
    rsi: Math.round(rsi * 10) / 10,
    sma20: Math.round(sma20 * 100) / 100,
    sma50: Math.round(sma50 * 100) / 100,
    sma200: Math.round(sma200 * 100) / 100,
    ema12: Math.round(ema12 * 100) / 100,
    ema26: Math.round(ema26 * 100) / 100,
    macdLine: Math.round(macd.line * 1000) / 1000,
    macdSignal: Math.round(macd.signal * 1000) / 1000,
    macdHistogram: Math.round(macd.histogram * 1000) / 1000,
    bollingerUpper: Math.round(bb.upper * 100) / 100,
    bollingerLower: Math.round(bb.lower * 100) / 100,
    bollingerMiddle: Math.round(bb.middle * 100) / 100,
    atr: Math.round(atr * 100) / 100,
    volume, avgVolume,
    volumeRatio: Math.round(volumeRatio * 100) / 100,
    high52w, low52w,
    percentFromLow: Math.round(pctFromLow * 10) / 10,
    percentFromHigh: Math.round(pctFromHigh * 10) / 10,
    nearSupport, nearResistance, consolidating, breakoutUp,
    oversold, overbought, goldenCross, deathCross, macdBullish, bollingerSqueeze,
    buyRangeLow, buyRangeHigh, target1, target2, target3, stopLoss,
    riskRewardRatio: Math.round(riskRewardRatio * 10) / 10,
    expectedReturn: Math.round(expectedReturn * 10) / 10,
    holdingPeriod, score, rating, signals,
  };
}
