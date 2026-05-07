"use client";

import { Flame, Star, Award } from "lucide-react";

interface Insignia {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha_obtenida: string;
}

interface PuntosWidgetProps {
  puntosTotal: number;
  rachaDias: number;
  insignias: Insignia[];
  posicionRanking: number | null;
  totalEmpleados: number;
}

export function PuntosWidget({
  puntosTotal,
  rachaDias,
  insignias,
  posicionRanking,
  totalEmpleados,
}: PuntosWidgetProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl ring-1 ring-tq-ink/10 bg-tq-paper">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-tq-gold/5 via-transparent to-tq-sky/5 pointer-events-none" />

      <div className="relative px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2 mb-4">
          <span className="w-5 h-px bg-tq-gold/70" />
          Mi progreso · Gamificación
        </p>

        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Puntos */}
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-tq-gold/15 flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-tq-gold2" fill="currentColor" />
            </div>
            <p className="font-display text-2xl text-tq-ink leading-none">{puntosTotal}</p>
            <p className="text-[10px] uppercase tracking-wider text-tq-ink/50 font-semibold mt-0.5">Puntos</p>
          </div>

          {/* Racha */}
          <div className="text-center">
            <div className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center mb-2 ${
              rachaDias >= 7 ? "bg-orange-100" : "bg-tq-ink/8"
            }`}>
              <Flame className={`w-5 h-5 ${rachaDias >= 7 ? "text-orange-500" : "text-tq-ink/30"}`}
                fill={rachaDias >= 7 ? "currentColor" : "none"} />
            </div>
            <p className="font-display text-2xl text-tq-ink leading-none">{rachaDias}</p>
            <p className="text-[10px] uppercase tracking-wider text-tq-ink/50 font-semibold mt-0.5">
              Racha días
            </p>
          </div>

          {/* Ranking */}
          <div className="text-center">
            <div className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center mb-2 ${
              posicionRanking === 1 ? "bg-tq-gold/20" : posicionRanking !== null && posicionRanking <= 3 ? "bg-tq-sky/10" : "bg-tq-ink/8"
            }`}>
              <Award className={`w-5 h-5 ${
                posicionRanking === 1 ? "text-tq-gold2" : posicionRanking !== null && posicionRanking <= 3 ? "text-tq-sky" : "text-tq-ink/30"
              }`} />
            </div>
            <p className="font-display text-2xl text-tq-ink leading-none">
              {posicionRanking !== null ? `#${posicionRanking}` : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-tq-ink/50 font-semibold mt-0.5">
              de {totalEmpleados}
            </p>
          </div>
        </div>

        {/* Badges */}
        {insignias.length > 0 && (
          <div className="border-t border-tq-ink/8 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-tq-ink/50 font-semibold mb-2">
              Logros desbloqueados
            </p>
            <div className="flex flex-wrap gap-2">
              {insignias.slice(0, 6).map((ins) => (
                <span
                  key={ins.id}
                  title={ins.descripcion ?? ins.nombre}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tq-gold/10 ring-1 ring-tq-gold/20 text-xs font-semibold text-tq-gold2"
                >
                  <Award className="w-3 h-3" />
                  {ins.nombre}
                </span>
              ))}
              {insignias.length > 6 && (
                <span className="text-xs text-tq-ink/40 self-center">
                  +{insignias.length - 6} más
                </span>
              )}
            </div>
          </div>
        )}

        {insignias.length === 0 && puntosTotal === 0 && (
          <p className="text-xs text-tq-ink/45 text-center py-2">
            Completa lecciones y exámenes para ganar puntos y desbloquear logros
          </p>
        )}
      </div>
    </section>
  );
}
