import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TODO: Replace with actual Supabase query
    // const stats = await getStats();

    return NextResponse.json({
      people_count: 0,
      company_count: 0,
      total_funding: 0,
      ipo_count: 0,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
