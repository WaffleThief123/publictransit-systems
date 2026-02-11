/**
 * ODPT Incidents Worker
 *
 * Fetches train operation information from the ODPT API for Tokyo Metro
 * on a schedule and stores processed alerts in KV for the frontend.
 *
 * Endpoints:
 *   GET /incidents/tokyo-metro - Returns current incident data
 *   POST /refresh - Manually trigger a refresh
 */

export interface Env {
  INCIDENTS_KV: KVNamespace;
  ODPT_CONSUMER_KEY: string;
  CORS_ORIGIN: string;
}

// ODPT railway suffix → our line ID
const RAILWAY_LINE_MAP: Record<string, string> = {
  Ginza: "ginza",
  Marunouchi: "marunouchi",
  Hibiya: "hibiya",
  Tozai: "tozai",
  Chiyoda: "chiyoda",
  Yurakucho: "yurakucho",
  Hanzomon: "hanzomon",
  Namboku: "namboku",
  Fukutoshin: "fukutoshin",
};

interface ODPTTrainInformation {
  "odpt:railway": string;
  "odpt:trainInformationStatus"?: { ja?: string; en?: string };
  "odpt:trainInformationText"?: { ja?: string; en?: string };
  "odpt:timeOfOrigin"?: string;
  "dct:valid"?: string;
}

interface ServiceAlert {
  id: string;
  type: "delay" | "emergency" | "advisory";
  title: string;
  description: string;
  affectedLines: string[];
  affectedStations: string[];
  postedAt: string;
  expiresAt: string | null;
}

interface IncidentData {
  fetchedAt: string;
  systemId: string;
  summary: {
    totalOutages: number;
    elevatorOutages: number;
    escalatorOutages: number;
    stationsAffected: number;
    activeAlerts: number;
  };
  alerts: ServiceAlert[];
  outagesByStation: Record<string, never[]>;
}

function extractLineId(railway: string): string | null {
  // odpt:railway = "odpt.Railway:TokyoMetro.Ginza" → "Ginza"
  const parts = railway.split(".");
  const suffix = parts[parts.length - 1];
  return RAILWAY_LINE_MAP[suffix] ?? null;
}

function mapAlertType(status?: { ja?: string; en?: string }): ServiceAlert["type"] {
  if (!status) return "advisory";
  const ja = status.ja || "";
  const en = (status.en || "").toLowerCase();

  if (ja.includes("運転見合わせ") || en.includes("suspend")) return "emergency";
  if (ja.includes("遅延") || en.includes("delay")) return "delay";
  return "advisory";
}

async function fetchODPTTrainInfo(consumerKey: string): Promise<ODPTTrainInformation[]> {
  const url = `https://api.odpt.org/api/v4/odpt:TrainInformation?acl:consumerKey=${consumerKey}&odpt:operator=odpt.Operator:TokyoMetro`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ODPT API error: ${response.status}`);
  }

  return (await response.json()) as ODPTTrainInformation[];
}

function processTrainInfo(entries: ODPTTrainInformation[]): IncidentData {
  const alerts: ServiceAlert[] = [];

  for (const entry of entries) {
    // Skip lines with normal operation (no status = normal)
    if (!entry["odpt:trainInformationStatus"]) continue;

    const lineId = extractLineId(entry["odpt:railway"]);
    if (!lineId) continue;

    const text = entry["odpt:trainInformationText"] || {};
    const title = text.en || text.ja || "Service disruption";
    const description = text.ja || "";

    alerts.push({
      id: `tokyo-metro-${lineId}-${Date.now()}`,
      type: mapAlertType(entry["odpt:trainInformationStatus"]),
      title,
      description,
      affectedLines: [lineId],
      affectedStations: [],
      postedAt: entry["odpt:timeOfOrigin"] || new Date().toISOString(),
      expiresAt: entry["dct:valid"] || null,
    });
  }

  return {
    fetchedAt: new Date().toISOString(),
    systemId: "tokyo-metro",
    summary: {
      totalOutages: 0,
      elevatorOutages: 0,
      escalatorOutages: 0,
      stationsAffected: 0,
      activeAlerts: alerts.length,
    },
    alerts,
    outagesByStation: {},
  };
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = corsHeaders(env.CORS_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // GET /incidents/tokyo-metro
    if (url.pathname === "/incidents/tokyo-metro" && request.method === "GET") {
      const data = await env.INCIDENTS_KV.get("tokyo-metro", "json");
      if (!data) {
        return new Response(
          JSON.stringify({ error: "No incident data available" }),
          { status: 404, headers },
        );
      }
      return new Response(JSON.stringify(data), { headers });
    }

    // POST /refresh
    if (url.pathname === "/refresh" && request.method === "POST") {
      try {
        const entries = await fetchODPTTrainInfo(env.ODPT_CONSUMER_KEY);
        const data = processTrainInfo(entries);
        await env.INCIDENTS_KV.put("tokyo-metro", JSON.stringify(data));
        return new Response(
          JSON.stringify({ success: true, summary: data.summary }),
          { headers },
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: (error as Error).message }),
          { status: 500, headers },
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers },
    );
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log("Running scheduled ODPT train info fetch...");

    try {
      const entries = await fetchODPTTrainInfo(env.ODPT_CONSUMER_KEY);
      const data = processTrainInfo(entries);
      await env.INCIDENTS_KV.put("tokyo-metro", JSON.stringify(data));

      console.log(`Fetched ${data.summary.activeAlerts} active alerts for Tokyo Metro`);
    } catch (error) {
      console.error("Failed to fetch ODPT train info:", error);
    }
  },
};
