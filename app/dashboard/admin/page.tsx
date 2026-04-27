import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  GraduationCap,
  Building2,
  UserPlus,
  Award,
  Bell,
  ClipboardList,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROL_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin_rrhh: "Admin RRHH",
  manager: "Manager",
  empleado: "Empleado",
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "TQ";
}

function timeSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d}d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = user
    ? await supabase
        .from("profiles")
        .select("nombre, apellido, rol")
        .eq("id", user.id)
        .single()
    : { data: null };

  const since7d = daysAgo(7);
  const since14d = daysAgo(14);

  const [
    { count: totalUsuarios },
    { count: totalCursos },
    { count: cursosActivos },
    { count: completadosEstaSemana },
    { count: completadosSemanaPasada },
    { count: certificados7d },
    { count: tiendasActivas },
    { data: ultimosUsuarios },
    { data: ultimosProgresos },
    { data: actividad7d },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("activo", true),
    supabase.from("cursos").select("*", { count: "exact", head: true }),
    supabase.from("cursos").select("*", { count: "exact", head: true }).eq("activo", true),
    supabase
      .from("progreso_cursos")
      .select("*", { count: "exact", head: true })
      .eq("completado", true)
      .gte("updated_at", since7d),
    supabase
      .from("progreso_cursos")
      .select("*", { count: "exact", head: true })
      .eq("completado", true)
      .gte("updated_at", since14d)
      .lt("updated_at", since7d),
    supabase
      .from("certificados")
      .select("*", { count: "exact", head: true })
      .gte("fecha_emision", since7d),
    supabase
      .from("tiendas")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase
      .from("profiles")
      .select("id, nombre, apellido, email, rol, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("progreso_cursos")
      .select(
        "id, fecha_completado, profiles(nombre, apellido, email), cursos(titulo)",
      )
      .eq("completado", true)
      .order("fecha_completado", { ascending: false })
      .limit(6),
    supabase
      .from("progreso_lecciones")
      .select("updated_at")
      .eq("completado", true)
      .gte("updated_at", since7d),
  ]);

  // Sparkline: lecciones completadas últimos 7 días
  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of actividad7d ?? []) {
    const k = (r.updated_at as string).slice(0, 10);
    if (dayMap.has(k)) dayMap.set(k, (dayMap.get(k) ?? 0) + 1);
  }
  const sparkData = Array.from(dayMap.entries()).map(([day, count]) => ({
    day,
    count,
  }));
  const sparkMax = Math.max(...sparkData.map((d) => d.count), 1);
  const sparkTotal = sparkData.reduce((s, d) => s + d.count, 0);

  // Deltas
  const completadosDelta = (() => {
    const a = completadosEstaSemana ?? 0;
    const b = completadosSemanaPasada ?? 0;
    if (b === 0) return a > 0 ? 100 : 0;
    return Math.round(((a - b) / b) * 100);
  })();
  const meName =
    me?.nombre || (user?.email ? user.email.split("@")[0] : "Equipo");
  const meRol = me?.rol ? ROL_LABEL[me.rol] ?? me.rol : "Admin";

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  // Sparkline SVG
  const SW = 280;
  const SH = 70;
  const sx = SW / Math.max(sparkData.length - 1, 1);
  const pts = sparkData.map((d, i) => ({
    x: i * sx,
    y: SH - 8 - (d.count / sparkMax) * (SH - 18),
    count: d.count,
  }));
  const sparkLine = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const sparkArea = `${sparkLine} L${SW},${SH} L0,${SH} Z`;

  return (
    <div className="space-y-8">
      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-2xl bg-tq-ink text-white">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(circle_at_15%_20%,white_1px,transparent_1px)] bg-[length:18px_18px]" />
        <div className="absolute -top-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-tq-sky/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-tq-gold/15 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-tq-gold/70 to-transparent" />
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />

        <div className="relative px-7 sm:px-10 py-9 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
          {/* izquierda */}
          <div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-tq-gold/90 font-semibold">
              <span className="w-6 h-px bg-tq-gold/70" />
              <span>{today} · {meRol}</span>
            </div>
            <h1 className="font-display text-[2.4rem] sm:text-5xl leading-[1.05] mt-4">
              {greeting()},{" "}
              <span className="italic text-tq-gold">{meName}.</span>
            </h1>
            <p className="text-white/55 text-sm mt-3 max-w-md leading-relaxed">
              Esto es lo que está pasando hoy en TQ Academy · Te Quiero Group ·
              Reivindicando el valor de lo accesible desde 1988.
            </p>

            {/* Acciones rápidas */}
            <div className="flex flex-wrap gap-2 mt-7">
              <QuickAction href="/dashboard/admin/usuarios" icon={UserPlus}>
                Nuevo usuario
              </QuickAction>
              <QuickAction href="/dashboard/admin/cursos" icon={BookOpen}>
                Crear curso
              </QuickAction>
              <QuickAction href="/dashboard/admin/notificaciones" icon={Bell}>
                Notificar
              </QuickAction>
              <QuickAction href="/dashboard/admin/reportes" icon={TrendingUp}>
                Ver reportes
              </QuickAction>
            </div>
          </div>

          {/* derecha — sparkline pulso semanal */}
          <div className="lg:border-l lg:border-white/10 lg:pl-10">
            <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold/80 font-semibold">
              Pulso · 7 días
            </p>
            <div className="flex items-end gap-3 mt-3">
              <span className="font-display text-5xl text-white tabular-nums leading-none">
                {sparkTotal.toLocaleString("es-ES")}
              </span>
              <span className="text-[11px] text-white/55 pb-1.5">
                lecciones
                <br />
                completadas
              </span>
            </div>
            <svg
              viewBox={`0 0 ${SW} ${SH}`}
              preserveAspectRatio="none"
              className="w-full h-20 mt-4"
            >
              <defs>
                <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8A164" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#C8A164" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparkArea} fill="url(#heroArea)" />
              <path
                d={sparkLine}
                fill="none"
                stroke="#C8A164"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.length > 0 && (
                <circle
                  cx={pts[pts.length - 1].x}
                  cy={pts[pts.length - 1].y}
                  r="3.5"
                  fill="#fff"
                  stroke="#C8A164"
                  strokeWidth="2"
                />
              )}
            </svg>
            <div className="flex justify-between text-[9px] uppercase tracking-[0.22em] text-white/40 font-semibold mt-1">
              <span>L</span>
              <span>M</span>
              <span>X</span>
              <span>J</span>
              <span>V</span>
              <span>S</span>
              <span>D</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ KPIs strip ════════════════════════════════════ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
        <KpiCell
          icon={Users}
          label="Usuarios activos"
          value={totalUsuarios ?? 0}
          accent="sky"
          hint={tiendasActivas ? `${tiendasActivas} tiendas` : undefined}
        />
        <KpiCell
          icon={BookOpen}
          label="Cursos publicados"
          value={cursosActivos ?? 0}
          accent="ink"
          hint={`${totalCursos ?? 0} en catálogo`}
        />
        <KpiCell
          icon={CheckCircle2}
          label="Completados · 7d"
          value={completadosEstaSemana ?? 0}
          accent="emerald"
          delta={completadosDelta}
        />
        <KpiCell
          icon={Award}
          label="Certificados · 7d"
          value={certificados7d ?? 0}
          accent="gold"
          hint="emitidos"
        />
      </section>

      {/* ═══ Listas paralelas ══════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Últimos usuarios */}
        <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="w-4 h-4 text-tq-sky" />
                <p className="tq-eyebrow">Bienvenidas</p>
              </div>
              <h2 className="tq-headline text-xl">Usuarios recientes</h2>
            </div>
            <Link
              href="/dashboard/admin/usuarios"
              className="text-[11px] uppercase tracking-[0.2em] text-tq-ink/55 hover:text-tq-sky font-semibold flex items-center gap-1"
            >
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {(ultimosUsuarios ?? []).length === 0 ? (
            <p className="text-sm text-tq-ink/50 text-center py-12">
              Sin usuarios todavía
            </p>
          ) : (
            <ul>
              {(ultimosUsuarios ?? []).map((u) => {
                const fullName =
                  `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() || u.email;
                return (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 px-6 py-3 border-t border-tq-ink/8 hover:bg-tq-paper/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 ring-1 ring-tq-gold/20 shadow-tq-soft">
                      {initials(fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-tq-ink font-medium truncate">
                        {fullName}
                      </p>
                      <p className="text-[11px] text-tq-ink/50 truncate">
                        {u.email}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="inline-block text-[9px] uppercase tracking-[0.2em] font-semibold text-tq-gold2">
                        {ROL_LABEL[u.rol] ?? u.rol}
                      </span>
                      <p className="text-[10px] text-tq-ink/40 mt-0.5">
                        {timeSince(u.created_at as string)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Últimas completaciones */}
        <div className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-tq-gold2" />
                <p className="tq-eyebrow">Logros recientes</p>
              </div>
              <h2 className="tq-headline text-xl">Cursos completados</h2>
            </div>
            <Link
              href="/dashboard/admin/reportes"
              className="text-[11px] uppercase tracking-[0.2em] text-tq-ink/55 hover:text-tq-sky font-semibold flex items-center gap-1"
            >
              Reportes <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {(ultimosProgresos ?? []).length === 0 ? (
            <p className="text-sm text-tq-ink/50 text-center py-12">
              Sin completaciones todavía
            </p>
          ) : (
            <ul>
              {(ultimosProgresos ?? []).map((p) => {
                const profile = p.profiles as unknown as {
                  nombre: string;
                  apellido: string;
                  email: string;
                } | null;
                const curso = p.cursos as unknown as { titulo: string } | null;
                const fullName =
                  `${profile?.nombre ?? ""} ${profile?.apellido ?? ""}`.trim() ||
                  profile?.email ||
                  "Empleado";
                return (
                  <li
                    key={p.id}
                    className="flex items-start gap-3 px-6 py-3 border-t border-tq-ink/8 hover:bg-tq-paper/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tq-gold/30 to-tq-gold/10 flex items-center justify-center flex-shrink-0 ring-1 ring-tq-gold/30">
                      <Award className="w-4 h-4 text-tq-gold2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-tq-ink leading-tight truncate">
                        {curso?.titulo ?? "Curso"}
                      </p>
                      <p className="text-[11px] text-tq-ink/55 truncate mt-0.5">
                        <span className="text-tq-ink/70 font-medium">
                          {fullName}
                        </span>
                        {p.fecha_completado && (
                          <>
                            {" · "}
                            <span className="text-tq-ink/40">
                              {timeSince(p.fecha_completado as string)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ═══ Atajos secundarios ════════════════════════════ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ShortcutCard
          href="/dashboard/admin/cursos"
          icon={GraduationCap}
          label="Cursos"
          desc="Catálogo y módulos"
        />
        <ShortcutCard
          href="/dashboard/admin/rutas"
          icon={ClipboardList}
          label="Rutas"
          desc="Itinerarios formativos"
        />
        <ShortcutCard
          href="/dashboard/admin/tiendas"
          icon={Building2}
          label="Tiendas"
          desc={`${tiendasActivas ?? 0} activas`}
        />
        <ShortcutCard
          href="/dashboard/admin/examenes-mensuales"
          icon={Sparkles}
          label="Examen mensual"
          desc="Configurar y revisar"
        />
      </section>

      <p className="text-[10px] uppercase tracking-[0.32em] text-tq-ink/30 text-center pt-2 font-semibold flex items-center justify-center gap-3">
        <span className="w-8 h-px bg-tq-gold/40" />
        TQ Academy · Panel administrativo
        <span className="w-8 h-px bg-tq-gold/40" />
      </p>
    </div>
  );
}

// ── Subcomponentes ──────────────────────────────────────────

function QuickAction({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/8 backdrop-blur border border-white/15 hover:border-tq-gold/60 hover:bg-white/12 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 hover:text-white transition-all"
    >
      <Icon className="w-3.5 h-3.5 text-tq-gold/90 group-hover:text-tq-gold transition-colors" />
      {children}
    </Link>
  );
}

function KpiCell({
  icon: Icon,
  label,
  value,
  accent,
  hint,
  delta,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: "sky" | "ink" | "gold" | "emerald";
  hint?: string;
  delta?: number;
}) {
  const accents = {
    sky: "from-tq-sky/15 to-tq-sky/5 text-tq-sky",
    ink: "from-tq-ink/15 to-tq-ink/5 text-tq-ink",
    gold: "from-tq-gold/25 to-tq-gold/5 text-tq-gold2",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-700",
  } as const;

  return (
    <div className="relative bg-white p-5 sm:p-6 group hover:bg-tq-paper/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/50 font-semibold">
            {label}
          </p>
          <p className="font-display text-3xl sm:text-4xl text-tq-ink mt-2 tabular-nums leading-none">
            {typeof value === "number" ? value.toLocaleString("es-ES") : value}
          </p>
          <div className="flex items-center gap-2 mt-2 min-h-[18px]">
            {typeof delta === "number" && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  delta >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                <ArrowUpRight
                  className={`w-2.5 h-2.5 ${delta >= 0 ? "" : "rotate-90"}`}
                />
                {delta >= 0 ? "+" : ""}
                {delta}%
              </span>
            )}
            {hint && (
              <span className="text-[11px] text-tq-ink/50">{hint}</span>
            )}
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${accents[accent]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {/* filete hover */}
      <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-tq-gold/0 to-transparent group-hover:via-tq-gold/40 transition-all" />
    </div>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-white rounded-xl border border-tq-ink/10 hover:border-tq-gold/50 hover:shadow-tq-gold p-4 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg bg-tq-paper flex items-center justify-center text-tq-ink/70 group-hover:text-tq-sky transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-tq-ink/20 group-hover:text-tq-sky group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
      <p className="font-display text-base text-tq-ink mt-3 leading-tight">
        {label}
      </p>
      <p className="text-[11px] text-tq-ink/50 mt-0.5">{desc}</p>
    </Link>
  );
}
