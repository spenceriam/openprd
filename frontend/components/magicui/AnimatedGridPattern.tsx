"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AnimatedGridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
}

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  ...props
}: AnimatedGridPatternProps) {
  const [squares, setSquares] = useState<[number, number][]>([]);

  useEffect(() => {
    const generateSquares = () => {
      if (typeof window === "undefined") {
        return;
      }
      const columns = Math.ceil(window.innerWidth / width);
      const rows = Math.ceil(window.innerHeight / height);
      const allSquares = Array.from({ length: columns * rows }).map((_, i) => [
        i % columns,
        Math.floor(i / columns),
      ]) as [number, number][];
      setSquares(
        allSquares
          .sort(() => 0.5 - Math.random())
          .slice(0, numSquares)
      );
    };

    // Initial generation
    generateSquares();

    // Regenerate squares every `duration` seconds to create a continuous, non-repeating animation
    const intervalId = setInterval(generateSquares, duration * 1000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [width, height, numSquares, duration]);

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
                animation: `fade ${duration}s linear infinite alternate`,
                animationDelay: `${Math.random() * duration}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </svg>
    </svg>
  );
}

export default AnimatedGridPattern;
