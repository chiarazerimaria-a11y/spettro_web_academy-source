import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function Terminal() {
  const [text, setText] = useState("");
  const fullText = `root@chiara:~# nmap -sC -sV -p- 10.10.10.25
Starting Nmap 7.93 ( https://nmap.org )
Nmap scan report for 10.10.10.25
Host is up (0.042s latency).
Not shown: 65533 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1
80/tcp open  http    Apache httpd 2.4.41

root@chiara:~# whoami
root

root@chiara:~# ./certify.sh --target ejptv2
[+] Enumeration complete.
[+] Exploits found.
[+] Privilege escalation paths identified.
[!] Target EJPTV2 compromised. You are ready.`;

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden border border-primary/30 bg-background/90 backdrop-blur-sm shadow-[0_0_15px_rgba(255,77,184,0.1)]">
      <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-primary/20">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <div className="mx-auto text-xs text-muted-foreground font-mono">terminal - root@chiara:~</div>
      </div>
      <div className="p-6 font-mono text-sm md:text-base text-primary/90 h-[300px] overflow-y-auto scanlines">
        <pre className="whitespace-pre-wrap leading-relaxed">{text}<motion.span 
          animate={{ opacity: [1, 0] }} 
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-2 h-4 bg-primary ml-1 align-middle"
        /></pre>
      </div>
    </div>
  );
}