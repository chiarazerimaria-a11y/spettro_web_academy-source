import { useEffect, useRef, useState } from "react";

type Props = {
  base: string;        // ej: "/androids/videos/alfa-01" (sin extensión)
  className?: string;
  fallback?: string;   // imagen de respaldo si el video falla
};

export default function LazyVideo({ base, className, fallback }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Detecta si la tarjeta está en pantalla
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setLoaded(true); // descarga solo la primera vez que se ve
      },
      { rootMargin: "100px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reproduce cuando se ve, pausa cuando sale de pantalla
  useEffect(() => {
    const el = ref.current;
    if (!el || !loaded) return;
    if (visible) el.play().catch(() => {});
    else el.pause();
  }, [visible, loaded]);

  if (failed && fallback) {
    return <img src={fallback} className={className} alt="" />;
  }

  return (
    <video
      ref={ref}
      className={className}
      src={loaded ? `${base}.mp4` : undefined}
      poster={`${base}.jpg`}
      muted
      loop
      playsInline
      preload="none"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
