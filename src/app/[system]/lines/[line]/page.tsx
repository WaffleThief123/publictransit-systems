import { notFound } from "next/navigation";
import Link from "next/link";
import { getSystem, getLine, getStationsByLine, formatDate } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { StationCard } from "@/components/transit/StationCard";
import { LineStats } from "@/components/transit/LineStats";

interface PageProps {
  params: Promise<{ system: string; line: string }>;
}

export default async function LineDetailPage({ params }: PageProps) {
  const { system: systemId, line: lineId } = await params;

  // Decode line ID if it's URL-encoded
  const decodedLineId = decodeURIComponent(lineId);

  try {
    const [system, line, stations] = await Promise.all([
      getSystem(systemId),
      getLine(systemId, decodedLineId),
      getStationsByLine(systemId, decodedLineId),
    ]);

    if (!line) {
      notFound();
    }

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-mono">
          <Link href={`/${systemId}`} className="text-text-muted hover:text-accent-secondary">
            {system.shortName}
          </Link>
          <span className="text-text-muted">/</span>
          <Link href={`/${systemId}/lines`} className="text-text-muted hover:text-accent-secondary">
            Lines
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-text-primary">{line.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-mono font-bold text-xl"
            style={{ backgroundColor: line.colorHex }}
          >
            {line.id.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-mono font-bold text-text-primary">
                {line.name}
              </h1>
              <StatusBadge status={line.status} />
            </div>
            <p className="text-text-secondary">
              {line.termini[0]} ↔ {line.termini[1]}
            </p>
            <p className="text-sm text-text-muted mt-1">
              Opened {formatDate(line.opened)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <LineStats
          length={line.length}
          sourceUnit={system.stats.distanceUnit}
          stationCount={stations.length}
          status={line.status}
          colorHex={line.colorHex}
        />

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary leading-relaxed">{line.description}</p>
          </CardContent>
        </Card>

        {/* Stations on this line */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-mono font-semibold text-text-primary">
              Stations
            </h2>
            <span className="text-sm font-mono text-text-muted">
              {stations.length} stations
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                systemId={systemId}
                compact
              />
            ))}
          </div>
        </section>
      </div>
    );
  } catch {
    notFound();
  }
}
