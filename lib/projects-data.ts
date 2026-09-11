export const defaultProjects = [
  {
    slug: "fidapp",
    title: "FidApp",
    year: "2025",
    status: "live",
    sector: "Retail · fidélité digitale",
    sectorEn: "Retail · digital loyalty",
    summary:
      "Programme de fidélité sans application à télécharger : le client scanne un QR, cumule des visites, le commerçant pilote tout depuis un dashboard. Quatre apps en production au Maroc.",
    summaryEn:
      "Loyalty with no app download: customers scan a QR, collect visits, merchants run everything from a dashboard. Four apps live in Morocco.",
    stack: "React · Node.js · PostgreSQL · Prisma · PWA",
    image: "/assets/shot-fidapp.png",
    gallery: JSON.stringify(["/assets/shot-fidapp.png"]),
    problem:
      "Restaurants, cafés et salons perdaient leurs habitués faute de carte physique et refusaient d’imposer une app à leurs clients.",
    problemEn:
      "Restaurants, cafés and salons were losing regulars without a physical card, and would not force customers to install an app.",
    solution:
      "PWA client + QR à rotation anti-fraude, dashboard commerçant, panel admin et API REST dans un même monorepo — déployé et maintenu en production.",
    solutionEn:
      "Client PWA + rotating anti-fraud QR, merchant dashboard, admin panel and REST API in one monorepo — shipped and kept in production.",
    result: "4 applications live, utilisées au quotidien par des commerces marocains.",
    resultEn: "4 live applications, used daily by Moroccan businesses.",
    featured: true,
    published: true,
    sortOrder: 1,
  },
  {
    slug: "foodgroup-erp",
    title: "Entrepôt ERP/CRM — Food Group Trading",
    year: "2025",
    status: "mission",
    sector: "Distribution · data / ERP",
    sectorEn: "Distribution · data / ERP",
    summary:
      "Remise en ordre d’un ERP Dynamics 365 BC sans documentation : 77 tables cartographiées, pipelines ETL et reporting Power BI pour ventes, stock, CRM, RH et finance.",
    summaryEn:
      "Brought order to an undocumented Dynamics 365 BC ERP: 77 tables mapped, ETL pipelines and Power BI reporting for sales, stock, CRM, HR and finance.",
    stack: "SQL Server · n8n · Power BI · T-SQL · Dynamics 365 BC",
    image: "",
    gallery: "[]",
    problem:
      "Les équipes décidaient à l’aveugle : le schéma ERP/CRM n’était pas documenté, les sources étaient éclatées (SQL, Excel, HTML, API).",
    problemEn:
      "Teams were flying blind: the ERP/CRM schema was undocumented and sources were split across SQL, Excel, HTML and APIs.",
    solution:
      "Documentation métier des 77 tables, pipelines n8n de consolidation, transformations T-SQL et dashboards Power BI / DAX.",
    solutionEn:
      "Business documentation of 77 tables, n8n consolidation pipelines, T-SQL transforms and Power BI / DAX dashboards.",
    result: "Une base unique et lisible pour le reporting et les décisions opérationnelles.",
    resultEn: "A single readable base for reporting and operational decisions.",
    featured: false,
    published: true,
    sortOrder: 2,
  },
  {
    slug: "2rparts",
    title: "2R Parts — Gestion auto accessoires",
    year: "2025",
    status: "prod",
    sector: "Distribution auto · desktop",
    sectorEn: "Auto distribution · desktop",
    summary:
      "Logiciel de comptoir pour un distributeur de pièces auto : caisse, stock, crédit client, fournisseurs, factures PDF et reporting — pensé pour la vitesse au clavier.",
    summaryEn:
      "Counter software for an auto-parts distributor: POS, stock, customer credit, suppliers, PDF invoices and reporting — built for keyboard speed.",
    stack: "Python · PyQt5 · SQLite · SQLAlchemy · ReportLab",
    image: "/assets/shot-2rparts.png",
    gallery: JSON.stringify(["/assets/shot-2rparts.png"]),
    problem:
      "Le magasin tournait encore sur Excel et du papier : ventes lentes, stock approximatif, crédit client difficile à suivre.",
    problemEn:
      "The shop still ran on Excel and paper: slow sales, approximate stock, customer credit hard to track.",
    solution:
      "Application Windows complète : POS, stock, fournisseurs, crédit, factures PDF, reporting financier et sauvegardes.",
    solutionEn:
      "Full Windows app: POS, stock, suppliers, credit, PDF invoices, financial reporting and backups.",
    result: "Livré et utilisé en production au comptoir, tous les jours.",
    resultEn: "Shipped and used in production at the counter, every day.",
    featured: false,
    published: true,
    sortOrder: 3,
  },
  {
    slug: "jobgate",
    title: "JobGate — studio d’entretien vidéo",
    year: "2025",
    status: "mission",
    sector: "Recrutement · plateforme",
    sectorEn: "Recruitment · platform",
    summary:
      "Backend d’une plateforme de recrutement : studio vidéo WebRTC, authentification multi-fournisseurs, candidatures et files asynchrones Celery/Redis.",
    summaryEn:
      "Recruitment platform backend: WebRTC video studio, multi-provider auth, applications and async Celery/Redis queues.",
    stack: "Django · WebRTC · PostgreSQL · Celery · Redis",
    image: "",
    gallery: "[]",
    problem:
      "Un CV PDF ne suffit plus : les recruteurs avaient besoin de voir le candidat, sans multiplier les outils.",
    problemEn:
      "A PDF CV is no longer enough: recruiters needed to see the candidate without juggling extra tools.",
    solution:
      "Studio d’entretien intégré à la plateforme, auth multi-fournisseurs, gestion des offres/candidatures et tâches asynchrones.",
    solutionEn:
      "Interview studio built into the platform, multi-provider auth, jobs/applications management and async tasks.",
    result: "Module backend livré et intégré à la plateforme JobGate.",
    resultEn: "Backend module delivered and integrated into the JobGate platform.",
    featured: false,
    published: true,
    sortOrder: 4,
  },
  {
    slug: "timetrack-pro",
    title: "TimeTrack Pro",
    year: "2024",
    status: "delivered",
    sector: "RH · pointage B2B",
    sectorEn: "HR · B2B time tracking",
    summary:
      "Pointage employés par géolocalisation et QR dynamiques, avec dashboards RH et reporting opérationnel pour les équipes terrain.",
    summaryEn:
      "Employee time tracking via geolocation and dynamic QR codes, with HR dashboards and operational reporting for field teams.",
    stack: "Next.js · React · TypeScript · Firebase · Tailwind",
    image: "",
    gallery: "[]",
    problem:
      "Le pointage papier ou WhatsApp ne tenait pas sur le terrain : absences floues, pas de preuve de présence, reporting RH trop tardif.",
    problemEn:
      "Paper or WhatsApp attendance did not hold in the field: unclear absences, no proof of presence, HR reporting too late.",
    solution:
      "SaaS B2B avec geofencing GPS, QR dynamiques, dashboards employés/RH et volet financier.",
    solutionEn:
      "B2B SaaS with GPS geofencing, dynamic QR, employee/HR dashboards and a financial layer.",
    result: "Système livré, audité, prêt à industrialiser le pointage d’équipes mobiles.",
    resultEn: "System delivered and audited, ready to industrialize mobile-team attendance.",
    featured: false,
    published: true,
    sortOrder: 5,
  },
  {
    slug: "optigest",
    title: "Opti Gest",
    year: "2025",
    status: "delivered",
    sector: "Optique · Windows / Mac",
    sectorEn: "Optics · Windows / Mac",
    summary:
      "Application desktop pour magasin d’optique : clients, ordonnances, devis et factures PDF, mutuelles CNOPS/CNSS, catalogue et rappels WhatsApp/SMS. Données en local.",
    summaryEn:
      "Desktop app for optical shops: clients, prescriptions, quotes and PDF invoices, CNOPS/CNSS mutuals, catalog and WhatsApp/SMS reminders. Data stays local.",
    stack: "Electron · React · Express · Prisma · SQLite",
    image: "/assets/shot-optigest.png",
    gallery: JSON.stringify(["/assets/shot-optigest.png"]),
    problem:
      "Le magasin gérait clients, mutuelles et rappels dans Excel : erreurs, retards, et aucune vue d’ensemble le jour J.",
    problemEn:
      "The shop managed clients, mutuals and reminders in Excel: errors, delays, and no overview on the day.",
    solution:
      "App Windows et Mac hors-ligne : fiches clients, ordonnances, devis/factures, suivi mutuelles et rappels automatiques.",
    solutionEn:
      "Offline Windows and Mac app: client files, prescriptions, quotes/invoices, mutual follow-up and automatic reminders.",
    result: "Logiciel livré pour le magasin, données stockées en local (SQLite).",
    resultEn: "Software delivered for the shop, data stored locally (SQLite).",
    featured: false,
    published: true,
    sortOrder: 6,
  },
  {
    slug: "gpsi",
    title: "GPSI — parc & support IT",
    year: "2026",
    status: "mission",
    sector: "IT interne · Food Group Trading",
    sectorEn: "Internal IT · Food Group Trading",
    summary:
      "Gestion de parc et service desk : inventaire des équipements, tickets avec SLA, trois rôles (admin, technicien, utilisateur) et copilote IA local (Ollama).",
    summaryEn:
      "IT asset management and service desk: equipment inventory, SLA tickets, three roles (admin, technician, user) and a local AI copilot (Ollama).",
    stack: "Laravel · Inertia · React · TypeScript · PostgreSQL",
    image: "",
    gallery: "[]",
    problem:
      "Le parc machines et les demandes de support n’étaient pas structurés : pas de SLA clair, pas de rôles, historique difficile à retrouver.",
    problemEn:
      "The machine fleet and support requests were unstructured: no clear SLA, no roles, history hard to retrieve.",
    solution:
      "MVP interne : inventaire, tickets SLA, rôles, et copilote IA (Ollama) avec repli heuristique si le modèle local est indisponible.",
    solutionEn:
      "Internal MVP: inventory, SLA tickets, roles, and an AI copilot (Ollama) with a heuristic fallback if the local model is down.",
    result: "MVP livré en mission interne, prêt à être étendu.",
    resultEn: "MVP delivered on an internal mission, ready to be extended.",
    featured: false,
    published: true,
    sortOrder: 7,
  },
  {
    slug: "gestipro",
    title: "GestiPro",
    year: "2026",
    status: "wip",
    sector: "SaaS multi-tenant · commerces",
    sectorEn: "Multi-tenant SaaS · retail",
    summary:
      "Plateforme multi-tenant pour restaurants, dépôts et boutiques : opérations du jour, stock et parcours métier — en construction.",
    summaryEn:
      "Multi-tenant platform for restaurants, warehouses and shops: daily ops, stock and business workflows — currently in build.",
    stack: "Next.js · Supabase · Vercel",
    image: "",
    gallery: "[]",
    problem:
      "Les petits commerces jonglent entre caisse, stock et WhatsApp, sans un outil commun à plusieurs points de vente.",
    problemEn:
      "Small shops juggle POS, stock and WhatsApp, with no shared tool across several points of sale.",
    solution:
      "SaaS multi-tenant en cours de construction : opérations quotidiennes, stock, parcours métier par type de commerce.",
    solutionEn:
      "Multi-tenant SaaS under construction: daily operations, stock, workflows by business type.",
    result: "Produit en développement — prochaine vague de livraisons.",
    resultEn: "Product in development — next wave of deliveries.",
    featured: false,
    published: true,
    sortOrder: 8,
  },
];
