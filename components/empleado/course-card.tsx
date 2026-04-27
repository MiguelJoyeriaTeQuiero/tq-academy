import Link from "next/link";
import {
  BookOpen,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { computeComplianceStatus, diasHasta } from "@/lib/compliance";
import type { ProgresoCurso } from "@/types/database";

interface CourseCardProps {
  curso: {
    id: string;
    titulo: string;
    descripcion: string | null;
    imagen_url: string | null;
  };
  progreso?: ProgresoCurso | null;
  fechaLimite?: string | null;
  obligatorio?: boolean;
  showEnrollButton?: boolean;
  onEnroll?: () => void;
}

export function CourseCard({
  curso,
  progreso,
  fechaLimite,
  obligatorio = false,
}: CourseCardProps) {
  const porcentaje = progreso?.porcentaje ?? 0;
  const completado = progreso?.completado ?? false;
  const iniciado = porcentaje > 0;

  const status = computeComplianceStatus({
    obligatorio,
    fecha_limite: fechaLimite ?? null,
    completado,
    porcentaje,
  });
  const isVencida = status === "vencido";
  const isRiesgo = status === "en_riesgo";
  const diasRestantes = fechaLimite ? diasHasta(fechaLimite) : null;

  const estadoLabel = completado
    ? "Completado"
    : iniciado
      ? "En curso"
      : "No iniciado";

  return (
    <Link
      href={`/dashboard/empleado/cursos/${curso.id}`}
      className="group relative block h-full rounded-2xl bg-tq-paper ring-1 ring-tq-ink/10 hover:ring-tq-gold/60 hover:shadow-tq-gold transition-all overflow-hidden"
    >
      {/* Imagen / hero */}
      <div className="relative h-40 overflow-hidden">
        {curso.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={curso.imagen_url}
            alt={curso.titulo}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-tq-sky via-[#0066B0] to-tq-ink flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/40" />
          </div>
        )}
        {/* Overlay degradado para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-tq-ink/75 via-tq-ink/15 to-transparent" />

        {/* Filete dorado */}
        <div className="absolute left-4 right-4 bottom-0 h-px bg-gradient-to-r from-transparent via-tq-gold/70 to-transparent" />

        {/* Badges flotantes */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ring-1 ${
              completado
                ? "bg-tq-gold text-tq-ink ring-tq-gold/60 shadow-tq-gold"
                : iniciado
                  ? "bg-white/15 text-white ring-white/30"
                  : "bg-white/10 text-white/85 ring-white/20"
            }`}
          >
            {completado ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : iniciado ? (
              <PlayCircle className="w-3 h-3" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {estadoLabel}
          </span>

          {obligatorio && !completado && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full bg-rose-500/95 text-white ring-1 ring-rose-300/50 shadow-md">
              Obligatorio
            </span>
          )}
        </div>

        {/* % grande inferior si iniciado */}
        {iniciado && (
          <div className="absolute bottom-3 right-4 text-right">
            <p className="font-display text-3xl text-white leading-none drop-shadow-md">
              {porcentaje}
              <span className="text-tq-gold">%</span>
            </p>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 pb-4 flex flex-col gap-3">
        <div className="min-h-[3.5rem]">
          <h3 className="font-display text-lg leading-snug text-tq-ink line-clamp-2 group-hover:text-tq-sky transition-colors">
            {curso.titulo}
          </h3>
          {curso.descripcion && (
            <p className="text-xs text-tq-ink/60 mt-1.5 line-clamp-2 leading-relaxed">
              {curso.descripcion}
            </p>
          )}
        </div>

        {/* Barra de progreso refinada */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-tq-ink/55">
              Progreso
            </span>
            <span className="text-[11px] font-semibold text-tq-ink/75">
              {porcentaje}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-tq-ink/8 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completado
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  : "bg-gradient-to-r from-tq-sky to-tq-gold"
              }`}
              style={{ width: `${Math.max(porcentaje, completado ? 100 : 0)}%` }}
            />
          </div>
        </div>

        {/* Fecha límite */}
        {fechaLimite && (
          <div
            className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg ring-1 ${
              isVencida
                ? "bg-rose-50 text-rose-700 ring-rose-200"
                : isRiesgo
                  ? "bg-amber-50 text-amber-800 ring-amber-200"
                  : "bg-tq-ink/[0.04] text-tq-ink/70 ring-tq-ink/8"
            }`}
          >
            {isVencida ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : isRiesgo ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-tq-gold/90" />
            )}
            <span className="truncate">
              {isVencida
                ? "Vencido · "
                : isRiesgo && diasRestantes !== null
                  ? `Vence en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"} · `
                  : "Límite "}
              {formatDate(fechaLimite)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
