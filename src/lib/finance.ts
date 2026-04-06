import { default as YahooFinance } from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

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

// Comprehensive list of Saudi Stock Market (Tadawul) tickers
export const SAUDI_STOCK_UNIVERSE = [
  // Major Banks
  "1120.SR","1150.SR","1180.SR","1060.SR","1020.SR","1010.SR","1110.SR","1140.SR",
  "1160.SR","1190.SR","1210.SR","1220.SR","1230.SR","1240.SR","1030.SR","1050.SR",
  "1070.SR","1080.SR","1090.SR","1130.SR",
  // Petrochemicals & Basic Materials
  "2010.SR","2002.SR","2008.SR","2310.SR","2330.SR","2380.SR","2050.SR","2060.SR",
  "2080.SR","2090.SR","2300.SR","2305.SR","2315.SR","2320.SR","2325.SR","2340.SR",
  "2360.SR","2370.SR",
  // Energy
  "2222.SR","2240.SR",
  // Insurance
  "8010.SR","8020.SR","8030.SR","8050.SR","8060.SR","8070.SR","8080.SR","8011.SR",
  "8025.SR","8035.SR","8055.SR","8065.SR","8075.SR","8085.SR","8090.SR","8190.SR",
  // Real Estate
  "4220.SR","4230.SR","4240.SR","4250.SR","4260.SR","4270.SR","4280.SR","4290.SR",
  "4210.SR",
  // Healthcare & Pharma
  "4211.SR",
  // Food & Retail
  "6004.SR","6010.SR","6020.SR","6030.SR","6040.SR","6050.SR","6060.SR","6070.SR",
  "6080.SR",
  // Telecom
  "7010.SR","7020.SR",
  // Transport
  "3020.SR","3030.SR","3040.SR","3050.SR","3060.SR","3070.SR","3080.SR","3090.SR",
  "3010.SR",
  // Utilities & Cement
  "4010.SR","4020.SR","4030.SR","4040.SR","4050.SR",
  // Technology & Services
  "1810.SR","1820.SR","1830.SR","1840.SR","1850.SR","1860.SR",
  // Investment & Financial Services
  "1100.SR","1101.SR","1102.SR","4060.SR","4070.SR","4080.SR","4090.SR",
  "4001.SR","4002.SR","4003.SR","4004.SR",
  // Additional stocks
  "3011.SR","3012.SR","3013.SR","3014.SR","3021.SR","3030.SR","3041.SR",
  "4005.SR","4006.SR","4007.SR","4008.SR","4009.SR","4011.SR","4012.SR",
  "4013.SR","4014.SR","4015.SR",
  "4231.SR","4241.SR","4242.SR","4243.SR","4244.SR","4245.SR",
  "5010.SR","5020.SR","5030.SR","5040.SR","5050.SR","5060.SR","5070.SR",
  "5080.SR","5090.SR","5011.SR","5012.SR",
  "5200.SR","5210.SR","5220.SR","5230.SR","5240.SR","5250.SR","5260.SR",
  "5270.SR","5280.SR","5290.SR",
  "4330.SR","4340.SR","4350.SR","4360.SR","4370.SR","4380.SR","4390.SR",
  "4300.SR","4301.SR","4302.SR","4303.SR","4304.SR","4305.SR",
  "1870.SR","1880.SR","1890.SR",
  "4200.SR","4201.SR","4202.SR","4203.SR","4204.SR","4205.SR","4206.SR",
  "4207.SR","4208.SR","4209.SR","4212.SR","4213.SR","4214.SR","4215.SR",
  "7030.SR","7040.SR","7050.SR","7060.SR","7070.SR","7080.SR","7090.SR",
  "4310.SR","4311.SR","4312.SR","4313.SR","4314.SR","4315.SR","4316.SR",
  "4317.SR","4318.SR","4319.SR",
];

// Remove duplicates while preserving order
const uniqueTickers = [...new Set(SAUDI_STOCK_UNIVERSE)];

export async function getBatchQuotes(tickers: string[]): Promise<Record<string, QuoteData>> {
  if (tickers.length === 0) return {};
  const result: Record<string, QuoteData> = {};

  // Fetch in batches of 20
  const batches: string[][] = [];
  for (let i = 0; i < tickers.length; i += 20) {
    batches.push(tickers.slice(i, i + 20));
  }

  for (const batch of batches) {
    try {
      const quotes = await yf.quote(batch);
      const arr = Array.isArray(quotes) ? quotes : [quotes];
      for (const q of arr) {
        if (q && q.symbol) {
          result[q.symbol] = q as unknown as QuoteData;
        }
      }
    } catch (err) {
      console.warn("Batch quote error:", err);
    }
    // Small delay between batches to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  return result;
}

export async function getStockHistory(
  symbol: string,
  interval = "1d",
  limit = 60
): Promise<HistoryCandle[]> {
  try {
    const result = await yf.chart(symbol, {
      period1: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      interval: "1d" as const,
    });

    if (!result || !result.quotes) return [];

    return result.quotes
      .filter((q: { close?: number }) => q.close != null)
      .map((q: { date: Date | string; open: number; high: number; low: number; close: number; volume: number }) => ({
        date: typeof q.date === "string" ? q.date : (q.date as Date).toISOString().split("T")[0],
        open: q.open || 0,
        high: q.high || 0,
        low: q.low || 0,
        close: q.close || 0,
        volume: q.volume || 0,
      }));
  } catch (err) {
    console.warn(`History error for ${symbol}:`, err);
    return [];
  }
}

export function filterUniverse(
  quotes: Record<string, QuoteData>,
  maxPrice: number = 500,
  minMarketCap: number = 100_000_000,
  minPrice: number = 1
): QuoteData[] {
  return Object.values(quotes).filter((q) => {
    const price = q.regularMarketPrice || 0;
    const mcap = q.marketCap || 0;
    return price >= minPrice && price <= maxPrice && mcap >= minMarketCap;
  });
}

export { uniqueTickers as SAUDI_STOCK_UNIVERSE_DEDUPED };

export interface StockAnalysis {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  rsi: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  bollingerUpper: number;
  bollingerLower: number;
  bollingerMiddle: number;
  atr: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  high52w: number;
  low52w: number;
  percentFromLow: number;
  percentFromHigh: number;
  nearSupport: boolean;
  nearResistance: boolean;
  consolidating: boolean;
  breakoutUp: boolean;
  oversold: boolean;
  overbought: boolean;
  goldenCross: boolean;
  deathCross: boolean;
  macdBullish: boolean;
  bollingerSqueeze: boolean;
  buyRangeLow: number;
  buyRangeHigh: number;
  target1: number;
  target2: number;
  target3: number;
  stopLoss: number;
  riskRewardRatio: number;
  expectedReturn: number;
  holdingPeriod: string;
  score: number;
  rating: string;
  signals: string[];
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
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcMACD(closes: number[]) {
  if (closes.length < 26) return { line: 0, signal: 0, histogram: 0 };
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const line = ema12 - ema26;
  const vals: number[] = [];
  for (let i = 26; i <= closes.length; i++) {
    vals.push(calcEMA(closes.slice(0, i), 12) - calcEMA(closes.slice(0, i), 26));
  }
  const signal = vals.length >= 9 ? calcEMA(vals, 9) : line;
  return { line, signal, histogram: line - signal };
}

function calcBollinger(closes: number[], period = 20) {
  if (closes.length < period) {
    const p = closes[closes.length - 1] || 0;
    return { upper: p * 1.02, middle: p, lower: p * 0.98 };
  }
  const s = closes.slice(-period);
  const mid = s.reduce((a, b) => a + b, 0) / period;
  const v = s.reduce((sum, val) => sum + Math.pow(val - mid, 2), 0) / period;
  const std = Math.sqrt(v);
  return { upper: mid + 2 * std, lower: mid - 2 * std, middle: mid };
}

function calcATR(candles: HistoryCandle[], period = 14): number {
  if (candles.length < period + 1) return 0;
  let sum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1] ? candles[i - 1].close : c.open;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev), Math.abs(c.low - prev));
    sum += tr;
  }
  return sum / period;
}

export function analyzeStock(
  quote: QuoteData,
  history: HistoryCandle[]
): StockAnalysis {
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

  // RSI Scoring
  if (rsi < 30) { score += 20; signals.push("RSI تشبع بيعي"); }
  else if (rsi < 40) { score += 18; signals.push("RSI منخفض"); }
  else if (rsi < 50) { score += 14; signals.push("RSI محايد"); }
  else if (rsi < 60) { score += 10; }
  else if (rsi < 70) { score += 5; }
  else if (rsi > 75) { score -= 5; signals.push("RSI تشبع شرائي"); }

  // Volume Scoring
  if (volumeRatio > 3) { score += 18; signals.push("حجم تداول مرتفع جداً"); }
  else if (volumeRatio > 2) { score += 14; signals.push("ارتفاع ملحوظ في الحجم"); }
  else if (volumeRatio > 1.5) { score += 10; signals.push("حجم أعلى من المتوسط"); }
  else if (volumeRatio > 1.0) { score += 5; }

  // Moving Average Scoring
  if (goldenCross) { score += 15; signals.push("تقاطع ذهبي SMA50/200"); }
  else if (sma50 > sma200) { score += 10; signals.push("اتجاه صاعد"); }
  else if (deathCross) { score -= 10; signals.push("تقاطع الموت SMA50/200"); }

  if (price > sma20) { score += 10; }
  else if (price > sma50) { score += 5; }

  // Bollinger Scoring
  if (price <= bb.lower) { score += 15; signals.push("السعر عند الحد السفلي لبولنجر"); }
  else if (price <= bb.lower * 1.02) { score += 12; signals.push("قرب الحد السفلي لبولنجر"); }
  else if (bollingerSqueeze) { score += 10; signals.push("انضغاط بولنجر"); }

  // MACD Scoring
  if (macdBullish) { score += 10; signals.push("MACD إيجابي"); }
  else if (macd.histogram > 0) { score += 5; }

  // Support/Resistance
  if (nearSupport && !oversold) { score += 10; signals.push("قرب مستوى دعم قوي"); }
  else if (price < sma200 && sma200 > 0) { score += 5; }

  // Pattern Scoring
  if (consolidating) { score += 10; signals.push("تذبذب ضيق (جاهز للانطلاق)"); }
  if (breakoutUp) { score += 10; signals.push("كسر مقاومة بحجم مرتفع"); }

  // Momentum
  if (changePercent > 3 && volumeRatio > 1.5) { score += 10; signals.push("زخم قوي"); }
  else if (changePercent > 1.5 && volumeRatio > 1.0) { score += 6; signals.push("زخم متوسط"); }
  else if (changePercent > 0.5) { score += 3; }

  // 52-week discount
  if (pctFromHigh > 40) { score += 12; signals.push("خصم كبير من أعلى 52 أسبوع"); }
  else if (pctFromHigh > 25) { score += 9; signals.push("خصم معتدل"); }
  else if (pctFromHigh > 15) { score += 5; }
  else if (pctFromHigh > 5) { score += 2; }

  // Rating
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
    holdingPeriod,
    score, rating, signals,
  };
}
