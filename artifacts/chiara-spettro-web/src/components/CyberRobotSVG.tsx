function hashSeed(str: string): number[] {
  const nums: number[] = [];
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
    nums.push(h);
  }
  for (let i = nums.length; i < 24; i++) {
    h = (((h << 5) + h) ^ (i * 37)) >>> 0;
    nums.push(h);
  }
  return nums;
}

const NEON_COLORS = [
  "#ff4db8", "#9b55f9", "#00f5ff", "#39ff14",
  "#ff6347", "#ff003c", "#7fff00", "#00bfff",
  "#ff1493", "#adff2f", "#ff8c00", "#da70d6",
];

export const CYBER_SEEDS = [
  "Terminator", "Skynet", "T1000", "HAL9000", "Ultron", "Borg", "Replicant", "Nexus6",
  "Blade", "Matrix", "Oracle", "AgentSmith", "Morpheus", "Trinity", "Neo", "Swordfish",
  "Hacker", "Zer0Day", "NullPtr", "RootShell", "GhostNet", "Daemon", "Phantom", "Cipher",
  "Viper", "Raven", "Void", "Flux", "NanoBot", "CoreDump", "Quantum", "VectorBot",
  "HelixAI", "ApexUnit", "PrismBot", "NexusBot", "CarbonBot", "TitanMech", "PulsarBot", "NovaCore",
];

export function CyberRobotSVG({ seed, size = 64 }: { seed: string; size?: number }) {
  const h = hashSeed(seed);
  const color = NEON_COLORS[h[0] % NEON_COLORS.length];
  const color2 = NEON_COLORS[(h[1] + 5) % NEON_COLORS.length];
  const eyeStyle = h[2] % 4;
  const mouthStyle = h[3] % 3;
  const hasAntenna = h[4] % 2 === 0;
  const hasEars = h[5] % 2 === 0;
  const eyeY = hasAntenna ? 55 : 50;
  const mouthY = hasAntenna ? 74 : 69;
  const headTop = hasAntenna ? 34 : 28;
  const uid = seed.replace(/[^a-z0-9]/gi, "");

  return (
    <svg viewBox="0 0 128 128" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`g${uid}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0L0 0 0 16" fill="none" stroke={color} strokeWidth="0.3" opacity="0.25" />
        </pattern>
        <radialGradient id={`rg${uid}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id={`bl${uid}`}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="128" height="128" fill="#0a0a0f" />
      <rect width="128" height="128" fill={`url(#g${uid})`} />
      <rect width="128" height="128" fill={`url(#rg${uid})`} />

      {/* Antenna */}
      {hasAntenna && (
        <g>
          <line x1="64" y1="8" x2="64" y2="30" stroke={color} strokeWidth="2" opacity="0.9" />
          <circle cx="64" cy="7" r="6" fill="#0a0a0f" stroke={color} strokeWidth="2" />
          <circle cx="64" cy="7" r="3" fill={color} />
          <circle cx="64" cy="7" r="8" fill="none" stroke={color} strokeWidth="0.7" opacity="0.4" filter={`url(#bl${uid})`} />
        </g>
      )}

      {/* Ears */}
      {hasEars && (
        <g>
          <rect x="21" y={headTop + 18} width="11" height="22" rx="3" fill="#111128" stroke={color} strokeWidth="1.5" />
          <rect x="24" y={headTop + 23} width="5" height="12" rx="2" fill={color} opacity="0.55" />
          <rect x="96" y={headTop + 18} width="11" height="22" rx="3" fill="#111128" stroke={color} strokeWidth="1.5" />
          <rect x="99" y={headTop + 23} width="5" height="12" rx="2" fill={color} opacity="0.55" />
        </g>
      )}

      {/* Head shadow/glow */}
      <rect x="29" y={headTop - 1} width="70" height="68" rx="11" fill={color} opacity="0.08" filter={`url(#bl${uid})`} />

      {/* Head */}
      <rect x="30" y={headTop} width="68" height="66" rx="10" fill="#111128" stroke={color} strokeWidth="2.5" />
      <rect x="33" y={headTop + 3} width="62" height="60" rx="7" fill="none" stroke={color} strokeWidth="0.7" opacity="0.18" />

      {/* Corner bolts */}
      {[[35, headTop + 6], [89, headTop + 6], [35, headTop + 56], [89, headTop + 56]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill="#0a0a0f" stroke={color} strokeWidth="1.2" opacity="0.6" />
      ))}

      {/* Status LED */}
      <circle cx="88" cy={headTop + 8} r="3.5" fill={color} opacity="0.9" />
      <circle cx="88" cy={headTop + 8} r="5.5" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />

      {/* EYES */}
      {eyeStyle === 0 && (
        // Visor / single bar
        <g>
          <rect x="38" y={eyeY - 7} width="52" height="14" rx="5" fill={color} opacity="0.15" />
          <rect x="38" y={eyeY - 7} width="52" height="14" rx="5" fill="none" stroke={color} strokeWidth="1.5" />
          <rect x="40" y={eyeY - 5} width="48" height="10" rx="3" fill={color} opacity="0.8" />
          <rect x="44" y={eyeY - 2} width="12" height="4" rx="2" fill="white" opacity="0.35" />
        </g>
      )}
      {eyeStyle === 1 && (
        // Twin circles
        <g>
          <circle cx="51" cy={eyeY} r="10" fill={color} opacity="0.1" />
          <circle cx="51" cy={eyeY} r="8" fill={color} opacity="0.85" />
          <circle cx="54" cy={eyeY - 2} r="2.5" fill="white" opacity="0.5" />
          <circle cx="77" cy={eyeY} r="10" fill={color2} opacity="0.1" />
          <circle cx="77" cy={eyeY} r="8" fill={color2} opacity="0.85" />
          <circle cx="80" cy={eyeY - 2} r="2.5" fill="white" opacity="0.5" />
        </g>
      )}
      {eyeStyle === 2 && (
        // Twin rects / HUD
        <g>
          <rect x="37" y={eyeY - 8} width="23" height="16" rx="4" fill={color} opacity="0.85" />
          <rect x="40" y={eyeY - 4} width="8" height="5" rx="2" fill="white" opacity="0.35" />
          <rect x="68" y={eyeY - 8} width="23" height="16" rx="4" fill={color2} opacity="0.85" />
          <rect x="71" y={eyeY - 4} width="8" height="5" rx="2" fill="white" opacity="0.35" />
          <line x1="60" y1={eyeY} x2="68" y2={eyeY} stroke={color} strokeWidth="1.5" opacity="0.5" />
        </g>
      )}
      {eyeStyle === 3 && (
        // Angular / diamond eyes
        <g>
          <polygon points={`38,${eyeY} 51,${eyeY - 9} 64,${eyeY} 51,${eyeY + 9}`} fill={color} opacity="0.85" />
          <polygon points={`64,${eyeY} 77,${eyeY - 9} 90,${eyeY} 77,${eyeY + 9}`} fill={color2} opacity="0.85" />
          <circle cx="51" cy={eyeY} r="2" fill="white" opacity="0.5" />
          <circle cx="77" cy={eyeY} r="2" fill="white" opacity="0.5" />
        </g>
      )}

      {/* MOUTH */}
      {mouthStyle === 0 && (
        // Grill
        <g>
          <rect x="38" y={mouthY} width="52" height="14" rx="4" fill="#0d0d1a" stroke={color} strokeWidth="1.5" opacity="0.9" />
          {[44, 51, 58, 65, 72, 79, 86].map(x => (
            <line key={x} x1={x} y1={mouthY + 2} x2={x} y2={mouthY + 12} stroke={color} strokeWidth="2.5" opacity="0.7" />
          ))}
        </g>
      )}
      {mouthStyle === 1 && (
        // LED display bar
        <g>
          <rect x="38" y={mouthY + 2} width="52" height="10" rx="5" fill={color} opacity="0.75" />
          <rect x="42" y={mouthY + 4} width="16" height="6" rx="3" fill="white" opacity="0.25" />
        </g>
      )}
      {mouthStyle === 2 && (
        // Smile arc
        <g>
          <path d={`M 40 ${mouthY} Q 64 ${mouthY + 16} 88 ${mouthY}`} fill="none" stroke={color} strokeWidth="2.5" opacity="0.9" />
          <circle cx="42" cy={mouthY + 1} r="3" fill={color} opacity="0.7" />
          <circle cx="86" cy={mouthY + 1} r="3" fill={color} opacity="0.7" />
        </g>
      )}

      {/* Neck */}
      <rect x="51" y={headTop + 68} width="26" height="12" rx="4" fill="#111128" stroke={color} strokeWidth="1.5" />
      {[56, 62, 68, 74].map(x => (
        <line key={x} x1={x} y1={headTop + 70} x2={x} y2={headTop + 78} stroke={color} strokeWidth="1.5" opacity="0.5" />
      ))}
    </svg>
  );
}

export function cyberSeedToDataURI(seed: string): string {
  return `cyber:${seed}`;
}

export function isCyberSeed(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("cyber:");
}

export function getCyberSeed(url: string): string {
  return url.replace("cyber:", "");
}
