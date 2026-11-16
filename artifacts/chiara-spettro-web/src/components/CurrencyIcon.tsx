const BASE = import.meta.env.BASE_URL;

const SRC: Record<string, string> = {
  GHC: BASE + "coins/ghc.png",
  SPC: BASE + "coins/spc.png",
};

export default function CurrencyIcon({ currency, className = "h-6 w-6" }: { currency: string; className?: string }) {
  const src = SRC[currency] ?? SRC.SPC;
  return <img src={src} alt={currency} className={`${className} object-contain inline-block drop-shadow`} />;
}
