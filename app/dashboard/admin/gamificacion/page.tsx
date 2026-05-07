import { createClient } from "@/lib/supabase/server";
import { Star, Flame, Award, Trophy } from "lucide-react";
import { VisitasSubnav } from "@/components/visitas/visitas-subnav";
import { NuevaInsigniaButton, InsigniaCard } from "@/components/gamificacion/insignia-form-dialog";
import type { Insignia } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function GamificacionPage() {
  const supabase = createClient();

  const { data: ranking } = await supabase
    .from("puntos")
    .select(`
      usuario_id, puntos_total, racha_dias, ultima_actividad,
      profile:profiles(nombre, apellido, avatar_url, tienda_id,
        tienda:tiendas(nombre))
    `)
    .order("puntos_total", { ascending: false })
    .limit(50);

  const { data: insignias } = await supabase.from("insignias").select("*");

  const { data: topInsignias } = await supabase
    .from("usuario_insignias")
    .select("usuario_id, insignia_id")
    .order("fecha_obtenida", { ascending: false })
    .limit(200);

  const insigniasCount = new Map<string, number>();
  for (const r of topInsignias ?? []) {
    insigniasCount.set(r.insignia_id, (insigniasCount.get(r.insignia_id) ?? 0) + 1);
  }

  const userInsignias = new Map<string, number>();
  for (const r of topInsignias ?? []) {
    userInsignias.set(r.usuario_id, (userInsignias.get(r.usuario_id) ?? 0) + 1);
  }

  type ProfileRaw = { nombre: string; apellido: string; avatar_url: string | null; tienda: { nombre: string } | null } | null;
  type RankingRow = { usuario_id: string; puntos_total: number; racha_dias: number; ultima_actividad: string | null; profile: ProfileRaw };

  const rows = (ranking ?? []) as unknown as RankingRow[];

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-7">
      <VisitasSubnav />

      <div>
        <p className="tq-eyebrow">Admin · Tienda</p>
        <h1 className="text-2xl font-semibold text-tq-ink mt-1">Gamificación</h1>
        <p className="text-sm text-tq-ink/60 mt-0.5">
          Ranking de empleados, rachas activas y logros desbloqueados.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-tq-ink/50">Participantes</span>
            <Star className="w-4 h-4 text-tq-gold/60" />
          </div>
          <p className="text-3xl font-display font-semibold text-tq-ink">{rows.length}</p>
          <p className="text-xs text-tq-ink/50 mt-1">empleados activos</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-tq-ink/50">Mejor racha</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-3xl font-display font-semibold text-tq-ink">
            {Math.max(0, ...rows.map((r) => r.racha_dias))}d
          </p>
          <p className="text-xs text-tq-ink/50 mt-1">días consecutivos</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-tq-ink/50">Líder</span>
            <Trophy className="w-4 h-4 text-tq-gold/60" />
          </div>
          <p className="text-xl font-display font-semibold text-tq-ink truncate">
            {rows[0]?.profile?.nombre ?? "—"}
          </p>
          <p className="text-xs text-tq-ink/50 mt-1">{rows[0]?.puntos_total ?? 0} pts</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-tq-ink/50">Logros totales</span>
            <Award className="w-4 h-4 text-tq-ink/30" />
          </div>
          <p className="text-3xl font-display font-semibold text-tq-ink">
            {(topInsignias ?? []).length}
          </p>
          <p className="text-xs text-tq-ink/50 mt-1">desbloqueados</p>
        </div>
      </div>

      {/* Ranking table */}
      <div className="tq-card overflow-hidden">
        <div className="px-5 py-4 border-b border-tq-ink/8 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-tq-gold2" />
          <h2 className="font-semibold text-tq-ink text-sm">Ranking de empleados</h2>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-tq-ink/40">
            Aún no hay datos de puntuación.
          </div>
        ) : (
          <div className="divide-y divide-tq-ink/6">
            {rows.map((row, idx) => {
              const profile = row.profile;
              const nombre = profile ? `${profile.nombre} ${profile.apellido}` : "—";
              const tienda = (profile?.tienda as unknown as { nombre: string } | null)?.nombre ?? "—";
              const nInsignias = userInsignias.get(row.usuario_id) ?? 0;
              const isTop3 = idx < 3;

              return (
                <div
                  key={row.usuario_id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${isTop3 ? "bg-tq-gold/4" : ""}`}
                >
                  {/* Position */}
                  <div className="w-8 text-center shrink-0">
                    {idx < 3 ? (
                      <span className="text-lg">{medals[idx]}</span>
                    ) : (
                      <span className="text-sm font-semibold text-tq-ink/40">#{idx + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-tq-ink/10 shrink-0 overflow-hidden flex items-center justify-center">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt={nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-tq-ink/50">
                        {profile?.nombre?.[0] ?? "?"}
                      </span>
                    )}
                  </div>

                  {/* Name + store */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-tq-ink truncate">{nombre}</p>
                    <p className="text-xs text-tq-ink/45 truncate">{tienda}</p>
                  </div>

                  {/* Streak */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Flame className={`w-3.5 h-3.5 ${row.racha_dias >= 7 ? "text-orange-500" : "text-tq-ink/25"}`} />
                    <span className="text-xs text-tq-ink/60">{row.racha_dias}d</span>
                  </div>

                  {/* Badges */}
                  {nInsignias > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Award className="w-3.5 h-3.5 text-tq-gold2" />
                      <span className="text-xs text-tq-gold2 font-semibold">{nInsignias}</span>
                    </div>
                  )}

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <p className="font-display text-lg text-tq-ink leading-none">{row.puntos_total}</p>
                    <p className="text-[10px] text-tq-ink/40 uppercase tracking-wider">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Badge catalog */}
      <div className="tq-card p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-tq-gold2" />
            <h2 className="font-semibold text-tq-ink text-sm">Catálogo de logros</h2>
            {(insignias?.length ?? 0) > 0 && (
              <span className="text-xs text-tq-ink/40">{insignias!.length} logros</span>
            )}
          </div>
          <NuevaInsigniaButton />
        </div>

        {(insignias?.length ?? 0) === 0 ? (
          <div className="py-8 text-center">
            <Award className="w-8 h-8 text-tq-ink/20 mx-auto mb-2" />
            <p className="text-sm text-tq-ink/40">Aún no hay logros. Crea el primero.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(insignias as unknown as Insignia[]).map((ins) => (
              <InsigniaCard
                key={ins.id}
                insignia={ins}
                desbloqueados={insigniasCount.get(ins.id) ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
