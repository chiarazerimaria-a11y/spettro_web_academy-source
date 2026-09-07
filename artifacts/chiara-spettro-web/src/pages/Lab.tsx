import { useState, useEffect, useRef, useId, useCallback, type ReactNode } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, Download, X, AlertTriangle, Zap, Server, ChevronRight, Crosshair, Target, ChevronLeft, Wifi, WifiOff, Play, Square, Copy, Monitor, Apple, Terminal, CheckCircle2, ExternalLink, ChevronDown, ChevronUp, Flag, FileText, Clock, Send, RotateCcw, Skull, User, Trophy, Eye, Lock, BookOpen, Building2, ClipboardList, FileCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type Difficulty = "FÁCIL" | "MEDIO" | "DIFÍCIL" | "INSANO";
interface Machine {
  id: string; name: string; slug: string; os: "Linux" | "Windows";
  difficulty: Difficulty; characterType: string; points: number;
  description: string; vulnerability: string; techniques: string[];
  hints: string; ip: string | null; thumbnailUrl: string | null; downloadUrl: string | null;
  writeupUrl: string | null; videoUrl: string | null;
  solveCount: number; isActive: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAndroidImage = (id: string | number) => {
  const n = ((Number(id) % 40) + 1).toString().padStart(2, "0");
  return `/androids/android-${n}.png`;
};

const diffColorMap: Record<string, string> = {
  "FÁCIL": "#ff4db8", "MEDIO": "#f59e0b", "DIFÍCIL": "#9b55f9", "INSANO": "#ef4444",
};
const diffLevelMap: Record<string, number> = { "FÁCIL": 1, "MEDIO": 2, "DIFÍCIL": 3, "INSANO": 4 };
const diffLabelBg: Record<string, string> = {
  "FÁCIL": "bg-primary", "MEDIO": "bg-amber-400", "DIFÍCIL": "bg-fuchsia-500", "INSANO": "bg-red-500",
};
const getDifficultyColor = (d: string) => {
  const m: Record<string, string> = {
    "FÁCIL": "text-primary border-primary/50",
    "MEDIO": "text-amber-400 border-amber-400/50",
    "DIFÍCIL": "text-fuchsia-500 border-fuchsia-500/50",
    "INSANO": "text-red-500 border-red-500/50",
  };
  return m[d] || "text-primary border-primary/50";
};

// ─── Creature Portrait ────────────────────────────────────────────────────────
// Detailed SVG illustrations styled as dark-RPG / cyberpunk boss portraits
const CreaturePortrait = ({ type, diff }: { type: string; diff: string }) => {
  const uid = useId().replace(/:/g, "");
  const c = diffColorMap[diff] ?? "#ff4db8";
  const t = type.toLowerCase();
  const id = `cp-${uid}`;

  const skull = (
    <svg viewBox="0 0 100 110" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-body`} cx="42%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#c5c5cc"/>
          <stop offset="55%" stopColor="#7e7e8a"/>
          <stop offset="100%" stopColor="#1e1e28"/>
        </radialGradient>
        <radialGradient id={`${id}-jaw`} cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#8a8a94"/>
          <stop offset="100%" stopColor="#2e2e3a"/>
        </radialGradient>
        <radialGradient id={`${id}-eye`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white"/>
          <stop offset="30%" stopColor={c}/>
          <stop offset="100%" stopColor={`${c}00`}/>
        </radialGradient>
        <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="2.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
      </defs>
      {/* Shadow beneath */}
      <ellipse cx="50" cy="100" rx="32" ry="8" fill="black" opacity="0.5"/>
      {/* Skull cranium */}
      <ellipse cx="50" cy="46" rx="36" ry="38" fill={`url(#${id}-body)`}/>
      {/* Highlight */}
      <ellipse cx="40" cy="30" rx="18" ry="14" fill="rgba(255,255,255,0.10)"/>
      <ellipse cx="36" cy="26" rx="9" ry="7" fill="rgba(255,255,255,0.08)"/>
      {/* Dark sides */}
      <ellipse cx="16" cy="50" rx="10" ry="20" fill="rgba(0,0,0,0.35)"/>
      <ellipse cx="84" cy="50" rx="10" ry="20" fill="rgba(0,0,0,0.35)"/>
      {/* Jaw */}
      <path d="M18 68 Q18 94 50 96 Q82 94 82 68Z" fill={`url(#${id}-jaw)`}/>
      <path d="M22 68 Q22 90 50 91 Q78 90 78 68Z" fill="rgba(0,0,0,0.20)"/>
      {/* Eye sockets */}
      <ellipse cx="32" cy="51" rx="14" ry="16" fill="#0e0e18"/>
      <ellipse cx="68" cy="51" rx="14" ry="16" fill="#0e0e18"/>
      {/* Eye glow outer */}
      <ellipse cx="32" cy="51" rx="10" ry="12" fill={c} opacity="0.15" filter={`url(#${id}-glow)`}/>
      <ellipse cx="68" cy="51" rx="10" ry="12" fill={c} opacity="0.15" filter={`url(#${id}-glow)`}/>
      {/* Eye glow mid */}
      <ellipse cx="32" cy="51" rx="6.5" ry="8" fill={c} opacity="0.5"/>
      <ellipse cx="68" cy="51" rx="6.5" ry="8" fill={c} opacity="0.5"/>
      {/* Eye core */}
      <ellipse cx="32" cy="51" rx="3" ry="3.5" fill="white"/>
      <ellipse cx="68" cy="51" rx="3" ry="3.5" fill="white"/>
      <circle cx="32" cy="51" r="1.5" fill={c}/>
      <circle cx="68" cy="51" r="1.5" fill={c}/>
      {/* Nose */}
      <path d="M44 66 L50 73 L56 66 L53 62 Q50 59 47 62Z" fill="#080814"/>
      {/* Teeth */}
      {[28,34,40,46,54,60,66].map((x, i) => (
        <rect key={i} x={x - 2} y={80} width={4} height={i % 3 === 0 ? 9 : 7} rx="1" fill="#d8d8e0" opacity="0.9"/>
      ))}
      {/* Cracks */}
      <path d="M50 10 L47 24 L51 34" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M30 20 L38 30" stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M64 28 L70 36" stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" strokeLinecap="round"/>
      {/* Outer glow ring */}
      <ellipse cx="50" cy="46" rx="37" ry="39" fill="none" stroke={c} strokeWidth="0.5" opacity="0.4"/>
    </svg>
  );

  const robot = (
    <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6a6a78"/>
          <stop offset="50%" stopColor="#3c3c4a"/>
          <stop offset="100%" stopColor="#1a1a28"/>
        </linearGradient>
        <linearGradient id={`${id}-panel`} x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#4a4a5a"/>
          <stop offset="100%" stopColor="#28282e"/>
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={c}/>
          <stop offset="60%" stopColor={`${c}60`}/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="110" rx="30" ry="8" fill="black" opacity="0.5"/>
      {/* Neck */}
      <rect x="38" y="90" width="24" height="18" rx="4" fill={`url(#${id}-metal)`}/>
      {/* Panel lines on neck */}
      {[0,1,2].map(i => <rect key={i} x="40" y={93+i*4} width="20" height="1" rx="0.5" fill="rgba(0,0,0,0.4)"/>)}
      {/* Head */}
      <rect x="14" y="18" width="72" height="76" rx="8" fill={`url(#${id}-metal)`}/>
      {/* Face plate */}
      <rect x="18" y="22" width="64" height="68" rx="6" fill={`url(#${id}-panel)`}/>
      {/* Panel lines on head */}
      <line x1="50" y1="22" x2="50" y2="90" stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
      <line x1="14" y1="55" x2="86" y2="55" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8"/>
      {/* Eyes */}
      <rect x="22" y="34" width="22" height="14" rx="3" fill="#0a0a12"/>
      <rect x="56" y="34" width="22" height="14" rx="3" fill="#0a0a12"/>
      {/* Eye screens */}
      <rect x="24" y="36" width="18" height="10" rx="2" fill={`url(#${id}-core)`}/>
      <rect x="58" y="36" width="18" height="10" rx="2" fill={`url(#${id}-core)`}/>
      {/* Eye scan lines */}
      {[0,1,2].map(i => <rect key={i} x={24} y={36+i*3.3} width={18} height={0.8} rx="0.4" fill="rgba(0,0,0,0.4)"/>)}
      {[0,1,2].map(i => <rect key={i} x={58} y={36+i*3.3} width={18} height={0.8} rx="0.4" fill="rgba(0,0,0,0.4)"/>)}
      {/* Nose sensor */}
      <circle cx="50" cy="58" r="4" fill="#0a0a12"/>
      <circle cx="50" cy="58" r="2.5" fill={c} opacity="0.8"/>
      <circle cx="50" cy="58" r="1.2" fill="white"/>
      {/* Mouth grille */}
      <rect x="24" y="68" width="52" height="12" rx="3" fill="#080810"/>
      {[0,1,2,3,4,5].map(i => <rect key={i} x={26+i*8} y={70} width={4} height={8} rx="1" fill={c} opacity={0.25+i*0.05}/>)}
      {/* Bolts */}
      {[[20,26],[80,26],[20,84],[80,84]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#555566"/>
      ))}
      {/* Antenna */}
      <rect x="48" y="6" width="4" height="14" rx="2" fill="#6a6a78"/>
      <circle cx="50" cy="5" r="4" fill="#3c3c4a"/>
      <circle cx="50" cy="5" r="2.5" fill={c} opacity="0.9"/>
      {/* Side vents */}
      {[0,1,2].map(i => <rect key={i} x={8} y={40+i*8} width={6} height={4} rx="1" fill="rgba(0,0,0,0.5)"/>)}
      {[0,1,2].map(i => <rect key={i} x={86} y={40+i*8} width={6} height={4} rx="1" fill="rgba(0,0,0,0.5)"/>)}
      <rect x="8" y="56" width="6" height="4" rx="1" fill={c} opacity="0.4"/>
      <rect x="86" y="56" width="6" height="4" rx="1" fill={c} opacity="0.4"/>
    </svg>
  );

  const demon = (
    <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-skin`} cx="50%" cy="40%">
          <stop offset="0%" stopColor="#8a2020"/>
          <stop offset="60%" stopColor="#5a0e0e"/>
          <stop offset="100%" stopColor="#1a0404"/>
        </radialGradient>
        <radialGradient id={`${id}-eyes`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="white"/>
          <stop offset="40%" stopColor={c}/>
          <stop offset="100%" stopColor="#4a0000"/>
        </radialGradient>
        <linearGradient id={`${id}-horn`} x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#3a1a00"/>
          <stop offset="100%" stopColor="#6a3010"/>
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="112" rx="28" ry="7" fill="black" opacity="0.5"/>
      {/* Horns */}
      <path d="M26 32 Q16 6 22 2 Q30 8 34 22" fill={`url(#${id}-horn)`}/>
      <path d="M28 30 Q19 8 24 3 Q31 9 34 24" fill="rgba(255,255,255,0.06)"/>
      <path d="M74 32 Q84 6 78 2 Q70 8 66 22" fill={`url(#${id}-horn)`}/>
      <path d="M72 30 Q81 8 76 3 Q69 9 66 24" fill="rgba(255,255,255,0.06)"/>
      {/* Small side horns */}
      <path d="M18 50 Q10 38 16 34 Q20 40 22 50" fill={`url(#${id}-horn)`}/>
      <path d="M82 50 Q90 38 84 34 Q80 40 78 50" fill={`url(#${id}-horn)`}/>
      {/* Head */}
      <path d="M16 56 Q14 26 50 20 Q86 26 84 56 Q84 90 50 96 Q16 90 16 56Z" fill={`url(#${id}-skin)`}/>
      {/* Highlight */}
      <ellipse cx="40" cy="38" rx="18" ry="14" fill="rgba(255,100,100,0.10)"/>
      {/* Wrinkles / texture */}
      <path d="M28 44 Q34 40 40 44" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none"/>
      <path d="M60 44 Q66 40 72 44" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none"/>
      {/* Brow */}
      <path d="M20 46 Q34 38 46 46" stroke="#2a0505" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M80 46 Q66 38 54 46" stroke="#2a0505" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* Eyes */}
      <ellipse cx="34" cy="54" rx="11" ry="9" fill="#080204"/>
      <ellipse cx="66" cy="54" rx="11" ry="9" fill="#080204"/>
      <ellipse cx="34" cy="54" rx="7.5" ry="6" fill={c} opacity="0.4"/>
      <ellipse cx="66" cy="54" rx="7.5" ry="6" fill={c} opacity="0.4"/>
      <ellipse cx="34" cy="54" rx="4.5" ry="5" fill={c} opacity="0.8"/>
      <ellipse cx="66" cy="54" rx="4.5" ry="5" fill={c} opacity="0.8"/>
      <ellipse cx="34" cy="54" rx="2" ry="4" fill="#0a0000"/>
      <ellipse cx="66" cy="54" rx="2" ry="4" fill="#0a0000"/>
      <ellipse cx="33" cy="51" rx="2" ry="1.2" fill="rgba(255,255,255,0.3)"/>
      <ellipse cx="65" cy="51" rx="2" ry="1.2" fill="rgba(255,255,255,0.3)"/>
      {/* Nose */}
      <path d="M46 64 Q50 68 54 64 Q52 60 50 61 Q48 60 46 64Z" fill="#1a0404"/>
      {/* Mouth - snarl with fangs */}
      <path d="M26 76 Q50 88 74 76" stroke="#1a0404" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M28 76 Q50 84 72 76" fill="rgba(100,10,10,0.5)"/>
      {/* Fangs */}
      <path d="M36 76 L33 84 L39 84Z" fill="#e8e8f0"/>
      <path d="M44 78 L42 86 L48 86Z" fill="#e8e8f0"/>
      <path d="M64 76 L67 84 L61 84Z" fill="#e8e8f0"/>
      <path d="M56 78 L58 86 L52 86Z" fill="#e8e8f0"/>
      {/* Chin shadow */}
      <ellipse cx="50" cy="92" rx="22" ry="6" fill="rgba(0,0,0,0.4)"/>
    </svg>
  );

  const spider = (
    <svg viewBox="0 0 120 100" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-body`} cx="50%" cy="40%">
          <stop offset="0%" stopColor="#2a1a2a"/>
          <stop offset="60%" stopColor="#140a14"/>
          <stop offset="100%" stopColor="#060208"/>
        </radialGradient>
        <radialGradient id={`${id}-ab`} cx="50%" cy="30%">
          <stop offset="0%" stopColor="#1e101e"/>
          <stop offset="70%" stopColor="#0c050c"/>
          <stop offset="100%" stopColor="#040204"/>
        </radialGradient>
      </defs>
      {/* Back legs */}
      <path d="M38 54 Q20 46 6 30" stroke="#1a0e1a" strokeWidth="4" strokeLinecap="round"/>
      <path d="M36 58 Q16 56 4 46" stroke="#1a0e1a" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M37 62 Q18 66 8 76" stroke="#1a0e1a" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M38 66 Q22 78 18 90" stroke="#1a0e1a" strokeWidth="3" strokeLinecap="round"/>
      <path d="M82 54 Q100 46 114 30" stroke="#1a0e1a" strokeWidth="4" strokeLinecap="round"/>
      <path d="M84 58 Q104 56 116 46" stroke="#1a0e1a" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M83 62 Q102 66 112 76" stroke="#1a0e1a" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M82 66 Q98 78 102 90" stroke="#1a0e1a" strokeWidth="3" strokeLinecap="round"/>
      {/* Leg joints */}
      {[[12,32],[8,48],[10,76],[22,88]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#2a1a2a"/>)}
      {[[108,32],[112,48],[110,76],[98,88]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#2a1a2a"/>)}
      {/* Abdomen */}
      <ellipse cx="60" cy="72" rx="22" ry="26" fill={`url(#${id}-ab)`}/>
      <ellipse cx="55" cy="64" rx="14" ry="10" fill="rgba(255,255,255,0.04)"/>
      {/* Abdomen pattern */}
      {[0,1,2].map(i => (
        <ellipse key={i} cx="60" cy={60+i*8} rx={14-i*3} ry={4} fill="none" stroke={c} strokeWidth="0.5" opacity="0.3"/>
      ))}
      {/* Cephalothorax */}
      <ellipse cx="60" cy="44" rx="24" ry="20" fill={`url(#${id}-body)`}/>
      <ellipse cx="54" cy="36" rx="14" ry="10" fill="rgba(255,255,255,0.06)"/>
      {/* Main eyes (2 large) */}
      <ellipse cx="50" cy="42" rx="9" ry="8" fill="#060210"/>
      <ellipse cx="70" cy="42" rx="9" ry="8" fill="#060210"/>
      <ellipse cx="50" cy="42" rx="5.5" ry="5" fill={c} opacity="0.5"/>
      <ellipse cx="70" cy="42" rx="5.5" ry="5" fill={c} opacity="0.5"/>
      <circle cx="50" cy="42" r="3" fill={c} opacity="0.9"/>
      <circle cx="70" cy="42" r="3" fill={c} opacity="0.9"/>
      <circle cx="50" cy="40.5" r="1.2" fill="white"/>
      <circle cx="70" cy="40.5" r="1.2" fill="white"/>
      {/* Secondary eyes (6 small) */}
      {[[38,36],[43,34],[57,34],[62,36],[76,34],[82,36]].map(([ex,ey],i) => (
        <g key={i}>
          <circle cx={ex} cy={ey} r="3.5" fill="#060210"/>
          <circle cx={ex} cy={ey} r="2" fill={c} opacity="0.65"/>
          <circle cx={ex-0.5} cy={ey-0.7} r="0.8" fill="rgba(255,255,255,0.4)"/>
        </g>
      ))}
      {/* Chelicerae / fangs */}
      <path d="M44 52 Q42 56 38 60 Q36 66 40 68" stroke="#1a0e1a" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M76 52 Q78 56 82 60 Q84 66 80 68" stroke="#1a0e1a" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <ellipse cx="40" cy="68" rx="3" ry="2" fill="#d8d8e0"/>
      <ellipse cx="80" cy="68" rx="3" ry="2" fill="#d8d8e0"/>
    </svg>
  );

  const ghost = (
    <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-body`} cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="rgba(200,220,255,0.85)"/>
          <stop offset="60%" stopColor="rgba(140,170,220,0.5)"/>
          <stop offset="100%" stopColor="rgba(80,100,160,0.08)"/>
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={c}/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {/* Outer ethereal aura */}
      <ellipse cx="50" cy="55" rx="44" ry="52" fill={c} opacity="0.04"/>
      <ellipse cx="50" cy="55" rx="38" ry="46" fill={c} opacity="0.06"/>
      {/* Wispy tendrils */}
      <path d="M20 82 Q14 92 18 100 Q12 95 10 104" stroke="rgba(160,180,220,0.35)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M50 88 Q50 98 46 106" stroke="rgba(160,180,220,0.3)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M80 82 Q86 92 82 100 Q88 95 90 104" stroke="rgba(160,180,220,0.35)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M35 86 Q30 96 34 104" stroke="rgba(160,180,220,0.25)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M65 86 Q70 96 66 104" stroke="rgba(160,180,220,0.25)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Main body */}
      <path d="M14 50 Q14 18 50 12 Q86 18 86 50 L86 82 Q78 76 72 84 Q66 76 60 84 Q54 76 50 82 Q46 76 40 84 Q34 76 28 84 Q22 76 14 82Z" fill={`url(#${id}-body)`}/>
      {/* Inner glow */}
      <ellipse cx="50" cy="44" rx="28" ry="24" fill="rgba(180,210,255,0.12)"/>
      {/* Shading */}
      <path d="M14 54 Q16 32 50 18" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none"/>
      <ellipse cx="34" cy="30" rx="12" ry="8" fill="rgba(255,255,255,0.08)"/>
      {/* Eye sockets */}
      <ellipse cx="35" cy="48" rx="13" ry="15" fill="rgba(10,15,40,0.85)"/>
      <ellipse cx="65" cy="48" rx="13" ry="15" fill="rgba(10,15,40,0.85)"/>
      {/* Eye glow */}
      <ellipse cx="35" cy="48" rx="8" ry="10" fill={c} opacity="0.25"/>
      <ellipse cx="65" cy="48" rx="8" ry="10" fill={c} opacity="0.25"/>
      <ellipse cx="35" cy="48" rx="5" ry="6.5" fill={c} opacity="0.6"/>
      <ellipse cx="65" cy="48" rx="5" ry="6.5" fill={c} opacity="0.6"/>
      <ellipse cx="35" cy="48" rx="2.5" ry="3.5" fill="white"/>
      <ellipse cx="65" cy="48" rx="2.5" ry="3.5" fill="white"/>
      <ellipse cx="34" cy="46" rx="1.2" ry="1.5" fill={c}/>
      <ellipse cx="64" cy="46" rx="1.2" ry="1.5" fill={c}/>
      {/* Mouth */}
      <path d="M38 64 Q50 72 62 64" stroke="rgba(10,15,40,0.8)" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Floating particles */}
      {[[22,20,0.4],[78,28,0.3],[18,38,0.2],[82,42,0.25],[60,18,0.35]].map(([px,py,op],i) => (
        <circle key={i} cx={px} cy={py} r="2" fill={c} opacity={op}/>
      ))}
    </svg>
  );

  const dragon = (
    <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-head`} cx="45%" cy="38%">
          <stop offset="0%" stopColor="#3a6040"/>
          <stop offset="55%" stopColor="#1e3822"/>
          <stop offset="100%" stopColor="#0a1410"/>
        </radialGradient>
        <linearGradient id={`${id}-horn`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a2010"/>
          <stop offset="100%" stopColor="#5a4020"/>
        </linearGradient>
        <radialGradient id={`${id}-fire`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffcc00"/>
          <stop offset="40%" stopColor="#ff6600"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="112" rx="28" ry="7" fill="black" opacity="0.4"/>
      {/* Horns */}
      <path d="M28 22 Q18 2 24 0 Q32 6 36 22" fill={`url(#${id}-horn)`}/>
      <path d="M30 20 Q20 4 25 1 Q32 7 36 20" fill="rgba(255,255,255,0.06)"/>
      <path d="M72 22 Q82 2 76 0 Q68 6 64 22" fill={`url(#${id}-horn)`}/>
      <path d="M70 20 Q80 4 75 1 Q68 7 64 20" fill="rgba(255,255,255,0.06)"/>
      {/* Ear frills */}
      <path d="M18 44 Q6 36 8 28 Q16 34 20 44" fill={`url(#${id}-horn)`} opacity="0.8"/>
      <path d="M82 44 Q94 36 92 28 Q84 34 80 44" fill={`url(#${id}-horn)`} opacity="0.8"/>
      {/* Head */}
      <path d="M18 52 Q16 26 50 20 Q84 26 82 52 Q84 78 50 84 Q16 78 18 52Z" fill={`url(#${id}-head)`}/>
      {/* Scale pattern */}
      {[[50,32,8],[38,38,6],[62,38,6],[30,46,6],[50,44,8],[70,46,6],[36,54,6],[64,54,6],[50,60,7]].map(([sx,sy,sr],i) => (
        <path key={i} d={`M${sx},${sy-sr} Q${sx+sr},${sy} ${sx},${sy+sr/2} Q${sx-sr},${sy} ${sx},${sy-sr}`} fill="rgba(0,0,0,0.2)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5"/>
      ))}
      {/* Brow ridges */}
      <path d="M20 46 Q34 38 46 46" stroke="#0a1410" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M80 46 Q66 38 54 46" stroke="#0a1410" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* Eyes */}
      <ellipse cx="33" cy="52" rx="11" ry="10" fill="#050a06"/>
      <ellipse cx="67" cy="52" rx="11" ry="10" fill="#050a06"/>
      <ellipse cx="33" cy="52" rx="7" ry="7" fill={c} opacity="0.45"/>
      <ellipse cx="67" cy="52" rx="7" ry="7" fill={c} opacity="0.45"/>
      <ellipse cx="33" cy="52" rx="4.5" ry="6" fill={c} opacity="0.85"/>
      <ellipse cx="67" cy="52" rx="4.5" ry="6" fill={c} opacity="0.85"/>
      <ellipse cx="33" cy="52" rx="2" ry="5.5" fill="#020404"/>
      <ellipse cx="67" cy="52" rx="2" ry="5.5" fill="#020404"/>
      <ellipse cx="31.5" cy="49" rx="2" ry="1.5" fill="rgba(255,255,255,0.35)"/>
      <ellipse cx="65.5" cy="49" rx="2" ry="1.5" fill="rgba(255,255,255,0.35)"/>
      {/* Snout */}
      <path d="M38 64 Q50 70 62 64 Q62 76 50 82 Q38 76 38 64Z" fill="#1a3020"/>
      {/* Nostrils */}
      <ellipse cx="44" cy="68" rx="3.5" ry="2.5" fill="#0a1410"/>
      <ellipse cx="56" cy="68" rx="3.5" ry="2.5" fill="#0a1410"/>
      {/* Fire breath glow */}
      <ellipse cx="50" cy="84" rx="14" ry="6" fill={`url(#${id}-fire)`} opacity="0.5"/>
      <ellipse cx="50" cy="88" rx="8" ry="4" fill="#ff6600" opacity="0.3"/>
    </svg>
  );

  const virus = (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-core`} cx="40%" cy="38%">
          <stop offset="0%" stopColor="#4a0a5a"/>
          <stop offset="50%" stopColor="#2a0638"/>
          <stop offset="100%" stopColor="#10021a"/>
        </radialGradient>
        <radialGradient id={`${id}-inner`} cx="45%" cy="40%">
          <stop offset="0%" stopColor={c} stopOpacity="0.4"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {/* Outer spikes */}
      {Array.from({length: 16}, (_, i) => {
        const a = (i * 22.5) * Math.PI / 180;
        const x1 = 50 + 26 * Math.cos(a), y1 = 50 + 26 * Math.sin(a);
        const x2 = 50 + 40 * Math.cos(a), y2 = 50 + 40 * Math.sin(a);
        const xb1 = 50 + 24 * Math.cos(a - 0.15), yb1 = 50 + 24 * Math.sin(a - 0.15);
        const xb2 = 50 + 24 * Math.cos(a + 0.15), yb2 = 50 + 24 * Math.sin(a + 0.15);
        return (
          <path key={i} d={`M${xb1},${yb1} L${x2},${y2} L${xb2},${yb2}`} fill={c} opacity="0.7"/>
        );
      })}
      {/* Spike tips */}
      {Array.from({length: 16}, (_, i) => {
        const a = (i * 22.5) * Math.PI / 180;
        return <circle key={i} cx={50 + 40 * Math.cos(a)} cy={50 + 40 * Math.sin(a)} r="2.5" fill={c} opacity="0.9"/>;
      })}
      {/* Main body */}
      <circle cx="50" cy="50" r="26" fill={`url(#${id}-core)`}/>
      {/* Highlight */}
      <ellipse cx="42" cy="40" rx="12" ry="9" fill="rgba(255,255,255,0.07)"/>
      {/* Inner structure */}
      <circle cx="50" cy="50" r="19" fill={`url(#${id}-inner)`}/>
      <circle cx="50" cy="50" r="13" fill="rgba(0,0,0,0.4)"/>
      {/* Nucleus */}
      <circle cx="50" cy="50" r="8" fill={c} opacity="0.35"/>
      <circle cx="50" cy="50" r="5" fill={c} opacity="0.6"/>
      <circle cx="50" cy="50" r="3" fill="white" opacity="0.8"/>
      {/* DNA strands */}
      <path d="M36 44 Q50 50 64 44" stroke={c} strokeWidth="1" fill="none" opacity="0.4"/>
      <path d="M36 50 Q50 56 64 50" stroke={c} strokeWidth="1" fill="none" opacity="0.4"/>
      <path d="M36 56 Q50 50 64 56" stroke={c} strokeWidth="1" fill="none" opacity="0.4"/>
      {/* Eyes */}
      <ellipse cx="40" cy="47" rx="4.5" ry="3.5" fill="#0a0010"/>
      <ellipse cx="60" cy="47" rx="4.5" ry="3.5" fill="#0a0010"/>
      <ellipse cx="40" cy="47" rx="2.5" ry="2" fill={c} opacity="0.9"/>
      <ellipse cx="60" cy="47" rx="2.5" ry="2" fill={c} opacity="0.9"/>
      <circle cx="39.5" cy="46.5" r="1" fill="white"/>
      <circle cx="59.5" cy="46.5" r="1" fill="white"/>
    </svg>
  );

  const ninja = (
    <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-cloth`} cx="50%" cy="30%">
          <stop offset="0%" stopColor="#1a1a1e"/>
          <stop offset="100%" stopColor="#060608"/>
        </radialGradient>
        <linearGradient id={`${id}-blade`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#888890"/>
          <stop offset="50%" stopColor="white"/>
          <stop offset="100%" stopColor="#888890"/>
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="114" rx="26" ry="6" fill="black" opacity="0.45"/>
      {/* Shadow/cape behind */}
      <path d="M18 60 Q8 80 12 110 Q30 104 50 108 Q70 104 88 110 Q92 80 82 60Z" fill="#060608" opacity="0.7"/>
      {/* Head */}
      <ellipse cx="50" cy="46" rx="30" ry="32" fill={`url(#${id}-cloth)`}/>
      {/* Face wrap — top */}
      <rect x="18" y="24" width="64" height="28" rx="4" fill="#0e0e12"/>
      {/* Eye slit */}
      <rect x="20" y="40" width="60" height="14" rx="2" fill="#0a0a0e"/>
      {/* Eyes through slit */}
      <ellipse cx="36" cy="47" rx="9" ry="5" fill="#060610"/>
      <ellipse cx="64" cy="47" rx="9" ry="5" fill="#060610"/>
      <ellipse cx="36" cy="47" rx="5.5" ry="3" fill={c} opacity="0.6"/>
      <ellipse cx="64" cy="47" rx="5.5" ry="3" fill={c} opacity="0.6"/>
      <ellipse cx="36" cy="47" rx="3" ry="2.5" fill={c} opacity="0.95"/>
      <ellipse cx="64" cy="47" rx="3" ry="2.5" fill={c} opacity="0.95"/>
      <ellipse cx="34.5" cy="45.5" rx="1.5" ry="1" fill="rgba(255,255,255,0.3)"/>
      <ellipse cx="62.5" cy="45.5" rx="1.5" ry="1" fill="rgba(255,255,255,0.3)"/>
      {/* Face wrap — bottom */}
      <rect x="20" y="54" width="60" height="20" rx="3" fill="#0c0c10"/>
      {/* Cloth folds */}
      <path d="M20 54 Q24 60 20 66" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none"/>
      <path d="M80 54 Q76 60 80 66" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none"/>
      {/* Shurikens */}
      {[[-1,1],[1,-1],[1,1],[-1,-1]].map(([dx,dy], i) => (
        <path key={i} d={`M${18+dx*3} ${24+dy*3} L21 27 L18 30`} fill="#555560" transform={`rotate(${i*90},18,27)`}/>
      ))}
      <circle cx="18" cy="27" r="2.5" fill="#888890"/>
      {/* Katana handle peeking */}
      <rect x="82" y="20" width="5" height="28" rx="2" fill="#1a1210"/>
      <rect x="83" y="22" width="3" height="24" rx="1.5" fill={`url(#${id}-blade)`} opacity="0.6"/>
      <rect x="79" y="32" width="11" height="6" rx="1" fill="#1a1210"/>
      {/* Head binding */}
      <rect x="18" y="24" width="64" height="4" rx="2" fill="#14141a"/>
      <path d="M24 24 Q50 20 76 24" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none"/>
    </svg>
  );

  const phantom = (
    <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-cloak`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#16101a"/>
          <stop offset="70%" stopColor="#0a060e"/>
          <stop offset="100%" stopColor="#040206"/>
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="45%" cy="40%">
          <stop offset="0%" stopColor="#c4c0b8"/>
          <stop offset="60%" stopColor="#7a7870"/>
          <stop offset="100%" stopColor="#2a2820"/>
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="114" rx="24" ry="6" fill="black" opacity="0.4"/>
      {/* Floating particles */}
      {[[22,18,0.3],[78,22,0.25],[15,44,0.2],[85,50,0.2],[60,14,0.3],[40,16,0.25]].map(([px,py,op],i) => (
        <circle key={i} cx={px} cy={py} r="1.5" fill={c} opacity={op}/>
      ))}
      {/* Cloak / body */}
      <path d="M18 46 Q14 22 50 16 Q86 22 82 46 L88 90 Q70 84 50 90 Q30 84 12 90Z" fill={`url(#${id}-cloak)`}/>
      {/* Cloak folds */}
      <path d="M18 46 Q16 60 12 90" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" fill="none"/>
      <path d="M82 46 Q84 60 88 90" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" fill="none"/>
      <path d="M35 28 Q30 50 32 88" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none"/>
      <path d="M65 28 Q70 50 68 88" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none"/>
      {/* Hood shadow */}
      <ellipse cx="50" cy="36" rx="26" ry="20" fill="rgba(0,0,0,0.5)"/>
      {/* Skull face within hood */}
      <ellipse cx="50" cy="40" rx="18" ry="20" fill={`url(#${id}-face)`}/>
      <ellipse cx="42" cy="32" rx="10" ry="8" fill="rgba(255,255,255,0.08)"/>
      {/* Eye sockets */}
      <ellipse cx="38" cy="40" rx="9" ry="11" fill="#0c0810"/>
      <ellipse cx="62" cy="40" rx="9" ry="11" fill="#0c0810"/>
      {/* Eye glow */}
      <ellipse cx="38" cy="40" rx="5.5" ry="7" fill={c} opacity="0.2"/>
      <ellipse cx="62" cy="40" rx="5.5" ry="7" fill={c} opacity="0.2"/>
      <ellipse cx="38" cy="40" rx="3.5" ry="4.5" fill={c} opacity="0.55"/>
      <ellipse cx="62" cy="40" rx="3.5" ry="4.5" fill={c} opacity="0.55"/>
      <ellipse cx="38" cy="40" rx="1.8" ry="2.5" fill="white"/>
      <ellipse cx="62" cy="40" rx="1.8" ry="2.5" fill="white"/>
      {/* Nose */}
      <path d="M46 50 L50 55 L54 50 Q52 47 50 48 Q48 47 46 50Z" fill="#080610"/>
      {/* Skeletal jaw hint */}
      <path d="M34 58 Q50 66 66 58" stroke="#4a4840" strokeWidth="1.5" fill="none"/>
      {/* Spectral hands */}
      <path d="M20 74 Q14 68 10 72 Q12 78 18 76 Q14 80 12 86 Q16 84 20 80 Q18 86 22 88 Q24 82 24 78 Q28 84 30 82 Q26 76 24 72Z" fill={c} opacity="0.15"/>
      <path d="M80 74 Q86 68 90 72 Q88 78 82 76 Q86 80 88 86 Q84 84 80 80 Q82 86 78 88 Q76 82 76 78 Q72 84 70 82 Q74 76 76 72Z" fill={c} opacity="0.15"/>
    </svg>
  );

  const cyber = (
    <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id={`${id}-chrome`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8a8a96"/>
          <stop offset="40%" stopColor="#4a4a58"/>
          <stop offset="100%" stopColor="#1e1e2a"/>
        </linearGradient>
        <linearGradient id={`${id}-organic`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a2420"/>
          <stop offset="60%" stopColor="#1e1210"/>
          <stop offset="100%" stopColor="#0a0806"/>
        </linearGradient>
        <radialGradient id={`${id}-screen`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={c}/>
          <stop offset="60%" stopColor={`${c}60`}/>
          <stop offset="100%" stopColor={`${c}10`}/>
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="112" rx="28" ry="7" fill="black" opacity="0.45"/>
      {/* Left side: organic */}
      <path d="M18 50 Q16 24 50 18 Q50 18 50 94 Q16 88 18 50Z" fill={`url(#${id}-organic)`}/>
      {/* Right side: cybernetic */}
      <path d="M82 50 Q84 24 50 18 Q50 18 50 94 Q84 88 82 50Z" fill={`url(#${id}-chrome)`}/>
      {/* Center division scar */}
      <line x1="50" y1="14" x2="50" y2="96" stroke={c} strokeWidth="1.5" opacity="0.5"/>
      <line x1="50" y1="14" x2="50" y2="96" stroke="black" strokeWidth="0.5"/>
      {/* Organic side highlights */}
      <ellipse cx="34" cy="34" rx="12" ry="10" fill="rgba(255,150,100,0.08)"/>
      {/* Chrome panel lines */}
      {[28,36,44,52,60,68].map((y, i) => (
        <path key={i} d={`M52 ${y} Q68 ${y} 80 ${y+4}`} stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none"/>
      ))}
      {/* Bolts on chrome side */}
      {[[60,28],[74,34],[78,48],[70,60]].map(([bx,by],i) => (
        <circle key={i} cx={bx} cy={by} r="2.5" fill="#6a6a78" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5"/>
      ))}
      {/* Left eye: organic */}
      <ellipse cx="33" cy="50" rx="11" ry="10" fill="#150e0a"/>
      <ellipse cx="33" cy="50" rx="7" ry="7" fill="#4a2010" opacity="0.6"/>
      <ellipse cx="33" cy="50" rx="4" ry="5" fill="#8a3018" opacity="0.8"/>
      <ellipse cx="33" cy="50" rx="2" ry="3" fill="#0a0404"/>
      <ellipse cx="31.5" cy="47.5" rx="1.5" ry="1.2" fill="rgba(255,200,180,0.3)"/>
      {/* Right eye: scanner */}
      <rect x="54" y="42" width="24" height="16" rx="3" fill="#060812"/>
      <rect x="56" y="44" width="20" height="12" rx="2" fill={`url(#${id}-screen)`}/>
      {/* Scanner lines */}
      {[0,1,2,3].map(i => <rect key={i} x="57" y={45+i*2.5} width="18" height="0.8" rx="0.4" fill="rgba(0,0,0,0.5)"/>)}
      {/* Scanner crosshair */}
      <line x1="66" y1="47" x2="66" y2="53" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
      <line x1="63" y1="50" x2="69" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
      <circle cx="66" cy="50" r="3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
      {/* Neural ports on chrome side */}
      {[[58,68],[64,72],[70,68]].map(([px,py],i) => (
        <g key={i}>
          <circle cx={px} cy={py} r="3" fill="#282830"/>
          <circle cx={px} cy={py} r="1.5" fill={c} opacity="0.6"/>
        </g>
      ))}
      {/* Mouth: organic left, speaker right */}
      <path d="M22 70 Q50 78 50 76" stroke="#1a0e08" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="50" y="70" width="28" height="8" rx="2" fill="#0a0a12"/>
      {[52,56,60,64,68,72].map(x => <rect key={x} x={x} y={72} width="2" height="4" rx="0.5" fill={c} opacity="0.4"/>)}
      {/* Antenna */}
      <line x1="68" y1="18" x2="76" y2="6" stroke="#6a6a78" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="77" cy="5" r="2.5" fill={c} opacity="0.8"/>
    </svg>
  );

  const eye = (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-iris`} cx="45%" cy="38%">
          <stop offset="0%" stopColor="#8a5a18"/>
          <stop offset="40%" stopColor="#4a2a08"/>
          <stop offset="100%" stopColor="#1a0a02"/>
        </radialGradient>
        <radialGradient id={`${id}-eyeglow`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={c}/>
          <stop offset="50%" stopColor={`${c}80`}/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {/* Eyelid shape */}
      <path d="M6 50 Q50 6 94 50 Q50 94 6 50Z" fill="#0a0406"/>
      {/* Sclera (white of eye) */}
      <path d="M10 50 Q50 14 90 50 Q50 86 10 50Z" fill="#e8e4dc"/>
      {/* Blood vessels */}
      <path d="M10 50 Q20 38 30 42" stroke="#cc4444" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M14 54 Q22 46 28 48" stroke="#cc4444" strokeWidth="0.7" fill="none" opacity="0.4"/>
      <path d="M90 50 Q80 38 70 42" stroke="#cc4444" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M86 54 Q78 46 72 48" stroke="#cc4444" strokeWidth="0.7" fill="none" opacity="0.4"/>
      <path d="M30 26 Q40 36 44 44" stroke="#cc4444" strokeWidth="0.8" fill="none" opacity="0.4"/>
      <path d="M70 26 Q60 36 56 44" stroke="#cc4444" strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* Iris */}
      <circle cx="50" cy="50" r="28" fill={`url(#${id}-iris)`}/>
      {/* Iris pattern / fibers */}
      {Array.from({length: 16}, (_, i) => {
        const a = (i * 22.5) * Math.PI / 180;
        return <line key={i} x1={50 + 10 * Math.cos(a)} y1={50 + 10 * Math.sin(a)} x2={50 + 27 * Math.cos(a)} y2={50 + 27 * Math.sin(a)} stroke="rgba(120,80,20,0.35)" strokeWidth="0.8"/>;
      })}
      <circle cx="50" cy="50" r="27" fill="none" stroke="rgba(120,80,20,0.2)" strokeWidth="2"/>
      <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(80,40,8,0.3)" strokeWidth="1"/>
      {/* Glow overlay on iris */}
      <circle cx="50" cy="50" r="28" fill={`url(#${id}-eyeglow)`} opacity="0.3"/>
      {/* Pupil */}
      <ellipse cx="50" cy="50" rx="8" ry="28" fill="#030108"/>
      {/* Pupil glow */}
      <ellipse cx="50" cy="50" rx="5" ry="24" fill={c} opacity="0.15"/>
      <ellipse cx="50" cy="50" rx="3" ry="18" fill={c} opacity="0.1"/>
      {/* Corneal highlight */}
      <ellipse cx="38" cy="34" rx="8" ry="6" fill="rgba(255,255,255,0.18)"/>
      <ellipse cx="36" cy="32" rx="4" ry="3" fill="rgba(255,255,255,0.12)"/>
      {/* Lashes top */}
      {[20,30,40,50,60,70,80].map((x, i) => (
        <path key={i} d={`M${x} ${50 - Math.sqrt(Math.max(0, 1600 - (x-50)**2))+2} L${x-2} ${50 - Math.sqrt(Math.max(0, 1600 - (x-50)**2)) - 8}`} stroke="#0a0408" strokeWidth="1.5" strokeLinecap="round"/>
      ))}
    </svg>
  );

  const kraken = (
    <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id={`${id}-body`} cx="45%" cy="35%">
          <stop offset="0%" stopColor="#1a2840"/>
          <stop offset="60%" stopColor="#0c1828"/>
          <stop offset="100%" stopColor="#060c14"/>
        </radialGradient>
        <radialGradient id={`${id}-sucker`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#2a3850"/>
          <stop offset="100%" stopColor="#0e1a28"/>
        </radialGradient>
      </defs>
      {/* Tentacles back */}
      <path d="M28 74 Q20 88 16 108 Q22 100 26 108 Q28 98 32 108 Q32 94 36 108" stroke="#0c1828" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M72 74 Q80 88 84 108 Q78 100 74 108 Q72 98 68 108 Q68 94 64 108" stroke="#0c1828" strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Tentacles mid */}
      <path d="M20 66 Q8 76 4 96 Q10 88 14 96 Q16 84 20 96" stroke="#0c1828" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M80 66 Q92 76 96 96 Q90 88 86 96 Q84 84 80 96" stroke="#0c1828" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Tentacles front */}
      <path d="M38 76 Q34 90 30 112 Q36 104 38 112 Q40 100 42 112" stroke="#122038" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M62 76 Q66 90 70 112 Q64 104 62 112 Q60 100 58 112" stroke="#122038" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M50 78 Q50 92 48 112 Q52 104 50 112" stroke="#122038" strokeWidth="8" strokeLinecap="round" fill="none"/>
      {/* Suction cups on tentacles */}
      {[[28,82],[24,90],[20,96],[70,84],[74,92],[78,98]].map(([sx,sy],i) => (
        <circle key={i} cx={sx} cy={sy} r="3" fill={`url(#${id}-sucker)`} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
      ))}
      {/* Main body */}
      <ellipse cx="50" cy="44" rx="36" ry="40" fill={`url(#${id}-body)`}/>
      {/* Body highlight */}
      <ellipse cx="40" cy="30" rx="18" ry="14" fill="rgba(255,255,255,0.06)"/>
      {/* Body spots (bioluminescence) */}
      {[[30,50,4,0.4],[70,46,3,0.3],[58,62,3.5,0.35],[42,64,3,0.3],[64,34,2.5,0.25],[36,34,2,0.2]].map(([bx,by,br,bop],i) => (
        <circle key={i} cx={bx} cy={by} r={br} fill={c} opacity={bop}/>
      ))}
      {/* Eyes */}
      <ellipse cx="32" cy="40" rx="14" ry="12" fill="#04080e"/>
      <ellipse cx="68" cy="40" rx="14" ry="12" fill="#04080e"/>
      <ellipse cx="32" cy="40" rx="9" ry="8" fill={c} opacity="0.3"/>
      <ellipse cx="68" cy="40" rx="9" ry="8" fill={c} opacity="0.3"/>
      <ellipse cx="32" cy="40" rx="5.5" ry="6" fill={c} opacity="0.7"/>
      <ellipse cx="68" cy="40" rx="5.5" ry="6" fill={c} opacity="0.7"/>
      <ellipse cx="32" cy="40" rx="3" ry="3.5" fill="#010204"/>
      <ellipse cx="68" cy="40" rx="3" ry="3.5" fill="#010204"/>
      <ellipse cx="30" cy="37.5" rx="2" ry="1.5" fill="rgba(255,255,255,0.25)"/>
      <ellipse cx="66" cy="37.5" rx="2" ry="1.5" fill="rgba(255,255,255,0.25)"/>
      {/* Beak */}
      <path d="M40 58 Q50 64 60 58 Q56 70 50 72 Q44 70 40 58Z" fill="#06101a"/>
      <path d="M42 62 Q50 65 58 62" stroke="rgba(0,0,0,0.4)" strokeWidth="1" fill="none"/>
      {/* Top fin */}
      <path d="M36 10 Q50 2 64 10 Q58 16 50 14 Q42 16 36 10Z" fill={`url(#${id}-body)`}/>
    </svg>
  );

  const chars: Record<string, React.ReactElement> = {
    skull, robot, demon, spider, ghost, dragon, virus, ninja, phantom, cyber, eye, kraken,
  };
  return <div className="w-full h-full">{chars[t] ?? chars.skull}</div>;
};

// ─── Matrix Rain Panel ────────────────────────────────────────────────────────
const MatrixRainPanel = ({ characterType, difficulty }: { characterType: string; difficulty: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rainColor = diffColorMap[difficulty] ?? "#00ff41";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    const charset = "01アイウエオカキクケコABCDEFGHIJKLM!@#$%^&*<>/\\|~{}[]0123456789";
    const fontSize = 13;
    let drops: number[] = [];
    const resetDrops = () => {
      const cols = Math.floor(canvas.width / fontSize);
      drops = Array(cols).fill(0).map(() => Math.random() * -80);
    };
    resetDrops();
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cols = Math.floor(canvas.width / fontSize);
      while (drops.length < cols) drops.push(Math.random() * -80);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      drops.forEach((y, i) => {
        const char = charset[Math.floor(Math.random() * charset.length)];
        const x = i * fontSize;
        ctx.globalAlpha = 0.95; ctx.fillStyle = "#ffffff";
        ctx.fillText(char, x, y * fontSize);
        ctx.globalAlpha = 0.45 + Math.random() * 0.3; ctx.fillStyle = rainColor;
        ctx.fillText(charset[Math.floor(Math.random() * charset.length)], x, (y - 1) * fontSize);
        ctx.globalAlpha = 0.18; ctx.fillStyle = rainColor;
        ctx.fillText(charset[Math.floor(Math.random() * charset.length)], x, (y - 2) * fontSize);
        ctx.globalAlpha = 1;
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.6;
      });
    };
    let last = 0;
    const loop = (ts: number) => {
      if (ts - last > 45) { draw(); last = ts; }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [difficulty]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-between py-5 px-4">
        <div className="w-full flex items-center justify-between">
          <div className="w-6 h-6 border-t-2 border-l-2" style={{ borderColor: rainColor }} />
          <span className="font-mono text-[9px] tracking-[0.3em] animate-pulse" style={{ color: rainColor }}>● TARGET LOCKED ●</span>
          <div className="w-6 h-6 border-t-2 border-r-2" style={{ borderColor: rainColor }} />
        </div>
        <div className="relative flex items-center justify-center w-full" style={{ filter: `drop-shadow(0 0 20px ${rainColor})` }}>
          <div className="w-44 h-44">
            <CreaturePortrait type={characterType} diff={difficulty} />
          </div>
        </div>
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <div className="w-6 h-6 border-b-2 border-l-2" style={{ borderColor: rainColor }} />
            <div className="w-6 h-6 border-b-2 border-r-2" style={{ borderColor: rainColor }} />
          </div>
          <div className="flex justify-between font-mono text-[9px] opacity-60" style={{ color: rainColor }}>
            <span>RECON: ON</span>
            <span className="animate-pulse">■ REC</span>
            <span>VULNYX v2.4</span>
          </div>
        </div>
      </div>
      <div className="absolute left-0 right-0 h-px opacity-20 pointer-events-none" style={{ background: `linear-gradient(90deg,transparent,${rainColor},transparent)`, animation: "labscan 4s linear infinite" }} />
      <style>{`@keyframes labscan { 0%{top:0%} 100%{top:100%} }`}</style>
    </div>
  );
};

// ─── Combat Intel (replaces radar) ───────────────────────────────────────────
const CombatIntel = ({ machine }: { machine: Machine }) => {
  const color = diffColorMap[machine.difficulty] ?? "#ff4db8";
  const h = machine.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const d = { "FÁCIL": 0.28, "MEDIO": 0.52, "DIFÍCIL": 0.76, "INSANO": 0.96 }[machine.difficulty] ?? 0.5;
  const jitter = (n: number) => Math.min(98, Math.max(12, Math.round(((h * n) % 100) * 0.45 + d * 55)));
  const stats = [
    { label: "SIGILO", val: jitter(3) },
    { label: "EXPLOIT", val: jitter(7) },
    { label: "PRIV.ESC", val: jitter(11) },
    { label: "POST-EXP", val: Math.round(machine.techniques.length / 7 * 55 + d * 45) },
    { label: "EVASIÓN", val: jitter(13) },
  ];
  const total = Math.round(stats.reduce((a, s) => a + s.val, 0) / stats.length);

  return (
    <div className="border-t border-white/8 bg-black/90 px-4 pt-3 pb-3 flex-shrink-0">
      <p className="font-mono text-[9px] tracking-[0.25em] text-center mb-3" style={{ color: `${color}99` }}>
        ► INTEL DE COMBATE
      </p>
      <div className="space-y-2">
        {stats.map(({ label, val }) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-0.5">
              <span className="font-mono text-[8px] text-muted-foreground">{label}</span>
              <span className="font-mono text-[9px] font-bold" style={{ color }}>{val}</span>
            </div>
            <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${val}%` }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}60, ${color})`, boxShadow: `0 0 6px ${color}` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="font-mono text-[8px] text-muted-foreground">THREAT SCORE</span>
        <span className="font-mono text-sm font-bold" style={{ color, textShadow: `0 0 8px ${color}` }}>{total}/100</span>
      </div>
    </div>
  );
};

// ─── Machine Card (video-game style) ─────────────────────────────────────────
const GameMachineCard = ({
  m, onSelect, user, onAuthOpen, exploding, solved,
}: {
  m: Machine; onSelect: (m: Machine) => void; user: any; onAuthOpen: () => void; exploding: boolean; solved?: boolean;
}) => {
  const [hovered, setHovered] = useState(false);
  const color = solved ? "#34d399" : (diffColorMap[m.difficulty] ?? "#ff4db8");
  const level = diffLevelMap[m.difficulty] ?? 1;

  return (
    <div className="relative" style={{ perspective: "600px" }}>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.04, rotateY: 3, rotateX: -2 }}
        animate={exploding ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl cursor-pointer flex flex-col border bg-[#050510]"
        style={{
          borderColor: solved ? "#34d399" : (hovered ? color : `${color}30`),
          boxShadow: solved
            ? "0 0 25px rgba(52,211,153,0.25), 0 0 50px rgba(52,211,153,0.08)"
            : (hovered
              ? `0 0 30px ${color}30, 0 0 60px ${color}10, inset 0 0 30px ${color}05`
              : `0 0 10px rgba(0,0,0,0.5)`),
          transformStyle: "preserve-3d",
        }}
      >
      {/* PWNED overlay badge */}
      {solved && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-1"
          style={{ background: "linear-gradient(90deg, rgba(52,211,153,0.85), rgba(52,211,153,0.7))" }}>
          <span className="font-mono font-black text-[11px] tracking-[0.35em] text-black flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> PWNED
          </span>
        </div>
      )}
        {/* ── Portrait Area ── */}
        <div className="relative overflow-hidden bg-black" style={{ height: "200px" }}>
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(${color}18 1px, transparent 1px), linear-gradient(90deg, ${color}18 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}/>
          {/* Radial vignette */}
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)`,
          }}/>
          {/* Creature / Thumbnail */}
          <div className="absolute inset-0 flex items-center justify-center p-4"
            style={{ filter: `drop-shadow(0 0 16px ${color}90) drop-shadow(0 0 32px ${color}40)` }}>
            <div className="w-40 h-40">
              <img
                src={m.thumbnailUrl || getAndroidImage(m.id)}
                alt={m.name}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
          {/* Scan line */}
          <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}90 40%, ${color} 50%, ${color}90 60%, transparent)`,
              animation: "mcardscan 3.5s linear infinite",
              opacity: 0.4,
            }}/>
          {/* HUD corners */}
          {[["top-2 left-2 border-t-2 border-l-2"],["top-2 right-2 border-t-2 border-r-2"],["bottom-2 left-2 border-b-2 border-l-2"],["bottom-2 right-2 border-b-2 border-r-2"]].map(([cls], i) => (
            <div key={i} className={`absolute w-5 h-5 ${cls} transition-all duration-300`}
              style={{ borderColor: hovered ? color : `${color}50` }} />
          ))}
          {/* Level indicator top-left */}
          <div className="absolute top-3 left-8 font-mono text-[9px] tracking-widest z-10"
            style={{ color, textShadow: `0 0 8px ${color}` }}>
            LVL {level}
          </div>
          {/* OS badge top-right */}
          <div className={`absolute top-3 right-8 text-[9px] font-mono z-10 px-1.5 py-0.5 rounded border ${m.os === "Linux" ? "text-green-400 border-green-400/30" : "text-blue-400 border-blue-400/30"}`}
            style={{ background: "rgba(0,0,0,0.6)" }}>
            {m.os === "Linux" ? "🐧" : "🪟"} {m.os}
          </div>
          {/* Animated corner pulse dots */}
          <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 rounded-full animate-pulse z-10"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full animate-pulse z-10"
            style={{ background: color, boxShadow: `0 0 6px ${color}`, animationDelay: "0.5s" }} />
          {/* Difficulty badge bottom */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2.5 z-10">
            <span className="font-mono text-[9px] font-bold tracking-[0.2em] px-3 py-0.5 rounded-sm"
              style={{ color, background: `${color}18`, border: `1px solid ${color}50`, textShadow: `0 0 10px ${color}` }}>
              ◆ {m.difficulty} ◆
            </span>
          </div>
        </div>

        {/* ── Card Body ── */}
        <div className="px-4 pt-3 pb-2 flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-mono text-lg font-bold text-white leading-tight tracking-wide"
              style={{ textShadow: hovered ? `0 0 12px ${color}` : "none" }}>
              {m.name}
            </h3>
          </div>
          {/* Techniques tags */}
          <div className="flex flex-wrap gap-1 mb-3 min-h-[18px]">
            {m.techniques.slice(0, 2).map(t => (
              <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-muted-foreground bg-white/[0.03]">{t}</span>
            ))}
            {m.techniques.length > 2 && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-muted-foreground bg-white/[0.03]">+{m.techniques.length - 2}</span>
            )}
          </div>
          {/* Points + solves */}
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="font-mono text-2xl font-bold leading-none"
                style={{ color, textShadow: hovered ? `0 0 12px ${color}` : `0 0 8px ${color}60` }}>
                +{m.points}<span className="text-sm ml-1 opacity-50 text-white">XP</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{m.solveCount} pwns</div>
            </div>
            {/* Boss HP bar */}
            <div className="w-24">
              <div className="font-mono text-[8px] text-muted-foreground mb-0.5 text-right">THREAT</div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, m.points)}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${color}60, ${color})`,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-4 pb-4 flex flex-col gap-2">
          <button
            onClick={() => user ? onSelect(m) : onAuthOpen()}
            className="w-full font-mono font-bold text-xs uppercase py-2.5 rounded-md relative overflow-hidden transition-all duration-300 group/btn"
            style={{
              background: hovered ? `${color}22` : `${color}10`,
              border: `1px solid ${color}50`,
              color,
              textShadow: `0 0 8px ${color}80`,
            }}>
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              {user ? "▶ INICIAR MISIÓN" : "⚡ ACCEDER"}
            </span>
            <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </button>
          {m.downloadUrl ? (
            <a href={m.downloadUrl} target="_blank" rel="noopener noreferrer"
              className="w-full font-mono text-[10px] uppercase py-2 rounded-md border border-secondary/30 text-secondary hover:bg-secondary/10 transition-all flex items-center justify-center gap-1.5">
              <Download className="h-3 w-3" /> DESCARGAR MÁQUINA
            </a>
          ) : (
            <button
              disabled
              className="w-full font-mono text-[10px] uppercase py-2 rounded-md border border-white/8 text-muted-foreground/40 cursor-not-allowed flex items-center justify-center gap-1.5">
              <Download className="h-3 w-3" /> DESCARGAR MÁQUINA
            </button>
          )}
        </div>
        <style>{`@keyframes mcardscan { 0%{top:0%} 100%{top:100%} }`}</style>
      </motion.div>
    </div>
  );
};

// ─── Active Machine Panel (HTB-style) ────────────────────────────────────────
interface ActiveMachinePanelProps {
  machine: Machine;
  session: any;
  userId: number;
  base: string;
  onStop: () => void;
  onCopyIp: (ip: string) => void;
  stopping: boolean;
  onMarkSolved?: (slug: string) => void;
}

function useElapsedTimer(startIso: string | undefined) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startIso) return;
    const start = new Date(startIso).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function ActiveMachinePanel({ machine, session, userId, base, onStop, onCopyIp, stopping, onMarkSolved }: ActiveMachinePanelProps) {
  const [tab, setTab] = useState<"flags"|"notas">("flags");
  const [userFlag, setUserFlag] = useState("");
  const [rootFlag, setRootFlag] = useState("");
  const [userOwned, setUserOwned] = useState(false);
  const [rootOwned, setRootOwned] = useState(false);
  const [submitting, setSubmitting] = useState<"user"|"root"|null>(null);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsed = useElapsedTimer(session?.spawnedAt);
  const { toast } = useToast();

  // Load flags and notes
  useEffect(() => {
    if (!userId || !machine.slug) return;
    fetch(`${base}api/lab/machines/${machine.slug}/my-flags?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setUserOwned(d.userOwned); setRootOwned(d.rootOwned); } });
    fetch(`${base}api/lab/machines/${machine.slug}/notes?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setNotes(d.content); });
  }, [machine.slug, userId, base]);

  const submitFlag = async (flagType: "user" | "root") => {
    const flag = flagType === "user" ? userFlag : rootFlag;
    if (!flag.trim()) return;
    setSubmitting(flagType);
    try {
      const r = await fetch(`${base}api/lab/machines/${machine.slug}/submit-flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, flagType, flag: flag.trim() }),
      });
      const data = await r.json();
      if (data.correct) {
        if (flagType === "user") setUserOwned(true);
        else { setRootOwned(true); onMarkSolved?.(machine.slug); }
        toast({ title: "🎉 ¡FLAG CORRECTA!", description: `+${flagType === "root" ? machine.points : Math.floor(machine.points / 2)} XP ganados` });
      } else {
        toast({ title: "❌ Flag incorrecta", description: "Sigue buscando…", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error de red", variant: "destructive" });
    } finally { setSubmitting(null); }
  };

  const saveNotes = async (content: string) => {
    setSavingNotes(true);
    try {
      await fetch(`${base}api/lab/machines/${machine.slug}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } finally { setSavingNotes(false); }
  };

  const handleNotesChange = (v: string) => {
    setNotes(v);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(v), 1200);
  };

  const progress = (userOwned ? 50 : 0) + (rootOwned ? 50 : 0);
  const color = diffColorMap[machine.difficulty] ?? "#ff4db8";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto"
      style={{ maxWidth: 900, left: "50%", transform: "translateX(-50%)" }}>
      <div className="m-4 rounded-2xl border overflow-hidden shadow-2xl font-mono"
        style={{ background: "rgba(6,6,13,0.97)", borderColor: `${color}40`, boxShadow: `0 -10px 60px ${color}18, 0 0 0 1px ${color}20` }}>

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: `${color}20`, background: `${color}08` }}>
          {/* Machine identity */}
          <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
            <CreaturePortrait type={machine.characterType} diff={machine.difficulty} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white truncate">{machine.name}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>{machine.difficulty}</span>
              <span className="text-[9px] text-muted-foreground">{machine.os}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-muted-foreground">IP:</span>
              <button onClick={() => onCopyIp(session.assignedIp)}
                className="text-[11px] font-bold text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                {session.assignedIp} <Copy className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Clock className="h-3 w-3 text-primary/60" />
            <span className="text-sm font-bold text-white tabular-nums">{elapsed}</span>
          </div>

          {/* Progress */}
          <div className="flex flex-col gap-1 items-center w-24 shrink-0">
            <div className="flex items-center justify-between w-full">
              <span className="text-[9px] text-muted-foreground tracking-widest">PROGRESO</span>
              <span className="text-[10px] font-bold" style={{ color }}>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${color},${color}99)` }}
                initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
            </div>
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="flex items-center gap-1" style={{ color: userOwned ? "#34d399" : "#374151" }}>
                <User className="h-2.5 w-2.5" />
                <span className="text-[9px]">USER</span>
                {userOwned && <CheckCircle2 className="h-2.5 w-2.5" />}
              </div>
              <div className="flex items-center gap-1" style={{ color: rootOwned ? "#f59e0b" : "#374151" }}>
                <Skull className="h-2.5 w-2.5" />
                <span className="text-[9px]">ROOT</span>
                {rootOwned && <CheckCircle2 className="h-2.5 w-2.5" />}
              </div>
            </div>
          </div>

          {/* Stop */}
          <button onClick={onStop} disabled={stopping}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 shrink-0">
            <Square className="h-3 w-3" /> {stopping ? "…" : "DETENER"}
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {[
            { id: "flags" as const, label: "SUBMIT FLAGS", icon: <Flag className="h-3 w-3" /> },
            { id: "notas" as const, label: "NOTAS", icon: <FileText className="h-3 w-3" /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[10px] font-bold tracking-widest transition-all border-b-2"
              style={{
                borderColor: tab === t.id ? color : "transparent",
                color: tab === t.id ? color : "#6b7280",
                background: tab === t.id ? `${color}08` : "transparent",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="px-5 py-4">
          {tab === "flags" ? (
            <div className="flex gap-4 flex-wrap md:flex-nowrap">
              {/* User flag */}
              {(["user", "root"] as const).map(ft => {
                const owned = ft === "user" ? userOwned : rootOwned;
                const val   = ft === "user" ? userFlag : rootFlag;
                const setVal = ft === "user" ? setUserFlag : setRootFlag;
                const pts   = ft === "root" ? machine.points : Math.floor(machine.points / 2);
                const icon  = ft === "user" ? <User className="h-4 w-4" /> : <Skull className="h-4 w-4" />;
                const flagColor = ft === "user" ? "#34d399" : "#f59e0b";

                return (
                  <div key={ft} className="flex-1 min-w-[200px] flex flex-col gap-2 p-3 rounded-xl border transition-all"
                    style={{
                      background: owned ? `${flagColor}08` : "rgba(0,0,0,0.4)",
                      borderColor: owned ? `${flagColor}40` : "rgba(255,255,255,0.08)",
                    }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2" style={{ color: owned ? flagColor : "#6b7280" }}>
                        {icon}
                        <span className="text-[10px] font-bold tracking-widest">{ft === "user" ? "USER FLAG" : "ROOT FLAG"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {owned
                          ? <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${flagColor}20`, color: flagColor }}><CheckCircle2 className="h-3 w-3" /> PWNED</span>
                          : <span className="text-[10px] text-muted-foreground">+{pts} XP</span>
                        }
                      </div>
                    </div>
                    {owned ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${flagColor}12`, border: `1px solid ${flagColor}30` }}>
                        <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: flagColor }} />
                        <span className="text-xs font-bold" style={{ color: flagColor }}>¡Máquina pwneada! 🎉</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={val}
                          onChange={e => setVal(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && submitFlag(ft)}
                          placeholder={`{flag_aqui}`}
                          className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-green-300 font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/25 transition-all"
                        />
                        <button
                          onClick={() => submitFlag(ft)}
                          disabled={submitting === ft || !val.trim()}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all hover:brightness-110 disabled:opacity-40"
                          style={{ background: `linear-gradient(135deg,${flagColor}40,${flagColor}20)`, border: `1px solid ${flagColor}50`, color: flagColor }}>
                          {submitting === ft ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          ENVIAR
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground tracking-widest">NOTAS PRIVADAS (se guardan automáticamente)</span>
                {savingNotes
                  ? <span className="text-[9px] text-primary/60 flex items-center gap-1"><RotateCcw className="h-2.5 w-2.5 animate-spin" /> Guardando…</span>
                  : notesSaved
                  ? <span className="text-[9px] text-green-400 flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> Guardado</span>
                  : null}
              </div>
              <textarea
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="# Reconocimiento&#10;nmap -sV -sC 10.10.x.x&#10;&#10;# Vectores de ataque&#10;..."
                rows={4}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-green-300 font-mono placeholder:text-muted-foreground/30 focus:outline-none focus:border-white/20 resize-none transition-all"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── VPN Status HUD (floating right panel) ───────────────────────────────────
// ─── VPN Terminal Animation ───────────────────────────────────────────────────
const VPN_CONNECT_CMD = "sudo openvpn --config spettro.ovpn";
const VPN_DISCONNECT_CMD = "sudo pkill -2 openvpn";

function VpnTerminal({ vpnIp, disconnecting, userId, username, base, simMode, onComplete }: {
  vpnIp: string; disconnecting: boolean;
  userId: number; username: string; base: string;
  simMode?: boolean;
  onComplete: () => void;
}) {
  const cmd = disconnecting ? VPN_DISCONNECT_CMD : VPN_CONNECT_CMD;
  const [typed, setTyped] = useState("");
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<"typing" | "output" | "done">("typing");
  const [visible, setVisible] = useState(true);
  const [cmdCopied, setCmdCopied] = useState(false);

  const ts = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")} ${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}`;
  };

  const connectLines = [
    "[sudo] password for root: ",
    `${ts()} OpenVPN 2.6.8 x86_64-pc-linux-gnu [SSL (OpenSSL)] [LZO] [LZ4]`,
    `${ts()} library versions: OpenSSL 3.0.13, LZO 2.10`,
    `${ts()} TCP/UDP: Preserving recently used remote address: [AF_INET]10.8.0.1:1194`,
    `${ts()} UDPv4 link local: (not bound)`,
    `${ts()} UDPv4 link remote: [AF_INET]10.8.0.1:1194`,
    `${ts()} [SpettroVPN] Peer Connection Initiated with [AF_INET]10.8.0.1:1194`,
    `${ts()} TUN/TAP device tun0 opened`,
    `${ts()} /sbin/ip addr add dev tun0 ${vpnIp} broadcast 10.8.0.255`,
    `${ts()} Initialization Sequence Completed`,
  ];
  const disconnectLines = [
    "[sudo] password for root: ",
    `${ts()} SIGINT[soft,process-exit] received, process exiting`,
    `${ts()} Closing TUN/TAP interface`,
    `${ts()} /sbin/ip addr del dev tun0 ${vpnIp}`,
    `${ts()} SIGINT[soft,process-exit] received, process exiting`,
    `${ts()} Tunnel closed.`,
  ];
  const OUTPUT = disconnecting ? disconnectLines : connectLines;

  // Phase 1: typewriter
  useEffect(() => {
    if (phase !== "typing") return;
    if (typed.length < cmd.length) {
      const t = setTimeout(() => setTyped(cmd.slice(0, typed.length + 1)), 38);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase("output"), 300);
    return () => clearTimeout(t);
  }, [phase, typed, cmd]);

  // Phase 2: output lines
  useEffect(() => {
    if (phase !== "output") return;
    if (outputLines.length < OUTPUT.length) {
      const delay = outputLines.length === 0 ? 350
        : outputLines.length === OUTPUT.length - 1 ? 500
        : 160;
      const t = setTimeout(() => setOutputLines(p => [...p, OUTPUT[p.length]]), delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase("done"), 700);
    return () => clearTimeout(t);
  }, [phase, outputLines]);

  // Phase 3: si es desconexión → cierre automático; si es conexión → mostrar panel de acción
  useEffect(() => {
    if (phase !== "done") return;
    if (disconnecting) {
      const t = setTimeout(() => { setVisible(false); setTimeout(onComplete, 400); }, 600);
      return () => clearTimeout(t);
    }
    // conexión real o demo: auto-copiar el one-liner al portapapeles
    const oneLiner = `bash <(curl -fsSL "${window.location.origin}${base}api/lab/vpn-connect-script?userId=${userId}")`;
    navigator.clipboard.writeText(oneLiner).catch(() => {});
    setCmdCopied(true);
    return undefined;
  }, [phase]);

  const lastLine = OUTPUT[OUTPUT.length - 1] ?? "";
  const oneLiner = `bash <(curl -fsSL "${window.location.origin}${base}api/lab/vpn-connect-script?userId=${userId}")`;

  const handleDownloadScript = () => {
    window.open(`${window.location.origin}${base}api/lab/vpn-connect-script?userId=${userId}`, "_blank");
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onComplete, 400);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}>
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -12 }}
            transition={{ type: "spring", damping: 22, stiffness: 200 }}
            className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden font-mono shadow-2xl"
            style={{ border: "1px solid rgba(52,211,153,0.3)", boxShadow: "0 0 80px rgba(52,211,153,0.18), 0 0 0 1px rgba(52,211,153,0.08)" }}>

            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: "rgba(14,14,22,0.99)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-[11px] text-muted-foreground tracking-widest">
                root@spettro-kali: ~ — {username}
              </span>
              {simMode && (
                <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded tracking-widest" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                  MODO DEMO
                </span>
              )}
            </div>

            {/* Terminal body */}
            <div className="px-5 py-4 text-[12px] leading-5" style={{ background: "rgba(4,6,10,0.99)" }}>
              {/* Prompt + typed command */}
              <div className="flex flex-wrap items-baseline gap-0">
                <span style={{ color: "#34d399" }}>root@spettro-kali</span>
                <span className="text-white">:</span>
                <span style={{ color: "#818cf8" }}>~</span>
                <span className="text-white"># </span>
                <span style={{ color: "#fbbf24" }}>{typed}</span>
                {phase === "typing" && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.75 }}
                    className="inline-block w-[7px] h-[14px] align-middle ml-px"
                    style={{ background: "#34d399", borderRadius: 1 }} />
                )}
              </div>

              {/* Output lines */}
              <div className="mt-1.5 flex flex-col gap-[2px]">
                {outputLines.map((line, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12 }}
                    style={{
                      color: line === lastLine ? (disconnecting ? "#f87171" : "#34d399") : line.includes("tun0") || line.includes("Peer Connection") ? "#a78bfa" : line.includes("[sudo]") ? "#4b5563" : "#6b7280",
                      fontWeight: line === lastLine ? "bold" : "normal",
                      textShadow: line === lastLine ? (disconnecting ? "0 0 14px rgba(248,113,113,0.7)" : "0 0 14px rgba(52,211,153,0.8)") : "none",
                    }}>
                    {line}
                  </motion.div>
                ))}
              </div>

              {/* New prompt cursor */}
              {phase !== "done" && phase === "typing" && null}
              {(phase === "output" || (phase === "done" && disconnecting)) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-baseline gap-0">
                  <span style={{ color: "#34d399" }}>root@spettro-kali</span>
                  <span className="text-white">:</span>
                  <span style={{ color: "#818cf8" }}>~</span>
                  <span className="text-white"># </span>
                  {phase === "done" && (
                    <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.75 }}
                      className="inline-block w-[7px] h-[14px] align-middle ml-px"
                      style={{ background: "#34d399", borderRadius: 1 }} />
                  )}
                </motion.div>
              )}
            </div>

            {/* ── ACTION PANEL (solo cuando conecta y la animación termina) ── */}
            {phase === "done" && !disconnecting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="px-5 py-4 flex flex-col gap-3 border-t"
                style={{ background: "rgba(10,14,24,0.99)", borderColor: "rgba(52,211,153,0.15)" }}>

                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] font-bold tracking-widest" style={{ color: "#34d399" }}>
                    {simMode ? "DEMO · CONECTA TU KALI" : "CONECTA TU KALI EN UN COMANDO"}
                  </span>
                  {simMode && (
                    <span className="ml-auto text-[9px] px-2 py-0.5 rounded font-bold" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                      SIN SERVIDOR REAL
                    </span>
                  )}
                </div>

                {/* One-liner */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(52,211,153,0.25)" }}>
                    <span className="text-[10px] text-green-300 truncate font-mono flex-1">{oneLiner}</span>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(oneLiner); setCmdCopied(true); }}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all hover:brightness-110 active:scale-95"
                    style={{ background: cmdCopied ? "rgba(52,211,153,0.2)" : "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399" }}>
                    {cmdCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {cmdCopied ? "COPIADO" : "COPIAR"}
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {simMode
                    ? <>Modo demo — el script requiere un <span className="text-amber-400">servidor VPN real</span> para conectar. Puedes descargarlo para verlo.</>
                    : <>Pega ese comando en tu <span className="text-green-400 font-bold">Kali Linux</span>. Descargará tu config VPN e instalará openvpn si hace falta.</>
                  }
                </p>

                <div className="flex gap-2 mt-1">
                  <button onClick={handleDownloadScript}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold transition-all hover:brightness-110 border"
                    style={{ background: "rgba(155,85,249,0.12)", borderColor: "rgba(155,85,249,0.4)", color: "#9b55f9" }}>
                    <Download className="h-3.5 w-3.5" /> DESCARGAR SCRIPT .SH
                  </button>
                  <button onClick={handleClose}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold transition-all hover:brightness-110 border border-white/10 text-white/60 hover:text-white">
                    <X className="h-3.5 w-3.5" /> CERRAR
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── VPN HUD ──────────────────────────────────────────────────────────────────
interface VpnHudProps {
  connected: boolean;
  vpnIp: string | null;
  userId: number;
  username: string;
  base: string;
  onToggle: () => void;
  onOpenWizard: () => void;
}

function VpnHud({ connected, vpnIp, userId, username, base, onToggle, onOpenWizard }: VpnHudProps) {
  const [copied, setCopied] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalDisconnecting, setTerminalDisconnecting] = useState(false);
  const [vpnServerConfigured, setVpnServerConfigured] = useState<boolean | null>(null);
  const [vpnServerHost, setVpnServerHost] = useState<string | null>(null);
  const [kaliIp, setKaliIp] = useState<string>(() => localStorage.getItem("spettro_kali_ip") ?? "");
  const [kaliIpInput, setKaliIpInput] = useState<string>(() => localStorage.getItem("spettro_kali_ip") ?? "");
  const [kaliIpEditing, setKaliIpEditing] = useState(false);

  useEffect(() => {
    fetch(`${base}api/lab/vpn-server-status`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setVpnServerConfigured(d.configured); setVpnServerHost(d.host); } })
      .catch(() => {});
  }, [base]);

  const copyIp = () => {
    if (!kaliIp) return;
    navigator.clipboard.writeText(kaliIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const accentColor  = connected ? "#34d399" : "#6b7280";
  const glowColor    = connected ? "rgba(52,211,153,0.25)" : "rgba(107,114,128,0.1)";
  const borderColor  = connected ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.08)";
  const bgColor      = connected ? "rgba(52,211,153,0.06)" : "rgba(0,0,0,0.7)";

  return (
    <motion.div
      className="fixed top-4 left-1/2 z-[60] flex flex-col gap-2"
      style={{ transform: "translateX(-50%)" }}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 160, delay: 0.4 }}>

      {/* Main HUD panel — horizontal compact bar at top */}
      <motion.div
        animate={{ boxShadow: connected
          ? ["0 0 20px rgba(52,211,153,0.2)", "0 0 35px rgba(52,211,153,0.38)", "0 0 20px rgba(52,211,153,0.2)"]
          : "0 0 12px rgba(0,0,0,0.6)"
        }}
        transition={{ repeat: connected ? Infinity : 0, duration: 2.4, ease: "easeInOut" }}
        className="rounded-2xl border px-4 py-2.5 flex flex-row items-center gap-4 font-mono backdrop-blur-md transition-colors duration-700"
        style={{ background: bgColor, borderColor, boxShadow: `0 0 20px ${glowColor}`, minWidth: "min(90vw, 540px)" }}>

        {/* Left: label + status */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.div className="w-2 h-2 rounded-full" style={{ background: accentColor }}
            animate={connected ? { opacity: [1, 0.3, 1], scale: [1, 1.2, 1] } : { opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }} />
          <span className="text-[9px] tracking-[0.25em] font-bold" style={{ color: accentColor }}>VPN</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all duration-700"
            style={{ background: connected ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)", borderColor }}>
            <span className="text-[9px] font-bold tracking-widest" style={{ color: accentColor }}>
              {connected ? "ACTIVA" : "DESCONECTADA"}
            </span>
          </div>
          {vpnServerConfigured === false && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
              DEMO
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 shrink-0" style={{ background: borderColor }} />

        {/* Center: Kali IP input */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[9px] text-muted-foreground tracking-widest shrink-0">IP KALI:</span>
          {vpnIp ? (
            kaliIpEditing ? (
              <form onSubmit={(e) => { e.preventDefault(); setKaliIpEditing(false); }} className="flex-1">
                <input
                  autoFocus
                  value={kaliIpInput}
                  onChange={e => { setKaliIpInput(e.target.value); setKaliIp(e.target.value); localStorage.setItem("spettro_kali_ip", e.target.value); }}
                  onBlur={() => setKaliIpEditing(false)}
                  placeholder="192.168.x.x"
                  className="w-full px-2 py-1 rounded-md border border-primary/50 bg-black/80 text-[11px] font-mono text-primary outline-none"
                />
              </form>
            ) : (
              <button onClick={() => setKaliIpEditing(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/10 bg-black/50 hover:border-primary/40 transition-all group/ip">
                <span className="text-[11px] font-bold font-mono" style={{ color: kaliIp ? (connected ? "#34d399" : "#e5e5e5") : "#6b7280" }}>
                  {kaliIp || "Pon tu IP aquí"}
                </span>
                <span className="text-[9px] opacity-0 group-hover/ip:opacity-100 transition-opacity" style={{ color: "#ff4db8" }}>✏️</span>
              </button>
            )
          ) : (
            <span className="text-[10px] text-muted-foreground italic">Inicia sesión</span>
          )}
          {kaliIp && !kaliIpEditing && (
            <button onClick={copyIp} className="shrink-0 text-[9px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Copy className="h-2.5 w-2.5" />{copied ? "✓" : ""}
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 shrink-0" style={{ background: borderColor }} />

        {/* Right: buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (!vpnIp) { onToggle(); return; }
              setTerminalDisconnecting(connected);
              setShowTerminal(true);
            }}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all hover:brightness-110 active:scale-95"
            style={{
              background: connected ? "rgba(239,68,68,0.15)" : "rgba(52,211,153,0.15)",
              border: `1px solid ${connected ? "rgba(239,68,68,0.4)" : "rgba(52,211,153,0.4)"}`,
              color: connected ? "#f87171" : "#34d399",
            }}>
            {connected ? "✕ DESCONECTAR" : "✓ CONECTAR"}
          </button>
          <button onClick={onOpenWizard}
            className="px-3 py-1.5 rounded-lg text-[9px] font-bold border border-secondary/30 text-secondary hover:bg-secondary/10 transition-all flex items-center gap-1">
            <Wifi className="h-3 w-3" /> GUÍA
          </button>
        </div>
      </motion.div>

      {/* Terminal animation overlay */}
      {showTerminal && vpnIp && (
        <VpnTerminal
          vpnIp={vpnIp}
          disconnecting={terminalDisconnecting}
          userId={userId}
          username={username}
          base={base}
          simMode={vpnServerConfigured === false}
          onComplete={() => {
            setShowTerminal(false);
            onToggle();
          }}
        />
      )}
    </motion.div>
  );
}

// ─── VPN Connection Wizard ────────────────────────────────────────────────────
type OsType = "linux" | "mac" | "windows";

function detectOs(): OsType {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  return "linux";
}

function CopyCmd({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 bg-black/70 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs group">
      <Terminal className="h-3.5 w-3.5 text-primary/60 shrink-0" />
      <span className="flex-1 text-green-300 break-all select-all">{cmd}</span>
      <button onClick={copy}
        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all text-[10px]">
        {copied ? <><CheckCircle2 className="h-3 w-3 text-green-400" /> COPIADO</> : <><Copy className="h-3 w-3" /> COPIAR</>}
      </button>
    </div>
  );
}

interface VpnWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  username: string;
}

function VpnWizardModal({ isOpen, onClose, onDownload, username }: VpnWizardModalProps) {
  const [step, setStep] = useState(0);
  const [os, setOs] = useState<OsType>(detectOs());
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => { if (isOpen) { setStep(0); setDownloaded(false); } }, [isOpen]);

  const osOptions: { key: OsType; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "linux", label: "Linux / Kali", icon: <Terminal className="h-6 w-6" />, color: "#ff4db8" },
    { key: "mac", label: "macOS", icon: <Apple className="h-6 w-6" />, color: "#9b55f9" },
    { key: "windows", label: "Windows", icon: <Monitor className="h-6 w-6" />, color: "#3b82f6" },
  ];

  const installInstructions: Record<OsType, { steps: { title: string; cmd?: string; note?: string }[] }> = {
    linux: {
      steps: [
        { title: "Instala OpenVPN (si no lo tienes)", cmd: "sudo apt install openvpn -y", note: "En Kali Linux ya viene instalado por defecto." },
        { title: "Navega a la carpeta donde descargaste el archivo" },
        { title: "Conecta con el archivo descargado", cmd: `sudo openvpn --config spettroweb-${username}.ovpn` },
      ],
    },
    mac: {
      steps: [
        { title: "Instala Tunnelblick (cliente VPN para macOS)", note: "Descarga el instalador gratuito desde tunnelblick.net" },
        { title: "Descarga e instala Tunnelblick" },
        { title: "Abre el archivo .ovpn con Tunnelblick", note: "Haz doble clic en el archivo descargado y sigue las instrucciones de Tunnelblick." },
      ],
    },
    windows: {
      steps: [
        { title: "Descarga OpenVPN GUI desde la web oficial", note: "Visita openvpn.net → Download → Windows Installer" },
        { title: "Instala OpenVPN GUI y reinicia si es necesario" },
        { title: "Copia el .ovpn a la carpeta de config", note: `C:\\Program Files\\OpenVPN\\config\\spettroweb-${username}.ovpn` },
        { title: "Abre OpenVPN GUI como Administrador, clic derecho en el icono de la bandeja → Conectar" },
      ],
    },
  };

  const steps = [
    { label: "Sistema", short: "OS" },
    { label: "Descarga", short: "DL" },
    { label: "Instala", short: "APP" },
    { label: "Conecta", short: "VPN" },
  ];

  const currentOs = osOptions.find(o => o.key === os)!;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70]"
            onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
            style={{ background: "#07070f", border: "1px solid rgba(155,85,249,0.35)", boxShadow: "0 0 80px rgba(155,85,249,0.18), 0 0 30px rgba(255,77,184,0.1)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9b55f9,#ff4db8)" }}>
                  <Wifi className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-primary/50 tracking-[0.3em]">SPETTROWEB ACADEMY</p>
                  <h3 className="font-mono text-base font-bold text-white">Conexión VPN</h3>
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-1 rounded-lg hover:bg-white/8">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-0 px-6 pt-5 pb-2 shrink-0">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <button
                      onClick={() => i < step || downloaded ? setStep(i) : undefined}
                      className="flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold border transition-all"
                      style={{
                        background: i === step ? "linear-gradient(135deg,#9b55f9,#ff4db8)" : i < step ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                        borderColor: i === step ? "#9b55f9" : i < step ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.1)",
                        color: i === step ? "#fff" : i < step ? "#34d399" : "#6b7280",
                        boxShadow: i === step ? "0 0 16px rgba(155,85,249,0.5)" : "none",
                      }}>
                      {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </button>
                    <span className="text-[9px] font-mono tracking-widest" style={{ color: i === step ? "#fff" : i < step ? "#34d399" : "#4b5563" }}>
                      {s.short}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="h-px flex-1 mx-1 mb-4 transition-all" style={{ background: i < step ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.07)" }} />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className="flex-1 px-6 pb-4 pt-2">
              <AnimatePresence mode="wait">

                {/* ── STEP 0: Choose OS ── */}
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                    <p className="font-mono text-xs text-muted-foreground tracking-wide mt-1">¿Qué sistema operativo usas?</p>
                    <div className="grid grid-cols-3 gap-3">
                      {osOptions.map(opt => (
                        <button key={opt.key} onClick={() => setOs(opt.key)}
                          className="flex flex-col items-center gap-3 py-5 px-3 rounded-xl border transition-all font-mono"
                          style={{
                            background: os === opt.key ? `${opt.color}14` : "rgba(255,255,255,0.03)",
                            borderColor: os === opt.key ? opt.color : "rgba(255,255,255,0.08)",
                            color: os === opt.key ? opt.color : "#6b7280",
                            boxShadow: os === opt.key ? `0 0 20px ${opt.color}25` : "none",
                          }}>
                          {opt.icon}
                          <span className="text-[10px] tracking-widest font-bold text-center leading-tight">{opt.label}</span>
                          {os === opt.key && <div className="w-5 h-0.5 rounded-full" style={{ background: opt.color }} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 1: Download ── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                    <p className="font-mono text-xs text-muted-foreground tracking-wide mt-1">Descarga tu archivo de configuración VPN personalizado.</p>
                    <div className="rounded-xl border p-4 flex flex-col gap-3"
                      style={{ background: "rgba(155,85,249,0.06)", borderColor: "rgba(155,85,249,0.3)" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(155,85,249,0.2)" }}>
                          <Shield className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold text-white">spettroweb-{username}.ovpn</p>
                          <p className="font-mono text-[10px] text-muted-foreground">Config personal · cifrado AES-256-GCM</p>
                        </div>
                      </div>
                      <ul className="text-[11px] text-muted-foreground font-mono space-y-1">
                        {["IP exclusiva del laboratorio asignada a ti", "Ruta 10.10.0.0/16 (red de máquinas)", "Servidor: vpn.spettroweb.academy:1194"].map(t => (
                          <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />{t}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => { onDownload(); setDownloaded(true); }}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-mono font-bold text-sm transition-all hover:brightness-110 active:scale-95"
                      style={{ background: "linear-gradient(135deg,#9b55f9,#7c3aed)", color: "#fff", boxShadow: "0 0 24px rgba(155,85,249,0.45)" }}>
                      <Download className="h-4 w-4" />
                      DESCARGAR ARCHIVO .ovpn
                    </button>
                    {downloaded && (
                      <div className="flex items-center gap-2 text-green-400 font-mono text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        ¡Archivo descargado! Avanza al siguiente paso.
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── STEP 2: Install ── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mt-1">
                      <div style={{ color: currentOs.color }}>{currentOs.icon}</div>
                      <p className="font-mono text-xs text-muted-foreground tracking-wide">Instrucciones para <span style={{ color: currentOs.color }}>{currentOs.label}</span></p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {installInstructions[os].steps.map((s, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold font-mono"
                              style={{ background: `${currentOs.color}20`, border: `1px solid ${currentOs.color}50`, color: currentOs.color }}>
                              {i + 1}
                            </div>
                            <p className="font-mono text-xs text-white/80 leading-relaxed">{s.title}</p>
                          </div>
                          {s.cmd && <div className="ml-8"><CopyCmd cmd={s.cmd} /></div>}
                          {s.note && (
                            <div className="ml-8 flex items-start gap-2 text-[11px] font-mono text-amber-400/80 bg-amber-400/5 border border-amber-400/15 rounded-lg px-3 py-2">
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              {s.note}
                            </div>
                          )}
                          {os === "mac" && i === 0 && (
                            <div className="ml-8">
                              <a href="https://tunnelblick.net/downloads.html" target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border border-secondary/30 text-secondary hover:bg-secondary/10 transition-all">
                                <ExternalLink className="h-3 w-3" /> Descargar Tunnelblick
                              </a>
                            </div>
                          )}
                          {os === "windows" && i === 0 && (
                            <div className="ml-8">
                              <a href="https://openvpn.net/community-downloads/" target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all">
                                <ExternalLink className="h-3 w-3" /> Descargar OpenVPN GUI
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 3: Connect ── */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                    <p className="font-mono text-xs text-muted-foreground tracking-wide mt-1">¡Todo listo! Ejecuta este comando para conectarte:</p>

                    {os === "linux" && (
                      <CopyCmd cmd={`sudo openvpn --config ~/Descargas/spettroweb-${username}.ovpn`} />
                    )}
                    {os === "mac" && (
                      <div className="flex flex-col gap-2">
                        <p className="font-mono text-xs text-white/70">Haz doble clic en el archivo descargado:</p>
                        <CopyCmd cmd={`open ~/Downloads/spettroweb-${username}.ovpn`} />
                      </div>
                    )}
                    {os === "windows" && (
                      <div className="font-mono text-xs text-white/70 bg-black/50 border border-white/10 rounded-lg px-4 py-3 space-y-1">
                        <p>1. Clic derecho en el icono de <span className="text-blue-400">OpenVPN GUI</span> en la bandeja</p>
                        <p>2. Selecciona <span className="text-blue-400">spettroweb-{username}</span></p>
                        <p>3. Clic en <span className="text-green-400">Conectar</span></p>
                      </div>
                    )}

                    <div className="rounded-xl border p-4 flex flex-col gap-3"
                      style={{ background: "rgba(52,211,153,0.05)", borderColor: "rgba(52,211,153,0.25)" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="font-mono text-xs text-green-400 font-bold tracking-widest">CUANDO ESTÉS CONECTADA</span>
                      </div>
                      <ul className="text-[11px] font-mono text-muted-foreground space-y-1.5">
                        {[
                          "Tu IP en la VPN será del rango 10.8.0.x",
                          "Podrás atacar máquinas en 10.10.0.0/16",
                          "Inicia la máquina objetivo y usa su IP",
                        ].map(t => (
                          <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border p-3 flex flex-col gap-2" style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.06)" }}>
                      <p className="font-mono text-[10px] text-muted-foreground tracking-widest">PRIMER ESCANEO (PRUEBA QUE FUNCIONA)</p>
                      <CopyCmd cmd="nmap -sn 10.10.0.0/24" />
                    </div>

                    <button onClick={onClose}
                      className="w-full py-3 rounded-xl font-mono font-bold text-sm transition-all hover:brightness-110"
                      style={{ background: "linear-gradient(135deg,#ff4db8,#9b55f9)", color: "#fff", boxShadow: "0 0 24px rgba(255,77,184,0.35)" }}>
                      ¡LISTA PARA HACKEAR! →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/6 shrink-0">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1.5 font-mono text-xs px-4 py-2 rounded-lg border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="h-3.5 w-3.5" /> ATRÁS
              </button>
              <span className="font-mono text-[10px] text-muted-foreground">{step + 1} / {steps.length}</span>
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
                  className="flex items-center gap-1.5 font-mono text-xs px-4 py-2 rounded-lg font-bold transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#9b55f9,#7c3aed)", color: "#fff", boxShadow: "0 0 12px rgba(155,85,249,0.4)" }}>
                  SIGUIENTE <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="w-24" />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Flag Submit Panel ────────────────────────────────────────────────────────
function FlagSubmitPanel({ machine, user, onAuthRequired, onSolved, isSolved }: {
  machine: Machine;
  user: any;
  onAuthRequired: () => void;
  onSolved: () => void;
  isSolved: boolean;
}) {
  const BASE = import.meta.env.BASE_URL;
  const { toast } = useToast();
  const [userFlagInput, setUserFlagInput] = useState("");
  const [rootFlagInput, setRootFlagInput] = useState("");
  const [userFlagOwned, setUserFlagOwned] = useState(false);
  const [rootFlagOwned, setRootFlagOwned] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [submittingRoot, setSubmittingRoot] = useState(false);

  useEffect(() => {
    setUserFlagInput("");
    setRootFlagInput("");
    setUserFlagOwned(false);
    setRootFlagOwned(false);
    if (!user) return;
    fetch(`${BASE}api/lab/machines/${machine.slug}/my-flags?userId=${user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => {
        rows.forEach(r => {
          if (r.flagType === "user" && r.isCorrect) setUserFlagOwned(true);
          if (r.flagType === "root" && r.isCorrect) setRootFlagOwned(true);
        });
      })
      .catch(() => {});
  }, [machine.slug, user]);

  const submitFlag = async (type: "user" | "root") => {
    if (!user) { onAuthRequired(); return; }
    const flag = type === "user" ? userFlagInput : rootFlagInput;
    if (!flag.trim()) return;
    type === "user" ? setSubmittingUser(true) : setSubmittingRoot(true);
    try {
      const r = await fetch(`${BASE}api/lab/machines/${machine.slug}/submit-flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, flagType: type, flag: flag.trim() }),
      });
      const data = await r.json();
      if (data.correct) {
        toast({ title: `🎉 ¡FLAG CORRECTA!`, description: `+${type === "user" ? Math.floor(machine.points / 2) : machine.points} XP`, });
        if (type === "user") { setUserFlagOwned(true); setUserFlagInput(""); }
        else { setRootFlagOwned(true); setRootFlagInput(""); onSolved(); }
      } else {
        toast({ title: "Flag incorrecta", description: "Sigue intentando... 💪", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al enviar", variant: "destructive" });
    } finally {
      type === "user" ? setSubmittingUser(false) : setSubmittingRoot(false);
    }
  };

  return (
    <div className="border border-primary/20 rounded-xl overflow-hidden bg-black/40">
      <div className="px-4 py-2.5 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-3 w-3 text-primary" />
          <span className="font-mono text-[10px] font-bold text-primary tracking-widest">ENVIAR FLAGS</span>
        </div>
        {isSolved && (
          <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-green-400">
            <CheckCircle2 className="h-3 w-3" /> PWNED
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* User Flag */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" /> USER FLAG
              <span className="text-green-400 font-bold">+{Math.floor(machine.points / 2)} XP</span>
            </label>
            {userFlagOwned && <span className="font-mono text-[10px] font-bold text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> OWNED</span>}
          </div>
          {userFlagOwned ? (
            <div className="h-10 rounded-lg border border-green-500/30 bg-green-500/5 flex items-center px-3 gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="font-mono text-xs text-green-400">Flag capturada</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={userFlagInput}
                onChange={e => setUserFlagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitFlag("user")}
                placeholder="SpettroWeb{...}"
                className="flex-1 font-mono text-xs bg-black/60 border-green-500/20 focus-visible:ring-green-500/30 h-10"
                disabled={submittingUser}
              />
              <button
                onClick={() => submitFlag("user")}
                disabled={submittingUser || !userFlagInput.trim()}
                className="px-3 h-10 rounded-lg font-mono text-[10px] font-bold border transition-all disabled:opacity-40"
                style={{ borderColor: "rgba(52,211,153,0.4)", color: "#34d399", background: "rgba(52,211,153,0.08)" }}>
                {submittingUser ? <div className="w-3.5 h-3.5 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Root Flag */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Skull className="h-3 w-3" /> ROOT FLAG
              <span className="text-amber-400 font-bold">+{machine.points} XP</span>
            </label>
            {rootFlagOwned && <span className="font-mono text-[10px] font-bold text-amber-400 flex items-center gap-1"><Trophy className="h-3 w-3" /> ROOTED</span>}
          </div>
          {rootFlagOwned ? (
            <div className="h-10 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center px-3 gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="font-mono text-xs text-amber-400">Root capturado — máquina PWNED</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={rootFlagInput}
                onChange={e => setRootFlagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitFlag("root")}
                placeholder="SpettroWeb{...}"
                className="flex-1 font-mono text-xs bg-black/60 border-amber-500/20 focus-visible:ring-amber-500/30 h-10"
                disabled={submittingRoot}
              />
              <button
                onClick={() => submitFlag("root")}
                disabled={submittingRoot || !rootFlagInput.trim()}
                className="px-3 h-10 rounded-lg font-mono text-[10px] font-bold border transition-all disabled:opacity-40"
                style={{ borderColor: "rgba(245,158,11,0.4)", color: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
                {submittingRoot ? <div className="w-3.5 h-3.5 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>

        {!user && (
          <button onClick={onAuthRequired}
            className="w-full text-center font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors mt-1">
            Inicia sesión para enviar flags
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Lab Page ────────────────────────────────────────────────────────────
export default function Lab() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterDiff, setFilterDiff] = useState<string>("TODAS");
  const [filterOS, setFilterOS] = useState<string>("TODOS");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("nombre");
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [guiaOpen, setGuiaOpen] = useState(false);
  useEffect(() => { setGuiaOpen(false); }, [selectedMachine?.slug]);
  const [explodingId, setExplodingId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [vpnWizardOpen, setVpnWizardOpen] = useState(false);
  const [vpnConnected, setVpnConnected] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [customIp, setCustomIp] = useState<string>("");
  const [machineIp, setMachineIp] = useState<string>("");
  const [spawning, setSpawning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [solvedMachineSlugs, setSolvedMachineSlugs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("spettro_solved_machines") ?? "[]")); }
    catch { return new Set(); }
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const BASE = import.meta.env.BASE_URL;

  const markMachineSolved = (slug: string) => {
    setSolvedMachineSlugs(prev => {
      const next = new Set(prev);
      next.add(slug);
      localStorage.setItem("spettro_solved_machines", JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const diffMap: Record<string, string> = { facil: "FÁCIL", medio: "MEDIO", dificil: "DIFÍCIL", insano: "INSANO" };
        const res = await fetch(`${import.meta.env.BASE_URL}api/lab/machines?limit=500`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const raw = Array.isArray(data) ? data : (data.data || []);
          setMachines(raw.map((m: any) => ({
            ...m, id: String(m.id),
            difficulty: diffMap[m.difficulty] ?? m.difficulty.toUpperCase(),
            techniques: typeof m.techniques === "string" ? m.techniques.split(",").map((t: string) => t.trim()).filter(Boolean) : (m.techniques || []),
          })));
        } else setMachines(generateMockMachines());

        const statsRes = await fetch(`${import.meta.env.BASE_URL}api/lab/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({ ...statsData, byDifficulty: (statsData.byDifficulty || []).map((d: any) => ({ ...d, difficulty: diffMap[d.difficulty] ?? d.difficulty, count: Number(d.count) })) });
        } else {
          setStats({ total: 185, byDifficulty: [{ difficulty: "FÁCIL", count: 70 }, { difficulty: "MEDIO", count: 65 }, { difficulty: "DIFÍCIL", count: 34 }, { difficulty: "INSANO", count: 16 }] });
        }
      } catch {
        setMachines(generateMockMachines());
        setStats({ total: 185, byDifficulty: [{ difficulty: "FÁCIL", count: 70 }, { difficulty: "MEDIO", count: 65 }, { difficulty: "DIFÍCIL", count: 34 }, { difficulty: "INSANO", count: 16 }] });
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fetchSession = useCallback(async (slug: string) => {
    if (!user) return;
    const r = await fetch(`${BASE}api/lab/my-sessions?userId=${user.id}`);
    if (!r.ok) return;
    const sessions: any[] = await r.json();
    const s = sessions.find(s => s.machineSlug === slug);
    setActiveSession(s ?? null);
  }, [user, BASE]);

  const handleInitiateMission = (m: Machine) => {
    setExplodingId(m.id);
    setTimeout(() => {
      setSelectedMachine(m);
      setMachineIp(m.ip || "");
      setExplodingId(null);
      setActiveSession(null);
      fetchSession(m.slug);
      // Fetch fresh machine data so downloadUrl/writeupUrl/videoUrl are always up to date
      const diffMap: Record<string, string> = { facil: "FÁCIL", medio: "MEDIO", dificil: "DIFÍCIL", insano: "INSANO" };
      fetch(`${BASE}api/lab/machines/${m.slug}`, { cache: "no-store" })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          setSelectedMachine(prev => prev?.slug === m.slug ? {
            ...prev,
            downloadUrl: data.downloadUrl ?? prev.downloadUrl,
            writeupUrl: data.writeupUrl ?? prev.writeupUrl,
            videoUrl: data.videoUrl ?? prev.videoUrl,
            thumbnailUrl: data.thumbnailUrl ?? prev.thumbnailUrl,
            description: data.description ?? prev.description,
            vulnerability: data.vulnerability ?? prev.vulnerability,
            hints: data.hints ?? prev.hints,
            ip: data.ip ?? prev.ip,
            techniques: typeof data.techniques === "string"
              ? data.techniques.split(",").map((t: string) => t.trim()).filter(Boolean)
              : (data.techniques ?? prev.techniques),
            difficulty: (diffMap[data.difficulty] ?? data.difficulty?.toUpperCase() ?? prev.difficulty) as Difficulty,
            points: data.points ?? prev.points,
          } : prev);
          if (data.ip) setMachineIp(data.ip);
        })
        .catch(() => {});
    }, 600);
  };

  const handleSpawn = async () => {
    if (!user || !selectedMachine) return;
    setSpawning(true);
    try {
      const r = await fetch(`${BASE}api/lab/machines/${selectedMachine.slug}/spawn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username: user.username }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      const session = await r.json();
      setActiveSession(session);
      setCustomIp(machineIp || session.assignedIp || "");
      toast({ title: "✅ MÁQUINA INICIADA", description: `IP del objetivo: ${machineIp || session.assignedIp}` });
    } catch (e: any) {
      toast({ title: "Error al iniciar", description: e.message, variant: "destructive" });
    } finally { setSpawning(false); }
  };

  const handleStop = async () => {
    if (!user || !selectedMachine) return;
    setStopping(true);
    try {
      await fetch(`${BASE}api/lab/machines/${selectedMachine.slug}/spawn?userId=${user.id}`, { method: "DELETE" });
      setActiveSession(null);
      toast({ title: "⛔ MÁQUINA DETENIDA", description: "Sesión terminada." });
    } catch {
      toast({ title: "Error al detener", variant: "destructive" });
    } finally { setStopping(false); }
  };

  const handleDownloadVpn = () => {
    if (!user) { setAuthOpen(true); return; }
    window.open(`${BASE}api/lab/vpn-config?userId=${user.id}`, "_blank");
  };

  const handleOpenVpnWizard = () => {
    if (!user) { setAuthOpen(true); return; }
    setVpnWizardOpen(true);
  };

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    toast({ title: "IP copiada", description: ip });
  };

  const filteredMachines = machines
    .filter(m => filterDiff === "TODAS" || m.difficulty === filterDiff)
    .filter(m => filterOS === "TODOS" || m.os.toUpperCase() === filterOS)
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "nombre") return a.name.localeCompare(b.name);
      if (sort === "resueltas") return b.solveCount - a.solveCount;
      if (sort === "puntuacion") return b.points - a.points;
      return 0;
    });

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-background text-foreground overflow-x-hidden">

      {/* ── HERO ── */}
      <div className="relative w-full pt-14 pb-8 border-b border-primary/20 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: "linear-gradient(rgba(255,77,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,184,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}/>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,77,184,0.08)_0,transparent_60%)]"/>
        {/* Scan line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"/>
        <div className="container mx-auto px-4 relative z-10">
          {/* Back button */}
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors group">
              <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="tracking-widest">INICIO</span>
            </Link>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2 font-mono text-[10px] text-primary/60 tracking-[0.4em] mb-2">
              <Crosshair className="h-3 w-3" />
              SISTEMA DE INFILTRACIÓN VULNYX v2.4
              <Crosshair className="h-3 w-3" />
            </div>
            <h1 className="text-4xl md:text-6xl font-mono font-bold text-primary drop-shadow-[0_0_20px_rgba(255,77,184,0.5)] leading-tight">
              &gt; LABORATORIO<br className="hidden md:block"/>
              <span className="text-white">DE INFILTRACIÓN</span>
            </h1>
            <p className="text-lg text-muted-foreground font-mono max-w-lg">
              Infiltra. Explota. Escala privilegios. Domina.
            </p>
            {/* VPN Connection Banner */}
            <button onClick={handleOpenVpnWizard}
              className="flex items-center gap-3 mt-2 px-5 py-3 rounded-xl border font-mono w-auto cursor-pointer transition-all hover:brightness-110 group"
              style={{ background: "rgba(0,0,0,0.6)", borderColor: "rgba(155,85,249,0.35)", boxShadow: "0 0 20px rgba(155,85,249,0.12)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: user ? "#34d399" : "#9b55f9" }} />
                <span className="text-[10px] tracking-widest" style={{ color: user ? "#34d399" : "#9b55f9" }}>
                  {user ? "VPN LISTA" : "CONECTAR VPN"}
                </span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <span className="text-[11px] text-muted-foreground group-hover:text-white/70 transition-colors">
                {user ? "Guía de conexión paso a paso" : "Cómo conectarse al laboratorio"}
              </span>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all group-hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#9b55f9,#7c3aed)", color: "#fff", boxShadow: "0 0 12px rgba(155,85,249,0.4)" }}>
                <Wifi className="h-3 w-3" />
                GUÍA VPN
              </div>
            </button>
            {stats && (
              <div className="flex flex-wrap justify-center gap-0 mt-4 font-mono text-sm border border-primary/25 rounded-lg overflow-hidden bg-black/60 backdrop-blur">
                {[
                  { label: "TOTAL", val: stats.total, color: "#e5e5e5" },
                  { label: "FÁCIL", val: stats.byDifficulty?.find((d: any) => d.difficulty === "FÁCIL")?.count ?? 0, color: "#ff4db8" },
                  { label: "MEDIO", val: stats.byDifficulty?.find((d: any) => d.difficulty === "MEDIO")?.count ?? 0, color: "#f59e0b" },
                  { label: "DIFÍCIL", val: stats.byDifficulty?.find((d: any) => d.difficulty === "DIFÍCIL")?.count ?? 0, color: "#9b55f9" },
                  { label: "INSANO", val: stats.byDifficulty?.find((d: any) => d.difficulty === "INSANO")?.count ?? 0, color: "#ef4444" },
                ].map(({ label, val, color }, i) => (
                  <div key={label} className={`flex flex-col items-center px-6 py-3 ${i < 4 ? "border-r border-primary/15" : ""}`}>
                    <span className="text-xl font-bold" style={{ color, textShadow: `0 0 10px ${color}` }}>{val}</span>
                    <span className="text-[9px] tracking-widest text-muted-foreground mt-0.5">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="sticky top-0 z-40 w-full border-b border-border bg-background/96 backdrop-blur-md py-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {["TODAS", "FÁCIL", "MEDIO", "DIFÍCIL", "INSANO"].map(diff => {
              const active = filterDiff === diff;
              const color = diffColorMap[diff] ?? "#e5e5e5";
              return (
                <button key={diff} onClick={() => setFilterDiff(diff)}
                  className="font-mono text-xs px-3 py-1.5 rounded border transition-all"
                  style={{
                    borderColor: active ? color : "rgba(255,255,255,0.1)",
                    background: active ? `${color}20` : "transparent",
                    color: active ? color : "#6b7280",
                    textShadow: active ? `0 0 8px ${color}` : "none",
                    boxShadow: active ? `0 0 12px ${color}20` : "none",
                  }}>
                  {diff}
                </button>
              );
            })}
            <div className="w-px h-6 bg-border mx-1" />
            {["TODOS", "LINUX", "WINDOWS"].map(os => {
              const active = filterOS === os;
              return (
                <button key={os} onClick={() => setFilterOS(os)}
                  className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${active ? "bg-primary/15 border-primary/50 text-primary" : "border-white/10 text-muted-foreground"}`}>
                  {os === "LINUX" ? "🐧 " : os === "WINDOWS" ? "🪟 " : ""}{os}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="buscar objetivo_" className="pl-9 font-mono bg-input/50 border-primary/30 focus-visible:ring-primary"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="bg-input/50 border border-primary/30 rounded-md text-sm font-mono p-2 focus:outline-none focus:border-primary text-foreground"
              value={sort} onChange={e => setSort(e.target.value)}>
              <option value="nombre">Por nombre</option>
              <option value="resueltas">Más resueltas</option>
              <option value="puntuacion">Mayor XP</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── MACHINE GRID ── */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"/>
              <div className="absolute inset-2 rounded-full border-t-2 border-secondary animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.6s" }}/>
              <Target className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse"/>
            </div>
            <p className="font-mono text-xs text-muted-foreground animate-pulse tracking-widest">ESCANEANDO OBJETIVOS...</p>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden" animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}>
            {filteredMachines.map(m => (
              <motion.div key={m.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                style={{ zIndex: explodingId === m.id ? 50 : 1 }}>
                <GameMachineCard m={m} onSelect={handleInitiateMission} user={user}
                  onAuthOpen={() => setAuthOpen(true)} exploding={explodingId === m.id}
                  solved={solvedMachineSlugs.has(m.slug)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* ── TICKER ── */}
      <div className="border-t border-primary/20 bg-primary/5 py-2 overflow-hidden flex whitespace-nowrap">
        <motion.div className="flex gap-4 items-center font-mono text-xs text-primary/60"
          animate={{ x: [0, -1200] }} transition={{ repeat: Infinity, ease: "linear", duration: 24 }}>
          {[...machines, ...machines].slice(0, 24).map((m, i) => (
            <span key={i} className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-primary/40" />
              <span style={{ color: diffColorMap[m.difficulty] ?? "#ff4db8" }}>◆</span>
              {m.name} [{m.difficulty}] +{m.points}XP
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── DETAIL PANEL ── */}
      <AnimatePresence>
        {selectedMachine && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
              onClick={() => setSelectedMachine(null)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
              className="fixed top-0 right-0 h-[100dvh] z-50 flex"
              style={{ width: "min(95vw, 1000px)" }}>
              {/* LEFT: Matrix rain + creature + scoring matrix + actions */}
              <div className="hidden md:flex flex-col w-[40%] border-l border-primary/20 bg-black flex-shrink-0 overflow-y-auto">

                {/* INFORME button — top of left panel */}
                <div className="px-3 pt-3 pb-2 flex-shrink-0">
                  <button
                    onClick={() => { if (!user) { setAuthOpen(true); return; } setReportOpen(true); }}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-md border font-mono text-[10px] font-bold hover:brightness-125 transition-all"
                    style={{ borderColor: "rgba(255,77,184,0.7)", color: "#ff4db8", background: "rgba(255,77,184,0.12)" }}>
                    <Building2 className="h-3 w-3" /> CREAR INFORME
                  </button>
                </div>

                {/* Matrix rain / creature area with WRITEUP + VIDEO centered inside */}
                <div className="relative flex-shrink-0" style={{ height: "280px" }}>
                  <MatrixRainPanel characterType={selectedMachine.characterType} difficulty={selectedMachine.difficulty} />
                  {/* WRITEUP & VIDEO — centred in the black space, above the creature */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none" style={{ paddingBottom: "60px" }}>
                    <div className="flex gap-3 pointer-events-auto">
                      {solvedMachineSlugs.has(selectedMachine.slug) && selectedMachine.writeupUrl ? (
                        <a href={selectedMachine.writeupUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-5 h-10 rounded-md border font-mono text-[11px] font-bold hover:brightness-125 transition-all"
                          style={{ borderColor: "rgba(155,85,249,0.8)", color: "#9b55f9", background: "rgba(155,85,249,0.15)", boxShadow: "0 0 18px rgba(155,85,249,0.35)" }}>
                          <BookOpen className="h-4 w-4" /> WRITEUP
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-2 px-5 h-10 rounded-md border font-mono text-[11px] font-bold"
                          title="Resuelve la máquina para desbloquear"
                          style={{ borderColor: "rgba(155,85,249,0.25)", color: "rgba(155,85,249,0.4)" }}>
                          <Lock className="h-4 w-4" /> WRITEUP
                        </div>
                      )}
                      {solvedMachineSlugs.has(selectedMachine.slug) && selectedMachine.videoUrl ? (
                        <a href={selectedMachine.videoUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-5 h-10 rounded-md border font-mono text-[11px] font-bold hover:brightness-125 transition-all"
                          style={{ borderColor: "rgba(239,68,68,0.8)", color: "#ef4444", background: "rgba(239,68,68,0.15)", boxShadow: "0 0 18px rgba(239,68,68,0.35)" }}>
                          <Play className="h-4 w-4 fill-current" /> VIDEO
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-2 px-5 h-10 rounded-md border font-mono text-[11px] font-bold"
                          title="Resuelve la máquina para desbloquear"
                          style={{ borderColor: "rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.4)" }}>
                          <Lock className="h-4 w-4" /> VIDEO
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <CombatIntel machine={selectedMachine} />
                {/* Scoring matrix – LEFT panel */}
                <div className="border-t border-primary/10 bg-black/60">
                  <div className="px-4 py-2.5 flex items-center gap-2 border-b border-primary/10">
                    <Trophy className="h-3 w-3 text-primary" />
                    <span className="font-mono text-[10px] font-bold text-primary tracking-widest">MATRIZ DE PUNTUACIÓN</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      { label: "USER FLAG", pts: Math.floor(selectedMachine.points / 2), color: "#34d399", icon: "🏴" },
                      { label: "ROOT FLAG", pts: selectedMachine.points, color: "#f59e0b", icon: "💀" },
                      { label: "FIRST BLOOD", pts: Math.floor(selectedMachine.points * 0.25), color: "#ef4444", icon: "🩸" },
                    ].map(({ label, pts, color, icon }) => (
                      <div key={label} className="flex items-center justify-between px-4 py-2.5">
                        <span className="font-mono text-[10px] text-muted-foreground">{icon} {label}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full" style={{ width: `${Math.min(64, pts)}px`, background: `linear-gradient(90deg, ${color}50, ${color})` }} />
                          <span className="font-mono text-xs font-bold" style={{ color }}>+{pts} XP</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5">
                      <span className="font-mono text-[10px] font-bold text-primary">TOTAL MÁXIMO</span>
                      <span className="font-mono text-sm font-black text-primary">+{selectedMachine.points + Math.floor(selectedMachine.points / 2) + Math.floor(selectedMachine.points * 0.25)} XP</span>
                    </div>
                  </div>
                </div>

                {/* ── Writeup guide – LEFT panel ── */}
                <div className="border-t border-primary/10 p-3">
                  <WriteupPanel
                    machine={selectedMachine}
                    isSolved={solvedMachineSlugs.has(selectedMachine.slug)}
                  />
                </div>
              </div>

              {/* RIGHT: Details */}
              <div className="flex flex-col flex-1 bg-[#06060d] border-l border-primary/30 shadow-[-20px_0_60px_rgba(0,0,0,0.9)]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/60 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="md:hidden w-12 h-12">
                      <CreaturePortrait type={selectedMachine.characterType} diff={selectedMachine.difficulty} />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-primary/60 tracking-widest">TARGET LOCKED</p>
                      <h2 className="font-mono text-xl font-bold text-white">{selectedMachine.name}</h2>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => setSelectedMachine(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Action bar — always visible below header */}
                {(() => {
                  const isSolved = solvedMachineSlugs.has(selectedMachine.slug);
                  return (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-black/40 flex-shrink-0">
                        {isSolved && selectedMachine.writeupUrl ? (
                          <a href={selectedMachine.writeupUrl} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border font-mono text-[10px] font-bold transition-all hover:brightness-125"
                            style={{ borderColor: "rgba(155,85,249,0.5)", color: "#9b55f9", background: "rgba(155,85,249,0.08)" }}>
                            <BookOpen className="h-3 w-3" /> WRITEUP
                          </a>
                        ) : (
                          <button disabled title={!isSolved ? "Resuelve la máquina para desbloquear" : "Sin writeup"}
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border font-mono text-[10px] font-bold cursor-not-allowed"
                            style={{ borderColor: "rgba(155,85,249,0.2)", color: "rgba(155,85,249,0.3)" }}>
                            <Lock className="h-3 w-3" /> WRITEUP
                          </button>
                        )}
                        {isSolved && selectedMachine.videoUrl ? (
                          <a href={selectedMachine.videoUrl} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border font-mono text-[10px] font-bold transition-all hover:brightness-125"
                            style={{ borderColor: "rgba(239,68,68,0.5)", color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
                            <Play className="h-3 w-3 fill-current" /> VIDEO
                          </a>
                        ) : (
                          <button disabled title={!isSolved ? "Resuelve la máquina para desbloquear" : "Sin video"}
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border font-mono text-[10px] font-bold cursor-not-allowed"
                            style={{ borderColor: "rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.3)" }}>
                            <Lock className="h-3 w-3" /> VIDEO
                          </button>
                        )}
                        <button
                          onClick={() => setGuiaOpen(v => !v)}
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border font-mono text-[10px] font-bold transition-all hover:brightness-125"
                          style={{ borderColor: guiaOpen ? "rgba(155,85,249,0.7)" : "rgba(155,85,249,0.35)", color: "#9b55f9", background: guiaOpen ? "rgba(155,85,249,0.15)" : "transparent" }}>
                          <BookOpen className="h-3 w-3" /> GUÍA
                          {guiaOpen ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
                        </button>
                        <button
                          onClick={() => { if (!user) { setAuthOpen(true); return; } setReportOpen(true); }}
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border font-mono text-[10px] font-bold transition-all hover:brightness-125"
                          style={{ borderColor: "rgba(255,77,184,0.5)", color: "#ff4db8", background: "rgba(255,77,184,0.08)" }}>
                          <Building2 className="h-3 w-3" /> INFORME
                        </button>
                      </div>
                      {guiaOpen && (
                        <div className="border-b border-white/5 flex-shrink-0 overflow-y-auto max-h-72">
                          <WriteupPanel machine={selectedMachine} isSolved={isSolved} />
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 flex flex-col gap-5">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${getDifficultyColor(selectedMachine.difficulty)} bg-transparent border uppercase font-mono`}>{selectedMachine.difficulty}</Badge>
                      <Badge className={`${selectedMachine.os === "Linux" ? "text-green-400 border-green-400/50" : "text-blue-400 border-blue-400/50"} bg-transparent border font-mono`}>{selectedMachine.os}</Badge>
                      <Badge variant="outline" className="font-mono text-white">+{selectedMachine.points} XP</Badge>
                      <Badge variant="outline" className="font-mono text-muted-foreground">{selectedMachine.solveCount} pwns</Badge>
                      {selectedMachine.downloadUrl && (
                        <a href={selectedMachine.downloadUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border transition-all hover:brightness-110"
                          style={{ background: "rgba(155,85,249,0.12)", borderColor: "rgba(155,85,249,0.4)", color: "#9b55f9" }}>
                          <Download className="h-2.5 w-2.5" /> DESCARGAR MÁQUINA
                        </a>
                      )}
                    </div>

                    <p className="text-muted-foreground font-sans text-sm leading-relaxed">{selectedMachine.description}</p>

                    <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0" />
                      <h4 className="font-mono text-red-400 font-bold mb-2 text-xs flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" /> VULNERABILIDAD DETECTADA
                      </h4>
                      <div className="font-mono text-sm text-red-200">
                        {selectedMachine.vulnerability.split("").map((char, index) => (
                          <motion.span key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.025 }}>
                            {char}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono text-primary font-bold mb-3 text-xs flex items-center gap-2">
                        <Shield className="h-3 w-3" /> TÉCNICAS A EMPLEAR
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMachine.techniques.map((tech, i) => (
                          <Badge key={i} variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </div>

                    {selectedMachine.hints && (
                      <Collapsible className="border border-primary/20 rounded-lg bg-black/50">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-mono font-bold text-xs text-primary hover:bg-primary/5">
                          <span className="flex items-center gap-2"><Server className="h-3 w-3" /> PISTAS DE INFILTRACIÓN</span>
                          <ChevronRight className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 pt-0 text-sm text-muted-foreground font-mono border-t border-primary/10">
                          {selectedMachine.hints}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* ── Flag Submission Area ── */}
                    <FlagSubmitPanel
                      machine={selectedMachine}
                      user={user}
                      onAuthRequired={() => setAuthOpen(true)}
                      onSolved={() => markMachineSolved(selectedMachine.slug)}
                      isSolved={solvedMachineSlugs.has(selectedMachine.slug)}
                    />

                    {/* ── Walkthroughs (unlock on solve) ── */}
                    {(selectedMachine.writeupUrl || selectedMachine.videoUrl) && (
                      <div className="border rounded-xl overflow-hidden transition-all duration-500"
                        style={{
                          borderColor: solvedMachineSlugs.has(selectedMachine.slug) ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)",
                          background: solvedMachineSlugs.has(selectedMachine.slug) ? "rgba(52,211,153,0.04)" : "rgba(0,0,0,0.3)",
                        }}>
                        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "inherit" }}>
                          {solvedMachineSlugs.has(selectedMachine.slug)
                            ? <><CheckCircle2 className="h-3 w-3 text-green-400" /><span className="font-mono text-[10px] font-bold text-green-400 tracking-widest">WALKTHROUGHS DESBLOQUEADOS</span></>
                            : <><Lock className="h-3 w-3 text-muted-foreground" /><span className="font-mono text-[10px] text-muted-foreground tracking-widest">WALKTHROUGHS — RESUELVE LA MÁQUINA PARA DESBLOQUEAR</span></>
                          }
                        </div>
                        <div className="p-3 flex gap-2 flex-wrap">
                          {selectedMachine.videoUrl && (
                            <a href={solvedMachineSlugs.has(selectedMachine.slug) ? selectedMachine.videoUrl : "#"}
                              target={solvedMachineSlugs.has(selectedMachine.slug) ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all"
                              style={{
                                borderColor: solvedMachineSlugs.has(selectedMachine.slug) ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.1)",
                                color: solvedMachineSlugs.has(selectedMachine.slug) ? "#34d399" : "#4b5563",
                                cursor: solvedMachineSlugs.has(selectedMachine.slug) ? "pointer" : "not-allowed",
                              }}
                              onClick={e => !solvedMachineSlugs.has(selectedMachine.slug) && e.preventDefault()}>
                              {solvedMachineSlugs.has(selectedMachine.slug) ? <><Eye className="h-3 w-3" /> VIDEO WALKTHROUGH</> : <><Lock className="h-3 w-3" /> VIDEO WALKTHROUGH</>}
                            </a>
                          )}
                          {selectedMachine.writeupUrl && (
                            <a href={solvedMachineSlugs.has(selectedMachine.slug) ? selectedMachine.writeupUrl : "#"}
                              target={solvedMachineSlugs.has(selectedMachine.slug) ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all"
                              style={{
                                borderColor: solvedMachineSlugs.has(selectedMachine.slug) ? "rgba(155,85,249,0.4)" : "rgba(255,255,255,0.1)",
                                color: solvedMachineSlugs.has(selectedMachine.slug) ? "#9b55f9" : "#4b5563",
                                cursor: solvedMachineSlugs.has(selectedMachine.slug) ? "pointer" : "not-allowed",
                              }}
                              onClick={e => !solvedMachineSlugs.has(selectedMachine.slug) && e.preventDefault()}>
                              {solvedMachineSlugs.has(selectedMachine.slug) ? <><FileText className="h-3 w-3" /> WRITEUP</> : <><Lock className="h-3 w-3" /> WRITEUP</>}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="border border-border rounded-lg p-3 bg-black/30">
                        <p className="font-mono text-[10px] text-muted-foreground mb-1">SISTEMA OBJETIVO</p>
                        <p className="font-mono text-sm font-bold text-white">{selectedMachine.os}</p>
                      </div>
                      <div className="rounded-lg p-3 bg-black/60" style={{ border: "1.5px solid rgba(52,211,153,0.5)", gridColumn: "span 2" }}>
                        <p className="font-mono text-[10px] text-green-400/70 mb-1.5 tracking-widest flex items-center gap-1">
                          <span>⌖</span> IP DE LA MÁQUINA VÍCTIMA
                        </p>
                        <input
                          type="text"
                          value={machineIp}
                          onChange={e => setMachineIp(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          onMouseDown={e => e.stopPropagation()}
                          onTouchStart={e => e.stopPropagation()}
                          onBlur={() => {
                            if (!selectedMachine) return;
                            fetch(`${BASE}api/lab/machines/${selectedMachine.slug}/ip`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ip: machineIp }),
                            }).catch(() => {});
                          }}
                          placeholder="Escribe la IP aquí — ej: 192.168.56.101"
                          style={{
                            width: "100%",
                            background: "rgba(52,211,153,0.08)",
                            border: "1px solid rgba(52,211,153,0.3)",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            fontFamily: "monospace",
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: machineIp ? "#34d399" : "#6b7280",
                            outline: "none",
                            pointerEvents: "all",
                            cursor: "text",
                          }}
                          onFocus={e => {
                            e.currentTarget.style.borderColor = "rgba(52,211,153,0.8)";
                            e.currentTarget.style.boxShadow = "0 0 12px rgba(52,211,153,0.2)";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-border bg-black/60 flex flex-col gap-3 flex-shrink-0">
                  {!user ? (
                    <Button className="w-full h-12 font-mono font-bold bg-primary text-black hover:brightness-110"
                      onClick={() => setAuthOpen(true)}>
                      <Zap className="mr-2 h-4 w-4" /> REGÍSTRATE PARA JUGAR
                    </Button>
                  ) : activeSession ? (
                    <>
                      {/* IP display */}
                      <div className="rounded-xl border p-4 flex flex-col gap-3 font-mono"
                        style={{ background: "rgba(52,211,153,0.06)", borderColor: "rgba(52,211,153,0.3)", boxShadow: "0 0 20px rgba(52,211,153,0.08)" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full animate-pulse bg-green-400" />
                          <span className="text-[10px] tracking-widest text-green-400 font-bold">MÁQUINA ACTIVA</span>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground tracking-widest mb-2">IP DEL OBJETIVO</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={customIp}
                              onChange={e => setCustomIp(e.target.value)}
                              placeholder="192.168.x.x"
                              className="flex-1 bg-black/50 border border-green-500/40 rounded-lg px-3 py-2 text-xl font-black text-green-400 tracking-wider outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/30 font-mono"
                              style={{ textShadow: "0 0 12px rgba(52,211,153,0.6)" }}
                            />
                            <button onClick={() => handleCopyIp(customIp)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold border border-green-500/30 text-green-400 hover:bg-green-400/10 transition-all">
                              <Copy className="h-3 w-3" /> COPIAR
                            </button>
                          </div>
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          <span className="font-mono">$ nmap -sV -sC {customIp || "..."}</span>
                        </div>
                      </div>
                      <Button variant="outline"
                        className="w-full h-10 font-mono text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                        disabled={stopping}
                        onClick={handleStop}>
                        <Square className="mr-2 h-3.5 w-3.5" /> {stopping ? "DETENIENDO..." : "DETENER MÁQUINA"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      className={`w-full h-12 font-mono font-bold uppercase text-sm ${diffLabelBg[selectedMachine.difficulty] ?? "bg-primary"} text-black hover:brightness-110`}
                      disabled={spawning}
                      onClick={handleSpawn}>
                      {spawning ? (
                        <><div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin mr-2" /> INICIANDO...</>
                      ) : (
                        <><Play className="mr-2 h-4 w-4 fill-black" /> INICIAR MÁQUINA</>
                      )}
                    </Button>
                  )}

                  {/* VPN wizard row */}
                  <div className="flex items-center gap-2 justify-between">
                    <button onClick={handleOpenVpnWizard}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border font-mono text-[10px] transition-all hover:bg-secondary/10 hover:brightness-110"
                      style={{ borderColor: "rgba(155,85,249,0.4)", color: "#9b55f9" }}>
                      <Wifi className="h-3 w-3" /> GUÍA DE CONEXIÓN VPN
                    </button>
                    {selectedMachine.downloadUrl ? (
                      <a href={selectedMachine.downloadUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-secondary/40 text-secondary font-mono text-[10px] hover:bg-secondary/10 transition-all">
                        <Download className="h-3 w-3" /> DESCARGAR MÁQUINA
                      </a>
                    ) : (
                      <button disabled
                        className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-white/10 text-muted-foreground/40 font-mono text-[10px] cursor-not-allowed">
                        <Download className="h-3 w-3" /> DESCARGAR MÁQUINA
                      </button>
                    )}
                  </div>


                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Pentest Report Modal ── */}
      {reportOpen && (
        <PentestReportModal
          machine={selectedMachine}
          user={user}
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialTab="register" />

      <VpnWizardModal
        isOpen={vpnWizardOpen}
        onClose={() => setVpnWizardOpen(false)}
        onDownload={handleDownloadVpn}
        username={user?.username ?? "usuario"}
      />

      {/* ── VPN STATUS HUD ── */}
      <VpnHud
        connected={vpnConnected}
        vpnIp={user ? `10.8.0.${(user.id % 200) + 10}` : null}
        userId={user?.id ?? 0}
        username={user?.username ?? ""}
        base={BASE}
        onToggle={() => {
          if (!user) { setAuthOpen(true); return; }
          setVpnConnected(v => !v);
        }}
        onOpenWizard={handleOpenVpnWizard}
      />

      {/* ── ACTIVE MACHINE PANEL (bottom bar, HTB-style) ── */}
      <AnimatePresence>
        {user && activeSession && selectedMachine && (
          <ActiveMachinePanel
            machine={selectedMachine}
            session={activeSession}
            userId={user.id}
            base={BASE}
            onStop={handleStop}
            onCopyIp={handleCopyIp}
            stopping={stopping}
            onMarkSolved={markMachineSolved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── WriteupPanel ─────────────────────────────────────────────────────────────
const WriteupPanel = ({ machine, isSolved }: { machine: Machine; isSolved: boolean }) => {
  const [open, setOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const phases = [
    { label: "RECONOCIMIENTO",         icon: "🔍", desc: "Escaneo inicial de puertos y servicios activos en el objetivo.", cmd: `nmap -sV -sC -p- --min-rate 5000 -oN scan.txt TARGET_IP` },
    { label: "ENUMERACIÓN WEB",        icon: "📋", desc: "Enumeración de directorios, subdominios y puntos de entrada.", cmd: `gobuster dir -u http://TARGET_IP/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php,html,txt,bak` },
    { label: "EXPLOTACIÓN",            icon: "⚡", desc: machine.vulnerability, cmd: `# Vector: ${machine.vulnerability}\n# Técnicas: ${machine.techniques.join(", ")}` },
    { label: "ESCALADA DE PRIVILEGIOS",icon: "🚀", desc: "Escalada de usuario a root mediante misconfiguraciones o exploits locales.", cmd: `sudo -l\nfind / -perm -4000 -type f 2>/dev/null\ncurl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh` },
    { label: "POST-EXPLOTACIÓN",       icon: "🏴", desc: "Captura de flags de usuario y root como prueba de compromiso.", cmd: `cat /home/*/user.txt\ncat /root/root.txt` },
  ];

  const handleCopy = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden" style={{ background: "#020208" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 font-mono text-xs font-bold text-secondary hover:bg-white/[0.02] transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" /> GUÍA DE WRITEUP — {machine.name.toUpperCase()}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden border-t border-white/5">
            <div className="px-4 py-2 bg-black/60 border-b border-white/5 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="font-mono text-[9px] text-muted-foreground ml-1">writeup.md — {machine.name}</span>
              {!isSolved && <span className="ml-auto font-mono text-[9px] text-muted-foreground/50 flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> comandos bloqueados</span>}
            </div>
            <div className="divide-y divide-white/5">
              {phases.map((phase, idx) => (
                <div key={idx} className="p-4">
                  <div className="flex items-start gap-3 mb-2.5">
                    <span className="text-base shrink-0">{phase.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] font-bold text-secondary mb-1">
                        # FASE {String(idx + 1).padStart(2, "0")}: {phase.label}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{phase.desc}</p>
                    </div>
                  </div>
                  <div className="relative rounded-lg overflow-hidden border border-white/5 bg-black/80">
                    <pre
                      className={`px-3 py-2.5 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap transition-all ${isSolved ? "text-green-400" : "text-white/20 select-none"}`}
                      style={!isSolved ? { filter: "blur(4px)" } : {}}
                    >{phase.cmd}</pre>
                    {isSolved ? (
                      <button onClick={() => handleCopy(phase.cmd, idx)}
                        className="absolute top-2 right-2 p-1.5 rounded border border-white/10 text-muted-foreground hover:text-white hover:border-white/30 transition-all bg-black/60">
                        {copiedIdx === idx ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-[10px] text-muted-foreground/50 flex items-center gap-1.5 bg-black/80 px-3 py-1 rounded-full">
                          <Lock className="h-3 w-3" /> Resuelve la máquina para desbloquear
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Pentest report types & helpers ───────────────────────────────────────────
interface ReportData {
  executiveSummary: string; scope: string; vulnerabilities: string;
  exploitSteps: string; impact: string; recommendations: string;
  tester: string; date: string;
}
const sanitizeField = (s: string, max = 1000) =>
  s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

// ─── PentestReportModal ────────────────────────────────────────────────────────
const PentestReportModal = ({
  machine, user, isOpen, onClose,
}: { machine: Machine | null; user: any; isOpen: boolean; onClose: () => void }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "preview">("form");
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<ReportData>({
    executiveSummary: "", scope: "", vulnerabilities: "",
    exploitSteps: "", impact: "", recommendations: "",
    tester: user?.username || "", date: today,
  });

  useEffect(() => {
    if (machine && isOpen) {
      setStep("form");
      setForm(prev => ({
        ...prev, scope: machine.name, vulnerabilities: machine.vulnerability,
        tester: user?.username || prev.tester, date: today,
      }));
    }
  }, [machine?.id, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubmitting(false);
    setStep("preview");
    toast({ title: "✓ Informe presentado", description: "Tu informe de seguridad ha sido registrado correctamente." });
  };

  const sf = {
    executiveSummary: sanitizeField(form.executiveSummary, 500),
    scope: sanitizeField(form.scope, 100),
    vulnerabilities: sanitizeField(form.vulnerabilities, 500),
    exploitSteps: sanitizeField(form.exploitSteps, 1500),
    impact: sanitizeField(form.impact, 500),
    recommendations: sanitizeField(form.recommendations, 500),
    tester: sanitizeField(form.tester, 50),
    date: form.date,
  };

  const fieldDefs = [
    { key: "executiveSummary", label: "Resumen Ejecutivo",              rows: 3, max: 500,  placeholder: "Describe el objetivo del pentest y los hallazgos principales...", required: true },
    { key: "vulnerabilities",  label: "Vulnerabilidades Encontradas",   rows: 3, max: 500,  placeholder: "Lista las vulnerabilidades con su severidad (Crítica / Alta / Media / Baja)...", required: true },
    { key: "exploitSteps",     label: "Pasos de Explotación",           rows: 4, max: 1500, placeholder: "Describe paso a paso cómo se explotó la vulnerabilidad...", required: false },
    { key: "impact",           label: "Impacto y Nivel de Riesgo",      rows: 2, max: 500,  placeholder: "¿Qué podría conseguir un atacante real? Nivel: Crítico / Alto / Medio / Bajo...", required: false },
    { key: "recommendations",  label: "Recomendaciones de Remediación", rows: 3, max: 500,  placeholder: "Parches, actualizaciones, cambios de configuración recomendados...", required: false },
  ];

  if (!isOpen || !machine) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.94)", backdropFilter: "blur(14px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="w-full max-w-2xl max-h-[92dvh] bg-[#050510] border border-primary/30 rounded-2xl overflow-hidden flex flex-col"
        style={{ boxShadow: "0 0 80px rgba(255,77,184,0.12)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-black/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-white text-sm tracking-wide">INFORME DE SEGURIDAD</h2>
              <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-0.5">TARGET: {machine.name.toUpperCase()} · SpettroWeb Security</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === "preview" && (
              <button onClick={() => setStep("form")}
                className="font-mono text-[10px] px-3 py-1.5 rounded border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-colors">
                ← EDITAR
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-1.5 rounded hover:bg-white/5">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            <div className="p-6 space-y-5 flex-1">
              {/* Info banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                <ClipboardList className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-mono text-xs text-primary font-bold mb-1">INFORME DE PRUEBA DE PENETRACIÓN</p>
                  <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                    Documenta tus hallazgos de forma profesional. Los campos con <span className="text-primary">*</span> son obligatorios.
                    El contenido es <span className="text-secondary">sanitizado automáticamente</span> antes de presentarse.
                  </p>
                </div>
              </div>

              {/* Scope */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Objetivo / Alcance</label>
                <input value={form.scope} onChange={e => setForm(p => ({ ...p, scope: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 font-mono text-sm text-white placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  maxLength={100} />
              </div>

              {fieldDefs.map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    {f.label} {f.required && <span className="text-primary">*</span>}
                  </label>
                  <textarea
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={f.rows}
                    maxLength={f.max}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 font-mono text-sm text-white placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                  />
                  <div className="flex justify-between">
                    <p className="font-mono text-[9px] text-muted-foreground/40">Sanitizado automáticamente · sin HTML</p>
                    <p className="font-mono text-[9px] text-muted-foreground/40">{((form as any)[f.key] as string).length}/{f.max}</p>
                  </div>
                </div>
              ))}

              {/* Analyst + date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Analista <span className="text-primary">*</span></label>
                  <input value={form.tester} onChange={e => setForm(p => ({ ...p, tester: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 font-mono text-sm text-white focus:outline-none focus:border-primary/50 transition-colors" maxLength={50} />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Fecha del informe</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 font-mono text-sm text-white focus:outline-none focus:border-primary/50 transition-colors" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/8 bg-black/40 flex gap-3 flex-shrink-0">
              <button type="button" onClick={onClose}
                className="font-mono text-xs px-4 py-2.5 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors">
                CANCELAR
              </button>
              <button type="submit"
                disabled={submitting || !form.executiveSummary.trim() || !form.vulnerabilities.trim() || !form.tester.trim()}
                className="flex-1 font-mono text-xs py-2.5 rounded-lg bg-primary text-black font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                {submitting
                  ? <><span className="animate-spin inline-block">◈</span> PROCESANDO...</>
                  : <><FileCheck className="h-3.5 w-3.5" /> PRESENTAR INFORME</>}
              </button>
            </div>
          </form>
        ) : (
          /* ── Preview ── */
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-4">
              {/* Cover */}
              <div className="rounded-xl border border-primary/30 p-5"
                style={{ background: "linear-gradient(135deg, rgba(255,77,184,0.08), rgba(155,85,249,0.05))" }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-mono text-[8px] text-primary/60 tracking-[0.3em] mb-1">SPETTROWEB SECURITY ACADEMY</p>
                    <h3 className="font-mono text-lg font-black text-white">INFORME DE PRUEBA DE<br />PENETRACIÓN</h3>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-[9px] shrink-0">CONFIDENCIAL</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px] font-mono border-t border-white/10 pt-3">
                  <span className="text-muted-foreground">Objetivo: <span className="text-white">{sf.scope}</span></span>
                  <span className="text-muted-foreground">Analista: <span className="text-white">{sf.tester}</span></span>
                  <span className="text-muted-foreground">Plataforma: <span className="text-white">SpettroWeb Lab</span></span>
                  <span className="text-muted-foreground">Fecha: <span className="text-white">{sf.date}</span></span>
                </div>
              </div>

              {[
                { num: "01", label: "RESUMEN EJECUTIVO",              content: sf.executiveSummary, color: "#ff4db8" },
                { num: "02", label: "VULNERABILIDADES ENCONTRADAS",   content: sf.vulnerabilities,  color: "#ef4444" },
                { num: "03", label: "PASOS DE EXPLOTACIÓN",           content: sf.exploitSteps,     color: "#9b55f9" },
                { num: "04", label: "IMPACTO Y NIVEL DE RIESGO",      content: sf.impact,           color: "#f59e0b" },
                { num: "05", label: "RECOMENDACIONES DE REMEDIACIÓN", content: sf.recommendations,  color: "#34d399" },
              ].filter(s => s.content.trim()).map(({ num, label, content, color }) => (
                <div key={num} className="rounded-xl border border-white/8 bg-black/40 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/5">
                    <span className="font-mono text-[10px] font-bold tracking-widest" style={{ color }}>{num}. {label}</span>
                  </div>
                  <p className="px-4 py-3.5 font-mono text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{content}</p>
                </div>
              ))}

              {/* Digital signature */}
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[9px] text-muted-foreground mb-0.5">Firmado digitalmente</p>
                  <p className="font-mono text-sm font-bold text-primary">{sf.tester} · SpettroWeb Security Academy</p>
                </div>
                <Badge className="bg-green-500/15 text-green-400 border-green-500/30 font-mono text-xs">✓ PRESENTADO</Badge>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/8 bg-black/40 flex gap-3">
              <button
                onClick={() => {
                  const txt = [`INFORME DE PENTEST — ${sf.scope}`, `Analista: ${sf.tester} | Fecha: ${sf.date}`, `SpettroWeb Security Academy`, "",
                    `1. RESUMEN EJECUTIVO\n${sf.executiveSummary}`, `2. VULNERABILIDADES\n${sf.vulnerabilities}`,
                    sf.exploitSteps && `3. EXPLOTACIÓN\n${sf.exploitSteps}`,
                    sf.impact && `4. IMPACTO\n${sf.impact}`,
                    sf.recommendations && `5. RECOMENDACIONES\n${sf.recommendations}`,
                  ].filter(Boolean).join("\n\n");
                  navigator.clipboard.writeText(txt);
                  toast({ title: "✓ Copiado", description: "Informe copiado al portapapeles." });
                }}
                className="flex-1 font-mono text-xs py-2.5 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <Copy className="h-3.5 w-3.5" /> COPIAR INFORME
              </button>
              <button onClick={onClose}
                className="flex-1 font-mono text-xs py-2.5 rounded-lg bg-primary text-black font-bold hover:brightness-110 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> CERRAR
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Mock fallback ────────────────────────────────────────────────────────────
function generateMockMachines(): Machine[] {
  const charTypes = ["skull", "robot", "demon", "spider", "ghost", "dragon", "virus", "ninja", "phantom", "cyber", "eye", "kraken"];
  const diffs: Difficulty[] = ["FÁCIL", "MEDIO", "DIFÍCIL", "INSANO"];
  const oss: ("Linux" | "Windows")[] = ["Linux", "Windows"];
  return Array.from({ length: 20 }, (_, i) => {
    const diff = diffs[i % 4];
    const pts = diff === "FÁCIL" ? 10 : diff === "MEDIO" ? 20 : diff === "DIFÍCIL" ? 40 : 50;
    return {
      id: `m-${i}`, name: `VulnMachine-${i + 1}`, slug: `vuln-machine-${i + 1}`,
      os: oss[i % 2], difficulty: diff, characterType: charTypes[i % charTypes.length],
      points: pts, description: "Máquina de entrenamiento de hacking para poner a prueba tus habilidades de enumeración y explotación.",
      vulnerability: "SQL Injection → RCE via file upload", techniques: ["Enumeración Web", "SQLi", "File Upload Bypass", "PrivEsc"],
      hints: "Revisa los headers HTTP y busca directorios ocultos.", thumbnailUrl: null, downloadUrl: null, writeupUrl: null, videoUrl: null,
      solveCount: Math.floor(Math.random() * 200), isActive: true,
    };
  });
}
