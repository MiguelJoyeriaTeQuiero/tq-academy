import { createClient } from "@/lib/supabase/server";
import {
  Users,
  BookOpen,
  Award,
  Trophy,
  CheckCircle2,
  Building2,
  Sparkles,
  Activity,
  Flame,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Helpers ────────────────────────────────────────────────
function formatPct(n: number): string {
  return `${Math.round(n)}%`;
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

// ── Page ───────────────────────────────────────────────────
export default async function ReportesPage() {
  const supabase = createClient();
  const since30d = daysAgo(30);

  const [
    { count: empleadosTotal },
    { count: empleadosActivos },
    { count: cursosTotal },
    { count: cursosActivos },
    { count: certificados30d },
    { count: leccionesCompletadas },
    { count: leccionesTotal },
    { data: progresoCursos },
    { data: profilesAll },
    { data: tiendasAll },
    { data: cursosAll },
    { data: progresoLec30d },
    { data: topPuntos },
    { data: cursosCompletadosTodos },
    { data: intentosMensual30d },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase.from("cursos").select("*", { count: "exact", head: true }),
    supabase
      .from("cursos")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase
      .from("certificados")
      .select("*", { count: "exact", head: true })
      .gte("fecha_emision", since30d),
    supabase
      .from("progreso_lecciones")
      .select("*", { count: "exact", head: true })
      .eq("completado", true),
    supabase.from("progreso_lecciones").select("*", { count: "exact", head: true }),
    supabase.from("progreso_cursos").select("usuario_id, curso_id, completado"),
    supabase
      .from("profiles")
      .select("id, nombre, email, tienda_id, activo")
      .eq("activo", true),
    supabase.from("tiendas").select("id, nombre, isla").eq("activo", true),
    supabase
      .from("cursos")
      .select("id, titulo, activo")
      .eq("activo", true),
    supabase
      .from("progreso_lecciones")
      .select("updated_at, completado")
      .eq("completado", true)
      .gte("updated_at", since30d),
    supabase
      .from("puntos")
      .select("puntos_total, racha_dias, profiles!inner(id, nombre, email, tienda_id)")
      .order("puntos_total", { ascending: false })
      .limit(10),
    supabase.from("progreso_cursos").select("curso_id, completado"),
    supabase
      .from("intentos_examen_mensual")
      .select("aprobado, nota, created_at")
      .gte("created_at", since30d),
  ]);

  // ── Métricas derivadas ──────────────────────────────────
  const completados = (progresoCursos ?? []).filter((p) => p.completado).length;
  const totalInscripciones = progresoCursos?.length ?? 0;
  const tasaCompletacion =
    totalInscripciones > 0 ? (completados / totalInscripciones) * 100 : 0;

  const intentosMensualOk = (intentosMensual30d ?? []).filter((i) => i.aprobado).length;
  const intentosMensualTotal = intentosMensual30d?.length ?? 0;
  const tasaExamenes =
    intentosMensualTotal > 0 ? (intentosMensualOk / intentosMensualTotal) * 100 : 0;

  // ── Ranking tiendas ────────────────────────────────────
  const tiendaStats = new Map<
    string,
    { id: string; nombre: string; isla: string; users: number; completados: number; total: number }
  >();
  for (const t of tiendasAll ?? []) {
    tiendaStats.set(t.id, {
      id: t.id,
      nombre: t.nombre,
      isla: t.isla,
      users: 0,
      completados: 0,
      total: 0,
    });
  }
  const userToTienda = new Map<string, string>();
  for (const p of profilesAll ?? []) {
    if (p.tienda_id) {
      userToTienda.set(p.id, p.tienda_id);
      const s = tiendaStats.get(p.tienda_id);
      if (s) s.users++;
    }
  }
  for (const pc of progresoCursos ?? []) {
    const tid = userToTienda.get(pc.usuario_id as string);
    if (!tid) continue;
    const s = tiendaStats.get(tid);
    if (!s) continue;
    s.total++;
    if (pc.completado) s.completados++;
  }
  const rankingTiendas = Array.from(tiendaStats.values())
    .filter((s) => s.users > 0)
    .map((s) => ({
      ...s,
      pct: s.total > 0 ? (s.completados / s.total) * 100 : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);

  // ── Cursos ranking ─────────────────────────────────────
  const cursoMap = new Map<
    string,
    { id: string; titulo: string; total: number; completados: number }
  >();
  for (const c of cursosAll ?? []) {
    cursoMap.set(c.id, { id: c.id, titulo: c.titulo, total: 0, completados: 0 });
  }
  for (const pc of cursosCompletadosTodos ?? []) {
    const c = cursoMap.get(pc.curso_id as string);
    if (!c) continue;
    c.total++;
    if (pc.completado) c.completados++;
  }
  const cursosRanking = Array.from(cursoMap.values())
    .filter((c) => c.total > 0)
    .map((c) => ({
      ...c,
      pct: (c.completados / c.total) * 100,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── Tendencia 30 días ──────────────────────────────────
  const dayCounts = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayCounts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const p of progresoLec30d ?? []) {
    const k = dayKey(p.updated_at as string);
    if (dayCounts.has(k)) dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1);
  }
  const trendData = Array.from(dayCounts.entries()).map(([day, count]) => ({
    day,
    count,
  }));
  const trendMax = Math.max(...trendData.map((d) => d.count), 1);
  const trendTotal = trendData.reduce((s, d) => s + d.count, 0);
  const trendAvg = Math.round(trendTotal / 30);
  // primeras 15 vs últimas 15 — variación
  const firstHalf = trendData.slice(0, 15).reduce((s, d) => s + d.count, 0);
  const lastHalf = trendData.slice(15).reduce((s, d) => s + d.count, 0);
  const trendDelta =
    firstHalf > 0
      ? Math.round(((lastHalf - firstHalf) / firstHalf) * 100)
      : lastHalf > 0
      ? 100
      : 0;

  // SVG path para el área (viewBox 600x140)
  const W = 600;
  const H = 140;
  const PAD_Y = 12;
  const stepX = W / Math.max(trendData.length - 1, 1);
  const points = trendData.map((d, i) => {
    const x = i * stepX;
    const y = H - PAD_Y - (d.count / trendMax) * (H - PAD_Y * 2);
    return { x, y, count: d.count, day: d.day };
  });
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  // ── Top empleados ──────────────────────────────────────
  type TopRow = {
    puntos_total: number;
    racha_dias: number;
    profiles: { id: string; nombre: string; email: string; tienda_id: string | null };
  };
  const tiendaName = new Map((tiendasAll ?? []).map((t) => [t.id, t.nombre]));
  const top = ((topPuntos ?? []) as unknown as TopRow[]) || [];
  const podium = top.slice(0, 3);
  const restoTop = top.slice(3, 10);
  const maxPuntos = Math.max(...top.map((t) => t.puntos_total), 1);

  const today = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* ═══ HERO — north star ═══════════════════════════════ */}
      <section className="relative overflow-hidden rounded-2xl bg-tq-ink text-white">
        {/* texturas */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(circle_at_15%_20%,white_1px,transparent_1px)] bg-[length:18px_18px]" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-tq-sky/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-tq-gold/15 blur-3xl pointer-events-none" />
        {/* filete superior */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-tq-gold/70 to-transparent" />

        <div className="relative px-7 sm:px-10 py-9 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-start">
          {/* izquierda: titular + métrica estrella */}
          <div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-tq-gold/90 font-semibold">
              <span className="w-6 h-px bg-tq-gold/70" />
              <span>Reportes · {today}</span>
            </div>
            <h1 className="font-display text-[2.6rem] sm:text-5xl leading-[1.05] mt-4 max-w-xl">
              La salud de la academia,{" "}
              <span className="italic text-tq-gold">a primera vista.</span>
            </h1>
            <p className="text-white/55 text-sm mt-3 max-w-md leading-relaxed">
              Datos en vivo desde Supabase · Te Quiero Group · Reivindicando el
              valor de lo accesible desde 1988.
            </p>

            {/* métrica norte */}
            <div className="mt-8 flex items-end gap-6 flex-wrap">
              <DonutCompletion pct={tasaCompletacion} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold/80 font-semibold">
                  Tasa de completación global
                </p>
                <p className="text-white/65 text-xs mt-1.5 max-w-[18rem] leading-relaxed">
                  {completados.toLocaleString("es-ES")} cursos terminados sobre{" "}
                  {totalInscripciones.toLocaleString("es-ES")} inscripciones
                  activas en toda la red.
                </p>
              </div>
            </div>
          </div>

          {/* derecha: strip vertical de KPIs */}
          <div className="lg:border-l lg:border-white/10 lg:pl-10 grid grid-cols-2 gap-y-6 gap-x-4">
            <HeroStat
              icon={Users}
              label="Empleados activos"
              value={empleadosActivos ?? 0}
              hint={`de ${empleadosTotal ?? 0}`}
            />
            <HeroStat
              icon={BookOpen}
              label="Cursos publicados"
              value={cursosActivos ?? 0}
              hint={`${cursosTotal ?? 0} en BD`}
            />
            <HeroStat
              icon={Award}
              label="Certificados · 30d"
              value={certificados30d ?? 0}
              hint="emitidos este mes"
              highlight
            />
            <HeroStat
              icon={Sparkles}
              label="Examen mensual"
              value={formatPct(tasaExamenes)}
              hint={`${intentosMensualOk}/${intentosMensualTotal} intentos`}
            />
          </div>
        </div>

        {/* filete inferior */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
      </section>

      {/* ═══ Tendencia 30 días — área SVG ════════════════════ */}
      <section className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
        <div className="px-6 sm:px-8 pt-7 pb-2 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="tq-eyebrow">Pulso de actividad</p>
            <h2 className="tq-headline text-2xl mt-1">
              Lecciones completadas · 30 días
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <Stat label="Total" value={trendTotal.toLocaleString("es-ES")} />
            <Stat label="Media diaria" value={trendAvg} />
            <DeltaPill delta={trendDelta} />
          </div>
        </div>

        <div className="px-2 sm:px-4 pb-4 pt-2">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full h-44"
          >
            <defs>
              <linearGradient id="tqArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0099F2" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0099F2" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="tqLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00557F" />
                <stop offset="60%" stopColor="#0099F2" />
                <stop offset="100%" stopColor="#C8A164" />
              </linearGradient>
            </defs>

            {/* gridlines horizontales */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1="0"
                x2={W}
                y1={H * f}
                y2={H * f}
                stroke="#00557F"
                strokeOpacity="0.06"
                strokeDasharray="2 4"
              />
            ))}

            <path d={areaPath} fill="url(#tqArea)" />
            <path
              d={linePath}
              fill="none"
              stroke="url(#tqLine)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* punto final */}
            {points.length > 0 && (
              <>
                <circle
                  cx={points[points.length - 1].x}
                  cy={points[points.length - 1].y}
                  r="6"
                  fill="#C8A164"
                  fillOpacity="0.25"
                />
                <circle
                  cx={points[points.length - 1].x}
                  cy={points[points.length - 1].y}
                  r="3"
                  fill="#C8A164"
                />
              </>
            )}
          </svg>

          {/* eje x — etiquetas semanales */}
          <div className="flex justify-between text-[10px] uppercase tracking-[0.18em] text-tq-ink/35 font-semibold px-2 pt-1">
            <span>{formatShortDate(trendData[0]?.day)}</span>
            <span>{formatShortDate(trendData[7]?.day)}</span>
            <span>{formatShortDate(trendData[14]?.day)}</span>
            <span>{formatShortDate(trendData[22]?.day)}</span>
            <span>hoy</span>
          </div>
        </div>

        {/* footer secundario */}
        <div className="border-t border-tq-ink/10 px-6 sm:px-8 py-3 flex items-center gap-6 text-[11px] text-tq-ink/55">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-tq-sky" />
            {(leccionesCompletadas ?? 0).toLocaleString("es-ES")} lecciones
            completadas histórico
          </span>
          <span className="text-tq-ink/30">·</span>
          <span>
            {(leccionesTotal ?? 0).toLocaleString("es-ES")} intentos totales
          </span>
        </div>
      </section>

      {/* ═══ Podio Top 3 + resto leaderboard ═════════════════ */}
      {top.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="tq-eyebrow">Hall of fame</p>
              <h2 className="tq-headline text-2xl mt-1">Empleados destacados</h2>
            </div>
            <Trophy className="w-5 h-5 text-tq-gold2" />
          </div>

          {/* Podio */}
          {podium.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {[1, 0, 2].map((order) => {
                const row = podium[order];
                if (!row) return <div key={order} className="hidden md:block" />;
                const rank = order; // 0,1,2
                const isFirst = rank === 0;
                const heightClass = isFirst
                  ? "py-9"
                  : rank === 1
                  ? "py-7"
                  : "py-6";
                return (
                  <PodiumCard
                    key={row.profiles.id}
                    rank={rank}
                    name={row.profiles.nombre || row.profiles.email}
                    tienda={
                      row.profiles.tienda_id
                        ? tiendaName.get(row.profiles.tienda_id) ?? "Sin tienda"
                        : "Sin tienda"
                    }
                    puntos={row.puntos_total}
                    racha={row.racha_dias}
                    pct={(row.puntos_total / maxPuntos) * 100}
                    heightClass={heightClass}
                  />
                );
              })}
            </div>
          )}

          {/* Resto */}
          {restoTop.length > 0 && (
            <ul className="mt-5 divide-y divide-tq-ink/10 bg-white rounded-xl border border-tq-ink/10 overflow-hidden">
              {restoTop.map((row, i) => (
                <li
                  key={row.profiles.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-tq-paper/40 transition-colors"
                >
                  <span className="font-display text-2xl text-tq-ink/30 tabular-nums w-8">
                    {String(i + 4).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-tq-ink truncate font-medium">
                      {row.profiles.nombre || row.profiles.email}
                    </p>
                    <p className="text-[11px] text-tq-ink/50 truncate flex items-center gap-2">
                      <span>
                        {row.profiles.tienda_id
                          ? tiendaName.get(row.profiles.tienda_id) ?? "Sin tienda"
                          : "Sin tienda"}
                      </span>
                      {row.racha_dias > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-tq-gold2 font-medium">
                          <Flame className="w-3 h-3" /> {row.racha_dias}d
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg text-tq-ink tabular-nums leading-none">
                      {row.puntos_total.toLocaleString("es-ES")}
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-tq-gold2 font-semibold mt-1">
                      puntos
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ═══ Tiendas + Cursos ════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-5">
        {/* Tiendas — leaderboard editorial */}
        <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-tq-sky" />
              <p className="tq-eyebrow">Red de tiendas</p>
            </div>
            <h2 className="tq-headline text-xl">Ranking por completación</h2>
          </div>

          {rankingTiendas.length === 0 ? (
            <p className="text-sm text-tq-ink/50 text-center py-12 px-6">
              Aún no hay datos de progreso por tienda.
            </p>
          ) : (
            <ul>
              {rankingTiendas.map((t, i) => (
                <li
                  key={t.id}
                  className="group relative px-6 py-4 border-t border-tq-ink/10 hover:bg-tq-paper/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* numeral serif gigante */}
                    <span
                      className={`font-display text-4xl tabular-nums leading-none w-14 ${
                        i === 0 ? "text-tq-gold2" : "text-tq-ink/20"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base text-tq-ink leading-tight">
                        {t.nombre}
                      </p>
                      <p className="text-[11px] text-tq-ink/50 mt-0.5">
                        {t.isla} · {t.users}{" "}
                        {t.users === 1 ? "empleado" : "empleados"} ·{" "}
                        {t.completados}/{t.total} cursos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl text-tq-ink tabular-nums leading-none">
                        {formatPct(t.pct)}
                      </p>
                    </div>
                  </div>
                  {/* barra finita debajo */}
                  <div className="mt-3 ml-[4.5rem] h-[3px] rounded-full bg-tq-ink/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        i === 0
                          ? "bg-gradient-to-r from-tq-gold via-tq-gold2 to-tq-gold"
                          : "bg-gradient-to-r from-tq-sky to-tq-ink"
                      }`}
                      style={{ width: `${Math.max(t.pct, 2)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cursos — barras codificadas */}
        <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-tq-sky" />
              <p className="tq-eyebrow">Catálogo</p>
            </div>
            <h2 className="tq-headline text-xl">Progreso por curso</h2>
          </div>

          {cursosRanking.length === 0 ? (
            <p className="text-sm text-tq-ink/50 text-center py-12 px-6">
              Aún sin inscripciones a cursos.
            </p>
          ) : (
            <ul className="px-6 pb-6 space-y-4">
              {cursosRanking.map((c) => {
                const tone =
                  c.pct >= 70
                    ? "from-emerald-400 to-emerald-600"
                    : c.pct >= 40
                    ? "from-tq-sky to-tq-ink"
                    : "from-tq-gold to-tq-gold2";
                return (
                  <li key={c.id} className="space-y-1.5">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex-1 truncate text-tq-ink">
                        {c.titulo}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-tq-ink/45 font-semibold whitespace-nowrap">
                        {c.total} {c.total === 1 ? "inscr." : "inscr."}
                      </span>
                      <span className="font-display text-base text-tq-ink tabular-nums w-12 text-right">
                        {formatPct(c.pct)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-tq-ink/8 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${tone}`}
                        style={{ width: `${Math.max(c.pct, 1.5)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <p className="text-[10px] uppercase tracking-[0.32em] text-tq-ink/30 text-center pt-2 font-semibold flex items-center justify-center gap-3">
        <span className="w-8 h-px bg-tq-gold/40" />
        Datos en vivo · actualizados al cargar
        <span className="w-8 h-px bg-tq-gold/40" />
      </p>
    </div>
  );
}

// ── Subcomponentes ──────────────────────────────────────────

function formatShortDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function HeroStat({
  icon: Icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={`inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] font-semibold ${
          highlight ? "text-tq-gold" : "text-white/55"
        }`}
      >
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <p className="font-display text-3xl text-white tabular-nums leading-none">
        {typeof value === "number" ? value.toLocaleString("es-ES") : value}
      </p>
      {hint && <p className="text-[11px] text-white/45">{hint}</p>}
    </div>
  );
}

function DonutCompletion({ pct }: { pct: number }) {
  const size = 124;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * c;
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C8A164" />
            <stop offset="60%" stopColor="#0099F2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl text-white tabular-nums leading-none">
          {Math.round(pct)}
          <span className="text-tq-gold text-xl">%</span>
        </span>
        <span className="text-[9px] uppercase tracking-[0.22em] text-white/55 mt-1 font-semibold">
          completado
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-right">
      <p className="text-[9px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold">
        {label}
      </p>
      <p className="font-display text-xl text-tq-ink tabular-nums leading-tight">
        {value}
      </p>
    </div>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  const positive = delta >= 0;
  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
        positive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      <ArrowUpRight
        className={`w-3 h-3 ${positive ? "" : "rotate-90"} transition-transform`}
      />
      {positive ? "+" : ""}
      {delta}% vs 15d previos
    </div>
  );
}

function PodiumCard({
  rank,
  name,
  tienda,
  puntos,
  racha,
  pct,
  heightClass,
}: {
  rank: number;
  name: string;
  tienda: string;
  puntos: number;
  racha: number;
  pct: number;
  heightClass: string;
}) {
  const isFirst = rank === 0;
  const config = isFirst
    ? {
        bg: "bg-gradient-to-br from-tq-ink via-tq-ink to-[#003a58] text-white",
        border: "border-tq-gold/60 ring-1 ring-tq-gold/40",
        medal: "🥇",
        accent: "text-tq-gold",
        sub: "text-white/60",
        bar: "bg-gradient-to-r from-tq-gold via-tq-gold2 to-tq-gold",
        barBg: "bg-white/10",
      }
    : rank === 1
    ? {
        bg: "bg-white text-tq-ink",
        border: "border-tq-ink/15",
        medal: "🥈",
        accent: "text-tq-ink",
        sub: "text-tq-ink/55",
        bar: "bg-gradient-to-r from-tq-sky to-tq-ink",
        barBg: "bg-tq-ink/8",
      }
    : {
        bg: "bg-white text-tq-ink",
        border: "border-tq-ink/15",
        medal: "🥉",
        accent: "text-tq-ink",
        sub: "text-tq-ink/55",
        bar: "bg-gradient-to-r from-tq-gold to-tq-gold2",
        barBg: "bg-tq-ink/8",
      };

  return (
    <div
      className={`relative rounded-2xl border ${config.border} ${config.bg} px-6 ${heightClass} shadow-tq-soft overflow-hidden`}
    >
      {isFirst && (
        <>
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/70 to-transparent" />
          <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-tq-sky/30 blur-3xl pointer-events-none" />
        </>
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`text-[9px] uppercase tracking-[0.28em] ${
              isFirst ? "text-tq-gold" : "text-tq-ink/45"
            } font-semibold flex items-center gap-1.5`}
          >
            <span className="text-base leading-none">{config.medal}</span>
            <span>
              {rank === 0
                ? "Primer puesto"
                : rank === 1
                ? "Segundo puesto"
                : "Tercer puesto"}
            </span>
          </p>
          <p
            className={`font-display ${
              isFirst ? "text-2xl" : "text-xl"
            } leading-tight mt-2 truncate`}
          >
            {name}
          </p>
          <p className={`text-[11px] mt-1 truncate ${config.sub}`}>
            {tienda}
            {racha > 0 && (
              <>
                {" · "}
                <span className={`${config.accent} font-medium`}>
                  <Flame className="w-3 h-3 inline -mt-0.5" /> {racha}d
                </span>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="relative mt-4 flex items-end justify-between">
        <p
          className={`font-display ${
            isFirst ? "text-4xl" : "text-3xl"
          } tabular-nums leading-none`}
        >
          {puntos.toLocaleString("es-ES")}
        </p>
        <span
          className={`text-[10px] uppercase tracking-[0.22em] font-semibold ${config.accent} pb-1`}
        >
          puntos
        </span>
      </div>
      <div className={`relative mt-3 h-1 rounded-full ${config.barBg} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${config.bar}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}
