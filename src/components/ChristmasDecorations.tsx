"use client";

import React, { useMemo } from "react";

interface ChristmasDecorationsProps {
  density?: "light" | "medium" | "heavy";
  showSnow?: boolean;
  showLights?: boolean;
  showFloating?: boolean;
}

interface Snowflake {
  id: string;
  left: number;
  delay: number;
  duration: number;
  swayDuration: number;
  opacity: number;
  size: number;
  blur: number;
}

interface Light {
  id: string;
  delay: number;
  color: string;
  x: number;
  y: number;
}

const LIGHT_COLORS = [
  "#ef4444", // Red-500
  "#22c55e", // Green-500
  "#eab308", // Yellow-500
  "#3b82f6", // Blue-500
  "#a855f7", // Purple-500
] as const;

export default function ChristmasDecorations({
  density = "medium",
  showSnow = true,
  showLights = true,
  showFloating = false,
}: ChristmasDecorationsProps) {
  const snowflakeCount =
    density === "light" ? 20 : density === "medium" ? 40 : 60;
  const lightCount = 30;

  // Generate snowflakes with depth (blur) and sway
  const snowflakes = useMemo<Snowflake[]>(
    () =>
      Array.from({ length: snowflakeCount }, (_, i) => ({
        id: `snow-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10, // Slower, more elegant fall
        swayDuration: 3 + Math.random() * 4, // Random sway speed
        opacity: 0.3 + Math.random() * 0.5,
        size: 3 + Math.random() * 5, // Smaller, more realistic
        blur: Math.random() < 0.4 ? 1 : 0, // Soft edges
      })),
    [snowflakeCount]
  );

  // Generate lights along a catenary curve (hanging wire)
  const lights = useMemo<Light[]>(
    () =>
      Array.from({ length: lightCount }, (_, i) => {
        // Calculate y position based on a simple parabola to simulate hanging wire
        // y = a(x-h)^2 + k
        // Normalized x from -1 to 1
        const xNorm = (i / (lightCount - 1)) * 2 - 1;
        const yDrop = xNorm * xNorm * 20; // 20px drop in the middle

        return {
          id: `light-${i}`,
          delay: i * 0.1,
          color: LIGHT_COLORS[i % LIGHT_COLORS.length],
          x: (i / (lightCount - 1)) * 100,
          y: yDrop,
        };
      }),
    [lightCount]
  );

  return (
    <div
      className="christmas-decorations pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      role="presentation"
      aria-hidden="true"
    >
      {/* Snowfall Effect */}
      {showSnow && (
        <div className="snowfall absolute inset-0">
          {snowflakes.map((flake) => (
            <div
              key={flake.id}
              className="snowflake-wrapper fixed top-[-20px]"
              style={{
                left: `${flake.left}%`,
                animationDuration: `${flake.duration}s`,
                animationDelay: `${flake.delay}s`,
              }}
            >
              <div
                className="snowflake text-white select-none"
                style={{
                  fontSize: `${flake.size * 2}px`, // Scale up for text
                  opacity: flake.opacity,
                  filter: flake.blur ? `blur(${flake.blur}px)` : "none",
                  animationDuration: `${flake.swayDuration}s`,
                }}
              >
                ❄
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Christmas Lights with Wire */}
      {showLights && (
        <div className="christmas-lights-container fixed top-0 left-0 right-0 h-16 z-[9999]">
          {/* The Wire (SVG) */}
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 100 20"
          >
            <path
              d="M0,0 Q50,20 100,0"
              fill="none"
              stroke="#374151"
              strokeWidth="0.5"
              className="opacity-60 dark:opacity-40"
            />
          </svg>

          {/* The Bulbs */}
          <div className="relative w-full h-full">
            {lights.map((light) => (
              <div
                key={light.id}
                className="christmas-light absolute top-0 transform -translate-x-1/2"
                style={{
                  left: `${light.x}%`,
                  top: `${light.y}px`, // Follow the curve roughly
                  backgroundColor: light.color,
                  boxShadow: `0 0 10px ${light.color}, 0 0 20px ${light.color}`,
                  animationDelay: `${light.delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Subtle Vignette/Frost Effect */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent h-32 opacity-30" />
    </div>
  );
}
