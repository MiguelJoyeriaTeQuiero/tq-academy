// ─────────────────────────────────────────────────────────────
//  Planes de carrera — Te Quiero Group
//  Conexiones explícitas entre DPTs + cálculo de gap competencial
// ─────────────────────────────────────────────────────────────

import { getDPT, type DPTCompetenciaTea } from "./dpt-data";
export { getDPT };

export type NivelTea = DPTCompetenciaTea["nivel"];

export const NIVEL_SCORE: Record<NivelTea, number> = {
  Bajo: 1,
  Medio: 2,
  "Medio-Alto": 3,
  Alto: 4,
  "Muy Alto": 5,
};

export const SCORE_NIVEL: Record<number, NivelTea> = {
  1: "Bajo",
  2: "Medio",
  3: "Medio-Alto",
  4: "Alto",
  5: "Muy Alto",
};

export type CareerTrack =
  | "tienda"
  | "producto"
  | "finanzas"
  | "marketing"
  | "tecnologia"
  | "people"
  | "visual";

export interface CareerHito {
  titulo: string;
  detalle: string;
  duracion?: string; // "0-3 meses"
}

export interface CareerPath {
  slug: string; // {from}__{to}
  fromSlug: string;
  toSlug: string;
  track: CareerTrack;
  duracionEstimada: string;
  resumen: string; // 1 frase narrativa
  hitos: CareerHito[];
  cursosRecomendados: string[]; // títulos provisionales (cuando exista BBDD se enlazan por id)
  rutasAprendizaje: string[]; // títulos provisionales
  requisitosClave: string[]; // gates explícitos
}

// ─────────────────────────────────────────────────────────────
//  Catálogo de planes — definidos a mano sobre el grafo de DPTs
// ─────────────────────────────────────────────────────────────

export const CAREER_PATHS: CareerPath[] = [
  // ── Tienda / Retail ──────────────────────────────────────
  {
    slug: "dependiente__manager-zona",
    fromSlug: "dependiente",
    toSlug: "manager-zona",
    track: "tienda",
    duracionEstimada: "18-30 meses",
    resumen:
      "Del mostrador a liderar varias tiendas: el camino retail más transitado en Te Quiero.",
    hitos: [
      {
        titulo: "Excelencia en venta consultiva",
        detalle:
          "Dominar las cinco fases de la venta TQ y sostener KPI de tienda durante dos trimestres consecutivos.",
        duracion: "0-6 meses",
      },
      {
        titulo: "Referente de tienda",
        detalle:
          "Acompañar a nuevas incorporaciones, abrir/cerrar tienda y representar al equipo en visitas regionales.",
        duracion: "6-12 meses",
      },
      {
        titulo: "Gestión operativa básica",
        detalle:
          "Inventarios, cuadrantes, control de stock y resolución de incidencias con central.",
        duracion: "12-18 meses",
      },
      {
        titulo: "Liderazgo de zona en prácticas",
        detalle:
          "Acompañamiento al Manager de Zona en visitas, reporting y plan de acción de 2-3 tiendas.",
        duracion: "18-24 meses",
      },
    ],
    cursosRecomendados: [
      "Venta consultiva TQ",
      "Producto: diamante, oro y plata",
      "Liderazgo de tienda",
      "KPI y reporting de retail",
    ],
    rutasAprendizaje: ["Ruta Retail · Nivel 1", "Ruta Retail · Nivel 2"],
    requisitosClave: [
      "Mínimo 12 meses como Dependiente con evaluación positiva",
      "Disponibilidad para movilidad entre tiendas de la zona",
      "Recomendación expresa del Manager de Zona actual",
    ],
  },
  {
    slug: "manager-zona__manager-regional",
    fromSlug: "manager-zona",
    toSlug: "manager-regional",
    track: "tienda",
    duracionEstimada: "24-36 meses",
    resumen:
      "Pasar de coordinar zona a liderar región: visión de negocio, expansión y desarrollo de Managers.",
    hitos: [
      {
        titulo: "Resultados sostenidos",
        detalle:
          "Cumplimiento de objetivos comerciales y de NPS durante 4 trimestres consecutivos.",
        duracion: "0-12 meses",
      },
      {
        titulo: "Proyectos transversales",
        detalle:
          "Liderar al menos un proyecto de grupo (apertura, reforma, lanzamiento de marca).",
        duracion: "12-24 meses",
      },
      {
        titulo: "Desarrollo de talento",
        detalle:
          "Promocionar internamente al menos un Dependiente a Manager de Zona.",
        duracion: "12-24 meses",
      },
      {
        titulo: "Visión regional",
        detalle:
          "Co-construir con Dirección el plan estratégico de la región y defender presupuesto.",
        duracion: "24-36 meses",
      },
    ],
    cursosRecomendados: [
      "Dirección de personas",
      "Análisis financiero para retail",
      "Negociación con propietarios y centros comerciales",
      "Expansión y aperturas",
    ],
    rutasAprendizaje: ["Ruta Retail · Nivel 3", "Ruta Liderazgo TQ"],
    requisitosClave: [
      "Mínimo 24 meses como Manager de Zona",
      "Inglés B2 acreditado",
      "Evaluación 360º positiva por equipo y dirección",
    ],
  },

  // ── Producto ─────────────────────────────────────────────
  {
    slug: "stock-specialist__procurement-specialist",
    fromSlug: "stock-specialist",
    toSlug: "procurement-specialist",
    track: "producto",
    duracionEstimada: "12-18 meses",
    resumen:
      "Del control de stock a la negociación con proveedores: dominar la cadena de aprovisionamiento.",
    hitos: [
      {
        titulo: "Análisis avanzado de rotación",
        detalle:
          "Construir reporting propio de cobertura, mermas y rotura de stock en Power BI.",
        duracion: "0-6 meses",
      },
      {
        titulo: "Acompañamiento a compras",
        detalle:
          "Participar en negociaciones reales con dos proveedores estratégicos.",
        duracion: "6-12 meses",
      },
      {
        titulo: "Proyecto de aprovisionamiento",
        detalle:
          "Liderar la propuesta de compra de una temporada bajo supervisión.",
        duracion: "12-18 meses",
      },
    ],
    cursosRecomendados: [
      "Compras internacionales",
      "Negociación con proveedores",
      "Excel avanzado y Power BI",
      "Gemología básica",
    ],
    rutasAprendizaje: ["Ruta Producto · Aprovisionamiento"],
    requisitosClave: [
      "Mínimo 12 meses como Stock Specialist",
      "Inglés B1 (B2 deseable)",
    ],
  },
  {
    slug: "stock-specialist__product-specialist",
    fromSlug: "stock-specialist",
    toSlug: "product-specialist",
    track: "producto",
    duracionEstimada: "12-18 meses",
    resumen:
      "Del stock al análisis estratégico del catálogo: rentabilidad, mix y vida del producto.",
    hitos: [
      {
        titulo: "Dominio del ciclo de vida",
        detalle:
          "Analizar altas, bajas y rotación por familia durante dos temporadas completas.",
        duracion: "0-6 meses",
      },
      {
        titulo: "Análisis de rentabilidad",
        detalle:
          "Construir cuadros de margen por línea y proponer ajustes de mix.",
        duracion: "6-12 meses",
      },
      {
        titulo: "Proyecto de optimización",
        detalle:
          "Defender ante el Director de Producto un plan de simplificación o expansión de catálogo.",
        duracion: "12-18 meses",
      },
    ],
    cursosRecomendados: [
      "Análisis de catálogo y rentabilidad",
      "Pricing y margen comercial",
      "Power BI para producto",
    ],
    rutasAprendizaje: ["Ruta Producto · Catálogo y rentabilidad"],
    requisitosClave: [
      "Mínimo 12 meses como Stock Specialist",
      "Manejo avanzado de Excel y BI",
    ],
  },
  {
    slug: "product-specialist__director-producto",
    fromSlug: "product-specialist",
    toSlug: "director-producto",
    track: "producto",
    duracionEstimada: "36-60 meses",
    resumen:
      "El salto a la dirección del área: visión de marca, gestión de equipo y rentabilidad global.",
    hitos: [
      {
        titulo: "Dominio del mix completo",
        detalle:
          "Conocer en profundidad las tres marcas del grupo y su posicionamiento.",
        duracion: "0-12 meses",
      },
      {
        titulo: "Liderazgo de proyecto estratégico",
        detalle:
          "Llevar de extremo a extremo el lanzamiento de una nueva marca, línea o categoría.",
        duracion: "12-24 meses",
      },
      {
        titulo: "Gestión de equipo",
        detalle:
          "Coordinar dos perfiles del área (Specialist o Coordinator) con responsabilidad sobre objetivos.",
        duracion: "24-36 meses",
      },
      {
        titulo: "Visión de comité",
        detalle:
          "Defender plan de producto ante dirección con visión multianual.",
        duracion: "36-60 meses",
      },
    ],
    cursosRecomendados: [
      "Dirección estratégica",
      "Liderazgo de equipos",
      "Finanzas para no financieros",
      "Storytelling de marca",
    ],
    rutasAprendizaje: ["Ruta Liderazgo TQ", "Ruta Producto · Estrategia"],
    requisitosClave: [
      "Mínimo 3 años como Product Specialist o equivalente",
      "Inglés B2",
      "Experiencia liderando proyecto transversal",
    ],
  },
  {
    slug: "proyect-coordinator__director-producto",
    fromSlug: "proyect-coordinator",
    toSlug: "director-producto",
    track: "producto",
    duracionEstimada: "36-48 meses",
    resumen:
      "Coordinar proyectos del área hasta dirigirla: liderazgo + visión comercial + cuenta de resultados.",
    hitos: [
      {
        titulo: "Cierre con éxito de proyectos clave",
        detalle: "Entregar tres proyectos de alcance grupal en plazo y presupuesto.",
        duracion: "0-12 meses",
      },
      {
        titulo: "Especialización comercial",
        detalle:
          "Asumir responsabilidad sobre P&L de una línea de producto.",
        duracion: "12-24 meses",
      },
      {
        titulo: "Construcción de equipo",
        detalle: "Definir y reclutar perfiles necesarios para escalar el área.",
        duracion: "24-36 meses",
      },
    ],
    cursosRecomendados: [
      "Dirección estratégica",
      "P&L y gestión presupuestaria",
      "Liderazgo avanzado",
    ],
    rutasAprendizaje: ["Ruta Liderazgo TQ"],
    requisitosClave: [
      "Mínimo 3 años como Proyect Coordinator",
      "Inglés B2",
    ],
  },
  {
    slug: "specialist-ecommerce__director-producto",
    fromSlug: "specialist-ecommerce",
    toSlug: "director-producto",
    track: "producto",
    duracionEstimada: "48-72 meses",
    resumen:
      "Camino digital-first hacia la dirección: el ecommerce como puerta a la visión global de producto.",
    hitos: [
      {
        titulo: "Dominio del canal digital",
        detalle:
          "Asumir la responsabilidad sobre la cuenta de resultados online.",
        duracion: "0-18 meses",
      },
      {
        titulo: "Conexión con tienda física",
        detalle:
          "Liderar un proyecto omnicanal con impacto medible en NPS.",
        duracion: "18-36 meses",
      },
      {
        titulo: "Visión de catálogo total",
        detalle:
          "Pasar de digital a producto-marca, integrando offline y online.",
        duracion: "36-60 meses",
      },
    ],
    cursosRecomendados: [
      "CRO y analítica avanzada",
      "Estrategia omnicanal",
      "Dirección estratégica",
    ],
    rutasAprendizaje: ["Ruta Producto · Digital", "Ruta Liderazgo TQ"],
    requisitosClave: [
      "Mínimo 3 años como Specialist Ecommerce",
      "Inglés B2",
    ],
  },

  // ── Finanzas ─────────────────────────────────────────────
  {
    slug: "tecnico-contabilidad__oficial-contabilidad",
    fromSlug: "tecnico-contabilidad",
    toSlug: "oficial-contabilidad",
    track: "finanzas",
    duracionEstimada: "12-18 meses",
    resumen:
      "Consolidar la base contable y asumir cierres complejos con autonomía.",
    hitos: [
      {
        titulo: "Autonomía en ciclo contable",
        detalle:
          "Cerrar mes a mes sin supervisión y resolver discrepancias.",
        duracion: "0-6 meses",
      },
      {
        titulo: "Especialización fiscal",
        detalle:
          "Liderar la preparación de un IVA trimestral y modelo anual.",
        duracion: "6-12 meses",
      },
      {
        titulo: "Acompañamiento de auditoría",
        detalle:
          "Ser referente del equipo en una auditoría externa.",
        duracion: "12-18 meses",
      },
    ],
    cursosRecomendados: [
      "Fiscalidad avanzada",
      "Cierre contable y conciliaciones",
      "Excel financiero",
    ],
    rutasAprendizaje: ["Ruta Finanzas · Contabilidad"],
    requisitosClave: [
      "Mínimo 12 meses como Técnico en Contabilidad",
      "Conocimiento sólido de Plan General Contable",
    ],
  },
  {
    slug: "oficial-contabilidad__director-financiero",
    fromSlug: "oficial-contabilidad",
    toSlug: "director-financiero",
    track: "finanzas",
    duracionEstimada: "60-96 meses",
    resumen:
      "El recorrido completo del área financiera, de la operativa diaria a la dirección estratégica.",
    hitos: [
      {
        titulo: "Visión de control de gestión",
        detalle:
          "Asumir reporting analítico y desviaciones presupuestarias.",
        duracion: "0-18 meses",
      },
      {
        titulo: "Tesorería y financiación",
        detalle:
          "Llevar la relación con bancos y previsiones de caja.",
        duracion: "18-36 meses",
      },
      {
        titulo: "Estrategia y comité",
        detalle:
          "Acompañar a la Dirección Financiera en consejo y planes a 3 años.",
        duracion: "36-72 meses",
      },
    ],
    cursosRecomendados: [
      "Control de gestión",
      "Tesorería corporativa",
      "Dirección financiera",
      "Inglés financiero",
    ],
    rutasAprendizaje: ["Ruta Finanzas · Dirección"],
    requisitosClave: [
      "Mínimo 5 años como Oficial de Contabilidad",
      "Grado en ADE / Económicas",
      "Inglés B2",
    ],
  },

  // ── Visual / Marketing ───────────────────────────────────
  {
    slug: "visual-merchandiser__director-marketing",
    fromSlug: "visual-merchandiser",
    toSlug: "director-marketing",
    track: "marketing",
    duracionEstimada: "60-84 meses",
    resumen:
      "De la imagen en tienda al liderazgo de la marca: un puente natural cuando se asume el storytelling completo.",
    hitos: [
      {
        titulo: "Manual visual corporativo",
        detalle:
          "Liderar la elaboración del manual de visual merchandising del grupo.",
        duracion: "0-18 meses",
      },
      {
        titulo: "Marca completa",
        detalle:
          "Asumir campañas integrales (visual + comunicación + digital).",
        duracion: "18-36 meses",
      },
      {
        titulo: "Estrategia de marca",
        detalle:
          "Co-liderar el plan anual de marketing junto a la dirección.",
        duracion: "36-60 meses",
      },
    ],
    cursosRecomendados: [
      "Branding y estrategia de marca",
      "Marketing digital",
      "Dirección creativa",
    ],
    rutasAprendizaje: ["Ruta Marca", "Ruta Liderazgo TQ"],
    requisitosClave: [
      "Mínimo 4 años como Visual Merchandiser",
      "Portfolio de campañas con resultados medibles",
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

export function getPath(slug: string): CareerPath | undefined {
  return CAREER_PATHS.find((p) => p.slug === slug);
}

export function getPathsFrom(slug: string): CareerPath[] {
  return CAREER_PATHS.filter((p) => p.fromSlug === slug);
}

export function getPathsTo(slug: string): CareerPath[] {
  return CAREER_PATHS.filter((p) => p.toSlug === slug);
}

export interface CompetenciaTeaDelta {
  area: string;
  competencia: string;
  fromNivel: NivelTea | null;
  toNivel: NivelTea;
  delta: number; // toScore - fromScore (>=1)
  justificacion: string;
}

export interface CareerGap {
  tecnicasNuevas: string[]; // técnicas que aparecen en destino y no en origen
  teaDeltas: CompetenciaTeaDelta[]; // competencias TEA que suben o son nuevas
  formacionNueva: string[];
  herramientasNuevas: string[];
}

function teaKey(c: { area: string; competencia: string }) {
  return `${c.area}::${c.competencia}`;
}

export function computeGap(fromSlug: string, toSlug: string): CareerGap | null {
  const from = getDPT(fromSlug);
  const to = getDPT(toSlug);
  if (!from || !to) return null;

  const fromTec = new Set(from.competenciasTecnicas);
  const tecnicasNuevas = to.competenciasTecnicas.filter((c) => !fromTec.has(c));

  const fromTeaMap = new Map(from.competenciasTea.map((c) => [teaKey(c), c]));
  const teaDeltas: CompetenciaTeaDelta[] = [];
  for (const t of to.competenciasTea) {
    const k = teaKey(t);
    const f = fromTeaMap.get(k);
    const fromScore = f ? NIVEL_SCORE[f.nivel] : 0;
    const toScore = NIVEL_SCORE[t.nivel];
    if (toScore > fromScore) {
      teaDeltas.push({
        area: t.area,
        competencia: t.competencia,
        fromNivel: f ? f.nivel : null,
        toNivel: t.nivel,
        delta: toScore - fromScore,
        justificacion: t.justificacion,
      });
    }
  }
  teaDeltas.sort((a, b) => b.delta - a.delta);

  const fromForm = new Set(from.requisitos.formacion);
  const formacionNueva = to.requisitos.formacion.filter((f) => !fromForm.has(f));

  const fromHerr = new Set(from.requisitos.herramientas ?? []);
  const herramientasNuevas = (to.requisitos.herramientas ?? []).filter(
    (h) => !fromHerr.has(h),
  );

  return { tecnicasNuevas, teaDeltas, formacionNueva, herramientasNuevas };
}

// ─────────────────────────────────────────────────────────────
//  Agrupaciones para vistas
// ─────────────────────────────────────────────────────────────

export const TRACK_LABEL: Record<CareerTrack, string> = {
  tienda: "Retail · Tienda",
  producto: "Producto",
  finanzas: "Finanzas",
  marketing: "Marca y marketing",
  tecnologia: "Tecnología",
  people: "People & Culture",
  visual: "Visual",
};

export const TRACK_ACCENT: Record<CareerTrack, string> = {
  tienda: "tq-sky",
  producto: "tq-gold",
  finanzas: "emerald-600",
  marketing: "tq-gold",
  tecnologia: "tq-sky",
  people: "tq-ink",
  visual: "tq-gold",
};

export function getPathsByTrack(): Record<CareerTrack, CareerPath[]> {
  const out = {} as Record<CareerTrack, CareerPath[]>;
  for (const p of CAREER_PATHS) {
    (out[p.track] ??= []).push(p);
  }
  return out;
}
