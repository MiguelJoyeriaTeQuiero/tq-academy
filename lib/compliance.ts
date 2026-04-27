export type ComplianceStatus =
  | "completado"
  | "en_curso"
  | "pendiente"
  | "en_riesgo"
  | "vencido";

export const RIESGO_UMBRAL_DIAS = 7;

export interface ComplianceInput {
  obligatorio: boolean;
  fecha_limite: string | null;
  completado: boolean;
  porcentaje: number;
}

/** Días completos entre hoy (00:00 local) y la fecha límite. */
export function diasHasta(fechaISO: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(fechaISO);
  fin.setHours(0, 0, 0, 0);
  const ms = fin.getTime() - hoy.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function computeComplianceStatus(input: ComplianceInput): ComplianceStatus {
  if (input.completado) return "completado";
  if (!input.fecha_limite) {
    return input.porcentaje > 0 ? "en_curso" : "pendiente";
  }
  const dias = diasHasta(input.fecha_limite);
  if (dias < 0) return "vencido";
  if (dias <= RIESGO_UMBRAL_DIAS) return "en_riesgo";
  return input.porcentaje > 0 ? "en_curso" : "pendiente";
}

export const STATUS_META: Record<
  ComplianceStatus,
  { label: string; className: string; tone: "green" | "blue" | "gray" | "amber" | "red" }
> = {
  completado: {
    label: "Completado",
    className: "bg-emerald-100 text-emerald-700",
    tone: "green",
  },
  en_curso: {
    label: "En curso",
    className: "bg-sky-100 text-sky-700",
    tone: "blue",
  },
  pendiente: {
    label: "Sin iniciar",
    className: "bg-gray-100 text-gray-700",
    tone: "gray",
  },
  en_riesgo: {
    label: "En riesgo",
    className: "bg-amber-100 text-amber-800",
    tone: "amber",
  },
  vencido: {
    label: "Vencido",
    className: "bg-red-100 text-red-700",
    tone: "red",
  },
};

export interface ComplianceCounts {
  total: number;
  completado: number;
  en_curso: number;
  pendiente: number;
  en_riesgo: number;
  vencido: number;
}

export function emptyCounts(): ComplianceCounts {
  return {
    total: 0,
    completado: 0,
    en_curso: 0,
    pendiente: 0,
    en_riesgo: 0,
    vencido: 0,
  };
}

export function incrementCounts(
  counts: ComplianceCounts,
  status: ComplianceStatus,
): void {
  counts.total++;
  counts[status]++;
}
