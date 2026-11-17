const BASE = import.meta.env.BASE_URL;
const MUTE_KEY = "spettro_sound_muted";

export type CoinSound = "spc-in" | "spc-out" | "ghc-move" | "exchange";

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // sin acceso a localStorage, no pasa nada
  }
  window.dispatchEvent(new CustomEvent("spettro-sound-mute", { detail: muted }));
}

export function playCoinSound(sound: CoinSound, volume = 0.5) {
  if (isSoundMuted()) return;
  try {
    const audio = new Audio(BASE + "sounds/" + sound + ".wav");
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    // el navegador puede bloquear audio sin interaccion previa; lo ignoramos
  }
}
