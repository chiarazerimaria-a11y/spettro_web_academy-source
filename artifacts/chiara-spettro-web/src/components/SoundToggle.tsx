import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundMuted, setSoundMuted } from "@/lib/sounds";

export default function SoundToggle() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  return (
    <button
      onClick={toggle}
      title={muted ? "Activar sonido" : "Silenciar sonido"}
      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}
