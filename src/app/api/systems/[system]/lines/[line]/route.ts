import { NextResponse } from "next/server";
import { getLine, getStationsByLine } from "@/lib/data";

interface RouteParams {
  params: Promise<{ system: string; line: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { system: systemId, line: lineId } = await params;
    const line = await getLine(systemId, lineId);

    if (!line) {
      return NextResponse.json(
        { error: "Line not found" },
        { status: 404 }
      );
    }

    const stations = await getStationsByLine(systemId, lineId);

    return NextResponse.json({
      data: {
        ...line,
        stations: stations.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch line" },
      { status: 500 }
    );
  }
}
