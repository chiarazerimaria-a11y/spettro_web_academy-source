import { PublicNav } from "@/components/PublicNav";
import { ExternalLink } from "lucide-react";

const platforms = [
  {
    name: "HackTheBox",
    desc: "Laboratorios y certificaciones líderes en la industria",
    url: "https://www.hackthebox.com",
    tag: "LABS",
  },
  {
    name: "TryHackMe",
    desc: "Salas guiadas y rutas de aprendizaje aptas para principiantes",
    url: "https://tryhackme.com",
    tag: "GUIADO",
  },
  {
    name: "Academia PortSwigger",
    desc: "Laboratorios gratuitos de seguridad web práctica de los creadores de Burp Suite",
    url: "https://portswigger.net/web-security",
    tag: "WEB",
  },
  {
    name: "picoCTF",
    desc: "La plataforma de competición para principiantes CTF de Carnegie Mellon",
    url: "https://picoctf.org",
    tag: "CTF",
  },
  {
    name: "VulnHub",
    desc: "Máquinas virtuales descargables intencionadamente vulnerables para practicar",
    url: "https://www.vulnhub.com",
    tag: "VMs",
  },
  {
    name: "Campos de pruebas",
    desc: "Entorno realista de laboratorio de práctica en Seguridad Ofensiva",
    url: "https://www.offsec.com/labs/",
    tag: "LABS",
  },
  {
    name: "CTFtime",
    desc: "Calendario de competiciones, clasificaciones y archivo de artículos de la CTF",
    url: "https://ctftime.org",
    tag: "CTF",
  },
  {
    name: "OverTheWire",
    desc: "Los wargames que ofrece la comunidad OverTheWire pueden ayudarte a aprender y practicar conceptos de seguridad en forma de juegos divertidos.",
    url: "https://overthewire.org/wargames/",
    tag: "WARGAMES",
  },
];

const blogs = [
  {
    name: "IppSec",
    desc: "Guías de la máquina HackTheBox y contenido ofensivo de seguridad",
    url: "https://www.youtube.com/@ippsec",
    tag: "YouTube",
  },
  {
    name: "S4vitar",
    desc: "Pentesting en español, CTFs y formación en ciberseguridad",
    url: "https://www.youtube.com/@s4vitar",
    tag: "YouTube ES",
  },
  {
    name: "John Hammond",
    desc: "Informes sobre CTF, análisis de malware y educación en seguridad",
    url: "https://www.youtube.com/@_JohnHammond",
    tag: "YouTube",
  },
  {
    name: "LiveOverflow",
    desc: "Investigación técnica profunda en seguridad y guías del CTF",
    url: "https://www.youtube.com/@LiveOverflow",
    tag: "YouTube",
  },
  {
    name: "NahamSec",
    desc: "Cazarrecompensas de insectos, hackeo web y técnicas de reconocimiento",
    url: "https://www.youtube.com/@NahamSec",
    tag: "YouTube",
  },
  {
    name: "Xerosec",
    desc: "Guías del CTF y contenido de ciberseguridad en español",
    url: "https://www.youtube.com/@xerosec",
    tag: "YouTube ES",
  },
  {
    name: "Lenam",
    desc: "Creador de máquinas VulNyx - Contenido y artículos de seguridad en español",
    url: "https://www.youtube.com/@lenamgenid",
    tag: "Blog ES",
  },
  {
    name: "Artículos sobre hacking",
    desc: "Tutoriales y artículos en profundidad sobre técnicas de pentesting",
    url: "https://hacktricks.xyz",
    tag: "Blog",
  },
  {
    name: "DeepHacking",
    desc: "Blog y tutoriales de seguridad en español especializado en inmersión profunda",
    url: "https://deephacking.tech",
    tag: "Blog ES",
  },
  {
    name: "0xBEN",
    desc: "Relatos, notas y documentación metodológica de pentesting",
    url: "https://benheater.com",
    tag: "Blog",
  },
  {
    name: "m3n0sd0n4ld",
    desc: "Colaborador de VulNyx - blog de investigación en seguridad personal",
    url: "https://m3n0sd0n4ld.github.io",
    tag: "Blog ES",
  },
];

const tagColors: Record<string, string> = {
  LABS: "text-primary border-primary/40 bg-primary/10",
  GUIADO: "text-green-400 border-green-400/40 bg-green-400/10",
  WEB: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  CTF: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  VMs: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  WARGAMES: "text-pink-400 border-pink-400/40 bg-pink-400/10",
  YouTube: "text-red-400 border-red-400/40 bg-red-400/10",
  "YouTube ES": "text-red-300 border-red-300/40 bg-red-300/10",
  Blog: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  "Blog ES": "text-fuchsia-400 border-fuchsia-400/40 bg-fuchsia-400/10",
};

function ResourceCard({ name, desc, url, tag }: { name: string; desc: string; url: string; tag: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 p-5 rounded-xl border border-white/8 bg-white/3 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-mono font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
            {name}
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
        <span className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${tagColors[tag] ?? "text-primary border-primary/40 bg-primary/10"}`}>
          {tag}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </a>
  );
}

function Section({ icon, title, count, children }: { icon: string; title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{icon}</span>
        <h2 className="font-mono font-bold text-xl text-foreground">{title}</h2>
        <span className="font-mono text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-full ml-1">
          {count} enlaces
        </span>
        <div className="flex-1 h-px bg-border ml-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </section>
  );
}

export default function Recursos() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary font-mono text-xs mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            DIRECTORIO EXTERNO
          </div>
          <h1 className="font-mono font-bold text-3xl md:text-4xl text-foreground mb-3">
            &gt; Recursos<span className="text-primary">_</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Colección curada de plataformas, laboratorios, blogs y canales de referencia para tu formación en ciberseguridad. Todo lo que necesitas fuera de SpettroWeb.
          </p>
        </div>

        <div className="space-y-14">
          <Section icon="🖥" title="Andenes" count={platforms.length}>
            {platforms.map((r) => (
              <ResourceCard key={r.name} {...r} />
            ))}
          </Section>

          <Section icon="🎙" title="Blogs y canales" count={blogs.length}>
            {blogs.map((r) => (
              <ResourceCard key={r.name} {...r} />
            ))}
          </Section>
        </div>

        <div className="mt-14 p-5 rounded-xl border border-primary/20 bg-primary/5 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            ¿Conoces un recurso que debería estar aquí?{" "}
            <a href="/trabaja" className="text-primary hover:underline">
              Escríbenos →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
