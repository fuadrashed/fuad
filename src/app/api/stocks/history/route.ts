import { NextResponse } from "next/server";
import { getStockHistory } from "@/lib/finance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const interval = searchParams.get("interval") || "1d";
  const limit = parseInt(searchParams.get("limit") || "90");

  if (!symbol) {
    return NextResponse.json({ error: "الرمز مطلوب" }, { status: 400 });
  }

  try {
    const history = await getStockHistory(symbol, interval, limit);
    return NextResponse.json({ symbol, history, interval });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "فشل في جلب البيانات التاريخية" }, { status: 500 });
  }
}
