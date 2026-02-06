#!/usr/bin/env npx tsx
/**
 * Merge Beijing Subway station data from multiple sources:
 * - bjsubway.com scraper (official Chinese data)
 * - OpenStreetMap (crowd-sourced entrance/elevator coordinates)
 * - Existing stations.json (base data)
 *
 * Usage:
 *   npx tsx scripts/merge-beijing-data.ts
 *
 * Options:
 *   --output, -o      Output file (default: data/systems/beijing-subway/stations.json)
 *   --bjsubway, -b    Path to bjsubway scraped data
 *   --osm, -m         Path to OSM data
 *   --base            Path to base stations.json
 *   --dry-run, -n     Don't write output
 */

import * as fs from "fs";
import * as path from "path";

interface Coordinates {
  lat: number;
  lng: number;
}

interface Entrance {
  id: string;
  name: string;
  coordinates?: Coordinates;
  features?: string[];
  accessibility?: string[];
  ref?: string;
  wheelchair?: boolean;
}

interface Elevator {
  id: string;
  location?: string;
  coordinates?: Coordinates;
  fromFloor?: number;
  toFloor?: number;
  wheelchair?: boolean;
}

interface Station {
  id: string;
  systemId: string;
  name: string;
  localName?: string;
  lines: string[];
  status: string;
  coordinates?: Coordinates;
  features: string[];
  entrances?: Entrance[];
  elevators?: Elevator[];
  escalatorLocations?: string[];
  osmId?: number;
  wikidata?: string;
}

interface StationsFile {
  stations: Station[];
}

function loadJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    console.log(`  File not found: ${filePath}`);
    return null;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as T;
}

function normalizeStationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）\-_]/g, "")
    .replace(/station|站/gi, "");
}

function mergeEntrances(base: Entrance[], overlay: Entrance[]): Entrance[] {
  const byId = new Map<string, Entrance>();

  // Add base entrances
  for (const e of base) {
    byId.set(e.id, { ...e });
  }

  // Merge overlay entrances
  for (const e of overlay) {
    const existing = byId.get(e.id);
    if (existing) {
      // Merge: prefer overlay coordinates if base doesn't have them
      if (!existing.coordinates && e.coordinates) {
        existing.coordinates = e.coordinates;
      }
      // Merge features
      if (e.features) {
        existing.features = [
          ...new Set([...(existing.features || []), ...e.features]),
        ];
      }
    } else {
      byId.set(e.id, { ...e });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function mergeElevators(base: Elevator[], overlay: Elevator[]): Elevator[] {
  const result = [...base];

  for (const e of overlay) {
    // Check if we already have this elevator (by coordinates proximity)
    const exists = result.some((existing) => {
      if (!existing.coordinates || !e.coordinates) return false;
      const dist = Math.sqrt(
        Math.pow(existing.coordinates.lat - e.coordinates.lat, 2) +
        Math.pow(existing.coordinates.lng - e.coordinates.lng, 2)
      );
      return dist < 0.0001; // ~10 meters
    });

    if (!exists) {
      result.push({ ...e });
    }
  }

  return result;
}

function mergeStations(
  base: Station[],
  bjsubway: Station[],
  osm: Station[]
): Station[] {
  // Create lookup maps
  const bjsubwayByName = new Map<string, Station>();
  for (const s of bjsubway) {
    const key = normalizeStationName(s.localName || s.name);
    bjsubwayByName.set(key, s);
  }

  const osmByName = new Map<string, Station>();
  for (const s of osm) {
    const key = normalizeStationName(s.localName || s.name);
    osmByName.set(key, s);
  }

  const merged: Station[] = [];

  for (const station of base) {
    const normalizedName = normalizeStationName(station.localName || station.name);
    const result = { ...station };

    // Merge bjsubway data
    const bjStation = bjsubwayByName.get(normalizedName);
    if (bjStation) {
      // Use bjsubway coordinates if we don't have them or they're more precise
      if (bjStation.coordinates && !result.coordinates) {
        result.coordinates = bjStation.coordinates;
      }

      // Merge entrances
      if (bjStation.entrances) {
        result.entrances = mergeEntrances(
          result.entrances || [],
          bjStation.entrances
        );
      }

      // Merge elevators
      if (bjStation.elevators) {
        result.elevators = mergeElevators(
          result.elevators || [],
          bjStation.elevators
        );
      }

      // Merge escalator locations
      if (bjStation.escalatorLocations) {
        result.escalatorLocations = [
          ...new Set([
            ...(result.escalatorLocations || []),
            ...bjStation.escalatorLocations,
          ]),
        ];
      }

      // Merge features
      result.features = [
        ...new Set([...result.features, ...bjStation.features]),
      ].sort();

      bjsubwayByName.delete(normalizedName);
    }

    // Merge OSM data
    const osmStation = osmByName.get(normalizedName);
    if (osmStation) {
      // Use OSM coordinates as fallback
      if (!result.coordinates && osmStation.coordinates) {
        result.coordinates = osmStation.coordinates;
      }

      // Merge OSM entrances (they have coordinates!)
      if (osmStation.entrances) {
        result.entrances = mergeEntrances(
          result.entrances || [],
          osmStation.entrances
        );
      }

      // Merge OSM elevators
      if (osmStation.elevators) {
        result.elevators = mergeElevators(
          result.elevators || [],
          osmStation.elevators
        );
      }

      // Add OSM metadata
      if (osmStation.osmId) {
        result.osmId = osmStation.osmId;
      }
      if (osmStation.wikidata) {
        result.wikidata = osmStation.wikidata;
      }

      // Merge features
      result.features = [
        ...new Set([...result.features, ...osmStation.features]),
      ].sort();

      osmByName.delete(normalizedName);
    }

    merged.push(result);
  }

  // Add any stations from bjsubway not in base
  console.log(`  New stations from bjsubway: ${bjsubwayByName.size}`);
  for (const station of bjsubwayByName.values()) {
    // Check OSM for additional data
    const osmStation = osmByName.get(
      normalizeStationName(station.localName || station.name)
    );
    if (osmStation) {
      if (osmStation.entrances) {
        station.entrances = mergeEntrances(
          station.entrances || [],
          osmStation.entrances
        );
      }
      if (osmStation.elevators) {
        station.elevators = mergeElevators(
          station.elevators || [],
          osmStation.elevators
        );
      }
      if (osmStation.osmId) station.osmId = osmStation.osmId;
    }
    merged.push(station);
  }

  return merged;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const projectRoot = path.resolve(__dirname, "..");

  const result = {
    output: path.join(projectRoot, "data/systems/beijing-subway/stations.json"),
    bjsubway: path.join(
      projectRoot,
      "data/systems/beijing-subway/stations-scraped.json"
    ),
    osm: path.join(projectRoot, "data/systems/beijing-subway/stations-osm.json"),
    base: path.join(projectRoot, "data/systems/beijing-subway/stations.json"),
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--output" || arg === "-o") {
      result.output = args[++i];
    } else if (arg === "--bjsubway" || arg === "-b") {
      result.bjsubway = args[++i];
    } else if (arg === "--osm" || arg === "-m") {
      result.osm = args[++i];
    } else if (arg === "--base") {
      result.base = args[++i];
    } else if (arg === "--dry-run" || arg === "-n") {
      result.dryRun = true;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();

  console.log("Loading data sources...");

  const baseData = loadJson<StationsFile>(args.base);
  const bjsubwayData = loadJson<StationsFile>(args.bjsubway);
  const osmData = loadJson<StationsFile>(args.osm);

  if (!baseData) {
    console.error("Base stations.json not found!");
    process.exit(1);
  }

  console.log(`  Base: ${baseData.stations.length} stations`);
  console.log(`  Bjsubway: ${bjsubwayData?.stations.length || 0} stations`);
  console.log(`  OSM: ${osmData?.stations.length || 0} stations`);

  console.log("\nMerging data...");
  const merged = mergeStations(
    baseData.stations,
    bjsubwayData?.stations || [],
    osmData?.stations || []
  );

  // Sort
  merged.sort((a, b) => (a.localName || a.name).localeCompare(b.localName || b.name));

  // Stats
  const withCoords = merged.filter((s) => s.coordinates).length;
  const withEntrances = merged.filter((s) => s.entrances && s.entrances.length > 0).length;
  const entrancesWithCoords = merged.reduce(
    (sum, s) =>
      sum + (s.entrances?.filter((e) => e.coordinates).length || 0),
    0
  );
  const totalEntrances = merged.reduce(
    (sum, s) => sum + (s.entrances?.length || 0),
    0
  );
  const withElevators = merged.filter((s) => s.elevators && s.elevators.length > 0).length;
  const totalElevators = merged.reduce(
    (sum, s) => sum + (s.elevators?.length || 0),
    0
  );

  console.log("\nResults:");
  console.log(`  Total stations: ${merged.length}`);
  console.log(`  With coordinates: ${withCoords}`);
  console.log(`  With entrances: ${withEntrances}`);
  console.log(`  Total entrances: ${totalEntrances} (${entrancesWithCoords} with coordinates)`);
  console.log(`  With elevators: ${withElevators}`);
  console.log(`  Total elevators: ${totalElevators}`);

  if (args.dryRun) {
    console.log("\nDry run - not writing output");
    const sample = merged.find((s) => s.entrances && s.entrances.length > 0);
    if (sample) {
      console.log("\nSample station with entrances:");
      console.log(JSON.stringify(sample, null, 2));
    }
  } else {
    fs.writeFileSync(args.output, JSON.stringify({ stations: merged }, null, 2));
    console.log(`\nWritten to: ${args.output}`);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
