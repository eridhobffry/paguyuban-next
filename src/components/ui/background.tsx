"use client";

import React from "react";

type BackgroundProps = {
  className?: string;
  children?: React.ReactNode;
};

// App-wide decorative background (aurora/mesh with subtle motion)
export function Background({ className, children }: BackgroundProps) {
  return (
    <div className={`relative isolate ${className ?? ""}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(100%_100%_at_50%_0%,#000_40%,transparent)]"
        style={{
          background:
            "radial-gradient(1200px 800px at -10% -10%, hsl(270 90% 60% / .25), transparent 60%)," +
            "radial-gradient(900px 600px at 110% 10%, hsl(200 95% 55% / .25), transparent 60%)," +
            "radial-gradient(900px 700px at 50% 120%, hsl(160 95% 45% / .20), transparent 60%)",
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-[conic-gradient(from_0deg,theme(colors.violet.500/.65),theme(colors.cyan.400/.65),theme(colors.emerald.400/.65),theme(colors.violet.500/.65))] blur-3xl opacity-40 animate-[spin_40s_linear_infinite]" />
      <div className="pointer-events-none absolute -bottom-24 right-12 -z-10 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,theme(colors.fuchsia.500/.6),transparent_60%)] blur-2xl opacity-50 animate-[pulse_12s_ease-in-out_infinite]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[.06] mix-blend-overlay"
        style={{
          backgroundImage:
            'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.35"/></svg>\')',
          backgroundSize: "300px 300px",
        }}
      />
      {children}
    </div>
  );
}

export default Background;
