import { NextResponse } from "next/server";
import { getIncidentCacheStatus } from "@/lib/data";

const INCIDENTS_WORKER_URL = process.env.INCIDENTS_WORKER_URL;

interface WorkerHealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  cronSchedule: string;
  systems: Record<
    string,
    {
      lastPullAt: string;
      lastPullDurationMs: number;
      lastPullSuccess: boolean;
      lastError: string | null;
    }
  >;
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const cacheEntries = getIncidentCacheStatus();

  let workerStatus: "ok" | "degraded" | "unreachable" = "unreachable";
  let workerLatencyMs: number | null = null;
  let workerSystems: WorkerHealthResponse["systems"] | null = null;
  let workerCronSchedule: string | null = null;

  if (INCIDENTS_WORKER_URL) {
    const start = performance.now();
    try {
      const res = await fetch(`${INCIDENTS_WORKER_URL}/health`, {
        cache: "no-store",
      });
      workerLatencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const data = (await res.json()) as WorkerHealthResponse;
        workerStatus = data.status;
        workerSystems = data.systems;
        workerCronSchedule = data.cronSchedule;
      }
    } catch {
      workerLatencyMs = Math.round(performance.now() - start);
    }
  }

  let status: "ok" | "degraded" | "error";
  if (workerStatus === "ok") {
    status = "ok";
  } else if (workerStatus === "degraded") {
    status = "degraded";
  } else {
    status = "error";
  }

  return NextResponse.json({
    status,
    timestamp,
    app: {
      cacheEntries,
    },
    worker: {
      status: workerStatus,
      latencyMs: workerLatencyMs,
      cronSchedule: workerCronSchedule,
      systems: workerSystems,
    },
  });
}
