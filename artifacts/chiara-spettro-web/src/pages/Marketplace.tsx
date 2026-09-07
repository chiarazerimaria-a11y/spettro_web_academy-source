import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, Plus, Star, Download, Tag, Users, Search, Filter,
  BookOpen, Code, Wrench, FileText, GraduationCap, Coins, ChevronLeft,
  CheckCircle, Lock, ArrowRight, Zap, X, Cpu, Radio, Wifi, Usb,
  Package, ExternalLink, ShoppingCart, Shield
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface Product {
  id: number;
  sellerId: number;
  sellerUsername: string;
  title: string;
  description: string;
  category: string;
  price: number;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
  previewText: string | null;
  tags: string[] | null;
  salesCount: number;
  rating: number | null;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { id: "all", label: "TODOS", icon: <ShoppingBag className="h-4 w-4" /> },
  { id: "hardware", label: "HARDWARE", icon: <Cpu className="h-4 w-4" /> },
  { id: "writeup", label: "WRITEUPS", icon: <BookOpen className="h-4 w-4" /> },
  { id: "script", label: "SCRIPTS", icon: <Code className="h-4 w-4" /> },
  { id: "tool", label: "TOOLS", icon: <Wrench className="h-4 w-4" /> },
  { id: "notes", label: "APUNTES", icon: <FileText className="h-4 w-4" /> },
  { id: "course", label: "GUÍAS", icon: <GraduationCap className="h-4 w-4" /> },
];

const CAT_COLORS: Record<string, string> = {
  writeup: "#ff4db8",
  script: "#9b55f9",
  tool: "#facc15",
  notes: "#22d3ee",
  course: "#34d399",
};

const CAT_LABELS: Record<string, string> = {
  writeup: "WRITEUP",
  script: "SCRIPT",
  tool: "TOOL",
  notes: "APUNTES",
  course: "GUÍA",
};

interface HardwareProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  specs: string[];
  tags: string[];
  price: number;
  currency: string;
  category: "rf" | "wifi" | "usb" | "sdr" | "rfid" | "red" | "micro";
  difficulty: "Principiante" | "Intermedio" | "Avanzado";
  link: string;
  icon: string;
  color: string;
  image: string;
}

const HW_CATEGORIES = [
  { id: "all", label: "TODOS" },
  { id: "rf", label: "RF / SDR" },
  { id: "wifi", label: "WiFi" },
  { id: "usb", label: "USB / HID" },
  { id: "rfid", label: "RFID / NFC" },
  { id: "red", label: "RED" },
  { id: "micro", label: "MICRO / IoT" },
];

const HW_COLOR: Record<string, string> = {
  rf: "#facc15",
  wifi: "#22d3ee",
  usb: "#ff4db8",
  sdr: "#facc15",
  rfid: "#9b55f9",
  red: "#34d399",
  micro: "#fb923c",
};

const HARDWARE_CATALOG: HardwareProduct[] = [
  {
    id: "flipper-zero",
    name: "Flipper Zero",
    brand: "Flipper Devices",
    description: "La navaja suiza del hardware hacking. Sub-GHz, RFID, NFC, IR, GPIO y Bluetooth en un solo dispositivo portátil.",
    specs: ["Sub-GHz 315/433/868 MHz", "RFID 125kHz LF", "NFC 13.56MHz HF", "Infrarrojo TX/RX", "Bluetooth LE 5.4", "GPIO / UART / SPI / I2C"],
    tags: ["sub-ghz", "rfid", "nfc", "infrarrojo", "gpio"],
    price: 169,
    currency: "USD",
    category: "rf",
    difficulty: "Principiante",
    link: "https://flipperzero.one",
    icon: "🐬",
    color: "#ff4db8",
    image: "https://5.imimg.com/data5/SELLER/Default/2025/1/480137922/GF/PM/ER/75467552/flipper-zero-device-for-hacking-multi-tool-1000x1000.jpg",
  },
  {
    id: "hackrf-one",
    name: "HackRF One",
    brand: "Great Scott Gadgets",
    description: "Radio definida por software half-duplex de 1 MHz a 6 GHz. Ideal para GPS spoofing, análisis GSM y replay de señales.",
    specs: ["1 MHz – 6 GHz", "Half-duplex TX/RX", "20 MHz de ancho de banda", "8-bit resolución ADC/DAC", "Compatible con GNU Radio"],
    tags: ["sdr", "radio", "gps-spoofing", "gsm", "replay"],
    price: 299,
    currency: "USD",
    category: "rf",
    difficulty: "Avanzado",
    link: "https://greatscottgadgets.com/hackrf",
    icon: "📡",
    color: "#facc15",
    image: "https://www.hgeek.com/cdn/shop/files/96794-5.jpg?v=1750663433",
  },
  {
    id: "rtlsdr-v4",
    name: "RTL-SDR Blog V4",
    brand: "RTL-SDR Blog",
    description: "Dongle SDR de bajo costo para escucha pasiva de radiofrecuencia. Ideal para empezar con SDR sin romper el banco.",
    specs: ["500 kHz – 1.75 GHz", "Modo solo recepción", "Driver propio RTL-SDR v4", "Compatible SDR# / GQRX / GNU Radio", "Antena dipolo incluida"],
    tags: ["sdr", "radio", "escucha", "am", "fm", "adsb"],
    price: 39,
    currency: "USD",
    category: "rf",
    difficulty: "Principiante",
    link: "https://www.rtl-sdr.com/rtl-sdr-blog-v4-dongle",
    icon: "🔊",
    color: "#facc15",
    image: "https://m.media-amazon.com/images/I/617qGXKe7hL.jpg",
  },
  {
    id: "wifi-pineapple",
    name: "WiFi Pineapple Mark VII",
    brand: "Hak5",
    description: "Plataforma de auditoría WiFi profesional. Ataques Evil Twin, Rogue AP, captive portal y monitoreo pasivo.",
    specs: ["2.4 GHz + 5 GHz dual-band", "Modo monitor / injection", "OpenWRT embebido", "REST API + web UI", "Alimentación USB-C"],
    tags: ["wifi", "evil-twin", "mitm", "deauth", "captive-portal"],
    price: 99,
    currency: "USD",
    category: "wifi",
    difficulty: "Intermedio",
    link: "https://shop.hak5.org/products/wifi-pineapple",
    icon: "🍍",
    color: "#22d3ee",
    image: "https://i.ebayimg.com/images/g/vtQAAOSwnWlhuNmf/s-l500.jpg",
  },
  {
    id: "alfa-awus036ach",
    name: "Alfa AWUS036ACH",
    brand: "Alfa Network",
    description: "Adaptador WiFi dual-band de alto rendimiento con soporte nativo de modo monitor e inyección de paquetes en Kali Linux.",
    specs: ["2.4 GHz + 5 GHz 802.11ac", "Hasta 1900 Mbps", "Chipset Realtek RTL8812AU", "Modo monitor + packet injection", "2× antena 5dBi"],
    tags: ["wifi", "monitor-mode", "kali", "injection", "auditoría"],
    price: 39,
    currency: "USD",
    category: "wifi",
    difficulty: "Principiante",
    link: "https://www.alfa.com.tw/products/awus036ach",
    icon: "📶",
    color: "#22d3ee",
    image: "https://www.alfa.com.tw/cdn/shop/files/AWUS036ACHM_04_81d6ac49-419e-4329-ba96-313240ee7185_800x800.jpg?v=1763607370",
  },
  {
    id: "rubber-ducky",
    name: "USB Rubber Ducky",
    brand: "Hak5",
    description: "Dispositivo de keystroke injection clásico. Se presenta como teclado HID e inyecta payloads en menos de 1 segundo.",
    specs: ["Emula teclado USB HID", "Lenguaje DuckyScript 3.0", "Inyección <1 segundo", "Compatible con Win / Mac / Linux / Android", "MicroSD para payloads"],
    tags: ["hid", "keystroke", "usb", "duckyscript", "injection"],
    price: 49,
    currency: "USD",
    category: "usb",
    difficulty: "Principiante",
    link: "https://shop.hak5.org/products/usb-rubber-ducky",
    icon: "🦆",
    color: "#ff4db8",
    image: "https://www.fonefunshop.com/cdn/shop/files/ducky3.jpg?v=1746188246",
  },
  {
    id: "bash-bunny",
    name: "Bash Bunny Mark II",
    brand: "Hak5",
    description: "Plataforma de ataque USB multi-payload. Combina HID, mass storage y ethernet en un solo dispositivo con payloads en carpetas.",
    specs: ["HID + Mass Storage + Ethernet", "Linux embebido (Debian)", "Dual payload switch", "Exfiltración de datos automatizada", "Soporte para herramientas nativas Linux"],
    tags: ["usb", "hid", "exfiltración", "ethernet", "linux"],
    price: 119,
    currency: "USD",
    category: "usb",
    difficulty: "Intermedio",
    link: "https://shop.hak5.org/products/bash-bunny",
    icon: "🐰",
    color: "#ff4db8",
    image: "https://www.fonefunshop.com/cdn/shop/files/hakbb2_02.jpg?v=1746187626",
  },
  {
    id: "omg-cable",
    name: "O.MG Cable Elite",
    brand: "O.MG / Hak5",
    description: "Cable USB con implante inalámbrico invisible. Keystroke injection remota con WiFi integrado, ideal para red team.",
    specs: ["Implante WiFi integrado", "Keystroke injection remota", "Compatible USB-A / USB-C / Lightning", "Geofencing & kill switch", "Hasta 300 payloads almacenados"],
    tags: ["cable", "hid", "implante", "wifi", "red-team"],
    price: 179,
    currency: "USD",
    category: "usb",
    difficulty: "Avanzado",
    link: "https://shop.hak5.org/products/omg-cable",
    icon: "🔌",
    color: "#ff4db8",
    image: "https://cdn.ksec.co.uk/ksec-solutions/cable_2000x-700x700.webp",
  },
  {
    id: "proxmark3-easy",
    name: "Proxmark3 Easy",
    brand: "RFID Research Group",
    description: "Herramienta de investigación RFID/NFC de referencia. Lectura, escritura, emulación y clonado de tarjetas LF y HF.",
    specs: ["RFID LF 125kHz (EM, HID, AWID...)", "NFC HF 13.56MHz (MIFARE, DESFire...)", "Modo sniff / emulación / replay", "Cliente multiplataforma ProxSpace", "Firmware actualizable"],
    tags: ["rfid", "nfc", "mifare", "em410x", "clone", "emulación"],
    price: 79,
    currency: "USD",
    category: "rfid",
    difficulty: "Intermedio",
    link: "https://proxmark.com",
    icon: "💳",
    color: "#9b55f9",
    image: "https://i.ebayimg.com/images/g/iHYAAeSwBRdpU6mE/s-l500.jpg",
  },
  {
    id: "chameleon-ultra",
    name: "Chameleon Ultra",
    brand: "Chameleon Tiny",
    description: "Emulador RFID avanzado de última generación. Soporta LF y HF con múltiples slots de emulación simultáneos.",
    specs: ["Emulación LF 125kHz + HF 13.56MHz", "8 slots de emulación", "GUI multiplataforma", "Anti-collision NFC completo", "Firmware abierto"],
    tags: ["rfid", "nfc", "emulador", "clone", "multi-slot"],
    price: 89,
    currency: "USD",
    category: "rfid",
    difficulty: "Avanzado",
    link: "https://github.com/RfidResearchGroup/ChameleonUltra",
    icon: "🦎",
    color: "#9b55f9",
    image: "https://cdn.ksec.co.uk/ksec-solutions/Chameleon_Ultra-700x700.jpg",
  },
  {
    id: "lan-turtle",
    name: "LAN Turtle Mk7",
    brand: "Hak5",
    description: "Implante de red covert en formato adaptador USB Ethernet. Acceso remoto, DNS spoofing y escucha de red de forma silenciosa.",
    specs: ["Gigabit Ethernet USB-A", "OpenWRT Linux embebido", "Módulos: AutoSSH, Meterpreter, nmap", "DNS spoofing integrado", "Acceso remoto por SSH"],
    tags: ["red", "implante", "covert", "dns-spoofing", "ssh"],
    price: 69,
    currency: "USD",
    category: "red",
    difficulty: "Intermedio",
    link: "https://shop.hak5.org/products/lan-turtle",
    icon: "🐢",
    color: "#34d399",
    image: "https://firewire-revolution.de/wp-content/uploads/2019/10/LAN_Turtle_SD_2000x-600x600.jpg",
  },
  {
    id: "glinet-mango",
    name: "GL.iNet GL-MT300N-V2 (Mango)",
    brand: "GL.iNet",
    description: "Mini router de viaje con OpenWRT preinstalado. Perfecto para ataques MITM portátiles, proxies y auditoría de redes.",
    specs: ["300 Mbps 2.4GHz 802.11n", "128MB RAM / 16MB Flash", "OpenWRT 21.02", "2× USB 2.0", "Modo router / repeater / AP"],
    tags: ["router", "mitm", "openwrt", "proxy", "portátil"],
    price: 22,
    currency: "USD",
    category: "red",
    difficulty: "Principiante",
    link: "https://www.gl-inet.com/products/gl-mt300n-v2",
    icon: "🌐",
    color: "#34d399",
    image: "https://store.gl-inet.com/cdn/shop/files/2-shopify_mt300n-v2_size_700x700.png?v=1718692474",
  },
  {
    id: "raspberry-pi-zero-2w",
    name: "Raspberry Pi Zero 2W",
    brand: "Raspberry Pi Foundation",
    description: "Micro-computadora Linux completamente funcional. Ideal para implantes de red, P4wnP1, badge hacking y plataformas portátiles.",
    specs: ["ARM Cortex-A53 quad-core 1GHz", "512MB RAM LPDDR2", "WiFi 2.4GHz + Bluetooth 4.2", "Mini HDMI / Micro USB OTG", "GPIO 40 pines"],
    tags: ["linux", "implante", "p4wnp1", "gpio", "portátil"],
    price: 15,
    currency: "USD",
    category: "micro",
    difficulty: "Intermedio",
    link: "https://www.raspberrypi.com/products/raspberry-pi-zero-2-w",
    icon: "🍓",
    color: "#fb923c",
    image: "https://rees52.com/cdn/shop/files/RS5285-3.jpg?v=1704112134&width=1445",
  },
  {
    id: "esp32-devkit",
    name: "ESP32 DevKit v1",
    brand: "Espressif",
    description: "Microcontrolador con WiFi + Bluetooth integrado. Úsalo para deauth attacks, BLE sniffing, flipper-like projects o evil portals.",
    specs: ["Dual-core Xtensa LX6 240MHz", "WiFi 802.11 b/g/n 2.4GHz", "Bluetooth 4.2 + BLE", "34 pines GPIO", "Flasheable desde Arduino / MicroPython"],
    tags: ["iot", "wifi", "bluetooth", "deauth", "evil-portal"],
    price: 8,
    currency: "USD",
    category: "micro",
    difficulty: "Principiante",
    link: "https://www.espressif.com/en/products/devkits",
    icon: "⚡",
    color: "#fb923c",
    image: "https://i.ebayimg.com/images/g/DqEAAOSwbbFmKmEH/s-l500.jpg",
  },
  {
    id: "wifi-nugget",
    name: "WiFi Nugget S3",
    brand: "HakCat",
    description: "Plataforma ESP32-S3 con pantalla OLED y face para deauth attacks, evil portals y aprendizaje de hacking WiFi.",
    specs: ["ESP32-S3 240MHz", "Pantalla OLED 128×64", "WiFi 2.4GHz modo monitor/injection", "Batería LiPo integrada", "Programable CircuitPython"],
    tags: ["wifi", "deauth", "evil-portal", "oled", "esp32"],
    price: 35,
    currency: "USD",
    category: "micro",
    difficulty: "Principiante",
    link: "https://retia.io/products/wifi-nugget",
    icon: "🐱",
    color: "#fb923c",
    image: "https://retia.io/cdn/shop/products/ScreenShot2021-10-28at5.30.26PM_1445x.png?v=1706730713",
  },
];

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const initialCat = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("tab") ?? "all"
    : "all";
  const [category, setCategory] = useState(initialCat);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [buying, setBuying] = useState<number | null>(null);
  const [hwFilter, setHwFilter] = useState("all");
  const [selectedHw, setSelectedHw] = useState<HardwareProduct | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", category: "writeup",
    price: 100, downloadUrl: "", thumbnailUrl: "", previewText: "", tags: "",
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["marketplace-products"],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/marketplace/products`);
      return r.json();
    },
    refetchInterval: 30000,
  });

  const { data: myOrders = [] } = useQuery<{ productId: number }[]>({
    queryKey: ["marketplace-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const r = await fetch(`${BASE}api/marketplace/orders/${user.id}`);
      return r.json();
    },
    enabled: !!user,
  });

  const ownedIds = new Set(myOrders.map(o => o.productId));

  const filtered = products.filter(p => {
    const matchCat = category === "all" || p.category === category;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const filteredHw = HARDWARE_CATALOG.filter(p => {
    const matchCat = hwFilter === "all" || p.category === hwFilter;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const buyProduct = async (product: Product) => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    if (ownedIds.has(product.id)) {
      if (product.downloadUrl) window.open(product.downloadUrl, "_blank");
      return;
    }
    setBuying(product.id);
    try {
      const r = await fetch(`${BASE}api/marketplace/products/${product.id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId: user.id, buyerUsername: user.username }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "¡Compra exitosa!", description: `${product.price.toLocaleString()} SPC deducidos` });
      qc.invalidateQueries({ queryKey: ["marketplace-orders"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      if (d.downloadUrl) window.open(d.downloadUrl, "_blank");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

  const createProduct = async () => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    if (!form.title || !form.price) { toast({ title: "Completa los campos requeridos", variant: "destructive" }); return; }
    try {
      const r = await fetch(`${BASE}api/marketplace/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: user.id, sellerUsername: user.username,
          title: form.title, description: form.description,
          category: form.category, price: form.price,
          downloadUrl: form.downloadUrl || null,
          thumbnailUrl: form.thumbnailUrl || null,
          previewText: form.previewText || null,
          tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "Producto publicado", description: "Tu contenido ya está en el marketplace" });
      setShowCreate(false);
      setForm({ title: "", description: "", category: "writeup", price: 100, downloadUrl: "", thumbnailUrl: "", previewText: "", tags: "" });
      qc.invalidateQueries({ queryKey: ["marketplace-products"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const diffColor = (d: string) => d === "Principiante" ? "#34d399" : d === "Intermedio" ? "#facc15" : "#ff4db8";

  const isHardware = category === "hardware";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4 py-12 relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 font-mono">
            <ChevronLeft className="h-4 w-4" /> INICIO
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <ShoppingBag className="h-8 w-8 text-primary" />
                <Badge className="font-mono text-xs" style={{ background: "rgba(255,77,184,0.15)", color: "#ff4db8", border: "1px solid rgba(255,77,184,0.4)" }}>
                  BETA
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-mono font-bold text-primary mb-2">
                &gt; MARKETPLACE
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                Compra y vende writeups, scripts, tools y gadgets. Paga con SPC — gana con SPC.
              </p>
            </div>
            {user && !isHardware && (
              <Button onClick={() => setShowCreate(true)}
                className="font-mono font-bold shrink-0 gap-2"
                style={{ background: "linear-gradient(135deg,#ff4db8,#9b55f9)", border: "none" }}>
                <Plus className="h-4 w-4" /> VENDER CONTENIDO
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 max-w-sm">
            {[
              { label: "PRODUCTOS", value: products.length },
              { label: "VENDEDORES", value: new Set(products.map(p => p.sellerId)).size },
              { label: "VENTAS", value: products.reduce((a, p) => a + p.salesCount, 0) },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="text-2xl font-mono font-bold text-primary">{s.value}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Main category tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isHardware ? "Buscar gadgets..." : "Buscar contenido..."}
              className="w-full pl-9 pr-4 py-2 bg-card border border-primary/20 rounded-lg font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { setCategory(c.id); setHwFilter("all"); setSearch(""); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all border
                  ${category === c.id
                    ? c.id === "hardware"
                      ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
                      : "bg-primary/20 border-primary text-primary"
                    : "bg-card border-primary/20 text-muted-foreground hover:border-primary/40"}`}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* HARDWARE CATALOG */}
        {isHardware ? (
          <div>
            {/* Hardware banner */}
            <div className="relative rounded-2xl overflow-hidden mb-8 border border-yellow-400/20"
              style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(155,85,249,0.08) 100%)" }}>
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: "repeating-linear-gradient(45deg, #facc15 0, #facc15 1px, transparent 0, transparent 50%)", backgroundSize: "8px 8px" }} />
              <div className="relative p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Cpu className="h-6 w-6 text-yellow-400" />
                    <span className="font-mono font-bold text-yellow-400 text-lg">HARDWARE HACKING SHOP</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-yellow-400/40 text-yellow-400 bg-yellow-400/10">DROPSHIPPING</span>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground max-w-xl">
                    Gadgets reales para hacking de hardware. Todos los productos son links a tiendas oficiales — precios en USD, envío internacional.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-green-400">Solo tiendas oficiales verificadas</span>
                </div>
              </div>
            </div>

            {/* Hardware sub-filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {HW_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setHwFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all border
                    ${hwFilter === c.id
                      ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
                      : "bg-card border-yellow-400/20 text-muted-foreground hover:border-yellow-400/40"}`}>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: "GADGETS", value: HARDWARE_CATALOG.length },
                { label: "DESDE", value: `$${Math.min(...HARDWARE_CATALOG.map(h => h.price))}` },
                { label: "HASTA", value: `$${Math.max(...HARDWARE_CATALOG.map(h => h.price))}` },
                { label: "CATEGORÍAS", value: HW_CATEGORIES.length - 1 },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-lg border border-yellow-400/20 bg-yellow-400/5">
                  <div className="text-xl font-mono font-bold text-yellow-400">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Hardware grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHw.map(hw => (
                <div key={hw.id}
                  className="group relative rounded-xl border bg-card overflow-hidden transition-all cursor-pointer hover:border-yellow-400/40 hover:shadow-[0_0_28px_rgba(250,204,21,0.15)]"
                  style={{ borderColor: `${hw.color}33` }}
                  onClick={() => setSelectedHw(hw)}>

                  {/* Product image hero */}
                  <div className="relative w-full h-44 overflow-hidden bg-black/40">
                    <img
                      src={hw.image}
                      alt={hw.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                      onError={e => {
                        const t = e.currentTarget;
                        t.style.display = "none";
                        const fb = t.nextElementSibling as HTMLElement | null;
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                    {/* emoji fallback */}
                    <div className="absolute inset-0 hidden items-center justify-center text-6xl select-none">
                      {hw.icon}
                    </div>
                    {/* gradient overlay */}
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: `linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)` }} />
                    {/* category badge over image */}
                    <span className="absolute top-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                      style={{ background: `${HW_COLOR[hw.category]}cc`, color: "#000", border: `1px solid ${HW_COLOR[hw.category]}` }}>
                      {hw.category.toUpperCase()}
                    </span>
                    {/* price over image bottom */}
                    <div className="absolute bottom-2 right-3 text-right">
                      <div className="text-lg font-mono font-bold drop-shadow-lg" style={{ color: hw.color }}>
                        ${hw.price}
                      </div>
                      <div className="text-[9px] text-white/60 font-mono">USD</div>
                    </div>
                  </div>

                  {/* color stripe */}
                  <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${hw.color}, transparent)` }} />

                  <div className="p-4">
                    {/* Name + brand */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{hw.icon}</span>
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-sm text-foreground group-hover:text-yellow-400 transition-colors truncate">
                          {hw.name}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">{hw.brand}</div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground font-mono mb-3 line-clamp-2">
                      {hw.description}
                    </p>

                    {/* Specs preview */}
                    <div className="mb-3 space-y-1">
                      {hw.specs.slice(0, 2).map(s => (
                        <div key={s} className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                          <div className="w-1 h-1 rounded-full shrink-0" style={{ background: hw.color }} />
                          {s}
                        </div>
                      ))}
                      {hw.specs.length > 2 && (
                        <div className="text-[10px] font-mono text-muted-foreground opacity-40">
                          +{hw.specs.length - 2} specs más...
                        </div>
                      )}
                    </div>

                    {/* Tags + difficulty */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap gap-1">
                        {hw.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                            style={{ background: `${hw.color}15`, color: hw.color, border: `1px solid ${hw.color}30` }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded shrink-0"
                        style={{ background: `${diffColor(hw.difficulty)}15`, color: diffColor(hw.difficulty), border: `1px solid ${diffColor(hw.difficulty)}30` }}>
                        {hw.difficulty}
                      </span>
                    </div>

                    <Button
                      className="w-full font-mono text-xs font-bold gap-2"
                      onClick={e => { e.stopPropagation(); window.open(hw.link, "_blank"); }}
                      style={{ background: `linear-gradient(135deg, ${hw.color}33, ${hw.color}22)`, border: `1px solid ${hw.color}55`, color: hw.color }}>
                      <ShoppingCart className="h-3 w-3" /> VER EN TIENDA <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredHw.length === 0 && (
              <div className="text-center py-20">
                <Cpu className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="font-mono text-muted-foreground">No hay gadgets en esta categoría.</p>
              </div>
            )}
          </div>
        ) : (
          /* P2P DIGITAL MARKETPLACE */
          <>
            {isLoading ? (
              <div className="text-center py-20 font-mono text-primary animate-pulse">Cargando marketplace...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="font-mono text-muted-foreground">No hay productos{category !== "all" ? " en esta categoría" : ""}.</p>
                {user && <Button onClick={() => setShowCreate(true)} className="mt-4 font-mono" variant="outline">Ser el primero en vender</Button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(product => {
                  const owned = ownedIds.has(product.id) || product.sellerId === user?.id;
                  const color = CAT_COLORS[product.category] || "#ff4db8";
                  const catLabel = CAT_LABELS[product.category] || product.category.toUpperCase();
                  const CAT_ICONS: Record<string, string> = {
                    writeup: "📝", script: "⚡", tool: "🔧", notes: "📚", course: "🎓",
                  };
                  const catIcon = CAT_ICONS[product.category] || "📦";
                  return (
                    <div key={product.id}
                      className="group relative rounded-xl border bg-card overflow-hidden transition-all cursor-default hover:shadow-[0_0_28px_rgba(255,77,184,0.15)]"
                      style={{ borderColor: `${color}33` }}>

                      {/* Thumbnail / hero image */}
                      <div className="relative w-full h-44 overflow-hidden bg-black/50">
                        {product.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={e => {
                              const t = e.currentTarget;
                              t.style.display = "none";
                              const fb = t.nextElementSibling as HTMLElement | null;
                              if (fb) fb.style.display = "flex";
                            }}
                          />
                        ) : null}
                        {/* Fallback or overlay for no-image */}
                        <div className="absolute inset-0 flex items-center justify-center text-6xl select-none"
                          style={{ display: product.thumbnailUrl ? "none" : "flex", background: `${color}10` }}>
                          {catIcon}
                        </div>
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 pointer-events-none"
                          style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.75) 100%)" }} />
                        {/* Category badge */}
                        <span className="absolute top-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                          style={{ background: `${color}cc`, color: "#000" }}>
                          {catLabel}
                        </span>
                        {/* Rating badge */}
                        <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-yellow-400">{product.rating?.toFixed(1) || "5.0"}</span>
                        </span>
                        {/* Price over bottom */}
                        <div className="absolute bottom-2 right-3 text-right">
                          <div className="text-lg font-mono font-bold drop-shadow-lg flex items-center gap-1 justify-end" style={{ color }}>
                            <Coins className="h-4 w-4" />{product.price.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-white/60 font-mono">SPC</div>
                        </div>
                      </div>

                      {/* Color stripe */}
                      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

                      <div className="p-4">
                        <h3 className="font-mono font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {product.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 font-mono leading-relaxed">
                          {product.description}
                        </p>

                        {product.previewText && (
                          <div className="mb-3 p-2 rounded bg-black/40 border border-white/5 text-[10px] font-mono text-muted-foreground line-clamp-2">
                            {product.previewText}
                          </div>
                        )}

                        {(product.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {(product.tags || []).slice(0, 4).map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                                style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-3 pt-2 border-t border-white/5">
                          <div>
                            <div className="text-[10px] text-muted-foreground font-mono">@{product.sellerUsername}</div>
                            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                              <Users className="h-3 w-3" /> {product.salesCount} ventas
                            </div>
                          </div>
                          {product.downloadUrl && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded flex items-center gap-1"
                              style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}>
                              <Download className="h-3 w-3" /> DESCARGA
                            </span>
                          )}
                        </div>

                        <Button
                          className="w-full font-mono text-xs font-bold gap-2"
                          disabled={buying === product.id}
                          onClick={() => buyProduct(product)}
                          style={owned
                            ? { background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399" }
                            : { background: `linear-gradient(135deg,${color}25,${color}15)`, border: `1px solid ${color}55`, color }}>
                          {buying === product.id ? (
                            <span className="animate-pulse">Procesando...</span>
                          ) : owned ? (
                            <><CheckCircle className="h-4 w-4" /> {product.sellerId === user?.id ? "TUYO" : "DESCARGADO"}</>
                          ) : (
                            <><ShoppingBag className="h-4 w-4" /> COMPRAR</>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Hardware detail modal */}
      {selectedHw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setSelectedHw(null)}>
          <div className="w-full max-w-xl rounded-2xl border bg-card p-6 shadow-[0_0_60px_rgba(250,204,21,0.2)] overflow-y-auto max-h-[90vh]"
            style={{ borderColor: `${selectedHw.color}44` }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{selectedHw.icon}</div>
                <div>
                  <h2 className="font-mono font-bold text-xl" style={{ color: selectedHw.color }}>{selectedHw.name}</h2>
                  <p className="text-xs font-mono text-muted-foreground">{selectedHw.brand}</p>
                </div>
              </div>
              <button onClick={() => setSelectedHw(null)} className="text-muted-foreground hover:text-foreground transition-colors mt-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                style={{ background: `${HW_COLOR[selectedHw.category]}22`, color: HW_COLOR[selectedHw.category], border: `1px solid ${HW_COLOR[selectedHw.category]}44` }}>
                {selectedHw.category.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                style={{ background: `${diffColor(selectedHw.difficulty)}15`, color: diffColor(selectedHw.difficulty), border: `1px solid ${diffColor(selectedHw.difficulty)}30` }}>
                {selectedHw.difficulty}
              </span>
            </div>

            <p className="text-sm font-mono text-muted-foreground mb-5">{selectedHw.description}</p>

            <div className="mb-5">
              <div className="text-xs font-mono font-bold text-foreground mb-2 flex items-center gap-2">
                <Cpu className="h-3 w-3" style={{ color: selectedHw.color }} /> ESPECIFICACIONES
              </div>
              <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: `${selectedHw.color}22`, background: `${selectedHw.color}08` }}>
                {selectedHw.specs.map(s => (
                  <div key={s} className="flex items-center gap-2 text-xs font-mono">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: selectedHw.color }} />
                    <span className="text-foreground">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="text-xs font-mono font-bold text-foreground mb-2">USOS TÍPICOS</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedHw.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-1 rounded font-mono"
                    style={{ background: `${selectedHw.color}18`, color: selectedHw.color, border: `1px solid ${selectedHw.color}33` }}>
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: `${selectedHw.color}22` }}>
              <div>
                <div className="text-3xl font-mono font-bold" style={{ color: selectedHw.color }}>
                  ${selectedHw.price} USD
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">Precio aproximado — puede variar</div>
              </div>
              <Button
                onClick={() => window.open(selectedHw.link, "_blank")}
                className="font-mono font-bold gap-2 text-sm px-6"
                style={{ background: `linear-gradient(135deg, ${selectedHw.color}aa, ${selectedHw.color}77)`, border: "none", color: "#000" }}>
                <ShoppingCart className="h-4 w-4" /> COMPRAR AHORA <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create product modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-primary/30 bg-card p-6 shadow-[0_0_60px_rgba(255,77,184,0.2)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-mono font-bold text-lg text-primary">PUBLICAR CONTENIDO</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">TÍTULO *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Writeup HackTheBox — Forest..."
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-primary/50" />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">CATEGORÍA *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.slice(2).map(c => (
                    <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-mono text-xs border transition-all
                        ${form.category === c.id ? "bg-primary/20 border-primary text-primary" : "bg-background border-primary/20 text-muted-foreground hover:border-primary/40"}`}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">DESCRIPCIÓN</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Explica qué incluye tu contenido..."
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-primary/50 resize-none" />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">VISTA PREVIA (texto libre)</label>
                <textarea value={form.previewText} onChange={e => setForm(f => ({ ...f, previewText: e.target.value }))}
                  rows={2} placeholder="Primeras líneas del contenido como muestra..."
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-primary/50 resize-none" />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">PRECIO (SPC) *</label>
                <div className="flex gap-2 items-center">
                  <input type="number" min={10} value={form.price} onChange={e => setForm(f => ({ ...f, price: parseInt(e.target.value) || 100 }))}
                    className="w-32 px-3 py-2 bg-background border border-primary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-primary/50" />
                  <div className="flex gap-1">
                    {[50, 100, 250, 500, 1000].map(p => (
                      <button key={p} onClick={() => setForm(f => ({ ...f, price: p }))}
                        className="text-[10px] px-2 py-1 rounded font-mono border border-primary/20 text-muted-foreground hover:border-primary hover:text-primary transition-all">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">
                  Tú recibirás: <span className="text-green-400">{Math.floor(form.price * 0.9).toLocaleString()} SPC</span> (comisión plataforma 10%)
                </p>
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">MINIATURA (URL de imagen)</label>
                <input value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/... o imgur..."
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-primary/50" />
                {form.thumbnailUrl && (
                  <div className="mt-2 h-20 rounded-lg overflow-hidden border border-primary/20 bg-black/30">
                    <img src={form.thumbnailUrl} alt="preview" className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = "none"; }} />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">URL DE DESCARGA</label>
                <input value={form.downloadUrl} onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))}
                  placeholder="https://drive.google.com/... o GitHub..."
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-primary/50" />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">TAGS (separados por coma)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="htb, linux, privesc, active-directory..."
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-primary/50" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 font-mono border-primary/20">
                CANCELAR
              </Button>
              <Button onClick={createProduct} className="flex-1 font-mono font-bold gap-2"
                style={{ background: "linear-gradient(135deg,#ff4db8,#9b55f9)", border: "none" }}>
                <Plus className="h-4 w-4" /> PUBLICAR
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
