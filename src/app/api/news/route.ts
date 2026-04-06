import { NextRequest, NextResponse } from "next/server";
import { getRecentNews } from "@/lib/queries";
import type { NewsCategory } from "@/types/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as NewsCategory | null;
  const limit = Number(searchParams.get("limit")) || 12;
  const offset = Number(searchParams.get("offset")) || 0;

  try {
    const news = await getRecentNews({
      category: category || undefined,
      limit,
      offset,
    });
    return NextResponse.json({ news });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
