import { NextResponse } from "next/server";
import { getLines } from "@/lib/data";

interface RouteParams {
  params: Promise<{ system: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { system: systemId } = await params;
    const lines = await getLines(systemId);
    return NextResponse.json({
      data: lines,
      count: lines.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch lines" },
      { status: 404 }
    );
  }
}
