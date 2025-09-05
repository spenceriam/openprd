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
  maxOpacity = 0.3,
  duration = 4,
  ...props
}: AnimatedGridPatternProps) {
  const [squares, setSquares] = useState<Array<{ x: number; y: number; animationDelay: number; id: string }>>([]);

  useEffect(() => {
    const generateSquares = () => {
      if (typeof window === "undefined") {
        return;
      }
      
      const columns = Math.ceil(window.innerWidth / width);
      const rows = Math.ceil(window.innerHeight / height);
      
      // Create a grid of all possible positions
      const allPositions: Array<{ x: number; y: number }> = [];
      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          allPositions.push({ x: col, y: row });
        }
      }
      
      // Shuffle and select random positions
      const shuffled = allPositions.sort(() => 0.5 - Math.random());
      const selectedPositions = shuffled.slice(0, Math.min(numSquares, allPositions.length));
      
      // Create squares with unique IDs and animation delays
      const newSquares = selectedPositions.map((pos, index) => ({
        x: pos.x,
        y: pos.y,
        animationDelay: Math.random() * duration,
        id: `${pos.x}-${pos.y}-${Date.now()}-${index}`
      }));
      
      setSquares(newSquares);
    };

    // Initial generation
    generateSquares();

    // Regenerate squares periodically for continuous animation
    const intervalId = setInterval(generateSquares, duration * 1000);

    // Handle window resize
    const handleResize = () => {
      generateSquares();
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
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
          <path 
            d={`M.5 ${height}V.5H${width}`} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
          />
        </pattern>
      </defs>
      <rect 
        width="100%" 
        height="100%" 
        strokeWidth={0} 
        fill="url(#grid-pattern)" 
      />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map((square) => (
          <rect
            key={square.id}
            strokeWidth="0"
            width={width - 1}
            height={height - 1}
            x={square.x * width + 1}
            y={square.y * height + 1}
            style={
              {
                "--max-opacity": maxOpacity,
                animation: `fade ${duration}s ease-in-out infinite alternate`,
                animationDelay: `${square.animationDelay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </svg>
    </svg>
  );
}

export default AnimatedGridPattern;
