export interface Hospital {
  id: string;
  name: string;
  type: "EsSalud" | "MINSA";
  description: string;
  image: string;
  level: number;
  minScoreToUnlock: number;
}

export const HOSPITALS: Hospital[] = [
  {
    id: "rebagliati",
    name: "Hosp. Nac. Edgardo Rebagliati Martins",
    type: "EsSalud",
    description: "Nivel 1: El gigante de la seguridad social. Ideal para empezar con casos de alta complejidad pero con recursos disponibles.",
    image: "https://picsum.photos/seed/rebagliati/800/600",
    level: 1,
    minScoreToUnlock: 0,
  },
  {
    id: "almenara",
    name: "Hosp. Nac. Guillermo Almenara Irigoyen",
    type: "EsSalud",
    description: "Nivel 2: Referente en especialidades. Casos quirúrgicos y crónicos complejos.",
    image: "https://picsum.photos/seed/almenara/800/600",
    level: 2,
    minScoreToUnlock: 1000,
  },
  {
    id: "militar",
    name: "Hospital Militar Central",
    type: "MINSA",
    description: "Nivel 3: Disciplina y rigor. Casos variados con protocolos estrictos.",
    image: "https://picsum.photos/seed/militar/800/600",
    level: 3,
    minScoreToUnlock: 2500,
  },
  {
    id: "hipolito",
    name: "Hosp. Nac. Hipólito Unanue",
    type: "MINSA",
    description: "Nivel 4: 'El Bravo Chico'. Casos respiratorios y quirúrgicos de alta demanda.",
    image: "https://picsum.photos/seed/hipolito/800/600",
    level: 4,
    minScoreToUnlock: 4500,
  },
  {
    id: "cayetano",
    name: "Hosp. Nac. Cayetano Heredia",
    type: "MINSA",
    description: "Nivel 5: Investigación y academia. Casos infecciosos y tropicales desafiantes.",
    image: "https://picsum.photos/seed/cayetano/800/600",
    level: 5,
    minScoreToUnlock: 7000,
  },
  {
    id: "dosdemayo",
    name: "Hosp. Nac. Dos de Mayo",
    type: "MINSA",
    description: "Nivel 6: Cuna de la medicina. Casos clínicos clásicos con recursos limitados.",
    image: "https://picsum.photos/seed/dosdemayo/800/600",
    level: 6,
    minScoreToUnlock: 10000,
  },
  {
    id: "loayza",
    name: "Hosp. Nac. Arzobispo Loayza",
    type: "MINSA",
    description: "Nivel 7: El corazón del centro de Lima. Gran volumen de pacientes y patologías complejas.",
    image: "https://picsum.photos/seed/loayza/800/600",
    level: 7,
    minScoreToUnlock: 14000,
  },
  {
    id: "ulloa",
    name: "Hosp. de Emergencias Casimiro Ulloa",
    type: "MINSA",
    description: "Nivel 8: El desafío final. Trauma y emergencias críticas al límite.",
    image: "https://picsum.photos/seed/ulloa/800/600",
    level: 8,
    minScoreToUnlock: 20000,
  },
];

export const MEDICAL_AREAS = [
  { id: "interna", name: "Medicina Interna", icon: "Stethoscope" },
  { id: "cirugia", name: "Cirugía General", icon: "Scissors" },
  { id: "pediatria", name: "Pediatría", icon: "Baby" },
  { id: "gineco", name: "Gineco-Obstetricia", icon: "HeartPulse" },
  { id: "emergencia", name: "Emergencias", icon: "Activity" },
];
