import { promises as fs } from "fs";
import path from "path";
import type {
  TransitSystem,
  Line,
  Station,
  RailcarGeneration,
  HistoryEvent,
  IncidentData,
  UnitOutage,
  ServiceAlert,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "systems");

// Cache for loaded data
const cache: Map<string, unknown> = new Map();

async function loadJSON<T>(filePath: string): Promise<T> {
  const cached = cache.get(filePath);
  if (cached) return cached as T;

  const fullPath = path.join(DATA_DIR, filePath);
  const content = await fs.readFile(fullPath, "utf-8");
  const data = JSON.parse(content) as T;
  cache.set(filePath, data);
  return data;
}

// System data
export async function getSystem(systemId: string): Promise<TransitSystem & { history: HistoryEvent[] }> {
  return loadJSON(`${systemId}/system.json`);
}

export async function getAllSystems(): Promise<TransitSystem[]> {
  const systemDirs = await fs.readdir(DATA_DIR);
  const systems: TransitSystem[] = [];

  for (const dir of systemDirs) {
    try {
      const system = await getSystem(dir);
      systems.push(system);
    } catch {
      // Skip directories without valid system.json
    }
  }

  return systems;
}

// Lines data
export async function getLines(systemId: string): Promise<Line[]> {
  const data = await loadJSON<{ lines: Line[] }>(`${systemId}/lines.json`);
  return data.lines;
}

export async function getLine(systemId: string, lineId: string): Promise<Line | undefined> {
  const lines = await getLines(systemId);
  return lines.find((line) => line.id === lineId);
}

// Stations data
export async function getStations(systemId: string): Promise<Station[]> {
  const data = await loadJSON<{ stations: Station[] }>(`${systemId}/stations.json`);
  return data.stations;
}

export async function getStation(systemId: string, stationId: string): Promise<Station | undefined> {
  const stations = await getStations(systemId);
  return stations.find((station) => station.id === stationId);
}

export async function getStationsByLine(systemId: string, lineId: string): Promise<Station[]> {
  const stations = await getStations(systemId);
  return stations.filter((station) => station.lines.includes(lineId));
}

export async function getStationsByStatus(
  systemId: string,
  status: Station["status"]
): Promise<Station[]> {
  const stations = await getStations(systemId);
  return stations.filter((station) => station.status === status);
}

// Railcars data
export async function getRailcars(systemId: string): Promise<RailcarGeneration[]> {
  const data = await loadJSON<{ generations: RailcarGeneration[] }>(`${systemId}/railcars.json`);
  return data.generations;
}

export async function getRailcar(
  systemId: string,
  railcarId: string
): Promise<RailcarGeneration | undefined> {
  const railcars = await getRailcars(systemId);
  return railcars.find((railcar) => railcar.id === railcarId);
}

// Utility functions
export function getLineColor(line: Line): string {
  const colorMap: Record<string, string> = {
    red: "var(--line-red)",
    orange: "var(--line-orange)",
    yellow: "var(--line-yellow)",
    green: "var(--line-green)",
    blue: "var(--line-blue)",
    silver: "var(--line-silver)",
    purple: "var(--line-purple)",
  };
  return colorMap[line.color] || line.colorHex;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getSystemUrl(systemId: string): string {
  return `/${systemId}`;
}

export function getLineUrl(systemId: string, lineId: string): string {
  return `/${systemId}/lines/${lineId}`;
}

export function getStationUrl(systemId: string, stationId: string): string {
  return `/${systemId}/stations/${stationId}`;
}

export function getRailcarUrl(systemId: string, railcarId: string): string {
  return `/${systemId}/railcars/${railcarId}`;
}

// Incident/Outage data
const INCIDENTS_DIR = path.join(process.cwd(), "data", "incidents");
const INCIDENTS_WORKER_URL = process.env.INCIDENTS_WORKER_URL;

// BART API configuration (public demo key)
const BART_API_KEY = process.env.BART_API_KEY || "MW9S-E7SL-26DU-VV8V";
const BART_API_BASE = "https://api.bart.gov/api";

// Sound Transit GTFS-RT alerts feed (public, no auth required)
const SOUND_TRANSIT_ALERTS_URL = "https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json";

// Simple in-memory cache for incident data (5 minute TTL)
const incidentCache: Map<string, { data: IncidentData; fetchedAt: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// BART station code to station ID mapping
const BART_STATION_CODES: Record<string, string> = {
  "12TH": "12th-street-oakland",
  "16TH": "16th-street-mission",
  "19TH": "19th-street-oakland",
  "24TH": "24th-street-mission",
  "ANTC": "antioch",
  "ASHB": "ashby",
  "BALB": "balboa-park",
  "BAYF": "bay-fair",
  "BERY": "berryessa",
  "CAST": "castro-valley",
  "CIVC": "civic-center",
  "COLM": "colma",
  "COLS": "coliseum",
  "CONC": "concord",
  "DALY": "daly-city",
  "DBRK": "downtown-berkeley",
  "DELN": "el-cerrito-del-norte",
  "DUBL": "dublin-pleasanton",
  "EMBR": "embarcadero",
  "FRMT": "fremont",
  "FTVL": "fruitvale",
  "GLEN": "glen-park",
  "HAYW": "hayward",
  "LAFY": "lafayette",
  "LAKE": "lake-merritt",
  "MCAR": "macarthur",
  "MLBR": "millbrae",
  "MLPT": "milpitas",
  "MONT": "montgomery-street",
  "NBRK": "north-berkeley",
  "NCON": "north-concord-martinez",
  "OAKL": "oakland-airport",
  "ORIN": "orinda",
  "PCTR": "pittsburg-center",
  "PHIL": "pleasant-hill",
  "PITT": "pittsburg-bay-point",
  "PLZA": "el-cerrito-plaza",
  "POWL": "powell-street",
  "RICH": "richmond",
  "ROCK": "rockridge",
  "SANL": "san-leandro",
  "SBRN": "san-bruno",
  "SFIA": "sfo-airport",
  "SHAY": "south-hayward",
  "SSAN": "south-san-francisco",
  "UCTY": "union-city",
  "WARM": "warm-springs",
  "WCRK": "walnut-creek",
  "WDUB": "west-dublin-pleasanton",
  "WOAK": "west-oakland",
};

interface BartApiResponse {
  root: {
    date: string;
    time: string;
    bsa: Array<{
      "@id": string;
      station: string;
      type: string;
      description: { "#cdata-section": string };
      sms_text: { "#cdata-section": string };
      posted: string;
      expires: string;
    }>;
  };
}

// Sound Transit GTFS-RT alerts response types
interface SoundTransitAlert {
  id: string;
  alert: {
    effect: string;
    effect_detail?: { translation: Array<{ text: string; language: string }> };
    cause: string;
    cause_detail?: { translation: Array<{ text: string; language: string }> };
    header_text: { translation: Array<{ text: string; language: string }> };
    description_text: { translation: Array<{ text: string; language: string }> };
    severity_level: string;
    url?: { translation: Array<{ text: string; language: string }> };
    active_period: Array<{ start: number; end?: number }>;
    informed_entity: Array<{
      agency_id?: string;
      route_type?: number;
      route_id?: string;
      stop_id?: string;
    }>;
  };
}

interface SoundTransitAlertsResponse {
  header: {
    gtfs_realtime_version: string;
    timestamp: number;
  };
  entity: SoundTransitAlert[];
}

// Sound Transit route ID to line ID mapping
const SOUND_TRANSIT_ROUTES: Record<string, string> = {
  "100479": "1-line",
  "1LINE": "1-line",
  "2LINE": "2-line",
  "TLINE": "t-line",
  "NLINE": "n-line",
  "SLINE": "s-line",
};

// Sound Transit station name patterns for text matching
// Maps search patterns to station IDs
const SOUND_TRANSIT_STATION_PATTERNS: Array<{ pattern: RegExp; stationId: string }> = [
  { pattern: /\bwestlake\b/i, stationId: "westlake" },
  { pattern: /\buniversity street\b/i, stationId: "university-street" },
  { pattern: /\bpioneer square\b/i, stationId: "pioneer-square" },
  { pattern: /\binternational district|chinatown|int'l dist/i, stationId: "international-district" },
  { pattern: /\bstadium\b(?!\s*district)/i, stationId: "stadium" },
  { pattern: /\bsodo\b/i, stationId: "sodo" },
  { pattern: /\bbeacon hill\b/i, stationId: "beacon-hill" },
  { pattern: /\bmount baker|mt\.?\s*baker/i, stationId: "mount-baker" },
  { pattern: /\bcolumbia city\b/i, stationId: "columbia-city" },
  { pattern: /\bothello\b/i, stationId: "othello" },
  { pattern: /\brainier beach\b/i, stationId: "rainier-beach" },
  { pattern: /\btukwila\b/i, stationId: "tukwila-international-boulevard" },
  { pattern: /\bseatac|sea-tac|seatac\/airport/i, stationId: "sea-tac-airport" },
  { pattern: /\bangle lake\b/i, stationId: "angle-lake" },
  { pattern: /\bcapitol hill\b/i, stationId: "capitol-hill" },
  { pattern: /\buniversity of washington\b|uw station/i, stationId: "university-of-washington" },
  { pattern: /\bu district\b/i, stationId: "u-district" },
  { pattern: /\broosevelt\b/i, stationId: "roosevelt" },
  { pattern: /\bnorthgate\b/i, stationId: "northgate" },
  { pattern: /\bshoreline south|148th\b/i, stationId: "shoreline-south-148th" },
  { pattern: /\bshoreline north|185th\b/i, stationId: "shoreline-north-185th" },
  { pattern: /\bmountlake terrace\b/i, stationId: "mountlake-terrace" },
  { pattern: /\blynnwood\b/i, stationId: "lynnwood-city-center" },
  { pattern: /\bjudkins park\b/i, stationId: "judkins-park" },
  { pattern: /\bmercer island\b/i, stationId: "mercer-island" },
  { pattern: /\bsouth bellevue\b/i, stationId: "south-bellevue" },
  { pattern: /\beast main\b/i, stationId: "east-main" },
  { pattern: /\bbellevue downtown\b/i, stationId: "bellevue-downtown" },
  { pattern: /\bwilburton\b/i, stationId: "wilburton" },
  { pattern: /\bspring district|120th\b/i, stationId: "spring-district-120th" },
  { pattern: /\bbel-red|130th\b/i, stationId: "bel-red-130th" },
  { pattern: /\boverlake village\b/i, stationId: "overlake-village" },
  { pattern: /\bredmond technology\b/i, stationId: "redmond-technology" },
  { pattern: /\bfederal way\b/i, stationId: "federal-way-downtown" },
  { pattern: /\bkent des moines\b/i, stationId: "kent-des-moines" },
  { pattern: /\bstar lake\b/i, stationId: "star-lake" },
];

function findStationsInText(text: string): string[] {
  const foundStations: string[] = [];
  for (const { pattern, stationId } of SOUND_TRANSIT_STATION_PATTERNS) {
    if (pattern.test(text) && !foundStations.includes(stationId)) {
      foundStations.push(stationId);
    }
  }
  return foundStations;
}

async function fetchBartIncidents(): Promise<IncidentData | null> {
  try {
    // Fetch both BSA (service advisories) and elevator status
    const [bsaResponse, elevResponse] = await Promise.all([
      fetch(`${BART_API_BASE}/bsa.aspx?cmd=bsa&key=${BART_API_KEY}&json=y`, {
        next: { revalidate: 300 },
      }),
      fetch(`${BART_API_BASE}/bsa.aspx?cmd=elev&key=${BART_API_KEY}&json=y`, {
        next: { revalidate: 300 },
      }),
    ]);

    if (!bsaResponse.ok || !elevResponse.ok) {
      return null;
    }

    const bsaData = (await bsaResponse.json()) as BartApiResponse;
    const elevData = (await elevResponse.json()) as BartApiResponse;

    const alerts: ServiceAlert[] = [];
    const outagesByStation: Record<string, UnitOutage[]> = {};
    let elevatorOutages = 0;

    // Process service advisories
    for (const bsa of bsaData.root.bsa || []) {
      const description = bsa.description?.["#cdata-section"] || "";
      const type = bsa.type?.toLowerCase() as "delay" | "emergency" | "advisory";

      alerts.push({
        id: bsa["@id"],
        type: type === "delay" || type === "emergency" ? type : "advisory",
        title: bsa.type || "Service Advisory",
        description: description.trim(),
        postedAt: bsa.posted || new Date().toISOString(),
        expiresAt: bsa.expires || null,
      });
    }

    // Process elevator outages
    for (const elev of elevData.root.bsa || []) {
      const description = elev.description?.["#cdata-section"] || "";

      // Parse elevator outage description to extract station codes
      // Format: "There is 1 elevator out of service at this time: BAYF: Station"
      const stationMatches = description.match(/([A-Z]{4}):/g);
      if (stationMatches) {
        for (const match of stationMatches) {
          const stationCode = match.replace(":", "");
          const stationId = BART_STATION_CODES[stationCode];

          if (stationId) {
            if (!outagesByStation[stationId]) {
              outagesByStation[stationId] = [];
            }

            // Extract location info after the station code
            const locationMatch = description.match(new RegExp(`${stationCode}:\\s*([^,]+)`));
            const location = locationMatch ? locationMatch[1].trim() : "Station";

            outagesByStation[stationId].push({
              unitName: `${stationCode} Elevator`,
              unitType: "elevator",
              location: location,
              symptom: "Out of service",
              outOfServiceSince: elev.posted || new Date().toISOString(),
              estimatedReturn: null,
              updatedAt: `${elevData.root.date} ${elevData.root.time}`,
            });
            elevatorOutages++;
          }
        }
      }
    }

    const stationsAffected = Object.keys(outagesByStation).length;

    return {
      fetchedAt: new Date().toISOString(),
      systemId: "bart",
      summary: {
        totalOutages: elevatorOutages,
        elevatorOutages,
        escalatorOutages: 0, // BART API doesn't provide escalator status
        stationsAffected,
        activeAlerts: alerts.length,
      },
      alerts,
      outagesByStation,
    };
  } catch {
    return null;
  }
}

async function fetchSoundTransitIncidents(): Promise<IncidentData | null> {
  try {
    const response = await fetch(SOUND_TRANSIT_ALERTS_URL, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SoundTransitAlertsResponse;
    const alerts: ServiceAlert[] = [];
    const outagesByStation: Record<string, UnitOutage[]> = {};
    let elevatorOutages = 0;
    let escalatorOutages = 0;

    for (const entity of data.entity || []) {
      const alert = entity.alert;
      const headerText = alert.header_text?.translation?.[0]?.text || "Service Alert";
      const descriptionText = alert.description_text?.translation?.[0]?.text || "";
      const fullText = `${headerText} ${descriptionText}`;
      const effect = alert.effect?.toLowerCase() || "other";

      // Determine alert type based on effect
      let alertType: "delay" | "emergency" | "advisory" = "advisory";
      if (effect.includes("delay") || effect.includes("detour")) {
        alertType = "delay";
      } else if (effect.includes("no_service") || alert.severity_level === "SEVERE") {
        alertType = "emergency";
      }

      // Extract affected lines from informed_entity
      const affectedLines: string[] = [];
      for (const informed of alert.informed_entity || []) {
        if (informed.route_id) {
          const lineId = SOUND_TRANSIT_ROUTES[informed.route_id];
          if (lineId && !affectedLines.includes(lineId)) {
            affectedLines.push(lineId);
          }
        }
      }

      // Find affected stations by searching text
      const affectedStations = findStationsInText(fullText);

      // Check for elevator/escalator outages and map to stations
      // Use fullText (title + description) since outage keywords may appear in either
      const lowerFullText = fullText.toLowerCase();
      const hasElevatorOutage = lowerFullText.includes("elevator") &&
        (lowerFullText.includes("out of service") || lowerFullText.includes("unavailable") || lowerFullText.includes("closed") || lowerFullText.includes("outage"));
      const hasEscalatorOutage = lowerFullText.includes("escalator") &&
        (lowerFullText.includes("out of service") || lowerFullText.includes("unavailable") || lowerFullText.includes("closed") || lowerFullText.includes("outage"));

      // Convert timestamps
      const startTime = alert.active_period?.[0]?.start;
      const endTime = alert.active_period?.[0]?.end;
      const postedAt = startTime ? new Date(startTime * 1000).toISOString() : new Date().toISOString();
      const expiresAt = endTime ? new Date(endTime * 1000).toISOString() : null;

      // Add outages to affected stations
      if ((hasElevatorOutage || hasEscalatorOutage) && affectedStations.length > 0) {
        for (const stationId of affectedStations) {
          if (!outagesByStation[stationId]) {
            outagesByStation[stationId] = [];
          }

          if (hasElevatorOutage) {
            outagesByStation[stationId].push({
              unitName: "Elevator",
              unitType: "elevator",
              location: headerText,
              symptom: "Out of service",
              outOfServiceSince: postedAt,
              estimatedReturn: expiresAt,
              updatedAt: postedAt,
            });
            elevatorOutages++;
          }

          if (hasEscalatorOutage) {
            outagesByStation[stationId].push({
              unitName: "Escalator",
              unitType: "escalator",
              location: headerText,
              symptom: "Out of service",
              outOfServiceSince: postedAt,
              estimatedReturn: expiresAt,
              updatedAt: postedAt,
            });
            escalatorOutages++;
          }
        }
      }

      alerts.push({
        id: entity.id,
        type: alertType,
        title: headerText,
        description: descriptionText.trim(),
        affectedLines: affectedLines.length > 0 ? affectedLines : undefined,
        affectedStations: affectedStations.length > 0 ? affectedStations : undefined,
        postedAt,
        expiresAt,
      });
    }

    const stationsAffected = Object.keys(outagesByStation).length;

    return {
      fetchedAt: new Date().toISOString(),
      systemId: "sound-transit",
      summary: {
        totalOutages: elevatorOutages + escalatorOutages,
        elevatorOutages,
        escalatorOutages,
        stationsAffected,
        activeAlerts: alerts.length,
      },
      alerts,
      outagesByStation,
    };
  } catch {
    return null;
  }
}

async function fetchWmataIncidents(): Promise<IncidentData | null> {
  // Try fetching from worker if URL is configured
  if (INCIDENTS_WORKER_URL) {
    try {
      const response = await fetch(`${INCIDENTS_WORKER_URL}/incidents/wmata`, {
        next: { revalidate: 300 },
      });
      if (response.ok) {
        return (await response.json()) as IncidentData;
      }
    } catch {
      // Fall through to local file
    }
  }

  // Fall back to local file
  try {
    const filePath = path.join(INCIDENTS_DIR, "wmata.json");
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as IncidentData;
  } catch {
    return null;
  }
}

export async function getIncidents(systemId: string): Promise<IncidentData | null> {
  // Check supported systems
  const supportedSystems = ["wmata", "bart", "sound-transit"];
  if (!supportedSystems.includes(systemId)) return null;

  // Check cache first
  const cached = incidentCache.get(systemId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  // Fetch based on system
  let data: IncidentData | null = null;
  if (systemId === "bart") {
    data = await fetchBartIncidents();
  } else if (systemId === "wmata") {
    data = await fetchWmataIncidents();
  } else if (systemId === "sound-transit") {
    data = await fetchSoundTransitIncidents();
  }

  if (data) {
    incidentCache.set(systemId, { data, fetchedAt: Date.now() });
  }

  return data;
}

export async function getStationOutages(
  systemId: string,
  stationId: string
): Promise<UnitOutage[]> {
  const incidents = await getIncidents(systemId);
  if (!incidents) return [];
  return incidents.outagesByStation[stationId] || [];
}
