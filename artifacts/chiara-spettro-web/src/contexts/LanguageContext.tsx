import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "es" | "en" | "it" | "fr" | "pl" | "ro" | "sq";

export const LANGUAGES: { code: Lang; label: string; flag: string; name: string }[] = [
  { code: "es", label: "ES", flag: "🇪🇸", name: "Español" },
  { code: "en", label: "EN", flag: "🇬🇧", name: "English" },
  { code: "it", label: "IT", flag: "🇮🇹", name: "Italiano" },
  { code: "fr", label: "FR", flag: "🇫🇷", name: "Français" },
  { code: "pl", label: "PL", flag: "🇵🇱", name: "Polski" },
  { code: "ro", label: "RO", flag: "🇷🇴", name: "Română" },
  { code: "sq", label: "SQ", flag: "🇦🇱", name: "Shqip" },
];

export interface T {
  nav: {
    home: string; lab: string; squads: string; streaming: string;
    certifications: string; courses: string; marketplace: string;
    tutoring: string; login: string; logout: string; register: string; profile: string;
  };
  hero: {
    badge: string; title1: string; title2: string; title3: string;
    subtitle: string; cta: string; ctaSecondary: string;
    stat1: string; stat2: string; stat3: string; stat4: string;
  };
  courses: {
    pageTitle: string; pageSubtitle: string; available: string;
    free: string; freeCourses: string; paid: string; paidCourses: string;
    elite: string; eliteCourses: string; searchPlaceholder: string;
    all: string; level: string; beginner: string; intermediate: string;
    advanced: string; expert: string; startFree: string; enroll: string;
    continue: string; enrolled: string; lessons: string; rating: string;
    students: string; spcOnComplete: string; upload: string;
    noResults: string; eliteOnly: string; certIncluded: string;
    yourProgress: string; completed: string; lessonCompleted: string;
    courseCompleted: string; markDone: string; next: string;
    notes: string; lesson: string; preview: string; online: string;
    comingSoon: string; videoSpanish: string; accessFree: string;
    beElite: string; enrollFirst: string;
  };
  lab: {
    title: string; subtitle: string; connect: string; startMachine: string;
    targetIp: string; download: string; fullLab: string; spawning: string;
    active: string; noVpn: string; vpnConfig: string; seeAll: string;
    lockMsg: string; connectVpn: string;
  };
  common: {
    loading: string; error: string; back: string; close: string; copy: string;
    copied: string; submit: string; cancel: string; save: string; confirm: string;
    or: string; and: string; points: string; pwned: string;
  };
}

const TRANSLATIONS: Record<Lang, T> = {
  es: {
    nav: {
      home: "INICIO", lab: "LABORATORIO", squads: "ESCUADRAS",
      streaming: "STREAMING", certifications: "CERTIFICACIONES", courses: "CURSOS",
      marketplace: "MARKETPLACE", tutoring: "TUTORÍAS", login: "ACCEDER",
      logout: "CERRAR SESIÓN", register: "REGISTRARSE", profile: "PERFIL",
    },
    hero: {
      badge: "Plataforma #1 de Hacking Ético en Español",
      title1: "Hackea.", title2: "Aprende.", title3: "Domina.",
      subtitle: "La academia de ciberseguridad ofensiva más completa en español. Laboratorio VulnYX, certificaciones y comunidad.",
      cta: "EMPEZAR GRATIS", ctaSecondary: "VER LABORATORIO",
      stat1: "Máquinas activas", stat2: "Estudiantes", stat3: "Cursos", stat4: "Certif. emitidos",
    },
    courses: {
      pageTitle: "Aprende a Hackear. En Español.", pageSubtitle: "Cursos técnicos de ciberseguridad ofensiva con laboratorios reales.",
      available: "CURSOS DISPONIBLES", free: "LIBRE", freeCourses: "cursos gratis",
      paid: "OPERATIVO", paidCourses: "cursos", elite: "ELITE", eliteCourses: "cursos exclusivos",
      searchPlaceholder: "Buscar cursos...", all: "TODOS", level: "NIVEL",
      beginner: "PRINCIPIANTE", intermediate: "INTERMEDIO", advanced: "AVANZADO", expert: "EXPERTO",
      startFree: "COMENZAR", enroll: "INSCRIBIRME", continue: "CONTINUAR", enrolled: "INSCRITO",
      lessons: "lecciones", rating: "valoración", students: "estudiantes",
      spcOnComplete: "SPC al completar", upload: "SUBIR", noResults: "No se encontraron cursos con ese filtro.",
      eliteOnly: "SOLO ELITE", certIncluded: "Certificado al completar",
      yourProgress: "TU PROGRESO", completed: "completadas", lessonCompleted: "Lección completada",
      courseCompleted: "¡CURSO COMPLETADO!", markDone: "MARCAR COMPLETADA", next: "SIGUIENTE",
      notes: "NOTAS", lesson: "LECCIÓN", preview: "PREVIEW", online: "En línea",
      comingSoon: "Vídeo próximamente", videoSpanish: "Contenido disponible en notas",
      accessFree: "ACCEDER GRATIS", beElite: "HACERSE ELITE", enrollFirst: "COMENZAR GRATIS",
    },
    lab: {
      title: "Laboratorio VulnYX", subtitle: "Máquinas reales. Ataques reales.",
      connect: "CONEXIÓN VPN", startMachine: "INICIAR Y CONECTAR VPN", targetIp: "IP DEL OBJETIVO",
      download: "DESCARGAR CONFIG OPENVPN", fullLab: "LAB COMPLETO", spawning: "INICIANDO MÁQUINA...",
      active: "MÁQUINA ACTIVA · VPN CONECTADA", noVpn: "Sin conexión VPN", vpnConfig: "CONFIG VPN",
      seeAll: "VER MÁQUINAS", lockMsg: "ACCEDE PARA VER", connectVpn: "CONECTAR VPN",
    },
    common: {
      loading: "Cargando...", error: "Error", back: "VOLVER", close: "Cerrar",
      copy: "COPIAR", copied: "¡COPIADO!", submit: "Enviar", cancel: "Cancelar",
      save: "Guardar", confirm: "Confirmar", or: "o", and: "y", points: "pts", pwned: "pwned",
    },
  },

  en: {
    nav: {
      home: "HOME", lab: "LABORATORY", squads: "SQUADS",
      streaming: "STREAMING", certifications: "CERTIFICATIONS", courses: "COURSES",
      marketplace: "MARKETPLACE", tutoring: "TUTORING", login: "LOGIN",
      logout: "LOGOUT", register: "REGISTER", profile: "PROFILE",
    },
    hero: {
      badge: "The #1 Ethical Hacking Platform in Spanish",
      title1: "Hack.", title2: "Learn.", title3: "Master.",
      subtitle: "The most complete offensive cybersecurity academy in Spanish. VulnYX lab, certifications and community.",
      cta: "START FREE", ctaSecondary: "VIEW LABORATORY",
      stat1: "Active machines", stat2: "Students", stat3: "Courses", stat4: "Certs issued",
    },
    courses: {
      pageTitle: "Learn to Hack. In Spanish.", pageSubtitle: "Technical offensive cybersecurity courses with real labs.",
      available: "COURSES AVAILABLE", free: "FREE", freeCourses: "free courses",
      paid: "STANDARD", paidCourses: "courses", elite: "ELITE", eliteCourses: "exclusive courses",
      searchPlaceholder: "Search courses...", all: "ALL", level: "LEVEL",
      beginner: "BEGINNER", intermediate: "INTERMEDIATE", advanced: "ADVANCED", expert: "EXPERT",
      startFree: "START", enroll: "ENROLL", continue: "CONTINUE", enrolled: "ENROLLED",
      lessons: "lessons", rating: "rating", students: "students",
      spcOnComplete: "SPC on completion", upload: "UPLOAD", noResults: "No courses found with that filter.",
      eliteOnly: "ELITE ONLY", certIncluded: "Certificate on completion",
      yourProgress: "YOUR PROGRESS", completed: "completed", lessonCompleted: "Lesson completed",
      courseCompleted: "COURSE COMPLETED!", markDone: "MARK AS DONE", next: "NEXT",
      notes: "NOTES", lesson: "LESSON", preview: "PREVIEW", online: "Online",
      comingSoon: "Video coming soon", videoSpanish: "Content available in notes",
      accessFree: "JOIN FREE", beElite: "GO ELITE", enrollFirst: "START FREE",
    },
    lab: {
      title: "VulnYX Laboratory", subtitle: "Real machines. Real attacks.",
      connect: "VPN CONNECTION", startMachine: "START & CONNECT VPN", targetIp: "TARGET IP",
      download: "DOWNLOAD OPENVPN CONFIG", fullLab: "FULL LAB", spawning: "STARTING MACHINE...",
      active: "MACHINE ACTIVE · VPN CONNECTED", noVpn: "No VPN connection", vpnConfig: "VPN CONFIG",
      seeAll: "VIEW MACHINES", lockMsg: "LOGIN TO VIEW", connectVpn: "CONNECT VPN",
    },
    common: {
      loading: "Loading...", error: "Error", back: "BACK", close: "Close",
      copy: "COPY", copied: "COPIED!", submit: "Submit", cancel: "Cancel",
      save: "Save", confirm: "Confirm", or: "or", and: "and", points: "pts", pwned: "pwned",
    },
  },

  it: {
    nav: {
      home: "HOME", lab: "LABORATORIO", squads: "SQUADRE",
      streaming: "STREAMING", certifications: "CERTIFICAZIONI", courses: "CORSI",
      marketplace: "MARKETPLACE", tutoring: "TUTORAGGIO", login: "ACCEDI",
      logout: "ESCI", register: "REGISTRATI", profile: "PROFILO",
    },
    hero: {
      badge: "La piattaforma #1 di Ethical Hacking in Spagnolo",
      title1: "Hackera.", title2: "Impara.", title3: "Domina.",
      subtitle: "L'accademia di cybersecurity offensiva più completa in spagnolo. Lab VulnYX, certificazioni e comunità.",
      cta: "INIZIA GRATIS", ctaSecondary: "VEDI LABORATORIO",
      stat1: "Macchine attive", stat2: "Studenti", stat3: "Corsi", stat4: "Cert. emessi",
    },
    courses: {
      pageTitle: "Impara a Hackare. In Spagnolo.", pageSubtitle: "Corsi tecnici di cybersecurity offensiva con laboratori reali.",
      available: "CORSI DISPONIBILI", free: "LIBERO", freeCourses: "corsi gratuiti",
      paid: "STANDARD", paidCourses: "corsi", elite: "ELITE", eliteCourses: "corsi esclusivi",
      searchPlaceholder: "Cerca corsi...", all: "TUTTI", level: "LIVELLO",
      beginner: "PRINCIPIANTE", intermediate: "INTERMEDIO", advanced: "AVANZATO", expert: "ESPERTO",
      startFree: "INIZIA", enroll: "ISCRIVITI", continue: "CONTINUA", enrolled: "ISCRITTO",
      lessons: "lezioni", rating: "valutazione", students: "studenti",
      spcOnComplete: "SPC al completamento", upload: "CARICA", noResults: "Nessun corso trovato con quel filtro.",
      eliteOnly: "SOLO ELITE", certIncluded: "Certificato al completamento",
      yourProgress: "IL TUO PROGRESSO", completed: "completate", lessonCompleted: "Lezione completata",
      courseCompleted: "CORSO COMPLETATO!", markDone: "SEGNA COMPLETATA", next: "SUCCESSIVA",
      notes: "NOTE", lesson: "LEZIONE", preview: "ANTEPRIMA", online: "Online",
      comingSoon: "Video prossimamente", videoSpanish: "Contenuto disponibile nelle note",
      accessFree: "ACCEDI GRATIS", beElite: "DIVENTA ELITE", enrollFirst: "INIZIA GRATIS",
    },
    lab: {
      title: "Laboratorio VulnYX", subtitle: "Macchine reali. Attacchi reali.",
      connect: "CONNESSIONE VPN", startMachine: "AVVIA E CONNETTI VPN", targetIp: "IP OBIETTIVO",
      download: "SCARICA CONFIG OPENVPN", fullLab: "LAB COMPLETO", spawning: "AVVIO MACCHINA...",
      active: "MACCHINA ATTIVA · VPN CONNESSA", noVpn: "Nessuna connessione VPN", vpnConfig: "CONFIG VPN",
      seeAll: "VEDI MACCHINE", lockMsg: "ACCEDI PER VEDERE", connectVpn: "CONNETTI VPN",
    },
    common: {
      loading: "Caricamento...", error: "Errore", back: "INDIETRO", close: "Chiudi",
      copy: "COPIA", copied: "COPIATO!", submit: "Invia", cancel: "Annulla",
      save: "Salva", confirm: "Conferma", or: "o", and: "e", points: "pt", pwned: "pwned",
    },
  },

  fr: {
    nav: {
      home: "ACCUEIL", lab: "LABORATOIRE", squads: "ESCOUADES",
      streaming: "STREAMING", certifications: "CERTIFICATIONS", courses: "COURS",
      marketplace: "MARKETPLACE", tutoring: "TUTORAT", login: "CONNEXION",
      logout: "DÉCONNEXION", register: "S'INSCRIRE", profile: "PROFIL",
    },
    hero: {
      badge: "La plateforme #1 de Hacking Éthique en Espagnol",
      title1: "Hackez.", title2: "Apprenez.", title3: "Maîtrisez.",
      subtitle: "L'académie de cybersécurité offensive la plus complète en espagnol. Lab VulnYX, certifications et communauté.",
      cta: "COMMENCER GRATUITEMENT", ctaSecondary: "VOIR LE LABORATOIRE",
      stat1: "Machines actives", stat2: "Étudiants", stat3: "Cours", stat4: "Certif. émis",
    },
    courses: {
      pageTitle: "Apprendre à Hacker. En Espagnol.", pageSubtitle: "Cours techniques de cybersécurité offensive avec des labs réels.",
      available: "COURS DISPONIBLES", free: "GRATUIT", freeCourses: "cours gratuits",
      paid: "STANDARD", paidCourses: "cours", elite: "ELITE", eliteCourses: "cours exclusifs",
      searchPlaceholder: "Rechercher des cours...", all: "TOUS", level: "NIVEAU",
      beginner: "DÉBUTANT", intermediate: "INTERMÉDIAIRE", advanced: "AVANCÉ", expert: "EXPERT",
      startFree: "COMMENCER", enroll: "S'INSCRIRE", continue: "CONTINUER", enrolled: "INSCRIT",
      lessons: "leçons", rating: "note", students: "étudiants",
      spcOnComplete: "SPC à la fin", upload: "TÉLÉCHARGER", noResults: "Aucun cours trouvé.",
      eliteOnly: "ELITE SEULEMENT", certIncluded: "Certificat à la fin",
      yourProgress: "VOTRE PROGRESSION", completed: "complétées", lessonCompleted: "Leçon terminée",
      courseCompleted: "COURS TERMINÉ!", markDone: "MARQUER TERMINÉE", next: "SUIVANT",
      notes: "NOTES", lesson: "LEÇON", preview: "APERÇU", online: "En ligne",
      comingSoon: "Vidéo bientôt", videoSpanish: "Contenu disponible dans les notes",
      accessFree: "ACCÈS GRATUIT", beElite: "DEVENIR ELITE", enrollFirst: "COMMENCER GRATUITEMENT",
    },
    lab: {
      title: "Laboratoire VulnYX", subtitle: "Vraies machines. Vraies attaques.",
      connect: "CONNEXION VPN", startMachine: "DÉMARRER ET CONNECTER VPN", targetIp: "IP CIBLE",
      download: "TÉLÉCHARGER CONFIG OPENVPN", fullLab: "LAB COMPLET", spawning: "DÉMARRAGE...",
      active: "MACHINE ACTIVE · VPN CONNECTÉ", noVpn: "Pas de connexion VPN", vpnConfig: "CONFIG VPN",
      seeAll: "VOIR LES MACHINES", lockMsg: "CONNECTEZ-VOUS POUR VOIR", connectVpn: "CONNECTER VPN",
    },
    common: {
      loading: "Chargement...", error: "Erreur", back: "RETOUR", close: "Fermer",
      copy: "COPIER", copied: "COPIÉ!", submit: "Envoyer", cancel: "Annuler",
      save: "Sauvegarder", confirm: "Confirmer", or: "ou", and: "et", points: "pts", pwned: "pwné",
    },
  },

  pl: {
    nav: {
      home: "STRONA", lab: "LABORATORIUM", squads: "DRUŻYNY",
      streaming: "STREAMING", certifications: "CERTYFIKATY", courses: "KURSY",
      marketplace: "RYNEK", tutoring: "KOREPETYCJE", login: "ZALOGUJ",
      logout: "WYLOGUJ", register: "ZAREJESTRUJ", profile: "PROFIL",
    },
    hero: {
      badge: "Platforma #1 Etycznego Hackingu po Hiszpańsku",
      title1: "Hakuj.", title2: "Ucz się.", title3: "Dominuj.",
      subtitle: "Najbardziej kompleksowa akademia cyberbezpieczeństwa ofensywnego po hiszpańsku. Lab VulnYX, certyfikaty i społeczność.",
      cta: "ZACZNIJ ZA DARMO", ctaSecondary: "ZOBACZ LABORATORIUM",
      stat1: "Aktywne maszyny", stat2: "Uczniowie", stat3: "Kursy", stat4: "Certyfikaty",
    },
    courses: {
      pageTitle: "Naucz się Hakować. Po Hiszpańsku.", pageSubtitle: "Techniczne kursy cyberbezpieczeństwa z prawdziwymi laboratoriami.",
      available: "DOSTĘPNE KURSY", free: "DARMOWY", freeCourses: "darmowe kursy",
      paid: "STANDARDOWY", paidCourses: "kursy", elite: "ELITE", eliteCourses: "kursy exkluzywne",
      searchPlaceholder: "Szukaj kursów...", all: "WSZYSTKIE", level: "POZIOM",
      beginner: "POCZĄTKUJĄCY", intermediate: "ŚREDNIOZAAWANSOWANY", advanced: "ZAAWANSOWANY", expert: "EKSPERT",
      startFree: "ZACZNIJ", enroll: "ZAPISZ SIĘ", continue: "KONTYNUUJ", enrolled: "ZAPISANY",
      lessons: "lekcji", rating: "ocena", students: "uczniów",
      spcOnComplete: "SPC po ukończeniu", upload: "PRZEŚLIJ", noResults: "Nie znaleziono kursów.",
      eliteOnly: "TYLKO ELITE", certIncluded: "Certyfikat po ukończeniu",
      yourProgress: "TWÓJ POSTĘP", completed: "ukończone", lessonCompleted: "Lekcja ukończona",
      courseCompleted: "KURS UKOŃCZONY!", markDone: "OZNACZ JAKO UKOŃCZONA", next: "NASTĘPNA",
      notes: "NOTATKI", lesson: "LEKCJA", preview: "PODGLĄD", online: "Online",
      comingSoon: "Wideo wkrótce", videoSpanish: "Treść dostępna w notatkach",
      accessFree: "DOŁĄCZ ZA DARMO", beElite: "ZOSTAŃ ELITE", enrollFirst: "ZACZNIJ ZA DARMO",
    },
    lab: {
      title: "Laboratorium VulnYX", subtitle: "Prawdziwe maszyny. Prawdziwe ataki.",
      connect: "POŁĄCZENIE VPN", startMachine: "URUCHOM I POŁĄCZ VPN", targetIp: "IP CELU",
      download: "POBIERZ CONFIG OPENVPN", fullLab: "PEŁNE LAB", spawning: "URUCHAMIANIE...",
      active: "MASZYNA AKTYWNA · VPN POŁĄCZONY", noVpn: "Brak połączenia VPN", vpnConfig: "CONFIG VPN",
      seeAll: "ZOBACZ MASZYNY", lockMsg: "ZALOGUJ ABY ZOBACZYĆ", connectVpn: "POŁĄCZ VPN",
    },
    common: {
      loading: "Ładowanie...", error: "Błąd", back: "WRÓĆ", close: "Zamknij",
      copy: "KOPIUJ", copied: "SKOPIOWANO!", submit: "Wyślij", cancel: "Anuluj",
      save: "Zapisz", confirm: "Potwierdź", or: "lub", and: "i", points: "pkt", pwned: "pwned",
    },
  },

  ro: {
    nav: {
      home: "ACASĂ", lab: "LABORATOR", squads: "ESCADROANE",
      streaming: "STREAMING", certifications: "CERTIFICĂRI", courses: "CURSURI",
      marketplace: "PIAȚĂ", tutoring: "MENTORAT", login: "CONECTARE",
      logout: "DECONECTARE", register: "ÎNREGISTRARE", profile: "PROFIL",
    },
    hero: {
      badge: "Platforma #1 de Hacking Etic în Spaniolă",
      title1: "Hackuiește.", title2: "Învață.", title3: "Stăpânește.",
      subtitle: "Cea mai completă academie de cybersecuritate ofensivă în spaniolă. Lab VulnYX, certificări și comunitate.",
      cta: "ÎNCEPE GRATUIT", ctaSecondary: "VEZ LABORATORUL",
      stat1: "Mașini active", stat2: "Studenți", stat3: "Cursuri", stat4: "Cert. emise",
    },
    courses: {
      pageTitle: "Învață să Hackuiești. În Spaniolă.", pageSubtitle: "Cursuri tehnice de cybersecuritate ofensivă cu laboratoare reale.",
      available: "CURSURI DISPONIBILE", free: "GRATUIT", freeCourses: "cursuri gratuite",
      paid: "STANDARD", paidCourses: "cursuri", elite: "ELITE", eliteCourses: "cursuri exclusive",
      searchPlaceholder: "Caută cursuri...", all: "TOATE", level: "NIVEL",
      beginner: "ÎNCEPĂTOR", intermediate: "INTERMEDIAR", advanced: "AVANSAT", expert: "EXPERT",
      startFree: "ÎNCEPE", enroll: "ÎNSCRIE-TE", continue: "CONTINUĂ", enrolled: "ÎNSCRIS",
      lessons: "lecții", rating: "evaluare", students: "studenți",
      spcOnComplete: "SPC la finalizare", upload: "ÎNCARCĂ", noResults: "Nu s-au găsit cursuri.",
      eliteOnly: "DOAR ELITE", certIncluded: "Certificat la finalizare",
      yourProgress: "PROGRESUL TĂU", completed: "completate", lessonCompleted: "Lecție completată",
      courseCompleted: "CURS FINALIZAT!", markDone: "MARCHEAZĂ FINALIZATĂ", next: "URMĂTOR",
      notes: "NOTE", lesson: "LECȚIE", preview: "PREVIZUALIZARE", online: "Online",
      comingSoon: "Video în curând", videoSpanish: "Conținut disponibil în note",
      accessFree: "ACCES GRATUIT", beElite: "DEVINO ELITE", enrollFirst: "ÎNCEPE GRATUIT",
    },
    lab: {
      title: "Laborator VulnYX", subtitle: "Mașini reale. Atacuri reale.",
      connect: "CONEXIUNE VPN", startMachine: "PORNEȘTE ȘI CONECTEAZĂ VPN", targetIp: "IP ȚINTĂ",
      download: "DESCARCĂ CONFIG OPENVPN", fullLab: "LAB COMPLET", spawning: "PORNIRE...",
      active: "MAȘINĂ ACTIVĂ · VPN CONECTAT", noVpn: "Fără conexiune VPN", vpnConfig: "CONFIG VPN",
      seeAll: "VEZ MAȘINILE", lockMsg: "CONECTEAZĂ-TE PENTRU A VEDEA", connectVpn: "CONECTEAZĂ VPN",
    },
    common: {
      loading: "Se încarcă...", error: "Eroare", back: "ÎNAPOI", close: "Închide",
      copy: "COPIAZĂ", copied: "COPIAT!", submit: "Trimite", cancel: "Anulează",
      save: "Salvează", confirm: "Confirmă", or: "sau", and: "și", points: "pct", pwned: "pwned",
    },
  },

  sq: {
    nav: {
      home: "KRYEFAQJA", lab: "LABORATORI", squads: "SKUADRA",
      streaming: "STREAMING", certifications: "CERTIFIKIMET", courses: "KURSET",
      marketplace: "TREGU", tutoring: "TUTORIMI", login: "HYRJA",
      logout: "DIL", register: "REGJISTROHU", profile: "PROFILI",
    },
    hero: {
      badge: "Platforma #1 e Hacking Etik në Spanjisht",
      title1: "Hako.", title2: "Mëso.", title3: "Dominoje.",
      subtitle: "Akademia më e plotë e cybersigurisë ofensive në spanjisht. Lab VulnYX, certifikime dhe komunitet.",
      cta: "FILLO FALAS", ctaSecondary: "SHIKO LABORATORIN",
      stat1: "Makina aktive", stat2: "Studentë", stat3: "Kurse", stat4: "Cert. lëshuara",
    },
    courses: {
      pageTitle: "Mëso të Hakosh. Në Spanjisht.", pageSubtitle: "Kurse teknike të cybersigurisë ofensive me laboratorë realë.",
      available: "KURSET E DISPONUESHME", free: "FALAS", freeCourses: "kurse falas",
      paid: "STANDARD", paidCourses: "kurse", elite: "ELITE", eliteCourses: "kurse ekskluzive",
      searchPlaceholder: "Kërko kurse...", all: "TË GJITHA", level: "NIVELI",
      beginner: "FILLESTAR", intermediate: "I MESËM", advanced: "I AVANCUAR", expert: "EKSPERT",
      startFree: "FILLO", enroll: "REGJISTROHU", continue: "VAZHDO", enrolled: "I REGJISTRUAR",
      lessons: "mësime", rating: "vlerësim", students: "studentë",
      spcOnComplete: "SPC pas përfundimit", upload: "NGARKO", noResults: "Nuk u gjetën kurse.",
      eliteOnly: "VETËM ELITE", certIncluded: "Certifikatë pas përfundimit",
      yourProgress: "PROGRESI YT", completed: "të përfunduara", lessonCompleted: "Mësim i përfunduar",
      courseCompleted: "KURSI U PËRFUNDUA!", markDone: "SHËNO SI TË PËRFUNDUAR", next: "TJETRA",
      notes: "SHËNIME", lesson: "MËSIM", preview: "PAMJE PARAPRAKE", online: "Online",
      comingSoon: "Video së shpejti", videoSpanish: "Përmbajtja e disponueshme në shënime",
      accessFree: "HYRJE FALAS", beElite: "BËHU ELITE", enrollFirst: "FILLO FALAS",
    },
    lab: {
      title: "Laboratori VulnYX", subtitle: "Makina reale. Sulme reale.",
      connect: "LIDHJA VPN", startMachine: "FILLO DHE LIDHU VPN", targetIp: "IP I OBJEKTIVIT",
      download: "SHKARKO CONFIG OPENVPN", fullLab: "LAB I PLOTË", spawning: "PO FILLON...",
      active: "MAKINA AKTIVE · VPN LIDHUR", noVpn: "Pa lidhje VPN", vpnConfig: "CONFIG VPN",
      seeAll: "SHIKO MAKINAT", lockMsg: "HYRJE PËR TË PARË", connectVpn: "LIDHU VPN",
    },
    common: {
      loading: "Po ngarkohet...", error: "Gabim", back: "KTHEHU", close: "Mbyll",
      copy: "KOPJO", copied: "U KOPJUA!", submit: "Dërgo", cancel: "Anulo",
      save: "Ruaj", confirm: "Konfirmo", or: "ose", and: "dhe", points: "pikë", pwned: "pwned",
    },
  },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "es", setLang: () => {}, t: TRANSLATIONS.es,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("spettro_lang") as Lang | null;
    return saved && LANGUAGES.find(l => l.code === saved) ? saved : "es";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("spettro_lang", l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
