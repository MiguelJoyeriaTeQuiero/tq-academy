import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Trophy,
  Flame,
  Star,
  Zap,
  Lock,
  TrendingUp,
  Calendar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const INSIGNIA_EMOJI: Record<string, string> = {
  lecciones_completadas: "📚",
  examen_perfecto: "💯",
  cursos_completados: "🎓",
  racha_dias: "🔥",
  ranking_mensual: "👑",
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getNivel(pts: number) {
  if (pts >= 2000) return { label: "Experto", tone: "text-purple-200", ring: "ring-purple-300/40", bg: "bg-purple-500/20" };
  if (pts >= 1000) return { label: "Avanzado", tone: "text-tq-sky", ring: "ring-tq-sky/40", bg: "bg-tq-sky/15" };
  if (pts >= 400) return { label: "Intermedio", tone: "text-tq-gold", ring: "ring-tq-gold/50", bg: "bg-tq-gold/15" };
  if (pts >= 100) return { label: "Aprendiz", tone: "text-emerald-300", ring: "ring-emerald-300/40", bg: "bg-emerald-500/20" };
  return { label: "Principiante", tone: "text-white/70", ring: "ring-white/20", bg: "bg-white/10" };
}

export default async function LogrosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: puntos }, { data: historial }, { data: insignias }, { data: obtenidas }] =
    await Promise.all([
      supabase.from("puntos").select("*").eq("usuario_id", user.id).maybeSingle(),
      supabase
        .from("puntos_historial")
        .select("id, puntos, concepto, created_at")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("insignias").select("*").order("condicion_valor"),
      supabase
        .from("usuario_insignias")
        .select("insignia_id, fecha_obtenida")
        .eq("usuario_id", user.id),
    ]);

  const obtenidaMap = new Map(
    (obtenidas ?? []).map((ui) => [ui.insignia_id, ui.fecha_obtenida]),
  );
  const puntosTotal = puntos?.puntos_total ?? 0;
  const racha = puntos?.racha_dias ?? 0;
  const insigniasCount = obtenidas?.length ?? 0;
  const totalInsignias = insignias?.length ?? 0;
  const nivel = getNivel(puntosTotal);

  const HITOS = [100, 400, 1000, 2000, 5000];
  const proximoHito = HITOS.find((h) => h > puntosTotal) ?? null;
  const progresoPct = proximoHito
    ? Math.min(100, Math.round((puntosTotal / proximoHito) * 100))
    : 100;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-tq-ink text-white tq-noise">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-tq-gold/20 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 w-[30rem] h-[30rem] rounded-full bg-tq-sky/20 blur-[140px]" />
        <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
        <div className="absolute left-8 right-8 bottom-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />

        {/* Trofeo decorativo gigante */}
        <Trophy className="absolute -right-8 top-8 w-64 h-64 text-white/[0.04]" strokeWidth={1} />

        <div className="relative px-6 sm:px-10 py-10 sm:py-14 grid lg:grid-cols-[1fr_auto] gap-10 items-end">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.32em] text-tq-gold/85 font-semibold flex items-center gap-2">
              <span className="w-6 h-px bg-tq-gold/70" />
              Tu trayectoria · TQ Academy
            </p>
            <h1 className="font-display text-[2.4rem] sm:text-6xl leading-[1.02] mt-3 break-words text-white">
              Mis <span className="italic text-tq-gold">logros</span>
            </h1>
            <p className="text-white/70 text-base mt-3 max-w-xl leading-relaxed">
              Cada lección suma. Cada examen brilla. Aquí están los puntos,
              rachas e insignias que cuentan tu historia en Te Quiero.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${nivel.tone} ${nivel.ring} ${nivel.bg}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Nivel {nivel.label}
              </span>
              <Link
                href="/dashboard/empleado/ranking"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/15 hover:bg-white/15 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-tq-gold/90" />
                Ver ranking
              </Link>
            </div>
          </div>

          {/* Donut puntos */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <PointsDonut value={progresoPct} center={puntosTotal} />
            <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold/90 font-semibold">
              {proximoHito ? `Próximo hito · ${proximoHito}` : "Hito máximo"}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="relative grid grid-cols-3 gap-px bg-white/5 ring-t ring-white/10">
          <BigStat
            icon={<Star className="w-4 h-4" />}
            label="Puntos totales"
            value={puntosTotal.toLocaleString("es-ES")}
            accent="gold"
            highlight
          />
          <BigStat
            icon={<Flame className={`w-4 h-4 ${racha >= 3 ? "text-orange-400" : ""}`} />}
            label="Racha activa"
            value={`${racha} d`}
            sub={racha === 0 ? "Comienza hoy" : racha >= 7 ? "¡Increíble!" : "¡Sigue así!"}
          />
          <BigStat
            icon={<Trophy className="w-4 h-4" />}
            label="Insignias"
            value={`${insigniasCount} / ${totalInsignias}`}
            sub={`${totalInsignias - insigniasCount} por desbloquear`}
            accent="sky"
          />
        </div>
      </section>

      {/* INSIGNIAS */}
      <section>
        <header className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2">
              <span className="w-5 h-px bg-tq-gold/70" />
              Colección
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
              Insignias
            </h2>
          </div>
          <p className="text-xs text-tq-ink/55">
            {insigniasCount} de {totalInsignias} desbloqueadas
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(insignias ?? []).map((ins) => {
            const earned = obtenidaMap.has(ins.id);
            const fecha = obtenidaMap.get(ins.id);
            return (
              <div
                key={ins.id}
                className={`relative rounded-2xl p-5 flex flex-col items-center text-center gap-2.5 transition-all ${
                  earned
                    ? "bg-gradient-to-br from-tq-paper to-tq-cream ring-1 ring-tq-gold/40 hover:shadow-tq-gold"
                    : "bg-tq-ink/[0.03] ring-1 ring-tq-ink/8"
                }`}
              >
                {earned && (
                  <span className="absolute top-2 right-2 text-[9px] uppercase tracking-[0.18em] font-semibold px-1.5 py-0.5 rounded-full bg-tq-gold text-tq-ink">
                    OK
                  </span>
                )}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                    earned
                      ? "bg-gradient-to-br from-tq-gold/30 to-tq-gold/10 shadow-tq-gold ring-1 ring-tq-gold/40"
                      : "bg-tq-ink/8"
                  }`}
                >
                  {earned ? (
                    INSIGNIA_EMOJI[ins.condicion_tipo] ?? "🏅"
                  ) : (
                    <Lock className="w-5 h-5 text-tq-ink/30" />
                  )}
                </div>
                <p
                  className={`text-xs font-semibold leading-tight ${
                    earned ? "text-tq-ink" : "text-tq-ink/40"
                  }`}
                >
                  {ins.nombre}
                </p>
                {earned && fecha ? (
                  <p className="text-[10px] text-tq-gold uppercase tracking-[0.16em] font-semibold">
                    {formatFecha(fecha)}
                  </p>
                ) : (
                  <p className="text-[10px] text-tq-ink/40 leading-tight line-clamp-2">
                    {ins.descripcion}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* HISTORIAL */}
      {(historial ?? []).length > 0 && (
        <section>
          <header className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2">
                <span className="w-5 h-px bg-tq-gold/70" />
                Bitácora
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
                Actividad reciente
              </h2>
            </div>
          </header>
          <div className="bg-tq-paper rounded-2xl ring-1 ring-tq-ink/8 overflow-hidden divide-y divide-tq-ink/5">
            {(historial ?? []).map((h, idx) => (
              <div
                key={h.id}
                className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-tq-ink/[0.02]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-display text-tq-ink/30 text-lg tabular-nums w-8 flex-shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-tq-sky/15 to-tq-gold/15 ring-1 ring-tq-gold/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3.5 h-3.5 text-tq-sky" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-tq-ink truncate">{h.concepto}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-tq-ink/30" />
                      <p className="text-[11px] text-tq-ink/45">
                        {formatFecha(h.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <span className="font-display text-lg text-emerald-700 tabular-nums">
                  +{h.puntos}
                  <span className="text-tq-gold text-sm ml-0.5">pts</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BigStat({
  icon,
  label,
  value,
  sub,
  accent,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "sky" | "gold";
  highlight?: boolean;
}) {
  const tone =
    accent === "gold"
      ? "text-tq-gold"
      : accent === "sky"
        ? "text-tq-sky"
        : "text-white/70";
  return (
    <div className={`px-5 py-5 sm:py-6 ${highlight ? "bg-tq-gold/10" : "bg-tq-ink/30"}`}>
      <div className={`flex items-center gap-1.5 ${tone}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">
          {label}
        </span>
      </div>
      <p className="font-display text-3xl sm:text-4xl text-white mt-1.5 leading-none">
        {value}
      </p>
      {sub && <p className="text-[11px] text-white/55 mt-1.5">{sub}</p>}
    </div>
  );
}

function PointsDonut({ value, center }: { value: number; center: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c * (1 - v / 100);
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="logrosDonut" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0099F2" />
            <stop offset="100%" stopColor="#C8A164" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="8" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="url(#logrosDonut)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl text-white leading-none tabular-nums">
          {center.toLocaleString("es-ES")}
        </span>
        <span className="text-[9px] uppercase tracking-[0.22em] text-tq-gold font-semibold mt-1">
          puntos
        </span>
      </div>
    </div>
  );
}
