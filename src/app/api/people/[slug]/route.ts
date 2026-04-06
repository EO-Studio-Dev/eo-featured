import { NextRequest, NextResponse } from "next/server";
import { getPersonBySlug } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const person = await getPersonBySlug(slug);
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }
    return NextResponse.json({ person });
  } catch (error) {
    console.error("Person API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
