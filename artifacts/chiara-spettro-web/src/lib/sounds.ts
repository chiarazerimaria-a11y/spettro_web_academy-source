const BASE = import.meta.env.BASE_URL;

export type CoinSound = "spc-in" | "spc-out" | "ghc-move" | "exchange";

export function playCoinSound(sound: CoinSound, volume = 0.5) {
  try {
    const audio = new Audio(BASE + "sounds/" + sound + ".wav");
    audio.volume = volume;
    void audio.play().catch(() => {});
  } catch {
    // el navegador puede bloquear audio sin interaccion previa; lo ignoramos
  }
}
