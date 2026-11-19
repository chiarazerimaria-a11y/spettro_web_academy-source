import { useEffect, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL;

const FRAMES: Record<string, string[]> = {
  SPC: Array.from({ length: 8 }, (_, i) => BASE + "coins/spin/spc" + (i + 1) + ".png"),
  GHC: Array.from({ length: 8 }, (_, i) => BASE + "coins/spin/ghc" + (i + 1) + ".png"),
};

const FRAME_MS = 110; // duracion de cada frame, en milisegundos

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

  // Precarga los 8 frames en cache del navegador para que el cambio sea instantaneo
  useEffect(() => {
    frames.forEach((src) => { const img = new Image(); img.src = src; });
  }, [frames]);

  // Animacion con requestAnimationFrame + tiempo acumulado real (no se atrasa ni se traba
  // como puede pasar con setInterval cuando el navegador esta ocupado)
  useEffect(() => {
    if (!spin) return;
    let rafId = 0;
    let last = performance.now();
    let acc = 0;

    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      acc += dt;
      // si hubo un salto grande (pestana en segundo plano, lag), no intentamos
      // "recuperar" todos los frames perdidos de golpe: avanzamos como maximo uno
      if (acc >= FRAME_MS) {
        acc = acc % FRAME_MS;
        idxRef.current = (idxRef.current + 1) % frames.length;
        setFrame(idxRef.current);
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
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
