import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { LineIndicatorGroup } from "./LineIndicator";
import type { Station } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/data";

interface StationCardProps {
  station: Station;
  systemId: string;
  className?: string;
  compact?: boolean;
}

export function StationCard({ station, systemId, className, compact = false }: StationCardProps) {
  return (
    <Link href={`/${systemId}/stations/${station.id}`}>
      <Card hover className={cn("h-full", className)}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-mono font-semibold text-text-primary">
            {station.name}
          </h3>
          <StatusBadge status={station.status} />
        </div>

        <div className="mb-3">
          <LineIndicatorGroup
            lines={station.lines}
            systemId={systemId}
            size="sm"
            linkable={false}
          />
        </div>

        {!compact && (
          <>
            <p className="text-sm text-text-secondary mb-3 line-clamp-2">
              {station.description}
            </p>

            <div className="flex items-center justify-between text-xs text-text-muted font-mono pt-3 border-t border-border">
              <span>Opened: {formatDate(station.opened)}</span>
              {station.features.length > 0 && (
                <span>{station.features.length} features</span>
              )}
            </div>
          </>
        )}
      </Card>
    </Link>
  );
}
