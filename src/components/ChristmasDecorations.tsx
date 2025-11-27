"use client";

import React from "react";

interface ChristmasDecorationsProps {
  density?: "light" | "medium" | "heavy";
  showSnow?: boolean;
  showLights?: boolean;
  showFloating?: boolean;
}

export default function ChristmasDecorations({
  density = "medium",
  showSnow = true,
  showLights = true,
  showFloating = true,
}: ChristmasDecorationsProps) {
  const snowflakeCount =
    density === "light" ? 15 : density === "medium" ? 25 : 40;

  return (
    <div className="christmas-decorations pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Copos de nieve animados */}
      {showSnow && (
        <div className="snowfall">
          {Array.from({ length: snowflakeCount }).map((_, i) => (
            <div
              key={`snow-${i}`}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
                opacity: 0.3 + Math.random() * 0.4,
                fontSize: `${8 + Math.random() * 12}px`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )}

      {/* Luces navideñas en el borde superior */}
      {showLights && (
        <div className="christmas-lights fixed top-0 left-0 right-0 h-2 flex justify-around">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`light-${i}`}
              className="christmas-light"
              style={{
                animationDelay: `${i * 0.1}s`,
                backgroundColor: ["#DC2626", "#059669", "#F59E0B", "#3B82F6"][
                  i % 4
                ],
              }}
            />
          ))}
        </div>
      )}

      {/* Decoraciones flotantes */}
      {showFloating && (
        <>
          <div className="fixed top-20 right-10 text-4xl animate-pulse opacity-20">
            🎅
          </div>
          <div className="fixed top-40 left-10 text-3xl animate-bounce opacity-15">
            ⭐
          </div>
          <div className="fixed bottom-20 right-20 text-3xl opacity-20">🎄</div>
          <div className="fixed bottom-32 left-16 text-2xl opacity-15 animate-pulse">
            🎁
          </div>
        </>
      )}
    </div>
  );
}
