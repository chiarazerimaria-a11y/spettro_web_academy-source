import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Terminal, Award, Lock, Unlock, CheckCircle2, Shield, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BreadcrumbNav = () => (
  <nav className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-md">
    <div className="container mx-auto px-4 h-14 flex items-center gap-4 text-sm font-mono">
      <Link href="/" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
        <Terminal className="h-4 w-4" />
        <span>root</span>
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/perfil" className="text-muted-foreground hover:text-primary transition-colors">perfil</Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/equipos" className="text-muted-foreground hover:text-primary transition-colors">equipos</Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/certificaciones" className="text-muted-foreground hover:text-primary transition-colors">certificaciones</Link>
    </div>
  </nav>
);

export default function Certifications() {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    fetch(`${import.meta.env.BASE_URL}api/lab/certifications`)
      .then(res => res.json())
      .then(data => {
        // Sort by points needed to create a logical path
        const sorted = (data || []).sort((a: any, b: any) => a.pointsNeeded - b.pointsNeeded);
        setCertifications(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const externalCerts = [
    { title: "eJPTv2 (INE Security)", desc: "Nuestra especialidad. 98% de tasa de aprobados", color: "text-secondary" },
    { title: "OSCP (OffSec)", desc: "El más respetado del sector. Requiere dedicación total", color: "text-primary" },
    { title: "CEH (EC-Council)", desc: "Reconocimiento corporativo mundial", color: "text-blue-400" },
    { title: "PNPT (TCM Security)", desc: "Práctico y asequible. Ideal como siguiente paso tras eJPT", color: "text-green-400" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans crt-flicker pb-20 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <BreadcrumbNav />

      <main className="container mx-auto px-4 pt-12 max-w-5xl space-y-16 relative z-10">
        
        {/* HERO */}
        <motion.section {...fadeIn} className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-mono font-bold mb-6 glitch-hover inline-block">
            <span className="text-primary">&gt;</span> RUTA_DE_CERTIFICACIONES
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground border-l-2 border-primary/50 pl-4 text-left mx-auto">
            De principiante a hacker profesional. Cada certificación te abre una puerta. Sigue el camino, resuelve las máquinas, y demuestra tus habilidades.
          </p>
        </motion.section>

        {/* ROADMAP */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-3xl mx-auto py-10"
        >
          {loading ? (
            <div className="text-center text-muted-foreground font-mono py-12">Compilando ruta de aprendizaje...</div>
          ) : (
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-8 md:left-12 top-0 bottom-0 w-1 bg-border/50 rounded-full" />

              <div className="space-y-12">
                {certifications.map((cert, index) => {
                  // Mock state for demo based on index
                  const status = index < 2 ? "DESBLOQUEADA" : index === 2 ? "EN PROGRESO" : "BLOQUEADA";
                  const isLocked = status === "BLOQUEADA";
                  const isProgress = status === "EN PROGRESO";
                  
                  return (
                    <motion.div 
                      key={cert.id}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex gap-6 md:gap-8 items-start"
                    >
                      {/* Node circle */}
                      <div className={`relative z-10 flex-shrink-0 w-16 h-16 md:w-24 md:h-24 rounded-full border-4 flex items-center justify-center bg-background shadow-lg
                        ${isLocked ? 'border-muted/30 text-muted/30' : isProgress ? 'border-amber-500/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-primary/80 text-primary shadow-[0_0_20px_rgba(255,77,184,0.3)]'}
                      `}>
                        {isLocked ? <Lock className="h-6 w-6 md:h-8 md:w-8" /> : 
                         isProgress ? <div className="font-mono font-bold text-sm md:text-xl animate-pulse">{cert.code}</div> : 
                         <div className="font-mono font-bold text-sm md:text-xl drop-shadow-[0_0_8px_currentColor]">{cert.code}</div>}
                      </div>

                      {/* Card Content */}
                      <div className={`flex-1 bg-card/20 rounded-xl border p-6 transition-colors
                        ${isLocked ? 'border-border/50 opacity-70' : isProgress ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/30 hover:border-primary/60 bg-primary/5'}
                      `}>
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-xl font-mono font-bold ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {cert.name}
                              </h3>
                              <Badge variant="outline" className={
                                status === "DESBLOQUEADA" ? "border-primary text-primary" : 
                                status === "EN PROGRESO" ? "border-amber-500 text-amber-500 animate-pulse" : 
                                "border-muted-foreground text-muted-foreground"
                              }>
                                {status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground max-w-lg">{cert.description}</p>
                          </div>
                          
                          <div className="flex gap-4 text-xs font-mono shrink-0">
                            <div className="flex flex-col items-center p-2 rounded bg-background/50 border border-border">
                              <span className="text-muted-foreground">Máquinas</span>
                              <span className={`font-bold ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>{cert.machinesNeeded}</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-background/50 border border-border">
                              <span className="text-muted-foreground">Puntos</span>
                              <span className={`font-bold ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>{cert.pointsNeeded}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm border-t border-border/50 pt-4 mt-4 text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${isLocked ? 'opacity-30' : 'text-primary'}`} />
                          <span className="font-mono">Requisitos: {cert.requirements}</span>
                        </div>

                        {/* Special Callouts based on code */}
                        {cert.code === "SPW-eJPT" && !isLocked && (
                          <div className="mt-4 p-3 bg-secondary/10 border border-secondary/30 rounded-lg flex items-start gap-3">
                            <Shield className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                            <p className="text-sm font-mono text-secondary">
                              CERTIFICACIÓN OFICIAL — Reconocida por la comunidad cybersec como preparación para eJPTv2 de INE Security.
                            </p>
                          </div>
                        )}

                        {cert.code === "SPW-LEG" && (
                          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex items-start gap-3 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                            <Crown className="h-6 w-6 text-yellow-500 shrink-0" />
                            <div>
                              <div className="font-mono font-bold text-yellow-500">EL OBJETIVO FINAL</div>
                              <p className="text-sm text-yellow-500/80 mt-1">
                                Solo los mejores de SpettroWeb ostentan este título. Demuestra maestría total en todos los vectores de ataque.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.section>

        {/* EXTERNAL CERTS */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pt-12 border-t border-border/50"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-mono font-bold mb-4">Preparación para el Mundo Real</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nuestras rutas están alineadas con las certificaciones internacionales más demandadas por la industria.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {externalCerts.map((cert, i) => (
              <Card key={i} className="bg-card/20 border-border hover:bg-card/40 transition-colors group cursor-pointer">
                <CardContent className="p-6 flex items-start justify-between">
                  <div>
                    <h3 className={`text-lg font-mono font-bold mb-2 ${cert.color}`}>{cert.title}</h3>
                    <p className="text-sm text-muted-foreground">{cert.desc}</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

      </main>
    </div>
  );
}

// Temporary icon component if lucide-react doesn't have Crown exported easily in this version context
function Crown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}
