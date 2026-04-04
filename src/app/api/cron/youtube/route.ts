import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: Implement YouTube data collection pipeline
    // 1. Fetch new videos from EO channel via YouTube Data API
    // 2. Parse titles with Claude API (structured output)
    // 3. Upsert people/companies/appearances in Supabase
    // 4. Update stats_cache

    return NextResponse.json({
      success: true,
      message: "YouTube cron executed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("YouTube cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
