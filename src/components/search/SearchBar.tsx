"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md",
          "bg-bg-tertiary border border-border hover:border-border-hover",
          "text-text-muted text-sm font-mono transition-colors"
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline text-xs bg-bg-secondary px-1.5 py-0.5 rounded border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Search modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl bg-bg-secondary border border-border rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <svg
                  className="w-5 h-5 text-text-muted shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search stations, lines, railcars..."
                  className={cn(
                    "flex-1 bg-transparent text-text-primary",
                    "placeholder:text-text-muted outline-none font-mono"
                  )}
                />
                <kbd className="text-xs bg-bg-tertiary text-text-muted px-2 py-1 rounded border border-border">
                  ESC
                </kbd>
              </div>
            </form>
            <div className="p-4 text-sm text-text-muted font-mono">
              <p>Type to search across all transit systems...</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs">Try:</span>
                <button
                  onClick={() => setQuery("Metro Center")}
                  className="text-xs text-accent-secondary hover:underline"
                >
                  Metro Center
                </button>
                <button
                  onClick={() => setQuery("Red Line")}
                  className="text-xs text-accent-secondary hover:underline"
                >
                  Red Line
                </button>
                <button
                  onClick={() => setQuery("7000 Series")}
                  className="text-xs text-accent-secondary hover:underline"
                >
                  7000 Series
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
