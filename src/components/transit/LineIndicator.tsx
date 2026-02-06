import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Line } from "@/lib/types";

interface LineIndicatorProps {
  line: Line | string;
  systemId?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  linkable?: boolean;
  glow?: boolean;
  className?: string;
}

const lineColors: Record<string, string> = {
  red: "#BF0D3E",
  orange: "#ED8B00",
  yellow: "#FFD200",
  green: "#00B140",
  blue: "#009CDE",
  silver: "#A2A4A3",
  purple: "#522398",
};

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

// Helper to determine if text should be light or dark based on background
function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#ffffff";

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 155 ? "#000000" : "#ffffff";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function LineIndicator({
  line,
  systemId,
  size = "md",
  showName = false,
  linkable = true,
  glow = true,
  className,
}: LineIndicatorProps) {
  const isLineObject = typeof line === "object";
  const lineId = isLineObject ? line.id : line;
  const lineName = isLineObject ? line.name : `${line.charAt(0).toUpperCase()}${line.slice(1)} Line`;
  const colorHex = isLineObject ? line.colorHex : lineColors[line] || "#666";
  const shortName = lineId.charAt(0).toUpperCase();

  const badge = (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-mono font-bold transition-all",
        sizeClasses[size],
        "border-2 border-opacity-30"
      )}
      style={{
        backgroundColor: colorHex,
        color: getContrastColor(colorHex),
        borderColor: colorHex,
        boxShadow: glow ? `0 0 20px ${colorHex}40, 0 0 40px ${colorHex}20` : undefined,
      }}
    >
      {shortName}
    </div>
  );

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {badge}
      {showName && (
        <span className="text-sm font-mono text-text-primary">{lineName}</span>
      )}
    </div>
  );

  if (linkable && systemId) {
    return (
      <Link
        href={`/${systemId}/lines/${lineId}`}
        className="hover:scale-110 transition-transform inline-block"
      >
        {content}
      </Link>
    );
  }

  return content;
}

interface LineIndicatorGroupProps {
  lines: (Line | string)[];
  systemId?: string;
  size?: "sm" | "md" | "lg";
  linkable?: boolean;
  glow?: boolean;
  className?: string;
}

export function LineIndicatorGroup({
  lines,
  systemId,
  size = "sm",
  linkable = true,
  glow = true,
  className,
}: LineIndicatorGroupProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {lines.map((line) => {
        const lineId = typeof line === "object" ? line.id : line;
        return (
          <LineIndicator
            key={lineId}
            line={line}
            systemId={systemId}
            size={size}
            linkable={linkable}
            glow={glow}
          />
        );
      })}
    </div>
  );
}
