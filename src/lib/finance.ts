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

// Predefined universe of popular US stocks (cheap + growth candidates)
const STOCK_UNIVERSE = [
  // Big tech that might be cheap
  "AAPL","MSFT","GOOG","AMZN","NVDA","META","TSLA","BRK-B","JPM","V",
  "MA","HD","UNH","PG","JNJ","XOM","AVGO","LLY","CVX","MRK",
  "ABBV","PEP","KO","COST","TMO","ADBE","CRM","CSCO","ACN","AMD",
  "NFLX","CMCSA","INTC","ABT","COP","MCD","NKE","TXN","WMT","WFC",
  "QCOM","BMY","HON","NEE","AMGN","LOW","UPS","LIN","PM","BA",
  "DE","RTX","SPGI","IBM","CAT","CI","TJX","UNP","BKNG","CVS",
  "GILD","MDLZ","CB","ADP","ISRG","SYK","MO","LRCX","VRTX","EQIX",
  "BSX","PLD","REGN","FIS","MU","ZTS","CL","SNPS","DUK","SO",
  "BDX","CME","BDX","USB","SHW","ITW","APD","EI","ICE","PGR",
  // Cheaper stocks under $10
  "ABEV","BBD","ITUB","NOK","HLN","MFG","LYG","BSBR","PFE","VZ",
  "T","SIRI","INTC","AAL","BAC","WBA","C","NCLH","PLTR","SNAP",
  "UWMC","F","GM","RIVN","LCID","NIO","MARA","SLB","PARA","WBD",
  "KO","DIS","UBER","LYFT","SHOP","SQ","RBLX","CRWD","PATH","AI",
  "SOFI","HOOD","AFRM","RPLA","UPST","LC","OPCH","BMBL","FUBO","VRM",
  "XPEV","LI","BERY","AVD","CCJ","CDE","CMP","CX","EIGO","EU",
  "EXEL","FSTR","GOLD","GTE","HBM","HL","HMY","IGC","IO","JAGGF",
  "KGC","MOS","MUX","NEM","NG","NUGT","NYMT","OG","PAAS","PT",
  "SAN","SBS","SLV","SVM","TAHO","TECK","TGD","TM","TPST","TRQ",
  "USAP","UXIN","VEEV","WPM","X","ZIM","AG","AEM","AMR","ARCH",
  "ATCO","BHP","BKR","CEIX","CHNR","CLF","CWH","DNN","EADSY","EMR",
  "FMS","FMC","FWONK","GGB","GFI","GLO","GRA","GWRE","HES","HLNE",
  "HUM","IR","J","JELD","KOP","LUMN","MRO","MT","NUE","OEC",
  "OSK","PGNY","PVG","RRD","SAND","SBSW","SIX","SJR","SLB","SMFG",
  "STAG","SU","SVM","TEVA","TFC","TK","TRGP","TRMD","TSEM","TX",
  "UMC","UWMC","VAL","VALE","VICI","VST","WDS","WLK","WPM","XOM",
  // More cheap growth stocks
  "ASTS","AUY","BIRK","BITF","BRFS","BTG","CASY","CEG","CHGG","CRBP",
  "CVNA","DK","DNUT","ENVX","EVGO","EXC","FREV","FIX","FTNT","GEHC",
  "GFS","GL","GM","GRAB","GSM","HLNE","HIMS","HNI","IGIC","INMD",
  "INVH","IRDM","JAMF","JMIA","JXN","KDP","KINS","KN","LCII","LECO",
  "MNST","MRNA","MSTR","MUI","NMRD","NRDS","NXST","OCFC","ON","OTEX",
  "PCGS","PINS","PRGS","PRO","PYPL","QRTEA","RCMT","RDVT","RIG","RNW",
  "RVP","RXST","SAVA","SBLK","SCU","SE","SEAS","SITC","SMCI","SNGX",
  "SOFI","SQNS","SSTK","STR","SUN","SUPN","TAL","TCOM","TGI","TLRY",
  "TNET","TR","TRMB","TSE","TTD","TTE","TWLO","TXN","UCBI","UCPT",
  "UHAL","UNTY","UPOW","USAC","USPH","VBTX","VIAV","VIR","VNT",
  "VOXX","VRT","VTRS","WB","WDC","WERN","WH","WIRE","WPC","WW",
  "XCUR","XERS","XM","XPEL","YMM","ZA","ZETA","ZIMV","ZNTL"
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
  // Not used anymore - we use the predefined universe
  return [];
}

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
      const quotes = await yf.quote(batch.map(s => s.replace("-", "-")));
      const arr = Array.isArray(quotes) ? quotes : [quotes];
      for (const q of arr) {
        if (q && q.symbol) {
          result[q.symbol] = q as unknown as QuoteData;
        }
      }
    } catch (err) {
      console.warn("Batch quote error:", err);
    }
    // Small delay between batches
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
    const rangeMap: Record<string, string> = {
      "1d": limit <= 7 ? "5d" : limit <= 30 ? "1mo" : "3mo",
      "1wk": "6mo",
      "1mo": "1y",
    };
    const range = rangeMap[interval] || "3mo";

    const result = await yf.chart(symbol, {
      period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
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

// Filter universe by price using quotes
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

  let holdingPeriod = "3-5 \u0623\u064A\u0627\u0645";
  if (expectedReturn > 30) holdingPeriod = "2-4 \u0623\u0633\u0627\u0628\u064A\u0639";
  else if (expectedReturn > 15) holdingPeriod = "1-3 \u0623\u0633\u0627\u0628\u064A\u0639";
  else if (expectedReturn > 8) holdingPeriod = "1-2 \u0623\u0633\u0628\u0648\u0639";

  let score = 0;
  const signals: string[] = [];

  if (rsi < 30) { score += 20; signals.push("RSI \u062A\u0634\u0628\u0639 \u0628\u064A\u0639\u064A"); }
  else if (rsi < 40) { score += 18; signals.push("RSI \u0645\u0646\u062E\u0641\u0636"); }
  else if (rsi < 50) { score += 14; signals.push("RSI \u0645\u062D\u0627\u064A\u062F"); }
  else if (rsi < 60) { score += 10; }
  else if (rsi < 70) { score += 5; }
  else if (rsi > 75) { score -= 5; signals.push("RSI \u062A\u0634\u0628\u0639 \u0634\u0631\u0627\u0626\u064A"); }

  if (volumeRatio > 3) { score += 18; signals.push("\u062D\u062C\u0645 \u062A\u062F\u0627\u0648\u0644 \u0645\u0631\u062A\u0641\u0639 \u062C\u062F\u0627"); }
  else if (volumeRatio > 2) { score += 14; signals.push("\u0627\u0631\u062A\u0641\u0627\u0639 \u0645\u0644\u062D\u0648\u0638 \u0641\u064A \u0627\u0644\u062D\u062C\u0645"); }
  else if (volumeRatio > 1.5) { score += 10; signals.push("\u062D\u062C\u0645 \u0623\u0639\u0644\u0649 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0633\u0637"); }
  else if (volumeRatio > 1.0) { score += 5; }

  if (goldenCross) { score += 15; signals.push("\u062A\u0642\u0627\u0637\u0639 \u0630\u0647\u0628\u064A SMA50/200"); }
  else if (sma50 > sma200) { score += 10; signals.push("\u0627\u062A\u062C\u0627\u0647 \u0635\u0627\u0639\u062F"); }
  else if (deathCross) { score -= 10; signals.push("\u062A\u0642\u0627\u0637\u0639 \u0627\u0644\u0645\u0648\u062A SMA50/200"); }

  if (price > sma20) { score += 10; }
  else if (price > sma50) { score += 5; }

  if (price <= bb.lower) { score += 15; signals.push("\u0627\u0644\u0633\u0639\u0631 \u0639\u0646\u062F \u0627\u0644\u062D\u062F \u0627\u0644\u0633\u0641\u0644\u064A \u0644\u0628\u0648\u0644\u0646\u062C\u0631"); }
  else if (price <= bb.lower * 1.02) { score += 12; signals.push("\u0642\u0631\u0628 \u0627\u0644\u062D\u062F \u0627\u0644\u0633\u0641\u0644\u064A \u0644\u0628\u0648\u0644\u0646\u062C\u0631"); }
  else if (bollingerSqueeze) { score += 10; signals.push("\u0627\u0646\u0636\u063A\u0627\u0637 \u0628\u0648\u0644\u0646\u062C\u0631"); }

  if (macdBullish) { score += 10; signals.push("MACD \u0625\u064A\u062C\u0627\u0628\u064A"); }
  else if (macd.histogram > 0) { score += 5; }

  if (nearSupport && !oversold) { score += 10; signals.push("\u0642\u0631\u0628 \u0645\u0633\u062A\u0648\u0649 \u062F\u0639\u0645 \u0642\u0648\u064A"); }
  else if (price < sma200 && sma200 > 0) { score += 5; }

  if (consolidating) { score += 10; signals.push("\u062A\u0630\u0628\u0630\u0628 \u0636\u064A\u0642 (\u062C\u0627\u0647\u0632 \u0644\u0644\u0627\u0646\u0637\u0644\u0627\u0642)"); }
  if (breakoutUp) { score += 10; signals.push("\u0643\u0633\u0631 \u0645\u0642\u0627\u0648\u0645\u0629 \u0628\u062D\u062C\u0645 \u0645\u0631\u062A\u0641\u0639"); }

  if (changePercent > 3 && volumeRatio > 1.5) { score += 10; signals.push("\u0632\u062E\u0645 \u0642\u0648\u064A"); }
  else if (changePercent > 1.5 && volumeRatio > 1.0) { score += 6; signals.push("\u0632\u062E\u0645 \u0645\u062A\u0648\u0633\u0637"); }
  else if (changePercent > 0.5) { score += 3; }

  if (pctFromHigh > 40) { score += 12; signals.push("\u062E\u0635\u0645 \u0643\u0628\u064A\u0631 \u0645\u0646 \u0623\u0639\u0644\u0649 52 \u0623\u0633\u0628\u0648\u0639"); }
  else if (pctFromHigh > 25) { score += 9; signals.push("\u062E\u0635\u0645 \u0645\u0639\u062A\u062F\u0644"); }
  else if (pctFromHigh > 15) { score += 5; }
  else if (pctFromHigh > 5) { score += 2; }

  // Cheap stock bonus
  if (price < 3) { score += 8; signals.push("\u0633\u0639\u0631 \u0631\u062E\u064A\u0635 \u062C\u062F\u0627 (<$3)"); }
  else if (price < 5) { score += 5; signals.push("\u0633\u0639\u0631 \u0645\u0646\u062E\u0641\u0636 (<$5)"); }
  else if (price < 10) { score += 3; }

  let rating = "\u0645\u062A\u0627\u0628\u0639\u0629";
  if (score >= 70) rating = "\u0630\u0647\u0628\u064A";
  else if (score >= 55) rating = "\u0648\u0627\u0639\u062F";
  else if (score >= 40) rating = "\u0645\u062A\u0627\u0628\u0639\u0629";
  else if (score >= 25) rating = "\u0645\u062D\u0627\u064A\u062F";
  else rating = "\u0628\u064A\u0639";

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
