"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { DistanceUnit } from "@/lib/types";

interface DistanceUnitContextType {
  unit: DistanceUnit;
  setUnit: (unit: DistanceUnit) => void;
  toggleUnit: () => void;
}

const DistanceUnitContext = createContext<DistanceUnitContextType | undefined>(undefined);

const STORAGE_KEY = "distance-unit";

export function DistanceUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<DistanceUnit>("mi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as DistanceUnit | null;
    if (stored === "km" || stored === "mi") {
      setUnitState(stored);
    }
  }, []);

  const setUnit = (newUnit: DistanceUnit) => {
    setUnitState(newUnit);
    localStorage.setItem(STORAGE_KEY, newUnit);
  };

  const toggleUnit = () => {
    setUnit(unit === "km" ? "mi" : "km");
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <DistanceUnitContext.Provider value={{ unit: "mi", setUnit, toggleUnit }}>
        {children}
      </DistanceUnitContext.Provider>
    );
  }

  return (
    <DistanceUnitContext.Provider value={{ unit, setUnit, toggleUnit }}>
      {children}
    </DistanceUnitContext.Provider>
  );
}

export function useDistanceUnit() {
  const context = useContext(DistanceUnitContext);
  if (context === undefined) {
    throw new Error("useDistanceUnit must be used within a DistanceUnitProvider");
  }
  return context;
}
