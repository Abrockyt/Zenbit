import React from "react";
import { MorphIcon } from "morphicons/react";
import * as iconsData from "lucide";

// cryptocurrency-icons usually has the images accessible if served, or we can use a CDN
// Since they are installed via npm, we could import them, but dynamic imports in Vite can be tricky for all SVGs.
// Let's use a reliable CDN for crypto logos (like CoinGecko or a generic one) if local fails,
// but since we have cryptocurrency-icons installed, let's try to load them from a generic source or use initials as fallback.

export default function CryptoLogo({ symbol, size = 32 }) {
  const sym = (symbol || "").toLowerCase();
  
  // A simple fallback if image fails to load
  const [error, setError] = React.useState(false);

  if (error || !sym) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: "50%", 
          background: "rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto"
        }}
      >
        <MorphIcon icon={iconsData.Coins} size={size * 0.6} color="var(--text-tertiary)" spring="snappy" />
      </div>
    );
  }

  // Use a reliable CDN for crypto icons (jsdelivr serving the npm package we installed)
  const src = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${sym}.svg`;

  return (
    <img 
      src={src}
      alt={`${symbol} logo`}
      width={size}
      height={size}
      style={{ borderRadius: "50%", flex: "0 0 auto", objectFit: "contain" }}
      onError={() => setError(true)}
    />
  );
}
