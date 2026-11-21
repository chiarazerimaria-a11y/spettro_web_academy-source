type Props = {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
};

export default function Pager({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const btn: React.CSSProperties = {
    padding: "8px 14px",
    margin: "0 4px",
    background: "transparent",
    color: "inherit",
    border: "1px solid rgba(255,255,255,0.25)",
    fontFamily: "inherit",
    letterSpacing: "0.1em",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 4, margin: "32px 0" }}>
      <button style={{ ...btn, opacity: page === 1 ? 0.4 : 1 }} disabled={page === 1} onClick={() => onChange(page - 1)}>
        ‹ ANTERIOR
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          style={{ ...btn, ...(n === page ? { borderColor: "#ff2e93", color: "#ff2e93" } : {}) }}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}

      <button
        style={{ ...btn, opacity: page === totalPages ? 0.4 : 1 }}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        SIGUIENTE ›
      </button>
    </div>
  );
}
