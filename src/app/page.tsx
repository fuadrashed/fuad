"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Zap, BarChart3, Activity, Target, ArrowUpDown,
  RefreshCw, Eye, Flame, Shield, Filter,
  Loader2, AlertTriangle, CheckCircle2, Volume2, Search, Star,
  Crosshair, Clock, Percent, AlertCircle, BarChart2, LineChart, DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ComposedChart, Bar, Line, ReferenceLine
} from "recharts";

interface StockAnalysis {
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

function formatNum(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

function formatSAR(n: number): string {
  return n.toFixed(2);
}

function getRatingColor(r: string) {
  if (r === "ذهبي") return "text-amber-700 bg-amber-50 border-amber-200";
  if (r === "واعد") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (r === "متابعة") return "text-blue-700 bg-blue-50 border-blue-200";
  if (r === "محايد") return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function getRatingEmoji(r: string) {
  if (r === "ذهبي") return "\uD83D\uDFE9";
  if (r === "واعد") return "\uD83D\uDFE2";
  if (r === "متابعة") return "\uD83D\uDD35";
  if (r === "محايد") return "\uD83D\uDFE1";
  return "\uD83D\uDD34";
}

function getScoreColor(s: number) {
  if (s >= 70) return "text-amber-600";
  if (s >= 55) return "text-emerald-600";
  if (s >= 40) return "text-blue-600";
  if (s >= 25) return "text-yellow-600";
  return "text-red-500";
}

// Mini chart for stock cards
function MiniChart({ symbol, isPositive }: { symbol: string; isPositive: boolean }) {
  const [data, setData] = useState<Array<{ date: string; close: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/stocks/history?symbol=${symbol}&interval=1d&limit=30`);
        const json = await res.json();
        if (json.history?.length) {
          setData(json.history.map((h: { date: string; close: number }) => ({
            date: new Date(h.date).toLocaleDateString("ar-SA", { day: "numeric", month: "short" }),
            close: h.close,
          })));
        }
      } catch { /* skip */ }
      setLoading(false);
    }
    load();
  }, [symbol]);

  if (loading) return <div className="h-10 flex items-center justify-center"><Loader2 className="h-3 w-3 animate-spin text-slate-400" /></div>;
  if (!data.length) return null;

  const color = isPositive ? "#059669" : "#dc2626";
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data}>
        <defs><linearGradient id={`mg-${symbol}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient></defs>
        <Area type="monotone" dataKey="close" stroke={color} strokeWidth={1.5} fill={`url(#mg-${symbol})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Full chart for detail dialog
function DetailChart({ stock }: { stock: StockAnalysis }) {
  const [data, setData] = useState<Array<{ date: string; close: number; high: number; low: number; volume: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/stocks/history?symbol=${stock.symbol}&interval=1d&limit=60`);
        const json = await res.json();
        if (json.history?.length) {
          setData(json.history.map((h: { date: string; close: number; high: number; low: number; volume: number }) => ({
            date: new Date(h.date).toLocaleDateString("ar-SA", { day: "numeric", month: "short" }),
            close: h.close, high: h.high, low: h.low, volume: h.volume,
          })));
        }
      } catch { /* skip */ }
      setLoading(false);
    }
    load();
  }, [stock.symbol]);

  if (loading) return <div className="h-48 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id={`dg-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stock.change >= 0 ? "#059669" : "#dc2626"} stopOpacity={0.15} />
            <stop offset="100%" stopColor={stock.change >= 0 ? "#059669" : "#dc2626"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis yAxisId="price" tick={{ fill: "#94a3b8", fontSize: 10 }} domain={["auto", "auto"]} />
        <YAxis yAxisId="vol" orientation="left" tick={{ fill: "#94a3b8", fontSize: 10 }} domain={[0, "auto"]} hide />
        <RechartsTooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", color: "#1e293b", fontSize: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)" }} />
        <ReferenceLine yAxisId="price" y={stock.sma50} stroke="#3b82f6" strokeDasharray="5 5" label={{ value: "SMA50", fill: "#3b82f6", fontSize: 9, position: "insideTopLeft" }} />
        <ReferenceLine yAxisId="price" y={stock.sma200} stroke="#8b5cf6" strokeDasharray="5 5" label={{ value: "SMA200", fill: "#8b5cf6", fontSize: 9, position: "insideTopLeft" }} />
        <ReferenceLine yAxisId="price" y={stock.buyRangeLow} stroke="#059669" strokeDasharray="3 3" />
        <ReferenceLine yAxisId="price" y={stock.stopLoss} stroke="#dc2626" strokeDasharray="3 3" label={{ value: "SL", fill: "#dc2626", fontSize: 9 }} />
        <ReferenceLine yAxisId="price" y={stock.target1} stroke="#d97706" strokeDasharray="3 3" label={{ value: "T1", fill: "#d97706", fontSize: 9 }} />
        <Bar yAxisId="vol" dataKey="volume" fill="#94a3b8" opacity={0.2} />
        <Area yAxisId="price" type="monotone" dataKey="close" stroke={stock.change >= 0 ? "#059669" : "#dc2626"} fill={`url(#dg-${stock.symbol})`} strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function SaudiStockScreener() {
  const [data, setData] = useState<{ stocks: StockAnalysis[]; total: number; scanned: number; analyzed: number; timestamp: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StockAnalysis | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "price" | "change" | "return" | "rr">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [maxPrice, setMaxPrice] = useState(500);
  const [minMarketCap, setMinMarketCap] = useState(100_000_000);
  const [minScore, setMinScore] = useState(20);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("golden");

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          maxPrice: maxPrice.toString(),
          minMarketCap: minMarketCap.toString(),
          minScore: minScore.toString(),
          rating: ratingFilter,
          limit: "80",
          minPrice: "1",
        });
        const res = await fetch(`/api/stocks?${params}`);
        const json = await res.json();
        if (!cancelled) {
          if (json.error) setError(json.error);
          else setData(json);
        }
      } catch {
        if (!cancelled) setError("فشل في الاتصال بالخادم");
      }
      if (!cancelled) setLoading(false);
    }

    load();
    intervalId = setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; if (intervalId) clearInterval(intervalId); };
  }, [maxPrice, minMarketCap, minScore, ratingFilter]);

  const handleSort = (f: typeof sortBy) => {
    if (sortBy === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(f); setSortDir("desc"); }
  };

  const sorted = data?.stocks ? [...data.stocks].sort((a, b) => {
    const d = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "score": return (a.score - b.score) * d;
      case "price": return (a.price - b.price) * d;
      case "change": return (a.changePercent - b.changePercent) * d;
      case "return": return (a.expectedReturn - b.expectedReturn) * d;
      case "rr": return (a.riskRewardRatio - b.riskRewardRatio) * d;
      default: return 0;
    }
  }) : [];

  const golden = sorted.filter(s => s.rating === "ذهبي");
  const promising = sorted.filter(s => s.rating === "واعد");
  const watchlist = sorted.filter(s => s.rating === "متابعة");
  const neutral = sorted.filter(s => s.rating === "محايد" || s.rating === "بيع");

  const displayStocks = activeTab === "golden" ? golden : activeTab === "promising" ? promising : activeTab === "watchlist" ? watchlist : neutral;

  const refresh = () => {
    setData(null);
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      maxPrice: maxPrice.toString(),
      minMarketCap: minMarketCap.toString(),
      minScore: minScore.toString(),
      rating: ratingFilter,
      limit: "80",
      minPrice: "1",
    });
    fetch(`/api/stocks?${params}`).then(r => r.json()).then(d => {
      if (d.error) setError(d.error);
      else setData(d);
      setLoading(false);
    }).catch(() => {
      setError("فشل في الاتصال");
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      {/* Subtle background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">فيلتر تداول <span className="text-xs font-normal text-emerald-600 mr-1">PRO</span></h1>
                <p className="text-[10px] text-slate-400">كاشف الأسهم السعودية | تحليل فني احترافي | سوق تداول</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 ml-1" />}
                تحديث
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-4 py-5">
          {/* Stats */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "تم فحصها", value: data.scanned, icon: Search, color: "text-blue-600 bg-blue-50" },
                { label: "تم تحليلها", value: data.analyzed, icon: Activity, color: "text-purple-600 bg-purple-50" },
                { label: "ذهبي + واعد", value: golden.length + promising.length, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
                { label: "إجمالي النتائج", value: data.total, icon: Star, color: "text-amber-600 bg-amber-50" },
              ].map(s => (
                <Card key={s.label} className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                      <p className="text-lg font-bold text-slate-900">{s.value.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filters */}
          <Card className="bg-white border-slate-200 p-4 mb-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">فلاتر متقدمة</span>
              <span className="text-[10px] text-slate-400 mr-auto">تحليل فني احترافي | سوق تداول السعودي</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[11px] text-slate-400"><DollarSign className="h-3 w-3 inline" /> أقصى سعر (ر.س)</label>
                  <span className="text-xs font-bold text-emerald-600">{maxPrice} ر.س</span>
                </div>
                <Slider value={[maxPrice]} onValueChange={([v]) => setMaxPrice(v)} min={10} max={1000} step={10} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[11px] text-slate-400"><BarChart2 className="h-3 w-3 inline" /> أدنى قيمة سوقية</label>
                  <span className="text-xs font-bold text-blue-600">{formatNum(minMarketCap)}</span>
                </div>
                <Select value={minMarketCap.toString()} onValueChange={v => setMinMarketCap(Number(v))}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8 text-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50000000">50M ر.س</SelectItem>
                    <SelectItem value="100000000">100M ر.س</SelectItem>
                    <SelectItem value="500000000">500M ر.س</SelectItem>
                    <SelectItem value="1000000000">1B ر.س</SelectItem>
                    <SelectItem value="5000000000">5B ر.س</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[11px] text-slate-400"><Target className="h-3 w-3 inline" /> أدنى تقييم</label>
                  <span className="text-xs font-bold text-amber-600">{minScore}</span>
                </div>
                <Slider value={[minScore]} onValueChange={([v]) => setMinScore(v)} min={0} max={90} step={5} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400"><Star className="h-3 w-3 inline" /> التصنيف</label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8 text-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="promising">واعد + ذهبي</SelectItem>
                    <SelectItem value="golden">ذهبي فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400"><ArrowUpDown className="h-3 w-3 inline" /> ترتيب</label>
                <Select value={sortBy} onValueChange={v => handleSort(v as typeof sortBy)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-8 text-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">التقييم</SelectItem>
                    <SelectItem value="price">السعر</SelectItem>
                    <SelectItem value="return">العائد المتوقع</SelectItem>
                    <SelectItem value="rr">نسبة المخاطرة/العائد</SelectItem>
                    <SelectItem value="change">التغير اليومي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Error */}
          {error && (
            <Card className="bg-red-50 border-red-200 p-6 text-center mb-5">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 text-sm">{error}</p>
            </Card>
          )}

          {/* Loading */}
          {loading && !data && (
            <div className="flex flex-col items-center py-24">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                <BarChart3 className="h-14 w-14 text-emerald-500" />
              </motion.div>
              <p className="text-slate-500 mt-4 text-sm">جارٍ تحليل سوق تداول السعودي...</p>
              <p className="text-slate-400 mt-1 text-xs">فحص وتحليل الأسهم السعودية بمنهجية احترافية</p>
            </div>
          )}

          {/* Results */}
          {sorted.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-100 border border-slate-200 mb-4 w-full flex h-auto p-1">
                {[
                  { key: "golden", label: "ذهبي", count: golden.length, icon: Flame, color: "text-amber-600" },
                  { key: "promising", label: "واعد", count: promising.length, icon: CheckCircle2, color: "text-emerald-600" },
                  { key: "watchlist", label: "متابعة", count: watchlist.length, icon: Eye, color: "text-blue-600" },
                  { key: "neutral", label: "محايد", count: neutral.length, icon: AlertTriangle, color: "text-yellow-600" },
                ].map(tab => (
                  <TabsTrigger key={tab.key} value={tab.key} className="flex-1 gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500 py-2 rounded-lg transition-all">
                    <tab.icon className={`h-3 w-3 ${tab.color}`} />
                    <span>{tab.label}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-slate-50 border-slate-200 text-slate-500">{tab.count}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {["golden", "promising", "watchlist", "neutral"].map(tabKey => (
                <TabsContent key={tabKey} value={tabKey}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <AnimatePresence>
                      {(tabKey === "golden" ? golden : tabKey === "promising" ? promising : tabKey === "watchlist" ? watchlist : neutral).map((stock, i) => (
                        <motion.div
                          key={stock.symbol}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.03, 0.5) }}
                        >
                          <Card
                            className={`cursor-pointer border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                              stock.rating === "ذهبي" ? "bg-gradient-to-br from-amber-50/80 to-white border-amber-200/60 shadow-amber-100/50 shadow-sm" :
                              stock.rating === "واعد" ? "bg-gradient-to-br from-emerald-50/80 to-white border-emerald-200/60 shadow-emerald-100/50 shadow-sm" :
                              stock.rating === "متابعة" ? "bg-gradient-to-br from-blue-50/80 to-white border-blue-200/60 shadow-blue-100/50 shadow-sm" :
                              "bg-white border-slate-200 shadow-sm"
                            }`}
                            onClick={() => { setSelected(stock); setDialogOpen(true); }}
                          >
                            <CardContent className="p-4">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                    <span className="font-bold text-xs text-emerald-600">{stock.symbol.replace(".SR", "")}</span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-sm text-slate-900">{stock.symbol}</span>
                                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getRatingColor(stock.rating)}`}>
                                        {getRatingEmoji(stock.rating)} {stock.rating}
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] text-slate-400 max-w-[120px] truncate">{stock.name}</p>
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-base text-slate-900">{formatSAR(stock.price)} <span className="text-[10px] font-normal text-slate-400">ر.س</span></p>
                                  <span className={`text-[11px] flex items-center gap-0.5 ${stock.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {stock.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                                  </span>
                                </div>
                              </div>

                              {/* Mini Chart */}
                              <MiniChart symbol={stock.symbol} isPositive={stock.changePercent >= 0} />

                              {/* Trade Setup */}
                              <div className="grid grid-cols-4 gap-1 mt-2 text-[10px]">
                                <div className="bg-emerald-50 rounded p-1 text-center border border-emerald-100">
                                  <p className="text-slate-400">شراء</p>
                                  <p className="font-semibold text-emerald-700">{formatSAR(stock.buyRangeLow)}</p>
                                </div>
                                <div className="bg-amber-50 rounded p-1 text-center border border-amber-100">
                                  <p className="text-slate-400">هدف 1</p>
                                  <p className="font-semibold text-amber-700">{formatSAR(stock.target1)}</p>
                                </div>
                                <div className="bg-red-50 rounded p-1 text-center border border-red-100">
                                  <p className="text-slate-400">وقف خسارة</p>
                                  <p className="font-semibold text-red-600">{formatSAR(stock.stopLoss)}</p>
                                </div>
                                <div className="bg-blue-50 rounded p-1 text-center border border-blue-100">
                                  <p className="text-slate-400">عائد</p>
                                  <p className="font-semibold text-blue-600">{stock.expectedReturn}%</p>
                                </div>
                              </div>

                              {/* Signals */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {stock.signals.slice(0, 3).map(sig => (
                                  <Badge key={sig} variant="outline" className="text-[9px] py-0 px-1.5 bg-slate-50 text-slate-500 border-slate-200">
                                    {sig}
                                  </Badge>
                                ))}
                                {stock.signals.length > 3 && (
                                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-slate-50 text-slate-400 border-slate-200">
                                    +{stock.signals.length - 3}
                                  </Badge>
                                )}
                              </div>

                              {/* Bottom bar */}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                  <span className="flex items-center gap-0.5"><LineChart className="h-3 w-3" /> RSI {stock.rsi}</span>
                                  <span className="flex items-center gap-0.5"><Volume2 className="h-3 w-3" /> {stock.volumeRatio}x</span>
                                </div>
                                <span className={`text-xs font-bold ${getScoreColor(stock.score)}`}>{stock.score}/100</span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {displayStocks.length === 0 && (
                    <div className="text-center py-16">
                      <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">لا توجد أسهم في هذا التصنيف حالياً</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* No results at all */}
          {!loading && data && sorted.length === 0 && !error && (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-500 font-semibold">لا توجد نتائج</h3>
              <p className="text-slate-400 text-sm mt-1">حاول تعديل الفلاتر لتوسيع نطاق البحث</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400">منهجية تحليل فني متقدمة | سوق تداول السعودي</p>
            <p className="text-[9px] text-slate-300 mt-1">⚠️ للأغراض التعليمية فقط | ليس نصيحة استثمارية</p>
          </div>
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 text-slate-900 shadow-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-green-50 border border-emerald-200 flex items-center justify-center">
                    <span className="font-bold text-emerald-700">{selected.symbol.replace(".SR", "")}</span>
                  </div>
                  <div className="text-right flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">{selected.symbol}</span>
                      <Badge className={`text-xs ${getRatingColor(selected.rating)}`}>
                        {getRatingEmoji(selected.rating)} {selected.rating}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-slate-100 border-slate-200 text-slate-600">
                        {selected.score}/100
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{selected.name} | القيمة السوقية: {formatNum(selected.marketCap)} ر.س</p>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 text-right">
                  تحليل فني شامل بنهجية Swing Trading
                </DialogDescription>
              </DialogHeader>

              {/* Chart */}
              <DetailChart stock={selected} />

              {/* Trade Setup */}
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
                    <Crosshair className="h-4 w-4 text-amber-600" />
                    خطة التداول
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    <div className="bg-white border border-emerald-200 rounded-lg p-2.5 text-center shadow-sm">
                      <p className="text-[10px] text-slate-400 mb-0.5">نطاق الشراء</p>
                      <p className="text-sm font-bold text-emerald-700">{formatSAR(selected.buyRangeLow)} - {formatSAR(selected.buyRangeHigh)}</p>
                    </div>
                    <div className="bg-white border border-amber-200 rounded-lg p-2.5 text-center shadow-sm">
                      <p className="text-[10px] text-slate-400 mb-0.5">الأهداف</p>
                      <p className="text-sm font-bold text-amber-700">T1: {formatSAR(selected.target1)}</p>
                      <p className="text-[10px] text-slate-400">T2: {formatSAR(selected.target2)} | T3: {formatSAR(selected.target3)}</p>
                    </div>
                    <div className="bg-white border border-red-200 rounded-lg p-2.5 text-center shadow-sm">
                      <p className="text-[10px] text-slate-400 mb-0.5">وقف الخسارة</p>
                      <p className="text-sm font-bold text-red-600">{formatSAR(selected.stopLoss)} ر.س</p>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-2.5 text-center shadow-sm">
                      <p className="text-[10px] text-slate-400 mb-0.5">العائد المتوقع</p>
                      <p className="text-sm font-bold text-blue-600">+{selected.expectedReturn}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white border border-slate-200 rounded p-1.5">
                      <span className="text-slate-400">المخاطرة/العائد</span>
                      <p className="font-bold text-amber-600">1:{selected.riskRewardRatio}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded p-1.5">
                      <span className="text-slate-400">فترة التداول</span>
                      <p className="font-bold text-slate-900">{selected.holdingPeriod}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded p-1.5">
                      <span className="text-slate-400">الخصم من 52W</span>
                      <p className="font-bold text-purple-600">-{selected.percentFromHigh}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "RSI (14)", value: selected.rsi.toString(), color: selected.oversold ? "text-blue-600" : selected.overbought ? "text-red-600" : "text-emerald-600", sub: selected.oversold ? "تشبع بيعي" : selected.overbought ? "تشبع شرائي" : "محايد" },
                  { label: "SMA 50", value: `${formatSAR(selected.sma50)} ر.س`, color: selected.price > selected.sma50 ? "text-emerald-600" : "text-red-600", sub: selected.price > selected.sma50 ? "فوق" : "تحت" },
                  { label: "SMA 200", value: `${formatSAR(selected.sma200)} ر.س`, color: selected.price > selected.sma200 ? "text-emerald-600" : "text-red-600", sub: selected.goldenCross ? "تقاطع ذهبي ✨" : selected.deathCross ? "تقاطع الموت" : "" },
                  { label: "حجم التداول", value: `${selected.volumeRatio}x`, color: selected.volumeRatio > 1.5 ? "text-amber-600" : "text-slate-600", sub: `متوسط: ${formatNum(selected.avgVolume)}` },
                ].map(ind => (
                  <Card key={ind.label} className="bg-white border-slate-200 shadow-sm">
                    <CardContent className="p-2.5 text-center">
                      <p className="text-[10px] text-slate-400">{ind.label}</p>
                      <p className={`text-sm font-bold ${ind.color}`}>{ind.value}</p>
                      {ind.sub && <p className="text-[9px] text-slate-400">{ind.sub}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bollinger & MACD */}
              <div className="grid grid-cols-2 gap-2">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="p-2.5">
                    <p className="text-[10px] text-slate-400 mb-1">بولنجر باند</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-red-600">علوي: {formatSAR(selected.bollingerUpper)}</span>
                      <span className="text-slate-500">وسط: {formatSAR(selected.bollingerMiddle)}</span>
                      <span className="text-emerald-600">سفلي: {formatSAR(selected.bollingerLower)}</span>
                    </div>
                    {selected.bollingerSqueeze && <Badge className="mt-1 text-[9px] bg-amber-50 text-amber-700 border-amber-200">انضغاط 🔥</Badge>}
                  </CardContent>
                </Card>
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="p-2.5">
                    <p className="text-[10px] text-slate-400 mb-1">MACD</p>
                    <div className="flex justify-between text-xs">
                      <span className={selected.macdLine > 0 ? "text-emerald-600" : "text-red-600"}>خط: {selected.macdLine}</span>
                      <span className="text-slate-500">إشارة: {selected.macdSignal}</span>
                    </div>
                    <Badge className={`mt-1 text-[9px] ${selected.macdBullish ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                      {selected.macdBullish ? "إيجابي" : "سلبي"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* 52W Range */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>{formatSAR(selected.low52w)} ر.س</span>
                    <span>نطاق 52 أسبوع</span>
                    <span>{formatSAR(selected.high52w)} ر.س</span>
                  </div>
                  <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="absolute h-full bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400 rounded-full" style={{ width: `${Math.max(3, selected.percentFromLow)}%` }} />
                    <div className="absolute w-3.5 h-3.5 bg-white rounded-full border-2 border-emerald-500 -top-0.5 shadow-md" style={{ left: `calc(${Math.max(3, selected.percentFromLow)}% - 7px)` }} />
                  </div>
                </CardContent>
              </Card>

              {/* Signals List */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-slate-700">
                    <Activity className="h-3.5 w-3.5 text-amber-600" />
                    المؤشرات الفنية
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.signals.map(sig => (
                      <Badge key={sig} variant="outline" className="text-[10px] py-0.5 px-2 bg-slate-50 text-slate-600 border-slate-200">
                        {sig}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
