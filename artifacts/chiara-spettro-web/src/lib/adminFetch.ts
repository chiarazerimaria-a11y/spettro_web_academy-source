// Anade la clave de admin (guardada en sessionStorage tras iniciar sesion) a las peticiones del panel.
const w = window as any;
if (!w.__adminFetchPatched) {
  w.__adminFetchPatched = true;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : "";
      const key = sessionStorage.getItem("adminKey");
      if (key && (url.includes("api/admin") || url.includes("api/payouts/requests"))) {
        const headers = new Headers(init?.headers);
        if (!headers.has("X-Admin-Key")) headers.set("X-Admin-Key", key);
        return original(input, { ...init, headers });
      }
    } catch { /* ignorar */ }
    return original(input, init);
  };
}
export {};
