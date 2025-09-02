"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface AnimatedGridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: any;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
}

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 40,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  repeatDelay = 0.5,
  ...props
}: AnimatedGridPatternProps) {
  const squares = useMemo(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const columns = Math.ceil(window.innerWidth / width);
    const rows = Math.ceil(window.innerHeight / height);
    const allSquares = Array.from({ length: columns * rows }).map((_, i) => [
      i % columns,
      Math.floor(i / columns),
    ]);
    return allSquares
      .sort(() => 0.5 - Math.random())
      .slice(0, numSquares);
  }, [width, height, numSquares]);

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id="grid-pattern"
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill="url(#grid-pattern)" />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(([x, y], i) => (
          <rect
            key={`${x}-${y}-${i}`}
            strokeWidth="0"
            width={width - 1}
            height={height - 1}
            x={x * width + 1}
            y={y * height + 1}
            style={
              {
                "--max-opacity": maxOpacity,
                "--duration": `${duration}s`,
                "--repeat-delay": `${repeatDelay}s`,
                animation: `fade ${duration}s linear ${
                  i * 0.05
                }s infinite alternate`,
                animationDelay: `${i * 0.05}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </svg>
    </svg>
  );
}

export default AnimatedGridPattern;
