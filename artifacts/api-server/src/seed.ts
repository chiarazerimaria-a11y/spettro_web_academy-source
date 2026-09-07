import { pool } from "@workspace/db";
import { logger } from "./lib/logger";

const COURSES = [
  ["Pentesting Desde Cero: eJPTv2","El curso más completo en español para preparar la certificación eJPTv2. De cero a comprometer tu primera máquina real.","97.00","principiante","certificacion","R3dD3vil",42,false,false,1241,4.9,150,true],
  ["Linux para Hackers: Domina la Terminal","Todo lo que necesitas saber de Linux para hacking: bash scripting, permisos, redes y automatización de ataques. Gratis para todos.","0.00","principiante","fundamentos","Ph4ntom",12,true,false,3801,4.8,80,true],
  ["Introducción al Hacking Ético","Conceptos básicos del hacking ético, metodología y primeras herramientas. El punto de entrada perfecto a la ciberseguridad.","0.00","principiante","fundamentos","SpettroWeb",8,true,false,5201,4.7,60,true],
  ["Redes y Protocolos para Hackers","TCP/IP, ARP spoofing, Man-in-the-Middle, sniffing de tráfico y ataques a infraestructura de red. Gratis.","0.00","principiante","redes","N3tW4rri0r",14,true,false,2901,4.6,90,true],
  ["Hacking Web Avanzado: OWASP Top 10","Explota las 10 vulnerabilidades web más críticas: SQL Injection, XSS, SSRF, XXE, deserialization y más. Laboratorios reales.","79.00","intermedio","web","Cyph3rX",28,false,false,891,4.8,200,true],
  ["Bug Bounty Hunting Profesional","Encuentra vulnerabilidades en programas reales, reporta correctamente y monetiza tus hallazgos éticos con metodología Hunter.","89.00","intermedio","bug_bounty","H4ck3rQueen",22,false,false,621,4.9,250,true],
  ["Active Directory: Red Team Completo","Compromete entornos Windows corporativos. BloodHound, Mimikatz, Pass-the-Hash, Kerberoasting y lateral movement. Solo ELITE.","119.00","avanzado","windows","N1ghtCrawl3r",35,false,true,340,5,400,true],
  ["Reversing & Malware Analysis","Desmonta binarios, analiza malware real y aprende shellcodes. Ghidra, radare2 y x64dbg. Contenido exclusivo Elite.","129.00","experto","reversing","B1n4ryGh0st",30,false,true,180,5,500,true],
];

const MACHINES = [
  {name:"SRV",slug:"srv",os:"Linux",difficulty:"dificil",characterType:"virus",points:20,description:"",vulnerability:"",techniques:"",hints:null,downloadUrl:"https://drive.proton.me/urls/6P6YTHXGN4#7P8tpZ9l0R6J",solveCount:0,isActive:true},
  {name:"Hel",slug:"hel",os:"Linux",difficulty:"dificil",characterType:"skull",points:40,description:"La diosa del inframundo. Mitad viva, mitad muerta. Dual boot.",vulnerability:"Dual Boot Exploit → Cross-OS → Root",techniques:"Buffer Overflow,Pivoting,BloodHound,Cross-Platform Exploit",hints:"La mitad viva de la máquina oculta la mitad muerta.",downloadUrl:null,solveCount:71,isActive:true},
  {name:"Valkyrie",slug:"valkyrie",os:"Linux",difficulty:"dificil",characterType:"ninja",points:40,description:"Ella elige quién vive. Bypass de mecanismos de seguridad avanzados.",vulnerability:"Security Bypass → Privilege Selection → Root",techniques:"Buffer Overflow,Pivoting,BloodHound,CrackMapExec",hints:"Las valquirias dejan rastros en el campo de batalla.",downloadUrl:null,solveCount:88,isActive:true},
  {name:"Hephaestus",slug:"hephaestus",os:"Linux",difficulty:"medio",characterType:"robot",points:30,description:"El herrero divino. Servicios industriales mal configurados.",vulnerability:"Exposed Admin Panel → RCE → Root",techniques:"Burp Suite,SQLi,LFI,LinPEAS,Hydra",hints:"El herrero tiene sus herramientas expuestas en el panel.",downloadUrl:null,solveCount:198,isActive:true},
  {name:"Shellshock",slug:"shellshock",os:"Linux",difficulty:"facil",characterType:"robot",points:20,description:"La vulnerabilidad clásica de Bash. CGI scripts vulnerables.",vulnerability:"Shellshock CVE-2014-6271 → RCE",techniques:"Nmap,Curl,Bash Exploit,Netcat",hints:"El bug está en cómo Bash procesa variables de entorno.",downloadUrl:null,solveCount:312,isActive:true},
  {name:"Pandora",slug:"pandora",os:"Linux",difficulty:"facil",characterType:"ghost",points:20,description:"La caja que no debías abrir. Servicios web mal configurados.",vulnerability:"SNMP Enumeration → SSH Tunnel → LFI → Root",techniques:"SNMPwalk,SSH Tunneling,LFI,Cron Exploit",hints:"A veces los servicios ocultos hablan si les preguntas bien.",downloadUrl:null,solveCount:445,isActive:true},
  {name:"Nibbles",slug:"nibbles",os:"Linux",difficulty:"facil",characterType:"ninja",points:20,description:"Pequeña pero peligrosa. Panel de administración expuesto.",vulnerability:"NibbleBlog Arbitrary File Upload → RCE",techniques:"Gobuster,Burp Suite,File Upload Bypass,Sudo Exploit",hints:"Busca el panel de admin. Está escondido pero no tanto.",downloadUrl:null,solveCount:501,isActive:true},
  {name:"Lame",slug:"lame",os:"Linux",difficulty:"facil",characterType:"demon",points:20,description:"La primera máquina que todo hacker debe comprometer. Clásico absoluto.",vulnerability:"Samba 3.0.20 CVE-2007-2447 → Root",techniques:"Nmap,Metasploit,Manual Exploit",hints:"Samba tiene una vulnerabilidad conocida en esta versión.",downloadUrl:null,solveCount:678,isActive:true},
  {name:"Blue",slug:"blue",os:"Windows",difficulty:"facil",characterType:"skull",points:20,description:"EternalBlue. El exploit que cambió el mundo del hacking.",vulnerability:"MS17-010 EternalBlue → SYSTEM",techniques:"Nmap,Metasploit,Manual MS17-010",hints:"WannaCry te dejó pistas. El nombre lo dice todo.",downloadUrl:null,solveCount:589,isActive:true},
  {name:"Jerry",slug:"jerry",os:"Windows",difficulty:"facil",characterType:"robot",points:20,description:"Apache Tomcat mal configurado. Credenciales por defecto.",vulnerability:"Tomcat Default Creds → WAR Upload → SYSTEM",techniques:"Gobuster,WAR Shell,Tomcat Manager",hints:"Manager/manager. El admin nunca cambió la contraseña.",downloadUrl:null,solveCount:423,isActive:true},
];

const SQUADS = [
  ["Shadow Wolves","shadow-wolves","DarkCipher","Los lobos del shadow web. Especializados en exploits de red y escalada de privilegios.","wolf",4,1350,5,8,3,"activa",false,null],
  ["Neon Phantoms","neon-phantoms","Phan7om","Fantasmas del ciberespacio. Masters en OSINT y ingeniería social avanzada.","phantom",3,620,3,5,4,"activa",false,null],
  ["Crimson Demons","crimson-demons","R3dD3vil","Demonios del red team. Binary exploitation y kernel hacking.","demon",5,1550,6,11,2,"activa",false,null],
  ["Ghost Protocol","ghost-protocol","Sp3ctre","Operaciones sigilosas. Especialistas en evasión y persistencia.","ghost",2,440,2,4,3,"activa",false,null],
  ["GHOST_IA_FACIL","ghost-ia-facil","IA_EASY","Equipo de entrenamiento básico. Ideal para practicar tus primeros exploits.","ghost",4,280,2,8,4,"activa",true,"facil"],
  ["DAEMON_IA_MEDIO","daemon-ia-medio","IA_MED","Adversario equilibrado. Usa técnicas de enumeración y escalada de privilegios.","demon",6,720,4,18,7,"activa",true,"medio"],
  ["PHANTOM_IA_HARD","phantom-ia-hard","IA_HARD","Contrincante avanzado. Cadenas de vulnerabilidades y movimiento lateral.","phantom",8,1450,7,35,6,"activa",true,"dificil"],
  ["OMEGA_IA_INSANO","omega-ia-insano","IA_INSANO","Élite total. Active Directory, pivoting y evasión. Solo para las mejores.","ghost",12,3800,10,67,3,"activa",true,"insano"],
];

const MISSIONS = [
  ["Operación Aurora","Infiltra el servidor corporativo. Encuentra la flag oculta en los logs del sistema.","facil","10.10.1.1",100,null],
  ["Proyecto Hydra","Dos cabezas crecen donde cae una. Explota una cadena de vulnerabilidades para escalar privilegios.","medio","10.10.1.5",200,null],
  ["Espejo Negro","Un servidor de IA ha sido comprometido. Recupera la flag antes de que destruya las evidencias.","dificil","10.10.1.9",350,null],
  ["Protocolo OMEGA","El servidor final. Solo los mejores llegan aquí. Active Directory + múltiples pivots.","insano","10.10.1.15",500,null],
];

const TUTORING = [
  ['"ASUCAR Walkthrough | De LFI a acceso SSH (DockerLabs)"',"Explotación LFI en WordPress (CVE-2018-7422), enumeración con Nmap y WPScan, fuerza bruta con Hydra para acceso SSH en entorno DockerLabs.",60,500,"https://www.youtube.com/watch?v=Cy7Pm8FWwwA"],
  ["Chiara SpettroWeb — Ciberseguridad real","Cómo funcionan los sistemas de autenticación web, técnicas de reconocimiento y buenas prácticas para proteger aplicaciones frente a ataques reales.",60,500,"https://www.youtube.com/watch?v=wGSZYx-ppQ8&t=2008s"],
  ["Máquina Plot — Linux VulNyx","Apache 2.4.56 + OpenSSH 8.4. RCE via Sar2HTML, escalada lateral por sudo ssh ProxyCommand, root por cron wildcard con tar.",60,500,"https://www.youtube.com/watch?v=dfrV0p9p3LE&t=2235s"],
  ["Máquina Candy — DockerLabs","Enumeración, credenciales Base64 en panel admin, shell inversa con PentestMonkey, escalada con sudo dd para acceso root.",60,500,"https://www.youtube.com/watch?v=IN1KVk3F8qg&t=2035s"],
  ["Máquina Plex — VulNyx","JWT oculto en robots.txt, acceso SSH como mauro, escalada de privilegios a root usando el binario mutt con sudo.",60,500,"https://www.youtube.com/watch?v=tOgaUeWTGqo&t=1457s"],
  ["Máquina Lower4 — Fuerza Bruta y Escalada","Reconocimiento con Nmap, ataque de fuerza bruta con Hydra, escalada de privilegios inyectando comandos en Multitail.",60,500,"https://www.youtube.com/watch?v=r8naoepX8-8&t=446s"],
  ["Máquina Wicca — Node.js RCE","RCE en servicio Node.js Express en puerto 5000, reverse shell, enumeración y escalada de privilegios en VulnYX.",60,500,"https://www.youtube.com/watch?v=plyVU1fjIP8&t=391s"],
  ["Máquina Node — Node-RED Escalada","Exploración de Node-RED en puerto 1880, inyección de reverse shell via bloques TCP, escalada de privilegios completa.",60,500,"https://www.youtube.com/watch?v=GTqYi9n6YTo&t=656s"],
];

const MARKETPLACE_PRODUCTS = [
  {title:"Writeup Completo — HTB Forest (Active Directory)",description:"Resolución paso a paso de Forest (HackTheBox). AS-REP Roasting, BloodHound, DCSync y escalada a Domain Admin. Incluye comandos y capturas.",category:"writeup",price:150,sellerUsername:"chiara",downloadUrl:"/api/marketplace/download/forest-ad-writeup",thumbnailUrl:"https://www.hackthebox.com/storage/avatars/23a6cdb39e80cdd2a7d0f1e7a04a7f12.png",rating:4.9,salesCount:47},
  {title:"AutoRecon Pro — Script de Enumeración Avanzada",description:"Script Python que automatiza reconocimiento: nmap, gobuster, nikto, ffuf y whatweb en una sola ejecución. Genera reporte HTML.",category:"script",price:250,sellerUsername:"chiara",downloadUrl:"/api/marketplace/download/autorecon-pro",thumbnailUrl:"https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400&q=80",rating:4.8,salesCount:83},
  {title:"Cheatsheet Completo — Privilege Escalation Linux",description:"Apuntes definitivos de escalada en Linux: SUID, cron jobs, capabilities, PATH injection, sudo abuse y más. Formato Markdown.",category:"notes",price:100,sellerUsername:"chiara",downloadUrl:"/api/marketplace/download/privesc-linux-cheatsheet",thumbnailUrl:"https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80",rating:5.0,salesCount:124},
  {title:"Guía Práctica — Bug Bounty Web desde Cero",description:"Metodología completa para bug bounty: recon, subdomain enum, XSS, SQLi, SSRF, IDOR y cómo reportar. Casos reales resueltos.",category:"course",price:500,sellerUsername:"chiara",downloadUrl:"/api/marketplace/download/bug-bounty-guide",thumbnailUrl:"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80",rating:4.7,salesCount:36},
  {title:"Writeup — THM RootMe (Principiantes)",description:"Writeup de la sala RootMe de TryHackMe. Enumeración web, upload bypass, reverse shell y escalada SUID. Ideal para empezar.",category:"writeup",price:50,sellerUsername:"chiareta",downloadUrl:"/api/marketplace/download/rootme-writeup",thumbnailUrl:"https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&q=80",rating:4.6,salesCount:89},
  {title:"SQLMap Tamper Pack — 15 Scripts Bypass WAF",description:"Colección de 15 scripts tamper para SQLMap que evaden WAFs comunes (CloudFlare, ModSecurity, AWS WAF). Probados en entornos reales.",category:"tool",price:300,sellerUsername:"chiareta",downloadUrl:"/api/marketplace/download/sqlmap-tamper-pack",thumbnailUrl:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80",rating:4.9,salesCount:29},
  {title:"Apuntes OSCP — Buffer Overflow 32-bit",description:"Notas detalladas sobre Buffer Overflow para el OSCP: spiking, fuzzing, offset, badchars, shellcode. Plantillas de exploit incluidas.",category:"notes",price:200,sellerUsername:"chiara",downloadUrl:"/api/marketplace/download/bof-oscp-notes",thumbnailUrl:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",rating:4.8,salesCount:61},
];

const CERTIFICATIONS = [
  ["Infiltrador Novato","SPN-01","principiante","Primer paso en el mundo del hacking ético. Demuestra que dominas el reconocimiento y la enumeración básica.","Completa 5 máquinas de nivel Fácil y obtén 100 puntos",5,100,"#00ffff"],
  ["Hacker Junior","SPN-02","principiante","Has demostrado capacidad para explotar vulnerabilidades web comunes y escalar privilegios en entornos Linux.","Completa 15 máquinas (10 Fácil + 5 Medio) y obtén 350 puntos",15,350,"#00ff88"],
  ["SpettroWeb eJPT Ready","SPW-eJPT","principiante","Certificación oficial de SpettroWeb que valida tu preparación total para superar el examen eJPTv2 de INE Security.","Completa el curso eJPTv2 + 20 máquinas + examen práctico en plataforma",20,500,"#ff00ff"],
  ["Red Team Operative","SPN-03","intermedio","Nivel intermedio. Dominas técnicas de post-explotación, pivoting y ataque a entornos Active Directory básicos.","Completa 30 máquinas (incluye 10 Medio) y obtén 800 puntos",30,800,"#ff6600"],
  ["SpettroWeb OSCP Ready","SPW-OSCP","intermedio","Preparación validada para el OSCP de OffSec. Demuestra que puedes completar un pentest completo con documentación profesional.","Completa 40 máquinas (incluye 15 Difícil) + laboratorio de red completo",40,1400,"#ff3333"],
  ["Ghost Operator","SPN-04","avanzado","Élite de SpettroWeb. Has demostrado habilidades avanzadas en explotación binaria, Active Directory y evasión de defensas.","Completa 60 máquinas (incluye 5 Insano) y obtén 2500 puntos",60,2500,"#cc00ff"],
  ["SpettroWeb Legend","SPW-LEG","avanzado","El trofeo más alto de la plataforma. Solo los mejores hackers del mundo ostentan esta certificación.","Completa TODAS las máquinas Insano + ranking top 10 global",100,5000,"#ffd700"],
];

export async function runSeed(): Promise<void> {
  const client = await pool.connect();
  try {
    // ── Courses: UPSERT — never delete admin-added courses ──────────────────
    for (const c of COURSES) {
      const [title,desc,price,level,cat,instructor,durHours,isFree,isPrem,enrolled,rating,spcRew,published] = c;
      const existing = await client.query("SELECT id FROM courses WHERE title = $1", [title]);
      if (existing.rows.length > 0) {
        await client.query(
          "UPDATE courses SET description=$2,price=$3,level=$4,category=$5,instructor=$6,duration_hours=$7,is_free=$8,is_premium=$9,enrolled_count=$10,rating=$11,spc_reward=$12,published=$13 WHERE title=$1",
          [title,desc,price,level,cat,instructor,durHours,isFree,isPrem,enrolled,rating,spcRew,published]
        );
      } else {
        await client.query(
          "INSERT INTO courses (title,description,price,level,category,instructor,duration_hours,is_free,is_premium,enrolled_count,rating,spc_reward,published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
          c
        );
      }
    }
    logger.info("[seed] Courses done: " + COURSES.length);

    // ── Machines: UPSERT by slug ─────────────────────────────────────────────
    for (let i = 0; i < MACHINES.length; i++) {
      const m = MACHINES[i];
      const thumbNum = String((i % 40) + 1).padStart(2, "0");
      const thumbUrl = "/androids/android-" + thumbNum + ".png";
      await client.query(
        `INSERT INTO lab_machines (name,slug,os,difficulty,character_type,points,description,vulnerability,techniques,hints,download_url,thumbnail_url,solve_count,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (slug) DO UPDATE SET
           name=EXCLUDED.name,os=EXCLUDED.os,difficulty=EXCLUDED.difficulty,
           character_type=EXCLUDED.character_type,points=EXCLUDED.points,
           description=EXCLUDED.description,vulnerability=EXCLUDED.vulnerability,
           techniques=EXCLUDED.techniques,hints=EXCLUDED.hints,
           download_url=EXCLUDED.download_url,thumbnail_url=EXCLUDED.thumbnail_url,
           solve_count=EXCLUDED.solve_count,is_active=EXCLUDED.is_active`,
        [m.name,m.slug,m.os,m.difficulty,m.characterType,m.points,m.description,m.vulnerability,m.techniques,m.hints ?? null,m.downloadUrl ?? null,thumbUrl,m.solveCount,m.isActive]
      );
    }
    logger.info("[seed] Machines done: " + MACHINES.length);

    // ── Squads: UPSERT by slug ───────────────────────────────────────────────
    for (const [name,slug,captain,desc,emblem,members,points,level,wins,losses,status,isBot,aiDiff] of SQUADS) {
      await client.query(
        `INSERT INTO squads (name,slug,captain_name,description,emblem,member_count,total_points,level,wins,losses,status,is_bot,ai_difficulty)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (slug) DO UPDATE SET
           captain_name=EXCLUDED.captain_name, description=EXCLUDED.description,
           emblem=EXCLUDED.emblem, member_count=EXCLUDED.member_count,
           total_points=EXCLUDED.total_points, level=EXCLUDED.level,
           wins=EXCLUDED.wins, losses=EXCLUDED.losses,
           status=EXCLUDED.status, is_bot=EXCLUDED.is_bot,
           ai_difficulty=EXCLUDED.ai_difficulty`,
        [name,slug,captain,desc,emblem,members,points,level,wins,losses,status,isBot,aiDiff ?? null]
      );
    }
    logger.info("[seed] Squads done: " + SQUADS.length);

    // ── CTF Missions: INSERT only ────────────────────────────────────────────
    for (const [name,desc,diff,ip,pts,flag] of MISSIONS) {
      const ex = await client.query("SELECT id FROM ctf_missions WHERE name=$1", [name]);
      if (ex.rows.length === 0) {
        await client.query(
          "INSERT INTO ctf_missions (name,description,difficulty,target_ip,points,flag_value) VALUES ($1,$2,$3,$4,$5,$6)",
          [name,desc,diff,ip,pts,flag ?? null]
        );
      }
    }
    logger.info("[seed] Missions done: " + MISSIONS.length);

    // ── Tutoring sessions ────────────────────────────────────────────────────
    const tutorRow = await client.query("SELECT id FROM users ORDER BY id LIMIT 1");
    const tutorId: number = tutorRow.rows[0]?.id ?? 1;
    const existingRes = await client.query("SELECT title FROM tutoring_sessions WHERE tutor_username='chiara ia'");
    const existingTitles = new Set<string>(existingRes.rows.map((r: { title: string }) => r.title));
    for (const [title, desc, dur, price, link] of TUTORING) {
      if (!existingTitles.has(title as string)) {
        await client.query(
          `INSERT INTO tutoring_sessions (tutor_id,tutor_username,title,description,topics,duration_minutes,price_per_session,status,meet_link)
           VALUES ($1,'chiara ia',$2,$3,$4,$5,$6,'disponible',$7)`,
          [tutorId, title, desc, [], dur, price, link]
        );
      }
    }
    logger.info("[seed] Tutoring done: " + TUTORING.length);

    // ── Ensure platform users exist (chiara=admin, chiareta=instructor) ────────
    // chiara password: matches $2b$12$6ecRAPi.re5u8nVo79X4y.OQzfi.auEByX5tt80qXBUNoQpqxFiIa
    const PLATFORM_USERS = [
      { username: "chiara", email: "chiara@spettroweb.com", passwordHash: "$2b$12$6ecRAPi.re5u8nVo79X4y.OQzfi.auEByX5tt80qXBUNoQpqxFiIa", avatarType: "ghost", subscriptionTier: "elite", rank: "Legend" },
      { username: "chiareta", email: "chiareta@spettroweb.com", passwordHash: "$2b$12$6ecRAPi.re5u8nVo79X4y.OQzfi.auEByX5tt80qXBUNoQpqxFiIa", avatarType: "ninja", subscriptionTier: "libre", rank: "Pro" },
    ];
    for (const u of PLATFORM_USERS) {
      await client.query(
        `INSERT INTO users (username,email,password_hash,avatar_type,subscription_tier,rank)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (username) DO NOTHING`,
        [u.username, u.email, u.passwordHash, u.avatarType, u.subscriptionTier, u.rank]
      );
    }
    logger.info("[seed] Platform users ensured");

    // ── Marketplace products: INSERT if not exists ───────────────────────────
    const usersRes = await client.query("SELECT id, username FROM users WHERE username IN ('chiara','chiareta')");
    const userMap: Record<string, number> = {};
    for (const row of usersRes.rows) userMap[row.username as string] = row.id as number;
    let mpCount = 0;
    for (const p of MARKETPLACE_PRODUCTS) {
      const sellerId = userMap[p.sellerUsername];
      if (!sellerId) continue;
      const existing = await client.query("SELECT id FROM marketplace_products WHERE title=$1", [p.title]);
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO marketplace_products (seller_id,seller_username,title,description,category,price,download_url,thumbnail_url,rating,sales_count,is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)`,
          [sellerId, p.sellerUsername, p.title, p.description, p.category, p.price, p.downloadUrl, p.thumbnailUrl, p.rating, p.salesCount]
        );
        mpCount++;
      } else {
        // Always keep download_url updated to the real endpoint
        await client.query(
          "UPDATE marketplace_products SET download_url=$1 WHERE title=$2",
          [p.downloadUrl, p.title]
        );
      }
    }
    logger.info(`[seed] Marketplace done (inserted ${mpCount}/${MARKETPLACE_PRODUCTS.length})`);

    // ── Certifications: UPSERT by code ──────────────────────────────────────
    for (const [name,code,level,desc,req,mn,pn,bc] of CERTIFICATIONS) {
      await client.query(
        `INSERT INTO certifications (name,code,level,description,requirements,machines_needed,points_needed,badge_color,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
         ON CONFLICT (code) DO UPDATE SET
           name=EXCLUDED.name, level=EXCLUDED.level, description=EXCLUDED.description,
           requirements=EXCLUDED.requirements, machines_needed=EXCLUDED.machines_needed,
           points_needed=EXCLUDED.points_needed, badge_color=EXCLUDED.badge_color`,
        [name,code,level,desc,req,mn,pn,bc]
      );
    }
    logger.info("[seed] Certifications done: " + CERTIFICATIONS.length);

    // ── Live Streams: seed demo sessions if table empty ──────────────────────
    const streamsCount = await client.query("SELECT COUNT(*) FROM live_streams");
    if (parseInt(streamsCount.rows[0].count as string) === 0) {
      const now = new Date();
      const STREAMS = [
        ["Taller en Vivo: eJPTv2 desde Cero — Sesión Inicial","chiara","Arrancaremos con reconocimiento, enumeración de servicios y primer exploit. Sesión perfecta para quienes empiezan.",new Date(now.getTime() + 2*24*60*60*1000).toISOString(),120,25,"taller",0,"https://www.youtube.com/watch?v=wGSZYx-ppQ8","en_vivo"],
        ["Live Hacking: DockerLabs — Máquina Candy Completa","chiara","Walthrough en directo de la máquina Candy: panel admin, shell inversa y escalada de privilegios paso a paso.",new Date(now.getTime() + 4*24*60*60*1000).toISOString(),90,20,"walkthrough",0,"https://www.youtube.com/watch?v=IN1KVk3F8qg","programado"],
        ["Clase OSCP: Buffer Overflow 32-bit — Explotación Manual","chiara","Técnica completa de BoF para OSCP: fuzzing, offset, badchars, shellcode sin metasploit.",new Date(now.getTime() + 7*24*60*60*1000).toISOString(),120,15,"clase",1500,"https://meet.google.com","programado"],
        ["Q&A Mensual: Preguntas sobre Ciberseguridad y Carrera","chiara","Sesión abierta de preguntas y respuestas sobre hacking ético, certificaciones y cómo trabajar en ciberseguridad.",new Date(now.getTime() + 10*24*60*60*1000).toISOString(),60,50,"qa",0,null,"programado"],
      ];
      for (const [title,instructor,desc,scheduledAt,dur,maxP,type,price,roomUrl,status] of STREAMS) {
        await client.query(
          `INSERT INTO live_streams (title,instructor,description,scheduled_at,duration_minutes,max_participants,type,price_eur,room_url,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [title,instructor,desc,scheduledAt,dur,maxP,type,price,roomUrl ?? null,status]
        );
      }
      logger.info("[seed] Live streams seeded: 4");
    }

    // ── Reset chiara admin password ──────────────────────────────────────────
    await client.query(
      "UPDATE users SET password_hash=$1 WHERE username='chiara'",
      ["$2b$12$6ecRAPi.re5u8nVo79X4y.OQzfi.auEByX5tt80qXBUNoQpqxFiIa"]
    );
    logger.info("[seed] Seed complete");

  } catch (err) {
    logger.error({ err }, "[seed] Seed error — server will continue");
  } finally {
    client.release();
  }
}
