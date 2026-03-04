import { Coach, Drill, StageConfig } from '../types';
import { PASCAL_IMAGE, MELVYN_IMAGE, MOHAMMED_IMAGE, BACHIR_IMAGE } from './coachImages';

export const CONFIG: StageConfig = {
  name: "THE GRIND CAMP",
  tagline: "Travail – Rigueur – Respect",
  location: "Pernes-les-Fontaines (Vaucluse)",
  dates: "Du 3 au 7 août 2026",
  price: 240,
  maxCapacity: 38,
  contact: {
    phone: "07 66 82 23 22",
    email: "grindcamp84@gmail.com"
  },
  features: [
    "Repas du midi inclus",
    "Ensemble d'entraînement offert",
    "Tee-shirt du camp offert",
    "Sortie Wave Island offerte (Mercredi)"
  ]
};

// Helper pour choisir l'image (Base64 prioritaire, sinon Unsplash)
const getImage = (base64: string, fallback: string) => {
  return base64 && base64.length > 50 ? base64 : fallback;
};

export const COACHES: Coach[] = [
  {
    name: "Pascal Mercier",
    role: "Responsable Sportif",
  description: "Responsable du stage. Coach U13 et Séniors Ligue. Expert en lecture de jeu et développement individuel.",
    tags: ["Head Coach", "Exigence", "Mental"],
    image: getImage(PASCAL_IMAGE, "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=800&auto=format&fit=crop")
  },
  {
    name: "Melvyn Mercier",
    role: "Coach U13",
    description: "Spécialiste du développement technique chez les jeunes. Focus sur les détails qui font la différence.",
    tags: ["Technique", "Pédagogie"],
    image: getImage(MELVYN_IMAGE, "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=800&auto=format&fit=crop")
  },
  {
    name: "Mohammed Boumkar",
    role: "Intervenant Élite",
    description: "Joueur international marocain. Apporte son expérience du haut niveau et les standards professionnels.",
    tags: ["International", "Expérience Pro"],
    image: getImage(MOHAMMED_IMAGE, "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop")
  },
  {
    name: "Bachir Mila",
    role: "Coach U15 Ligue",
    description: "Expert en formation. Travaille sur l'intensité et la répétition des gestes justes.",
    tags: ["Formation", "Intensité"],
    image: getImage(BACHIR_IMAGE, "https://images.unsplash.com/photo-1518407613690-d9fc990e795f?q=80&w=800&auto=format&fit=crop")
  }
];

export const DRILLS: Drill[] = [
  { id: '1', title: "Pound Dribble Series", category: "Handle", description: "Dribble fort à hauteur de genou, focus sur le contrôle.", difficulty: 1 },
  { id: '2', title: "In & Out Cross", category: "Handle", description: "Feinte de départ et changement de direction rapide.", difficulty: 2 },
  { id: '3', title: "Pocket Dribble", category: "Handle", description: "Manipulation latérale pour protéger la balle.", difficulty: 2 },
  { id: '4', title: "Mikan Drill Inversé", category: "Finition", description: "Finition main opposée sous le cercle.", difficulty: 1 },
  { id: '5', title: "Eurostep Floater", category: "Finition", description: "Évitement du défenseur et finition haute.", difficulty: 3 },
  { id: '6', title: "Power Layup", category: "Finition", description: "Arrêt deux temps, protection de balle, finition contact.", difficulty: 2 },
  { id: '7', title: "Form Shooting", category: "Shoot", description: "Mécanique pure proche du cercle.", difficulty: 1 },
  { id: '8', title: "Elbow Jumpers", category: "Shoot", description: "Tirs à mi-distance en sortie de dribble.", difficulty: 2 },
];

export const FAQ_ITEMS = [
  { q: "Quels sont les horaires ?", a: "Accueil à partir de 9h00. Début des séances à 9h30. Fin de journée à 17h00." },
  { q: "Le repas est-il fourni ?", a: "Oui, le repas du midi est inclus dans le tarif, ainsi qu'une collation." },
  { q: "Quel équipement apporter ?", a: "Chaussures de basket (intérieur), gourde, serviette, affaires de rechange. Le maillot d'entraînement est fourni." },
  { q: "Comment se passe la sortie Wave Island ?", a: "Le transport et l'entrée sont pris en charge par le camp le mercredi après-midi." },
  { q: "Y a-t-il un niveau minimum ?", a: "Le camp est ouvert aux U11, U13, U15 et U18. Une pratique en club est recommandée pour suivre l'intensité." },
  { q: "Comment payer ?", a: "Le paiement se fera ultérieurement (virement ou chèque) pour valider l'inscription. Vous recevrez les instructions par email." },
];