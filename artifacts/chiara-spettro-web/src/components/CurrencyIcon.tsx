import { useEffect, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL;

const FRAMES: Record<string, string[]> = {
  SPC: Array.from({ length: 8 }, (_, i) => BASE + "coins/spin/spc" + (i + 1) + ".png"),
  GHC: Array.from({ length: 8 }, (_, i) => BASE + "coins/spin/ghc" + (i + 1) + ".png"),
};

export default function CurrencyIcon({
  currency,
  className = "h-6 w-6",
  spin = true,
}: {
  currency: string;
  className?: string;
  spin?: boolean;
}) {
  const frames = FRAMES[currency] ?? FRAMES.SPC;
  const [frame, setFrame] = useState(0);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!spin) return;
    const id = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % frames.length;
      setFrame(idxRef.current);
    }, 110);
    return () => clearInterval(id);
  }, [spin, frames.length]);

  return (
    <img
      src={frames[frame]}
      alt={currency}
      draggable={false}
      className={`${className} object-contain inline-block drop-shadow select-none`}
    />
  );
}
