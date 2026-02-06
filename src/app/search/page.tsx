import { getAllSystems, getStations, getLines, getRailcars } from "@/lib/data";
import { SearchResults } from "@/components/search/SearchResults";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: query } = await searchParams;

  // Load all data for search
  const systems = await getAllSystems();

  const allStations = [];
  const allLines = [];
  const allRailcars = [];

  for (const system of systems) {
    try {
      const [stations, lines, railcars] = await Promise.all([
        getStations(system.id),
        getLines(system.id),
        getRailcars(system.id),
      ]);
      allStations.push(...stations);
      allLines.push(...lines);
      allRailcars.push(...railcars);
    } catch {
      // Skip systems with missing data
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-mono font-bold text-text-primary">Search</h1>
        <p className="text-text-secondary">
          Search across all transit systems, stations, lines, and railcars
        </p>
      </div>

      <SearchResults
        query={query || ""}
        systems={systems}
        stations={allStations}
        lines={allLines}
        railcars={allRailcars}
      />
    </div>
  );
}
