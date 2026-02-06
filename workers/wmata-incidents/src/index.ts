/**
 * WMATA Incidents Worker
 *
 * Fetches elevator/escalator incidents from WMATA API on a schedule
 * and stores them in KV for the frontend to consume.
 *
 * Endpoints:
 *   GET /incidents/wmata - Returns current incident data
 *   GET /incidents/wmata/:stationId - Returns incidents for a specific station
 *   POST /refresh - Manually trigger a refresh (requires auth)
 */

export interface Env {
  INCIDENTS_KV: KVNamespace;
  WMATA_API_KEY: string;
  CORS_ORIGIN: string;
}

// WMATA station code to our station ID mapping
const STATION_CODE_MAP: Record<string, string> = {
  'A01': 'metro-center',
  'A02': 'farragut-north',
  'A03': 'dupont-circle',
  'A04': 'woodley-park',
  'A05': 'cleveland-park',
  'A06': 'van-ness-udc',
  'A07': 'tenleytown-au',
  'A08': 'friendship-heights',
  'A09': 'bethesda',
  'A10': 'medical-center',
  'A11': 'grosvenor-strathmore',
  'A12': 'white-flint',
  'A13': 'twinbrook',
  'A14': 'rockville',
  'A15': 'shady-grove',
  'B01': 'gallery-place',
  'B02': 'judiciary-square',
  'B03': 'union-station',
  'B04': 'rhode-island-ave',
  'B05': 'brookland-cua',
  'B06': 'fort-totten',
  'B07': 'takoma',
  'B08': 'silver-spring',
  'B09': 'forest-glen',
  'B10': 'wheaton',
  'B11': 'glenmont',
  'B35': 'noma-gallaudet',
  'C01': 'metro-center',
  'C02': 'mcpherson-square',
  'C03': 'farragut-west',
  'C04': 'foggy-bottom',
  'C05': 'rosslyn',
  'C06': 'arlington-cemetery',
  'C07': 'pentagon',
  'C08': 'pentagon-city',
  'C09': 'crystal-city',
  'C10': 'reagan-national-airport',
  'C12': 'braddock-road',
  'C13': 'king-street',
  'C14': 'eisenhower-ave',
  'C15': 'huntington',
  'D01': 'federal-triangle',
  'D02': 'smithsonian',
  'D03': 'l-enfant-plaza',
  'D04': 'federal-center-sw',
  'D05': 'capitol-south',
  'D06': 'eastern-market',
  'D07': 'potomac-ave',
  'D08': 'stadium-armory',
  'D09': 'minnesota-ave',
  'D10': 'deanwood',
  'D11': 'cheverly',
  'D12': 'landover',
  'D13': 'new-carrollton',
  'E01': 'mt-vernon-sq',
  'E02': 'shaw-howard',
  'E03': 'u-street',
  'E04': 'columbia-heights',
  'E05': 'georgia-ave-petworth',
  'E06': 'fort-totten',
  'E07': 'west-hyattsville',
  'E08': 'prince-georges-plaza',
  'E09': 'college-park',
  'E10': 'greenbelt',
  'F01': 'gallery-place',
  'F02': 'archives',
  'F03': 'l-enfant-plaza',
  'F04': 'waterfront',
  'F05': 'navy-yard',
  'F06': 'anacostia',
  'F07': 'congress-heights',
  'F08': 'southern-avenue',
  'F09': 'naylor-road',
  'F10': 'suitland',
  'F11': 'branch-ave',
  'G01': 'benning-road',
  'G02': 'capitol-heights',
  'G03': 'addison-road',
  'G04': 'morgan-boulevard',
  'G05': 'largo-town-center',
  'J02': 'van-dorn-street',
  'J03': 'franconia-springfield',
  'K01': 'court-house',
  'K02': 'clarendon',
  'K03': 'virginia-square',
  'K04': 'ballston-mu',
  'K05': 'east-falls-church',
  'K06': 'west-falls-church',
  'K07': 'dunn-loring',
  'K08': 'vienna',
  'N01': 'mclean',
  'N02': 'tysons-corner',
  'N03': 'greensboro',
  'N04': 'spring-hill',
  'N06': 'wiehle-reston-east',
  'N07': 'reston-town-center',
  'N08': 'herndon',
  'N09': 'innovation-center',
  'N10': 'dulles-airport',
  'N11': 'loudoun-gateway',
  'N12': 'ashburn',
};

interface WMATAIncident {
  UnitName: string;
  UnitType: string;
  StationCode: string;
  StationName: string;
  LocationDescription: string;
  SymptomDescription: string;
  DateOutOfServ: string;
  DateUpdated: string;
  EstimatedReturnToService: string | null;
}

interface UnitOutage {
  unitName: string;
  unitType: 'elevator' | 'escalator';
  location: string;
  symptom: string;
  outOfServiceSince: string;
  estimatedReturn: string | null;
  updatedAt: string;
}

interface IncidentData {
  fetchedAt: string;
  systemId: string;
  summary: {
    totalOutages: number;
    elevatorOutages: number;
    escalatorOutages: number;
    stationsAffected: number;
  };
  outagesByStation: Record<string, UnitOutage[]>;
}

async function fetchWMATAIncidents(apiKey: string): Promise<WMATAIncident[]> {
  const response = await fetch(
    `https://api.wmata.com/Incidents.svc/json/ElevatorIncidents?api_key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`WMATA API error: ${response.status}`);
  }

  const data = await response.json() as { ElevatorIncidents: WMATAIncident[] };
  return data.ElevatorIncidents || [];
}

function processIncidents(incidents: WMATAIncident[]): IncidentData {
  const outagesByStation: Record<string, UnitOutage[]> = {};

  for (const incident of incidents) {
    const stationId = STATION_CODE_MAP[incident.StationCode];
    if (!stationId) continue;

    if (!outagesByStation[stationId]) {
      outagesByStation[stationId] = [];
    }

    // Determine accessibility from name/description
    const name = (incident.UnitName || '').toLowerCase();
    const desc = (incident.LocationDescription || '').toLowerCase();
    const hasElevator = name.includes('elev') || desc.includes('elevator');

    outagesByStation[stationId].push({
      unitName: incident.UnitName,
      unitType: incident.UnitType.toLowerCase() as 'elevator' | 'escalator',
      location: incident.LocationDescription,
      symptom: incident.SymptomDescription,
      outOfServiceSince: incident.DateOutOfServ,
      estimatedReturn: incident.EstimatedReturnToService,
      updatedAt: incident.DateUpdated,
    });
  }

  let elevatorOutages = 0;
  let escalatorOutages = 0;
  for (const outages of Object.values(outagesByStation)) {
    for (const o of outages) {
      if (o.unitType === 'elevator') elevatorOutages++;
      else escalatorOutages++;
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    systemId: 'wmata',
    summary: {
      totalOutages: incidents.length,
      elevatorOutages,
      escalatorOutages,
      stationsAffected: Object.keys(outagesByStation).length,
    },
    outagesByStation,
  };
}

function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export default {
  // HTTP request handler
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = corsHeaders(env.CORS_ORIGIN);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // GET /incidents/wmata - Get all incidents
    if (url.pathname === '/incidents/wmata' && request.method === 'GET') {
      const data = await env.INCIDENTS_KV.get('wmata', 'json');
      if (!data) {
        return new Response(
          JSON.stringify({ error: 'No incident data available' }),
          { status: 404, headers }
        );
      }
      return new Response(JSON.stringify(data), { headers });
    }

    // GET /incidents/wmata/:stationId - Get incidents for a station
    const stationMatch = url.pathname.match(/^\/incidents\/wmata\/([a-z0-9-]+)$/);
    if (stationMatch && request.method === 'GET') {
      const stationId = stationMatch[1];
      const data = await env.INCIDENTS_KV.get('wmata', 'json') as IncidentData | null;
      if (!data) {
        return new Response(JSON.stringify([]), { headers });
      }
      const outages = data.outagesByStation[stationId] || [];
      return new Response(JSON.stringify(outages), { headers });
    }

    // POST /refresh - Manually trigger refresh
    if (url.pathname === '/refresh' && request.method === 'POST') {
      try {
        const incidents = await fetchWMATAIncidents(env.WMATA_API_KEY);
        const data = processIncidents(incidents);
        await env.INCIDENTS_KV.put('wmata', JSON.stringify(data));
        return new Response(
          JSON.stringify({ success: true, summary: data.summary }),
          { headers }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: (error as Error).message }),
          { status: 500, headers }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers }
    );
  },

  // Scheduled (cron) handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Running scheduled WMATA incident fetch...');

    try {
      const incidents = await fetchWMATAIncidents(env.WMATA_API_KEY);
      const data = processIncidents(incidents);
      await env.INCIDENTS_KV.put('wmata', JSON.stringify(data));

      console.log(
        `Fetched ${data.summary.totalOutages} incidents ` +
        `(${data.summary.elevatorOutages} elevators, ${data.summary.escalatorOutages} escalators) ` +
        `at ${data.summary.stationsAffected} stations`
      );
    } catch (error) {
      console.error('Failed to fetch WMATA incidents:', error);
    }
  },
};
