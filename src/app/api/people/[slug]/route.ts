import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // TODO: Replace with actual Supabase query
    // const person = await getPersonBySlug(slug);

    return NextResponse.json({
      person: null,
      slug,
    });
  } catch (error) {
    console.error("Person API error:", error);
    return NextResponse.json(
      { error: "Person not found" },
      { status: 404 }
    );
  }
}
