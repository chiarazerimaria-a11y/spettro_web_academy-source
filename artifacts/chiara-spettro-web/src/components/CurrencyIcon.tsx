const BASE = import.meta.env.BASE_URL;

const SRC: Record<string, string> = {
  GHC: BASE + "coins/ghc.jpeg",
  SPC: BASE + "coins/spc.jpeg",
};

export default function CurrencyIcon({ currency, className = "h-4 w-4" }: { currency: string; className?: string }) {
  const src = SRC[currency] ?? SRC.SPC;
  return <img src={src} alt={currency} className={`${className} rounded-full object-cover inline-block`} />;
}
