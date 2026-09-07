import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Terminal, Users, Crown, Sword, Shield, Swords, Plus, Server, Activity, Send, MessageSquare, Radio, ExternalLink, LogIn, Trophy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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

export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentRooms, setTournamentRooms] = useState<any[]>([]);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const BASE = import.meta.env.BASE_URL;

  // ── Create squad form state ──────────────────────────────────────────────────
  const [squadName, setSquadName] = useState("");
  const [squadDesc, setSquadDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [tournamentRegistered, setTournamentRegistered] = useState(false);

  const userSquad = teams.find(t => t.captainName === user?.username);

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Acceso requerido", description: "Debes iniciar sesión para fundar una escuadra.", variant: "destructive" });
      return;
    }
    if (!squadName.trim()) {
      toast({ title: "Nombre requerido", description: "Escribe un nombre para tu escuadra.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}api/squads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: squadName.trim(), captainName: user.username, description: squadDesc.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear la escuadra");
      toast({ title: "✓ Escuadra fundada", description: `${data.name} ya está en el sistema. ¡Recluta a tu equipo!` });
      setSquadName("");
      setSquadDesc("");
      // Refresh leaderboard
      const updated = await fetch(`${BASE}api/squads`).then(r => r.json());
      setTeams(updated || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleTournamentRegister = () => {
    if (!user) {
      toast({ title: "Acceso requerido", description: "Inicia sesión para registrar tu escuadra en el torneo.", variant: "destructive" });
      return;
    }
    if (!userSquad) {
      toast({ title: "Sin escuadra", description: "Primero funda o únete a una escuadra antes de inscribirte.", variant: "destructive" });
      return;
    }
    setTournamentRegistered(true);
    toast({ title: "✓ Escuadra inscrita", description: `${userSquad.name} ha sido registrada para la Infiltration Cup 2026. Recibirás confirmación antes del torneo.` });
  };
  
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, user: "Ghost_H4ck3r", color: "text-primary", text: "acabo de pwn Medusa en 12 min 🔥", time: "10:23:45" },
    { id: 2, user: "CipherPunk", color: "text-secondary", text: "alguien para darle al AD de Forest?", time: "10:25:12" },
    { id: 3, user: "RedStorm_X", color: "text-red-500", text: "estamos en la final del torneo 💀", time: "10:28:00" },
    { id: 4, user: "Null_Ptr_01", color: "text-amber-500", text: "suerte con eso, los de Ghost Protocol están rotos", time: "10:29:15" },
    { id: 5, user: "CHIARA_SPETTRO", color: "text-green-500", text: "[SISTEMA] Mantenimiento programado a las 00:00 UTC", time: "10:30:00" },
    { id: 6, user: "Ghost_H4ck3r", color: "text-primary", text: "gracias bro, pero ganaremos igual", time: "10:31:22" },
    { id: 7, user: "0xRoot", color: "text-blue-400", text: "busco escuadra soy lvl 40", time: "10:35:10" },
    { id: 8, user: "CipherPunk", color: "text-secondary", text: "manda apply a mi team", time: "10:36:05" },
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    fetch(`${BASE}api/lab/teams`)
      .then(res => res.json())
      .then(data => { setTeams(data || []); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`${BASE}api/tournament/rooms`)
      .then(res => res.json())
      .then(data => setTournamentRooms(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        user: "TU_HACKER",
        color: "text-green-400",
        text: chatMessage,
        time: timeString
      }
    ]);
    setChatMessage("");
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  const getRankBadge = (points: number) => {
    if (points > 10000) return { title: "Legend", color: "border-yellow-500 text-yellow-500" };
    if (points > 5000) return { title: "Elite", color: "border-secondary text-secondary" };
    if (points > 2000) return { title: "Pro", color: "border-primary text-primary" };
    if (points > 500) return { title: "Intermediate", color: "border-amber-500 text-amber-500" };
    return { title: "Rookie", color: "border-gray-500 text-gray-500" };
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Sword className="h-5 w-5 text-gray-300" />;
    if (index === 2) return <Shield className="h-5 w-5 text-amber-600" />;
    return <span className="font-mono text-muted-foreground">#{index + 1}</span>;
  };

  const rooms = [
    { name: "Sala de Asalto Web", status: "ACTIVA", players: "3/5", machine: "CORS_Bypass_v2" },
    { name: "Bunker de Reversing", status: "CERRADA", players: "0/5", machine: "-" },
    { name: "Cuartel Active Directory", status: "ACTIVA", players: "4/5", machine: "Forest_Domain" },
    { name: "Zona de Exploits", status: "CERRADA", players: "0/5", machine: "-" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans crt-flicker pb-20">
      <BreadcrumbNav />

      <main className="container mx-auto px-4 pt-12 max-w-6xl space-y-16">
        
        {/* HERO */}
        <motion.section {...fadeIn} className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-mono font-bold mb-4 glitch-hover inline-block">
            <span className="text-primary">&gt;</span> ESCUADRAS_DE_INFILTRACIÓN
          </h1>
          <p className="text-lg text-muted-foreground border-l-2 border-secondary/50 pl-4 text-left mx-auto max-w-lg">
            Únete a un equipo, domina el laboratorio juntos. Los mejores hackers no trabajan solos.
          </p>
        </motion.section>

        {/* CHALLENGE BANNER */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-secondary/20 to-primary/5 border-secondary/30 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-10">
              <Swords className="h-40 w-40" />
            </div>
            <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-mono font-bold text-foreground mb-2 flex items-center gap-2">
                  <Swords className="h-5 w-5 text-secondary" />
                  DESAFÍOS ENTRE ESCUADRAS
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Reta a otro equipo a resolver la misma máquina en el menor tiempo posible. El ganador se lleva los puntos dobles. 
                  <span className="text-secondary ml-2 font-mono">[Modo Torneo — Activo]</span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleTournamentRegister}
                disabled={tournamentRegistered}
                className="font-mono border-secondary/50 text-secondary whitespace-nowrap hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
              >
                {tournamentRegistered ? (
                  <><CheckCircle className="h-4 w-4 mr-2 text-green-400" /> INSCRITA</>
                ) : (
                  <><Trophy className="h-4 w-4 mr-2" /> REGISTRAR ESCUADRA AL PRÓXIMO TORNEO</>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-12">
            {/* LEADERBOARD */}
            <div className="space-y-6">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-mono font-bold text-primary flex items-center gap-2"
              >
                <Terminal className="h-6 w-6" /> GLOBAL_LEADERBOARD
              </motion.h2>

              <Card className="bg-card/30 border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs font-mono text-muted-foreground uppercase bg-muted/20 border-b border-border">
                      <tr>
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Escuadra</th>
                        <th className="px-6 py-4">Hackers</th>
                        <th className="px-6 py-4">Rango</th>
                        <th className="px-6 py-4 text-right">Puntuación</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {loading ? (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground font-mono">Decodificando...</td></tr>
                      ) : teams.length > 0 ? (
                        teams.sort((a, b) => b.totalPoints - a.totalPoints).map((team, index) => {
                          const rank = getRankBadge(team.totalPoints);
                          return (
                            <motion.tr 
                              key={team.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="hover:bg-muted/10 transition-colors group"
                            >
                              <td className="px-6 py-4 w-16">{getRankIcon(index)}</td>
                              <td className="px-6 py-4 font-mono font-bold text-foreground">{team.name}</td>
                              <td className="px-6 py-4 text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" /> {team.members?.length || 0}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className={`${rank.color} bg-background`}>
                                  {rank.title}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-primary text-lg">
                                {team.totalPoints.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs border-secondary/50 text-secondary hover:bg-secondary/10">
                                  SOLICITAR
                                </Button>
                              </td>
                            </motion.tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground font-mono">No hay escuadras registradas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* TOURNAMENT BRACKET + ROOMS */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-mono font-bold text-secondary flex items-center gap-2">
                <Swords className="h-5 w-5" /> &gt; TORNEO_ACTIVO: Infiltration Cup 2026
              </h2>
              
              {/* Static bracket visual */}
              <div className="relative p-6 bg-card/20 border border-primary/20 rounded-xl overflow-x-auto min-h-[280px] flex items-center justify-center">
                <div className="min-w-[600px] flex justify-between items-center gap-4 w-full">
                  <div className="flex flex-col gap-8 relative">
                    <Card className="w-48 bg-[#0a0a0a] border-primary shadow-[0_0_10px_rgba(255,77,184,0.2)] relative z-10">
                      <CardContent className="p-3">
                        <div className="flex justify-between font-mono text-xs mb-2">
                          <span className="text-primary font-bold">Ghost Protocol</span>
                          <span className="text-primary font-bold">3</span>
                        </div>
                        <div className="flex justify-between font-mono text-xs text-muted-foreground">
                          <span>Shadow Wolves</span><span>1</span>
                        </div>
                        <div className="mt-2 text-right">
                          <Badge variant="outline" className="border-green-500 text-green-500 text-[10px]">COMPLETADO</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="absolute right-[-2rem] top-[50%] w-8 border-t-2 border-primary/50 z-0"></div>
                  </div>

                  <div className="flex flex-col relative">
                    <div className="absolute left-[-2rem] top-[50%] w-8 border-t-2 border-primary/50 z-0"></div>
                    <div className="absolute right-[-2rem] top-[50%] w-8 border-t-2 border-primary/50 z-0"></div>
                    <div className="text-center mb-2 font-mono text-xs text-secondary animate-pulse font-bold tracking-widest">GRAN FINAL</div>
                    <Card className="w-56 bg-card border-secondary shadow-[0_0_15px_rgba(155,85,249,0.3)] relative z-10">
                      <CardContent className="p-4">
                        <div className="flex justify-between font-mono text-sm mb-3">
                          <span className="text-primary font-bold">Ghost Protocol</span>
                          <span className="text-muted-foreground">?</span>
                        </div>
                        <div className="flex justify-between font-mono text-sm">
                          <span className="text-red-500 font-bold">Red Storm</span>
                          <span className="text-muted-foreground">?</span>
                        </div>
                        <div className="mt-3 flex flex-col gap-2">
                          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50 animate-pulse text-[10px] justify-center">
                            <Radio className="h-2.5 w-2.5 mr-1" /> EN CURSO
                          </Badge>
                          {tournamentRooms.find(r => r.status === "en_curso") && (
                            <Link href={`/torneo/${tournamentRooms.find(r => r.status === "en_curso").id}`}>
                              <Button size="sm" className="w-full font-mono text-[10px] bg-secondary/20 text-secondary border border-secondary/40 hover:bg-secondary/30 h-6 gap-1">
                                <ExternalLink className="h-2.5 w-2.5" /> ENTRAR A LA SALA
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex flex-col gap-8 relative">
                    <div className="absolute left-[-2rem] top-[50%] w-8 border-t-2 border-primary/50 z-0"></div>
                    <Card className="w-48 bg-[#0a0a0a] border-red-500/50 relative z-10">
                      <CardContent className="p-3">
                        <div className="flex justify-between font-mono text-xs mb-2">
                          <span className="text-red-500 font-bold">Red Storm</span>
                          <span className="text-red-500 font-bold">2</span>
                        </div>
                        <div className="flex justify-between font-mono text-xs text-muted-foreground">
                          <span>Null Pointers</span><span>1</span>
                        </div>
                        <div className="mt-2 text-right">
                          <Badge variant="outline" className="border-green-500 text-green-500 text-[10px]">COMPLETADO</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* TOURNAMENT ROOMS LIST */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-4"
            >
              <h2 className="text-xl font-mono font-bold text-primary mb-6 flex items-center gap-2">
                <Server className="h-5 w-5" /> SALAS_DE_TORNEO
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {tournamentRooms.length === 0 ? (
                  <div className="md:col-span-2 text-center py-8 text-muted-foreground font-mono text-sm">
                    Cargando salas...
                  </div>
                ) : tournamentRooms.map((room) => {
                  const isLive = room.status === "en_curso";
                  const isWaiting = room.status === "esperando";
                  const isDone = room.status === "finalizado";
                  return (
                    <Card key={room.id} className={`bg-card/20 border transition-colors ${isLive ? 'border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : isWaiting ? 'border-primary/30' : 'border-border'}`}>
                      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-mono font-bold text-foreground text-sm">{room.round}</h3>
                              <p className="font-mono text-xs text-muted-foreground">{room.tournamentName}</p>
                            </div>
                            {isLive && <Badge className="bg-amber-500/20 border-amber-500 text-amber-400 text-[10px] gap-1 animate-pulse"><Radio className="h-2.5 w-2.5" /> LIVE</Badge>}
                            {isWaiting && <Badge variant="outline" className="border-primary/50 text-primary text-[10px]">ESPERANDO</Badge>}
                            {isDone && <Badge variant="outline" className="border-green-500/50 text-green-500 text-[10px]">COMPLETADO</Badge>}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground space-y-1.5 mt-3">
                            <div className="flex items-center gap-2">
                              <Swords className="h-3 w-3 text-primary" />
                              <span className="text-primary font-bold">{room.squad1Name}</span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="text-red-400 font-bold">{room.squad2Name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-3 w-3" /> Target: <span className="text-primary/80">{room.machineName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" /> {room.currentParticipants}/{room.maxParticipants} espectadores
                            </div>
                          </div>
                        </div>
                        <Link href={`/torneo/${room.id}`}>
                          <Button
                            className={`w-full font-mono text-xs gap-2 ${isLive ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40' : isWaiting ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50' : 'bg-muted/40 text-muted-foreground border border-border'}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {isLive ? "ENTRAR EN DIRECTO" : isWaiting ? "VER SALA" : "VER RESULTADO"}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            {/* CREATE TEAM */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card/40 border-primary/30 sticky top-24">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle className="font-mono text-primary flex items-center gap-2">
                    <Plus className="h-5 w-5" /> CREAR_ESCUADRA
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    Recluta hackers, gana puntos conjuntos y sube en el ranking global.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {!user ? (
                    <div className="text-center space-y-3 py-2">
                      <p className="font-mono text-xs text-muted-foreground">Debes iniciar sesión para fundar una escuadra.</p>
                      <Link href="/login">
                        <Button className="w-full bg-primary text-background hover:bg-primary/90 font-mono font-bold gap-2">
                          <LogIn className="h-4 w-4" /> ACCEDER / REGISTRARSE
                        </Button>
                      </Link>
                    </div>
                  ) : userSquad ? (
                    <div className="text-center space-y-2 py-2">
                      <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
                      <p className="font-mono text-sm font-bold text-white">{userSquad.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">Ya eres capitana de esta escuadra.</p>
                      <Link href="/equipos">
                        <Button variant="outline" className="w-full font-mono border-primary/30 text-primary text-xs">
                          VER MI ESCUADRA
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <form className="space-y-4" onSubmit={handleCreateSquad}>
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-muted-foreground uppercase">Nombre de la Escuadra <span className="text-primary">*</span></label>
                        <Input
                          value={squadName}
                          onChange={e => setSquadName(e.target.value)}
                          className="bg-background/50 border-border focus-visible:ring-primary font-mono"
                          placeholder="Ej. The_Root_Squad"
                          maxLength={50}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-muted-foreground uppercase">Manifiesto / Descripción</label>
                        <Textarea
                          value={squadDesc}
                          onChange={e => setSquadDesc(e.target.value)}
                          className="bg-background/50 border-border focus-visible:ring-primary font-mono min-h-[80px] resize-none"
                          placeholder="¿Cuál es el objetivo de tu equipo?"
                          maxLength={300}
                        />
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        Capitana: <span className="text-primary">{user.username}</span>
                      </p>
                      <Button
                        type="submit"
                        disabled={creating || !squadName.trim()}
                        className="w-full bg-primary text-background hover:bg-primary/90 font-mono font-bold disabled:opacity-50"
                      >
                        {creating ? (
                          <span className="flex items-center gap-2"><span className="animate-spin">◈</span> FUNDANDO...</span>
                        ) : (
                          <><Plus className="h-4 w-4 mr-1" /> FUNDAR ESCUADRA</>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* GROUP CHAT */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-8"
        >
          <h2 className="text-xl font-mono font-bold text-primary mb-6 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> &gt; CHAT_GLOBAL_ESCUADRAS
          </h2>
          <Card className="bg-[#050505] border-border overflow-hidden">
            <CardContent className="p-0 flex flex-col h-[400px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2"
                  >
                    <span className="text-muted-foreground whitespace-nowrap">[{msg.time}]</span>
                    <span className={`${msg.color} font-bold whitespace-nowrap`}>{msg.user}:</span>
                    <span className="text-foreground/90 break-words break-all">{msg.text}</span>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-border/50 bg-background/50">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <span className="text-primary font-mono text-sm self-center hidden sm:inline-block">TU_HACKER@root:~$</span>
                  <Input 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 bg-[#0a0a0a] border-primary/30 focus-visible:ring-primary font-mono text-sm rounded-none" 
                    placeholder="Escribe un mensaje..." 
                  />
                  <Button type="submit" className="font-mono bg-primary text-background hover:bg-primary/90 rounded-none shrink-0 gap-2">
                    <Send className="h-4 w-4" /> <span className="hidden sm:inline-block">ENVIAR</span>
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </motion.section>

      </main>
    </div>
  );
}
