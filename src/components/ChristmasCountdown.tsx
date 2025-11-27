"use client";

import { useState, useEffect } from "react";
import { getTimeUntilChristmas } from "@/lib/theme-scheduler";
import { HiGift, HiClock, HiSparkles } from "react-icons/hi";
import { FaTree, FaSnowflake } from "react-icons/fa";

// Valores fijos para evitar errores de hidratación
const snowflakes = [
  { left: "2%", size: 18, opacity: 0.8, duration: 5, delay: 0 },
  { left: "12%", size: 16, opacity: 0.9, duration: 4.5, delay: 0.4 },
  { left: "22%", size: 20, opacity: 0.75, duration: 5.5, delay: 0.8 },
  { left: "32%", size: 15, opacity: 0.85, duration: 4.8, delay: 1.2 },
  { left: "42%", size: 19, opacity: 0.8, duration: 5.2, delay: 1.6 },
  { left: "52%", size: 17, opacity: 0.9, duration: 4.7, delay: 2 },
  { left: "62%", size: 21, opacity: 0.75, duration: 5.3, delay: 2.4 },
  { left: "72%", size: 16, opacity: 0.85, duration: 4.9, delay: 2.8 },
  { left: "82%", size: 18, opacity: 0.8, duration: 5.1, delay: 3.2 },
  { left: "92%", size: 20, opacity: 0.9, duration: 4.6, delay: 3.6 },
];

export default function ChristmasCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilChristmas());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilChristmas());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Si el tema ya está activo, no mostrar la cuenta regresiva
  if (timeLeft.isActive) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-red-600 to-emerald-600 rounded-lg shadow-lg p-4 text-white relative overflow-hidden border border-yellow-400/50">
      {/* Copos de nieve cayendo */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {snowflakes.map((snow, i) => (
          <div
            key={`snow-${i}`}
            className="absolute"
            style={{
              left: snow.left,
              animationName: "snowfall",
              animationDuration: `${snow.duration}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationDelay: `${snow.delay}s`,
            }}
          >
            <FaSnowflake
              className="text-white drop-shadow-lg"
              style={{
                fontSize: `${snow.size}px`,
                opacity: snow.opacity,
                filter: "drop-shadow(0 0 2px rgba(255,255,255,0.8))",
              }}
            />
          </div>
        ))}
      </div>

      {/* Decoraciones navideñas estáticas */}
      <div className="absolute top-2 right-2 opacity-20 z-10">
        <FaSnowflake className="text-xl animate-pulse" />
      </div>
      <div className="absolute bottom-2 left-2 opacity-15 z-10">
        <HiSparkles
          className="text-lg animate-pulse"
          style={{ animationDelay: "0.3s" }}
        />
      </div>

      <div className="relative z-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-white/30">
            <FaTree className="text-2xl text-yellow-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <HiGift className="text-base text-yellow-300" />
              ¡Navidad Próximamente en FrontStock!
            </h3>
            <p className="text-xs text-emerald-100 flex items-center gap-1">
              <HiClock className="text-xs" />
              La magia de la Navidad está por venir
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px] text-center border border-yellow-400/40 shadow-md">
            <div
              className="text-xl font-bold text-yellow-100"
              suppressHydrationWarning
            >
              {timeLeft.days}
            </div>
            <div className="text-[10px] uppercase text-emerald-100">Días</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px] text-center border border-yellow-400/40 shadow-md">
            <div
              className="text-xl font-bold text-yellow-100"
              suppressHydrationWarning
            >
              {timeLeft.hours}
            </div>
            <div className="text-[10px] uppercase text-emerald-100">Hrs</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px] text-center border border-yellow-400/40 shadow-md hidden sm:block">
            <div
              className="text-xl font-bold text-yellow-100"
              suppressHydrationWarning
            >
              {timeLeft.minutes}
            </div>
            <div className="text-[10px] uppercase text-emerald-100">Min</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px] text-center border border-yellow-400/40 shadow-md hidden md:block">
            <div
              className="text-xl font-bold text-yellow-100"
              suppressHydrationWarning
            >
              {timeLeft.seconds}
            </div>
            <div className="text-[10px] uppercase text-emerald-100">Seg</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(140px) translateX(15px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
