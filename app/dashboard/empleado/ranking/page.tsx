import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Trophy, Medal, Star, Crown, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface RankingRow {
  usuario_id: string;
  puntos_total: number;
  nombre: string;
  apellido: string;
  tienda: string | null;
}

function initials(nombre: string, apellido: string) {
  return `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase() || "TQ";
}

export default async function RankingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, apellido, tienda_id, tiendas(nombre)")
    .eq("id", user.id)
    .single();

  const { data: puntosData } = await supabase
    .from("puntos")
    .select("usuario_id, puntos_total")
    .order("puntos_total", { ascending: false })
    .limit(50);

  if (!puntosData || puntosData.length === 0) {
    return (
      <div className="space-y-8">
        <RankHero pos={0} pts={0} nombre={profile?.nombre ?? ""} />
        <EmptyRanking />
      </div>
    );
  }

  const usuarioIds = puntosData.map((p) => p.usuario_id);
  const { data: perfiles } = await supabase
    .from("profiles")
    .select("id, nombre, apellido, tienda_id, tiendas(nombre)")
    .in("id", usuarioIds);

  const perfilMap = new Map(
    (perfiles ?? []).map((p) => [
      p.id,
      {
        nombre: p.nombre,
        apellido: p.apellido,
        tienda:
          (p.tiendas as unknown as { nombre: string } | null)?.nombre ?? null,
        tienda_id: p.tienda_id,
      },
    ]),
  );

  const rankingGlobal: RankingRow[] = puntosData
    .map((p) => {
      const pf = perfilMap.get(p.usuario_id);
      return {
        usuario_id: p.usuario_id,
        puntos_total: p.puntos_total,
        nombre: pf?.nombre ?? "—",
        apellido: pf?.apellido ?? "",
        tienda: pf?.tienda ?? null,
      };
    })
    .slice(0, 10);

  const posGlobal = puntosData.findIndex((p) => p.usuario_id === user.id) + 1;
  const userPuntos =
    puntosData.find((p) => p.usuario_id === user.id)?.puntos_total ?? 0;
  const userEnTop10Global = posGlobal > 0 && posGlobal <= 10;

  const miTiendaId = profile?.tienda_id;
  const miTienda =
    (profile?.tiendas as unknown as { nombre: string } | null)?.nombre ?? null;

  const rankingTienda: (RankingRow & { pos: number })[] = miTiendaId
    ? puntosData
        .filter((p) => perfilMap.get(p.usuario_id)?.tienda_id === miTiendaId)
        .map((p, idx) => {
          const pf = perfilMap.get(p.usuario_id);
          return {
            usuario_id: p.usuario_id,
            puntos_total: p.puntos_total,
            nombre: pf?.nombre ?? "—",
            apellido: pf?.apellido ?? "",
            tienda: pf?.tienda ?? null,
            pos: idx + 1,
          };
        })
        .slice(0, 10)
    : [];

  const posTienda = miTiendaId
    ? puntosData
        .filter((p) => perfilMap.get(p.usuario_id)?.tienda_id === miTiendaId)
        .findIndex((p) => p.usuario_id === user.id) + 1
    : 0;

  const podio = rankingGlobal.slice(0, 3);
  const resto = rankingGlobal.slice(3);

  return (
    <div className="space-y-8">
      <RankHero pos={posGlobal} pts={userPuntos} nombre={profile?.nombre ?? ""} totalParticipantes={puntosData.length} />

      {/* PODIO */}
      {podio.length >= 1 && (
        <section>
          <header className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2">
              <span className="w-5 h-px bg-tq-gold/70" />
              Podio
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
              Top 3 global
            </h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 0, 2].map((sortIdx) => {
              const row = podio[sortIdx];
              if (!row) return <div key={sortIdx} />;
              const pos = sortIdx + 1;
              const isMe = row.usuario_id === user.id;
              const isFirst = pos === 1;
              return (
                <div
                  key={row.usuario_id}
                  className={`relative rounded-2xl p-6 text-center ring-1 ${
                    isFirst
                      ? "bg-gradient-to-br from-tq-gold/30 via-tq-gold/15 to-transparent ring-tq-gold/60 sm:scale-105 sm:py-8 shadow-tq-gold"
                      : pos === 2
                        ? "bg-gradient-to-br from-tq-paper to-tq-cream ring-tq-ink/15"
                        : "bg-gradient-to-br from-tq-paper to-tq-cream ring-tq-ink/15"
                  } ${isMe ? "ring-2 ring-tq-sky" : ""}`}
                >
                  <div className="absolute top-3 right-3 font-display text-tq-ink/15 text-4xl tabular-nums">
                    {pos}
                  </div>
                  {isFirst && (
                    <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 text-tq-gold drop-shadow-md" />
                  )}
                  <div
                    className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center font-display text-2xl text-white shadow-md ring-2 ring-offset-2 ring-offset-tq-paper ${
                      isFirst
                        ? "bg-gradient-to-br from-tq-gold to-amber-700 ring-tq-gold/60"
                        : pos === 2
                          ? "bg-gradient-to-br from-tq-sky to-tq-ink ring-tq-sky/40"
                          : "bg-gradient-to-br from-amber-600 to-amber-800 ring-amber-700/40"
                    }`}
                  >
                    {initials(row.nombre, row.apellido)}
                  </div>
                  <p className="font-display text-lg text-tq-ink leading-tight mt-3 truncate">
                    {row.nombre} {row.apellido}
                    {isMe && (
                      <span className="block text-[10px] text-tq-sky uppercase tracking-[0.22em] font-semibold mt-0.5">
                        (tú)
                      </span>
                    )}
                  </p>
                  {row.tienda && (
                    <p className="text-[11px] text-tq-ink/55 truncate mt-0.5">
                      {row.tienda}
                    </p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tq-ink/5 ring-1 ring-tq-ink/10">
                    <Star className="w-3.5 h-3.5 text-tq-gold" />
                    <span className="font-display text-lg text-tq-ink tabular-nums leading-none">
                      {row.puntos_total.toLocaleString("es-ES")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* LEADERBOARD GLOBAL */}
      <section>
        <header className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold flex items-center gap-2">
              <span className="w-5 h-px bg-tq-gold/70" />
              Clasificación
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
              Ranking global
            </h2>
          </div>
          <p className="text-xs text-tq-ink/55">Top 10</p>
        </header>

        <RankingTable
          rows={resto}
          startPos={4}
          currentUserId={user.id}
          userPos={posGlobal}
          userPts={userPuntos}
          userNombre={profile?.nombre ?? ""}
          userApellido={profile?.apellido ?? ""}
          showCurrentIfNotTop={!userEnTop10Global}
        />
      </section>

      {/* RANKING TIENDA */}
      {rankingTienda.length > 0 && miTienda && (
        <section>
          <header className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-tq-sky font-semibold flex items-center gap-2">
                <span className="w-5 h-px bg-tq-sky/70" />
                Mi tienda
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-tq-ink mt-1">
                {miTienda}
              </h2>
            </div>
            <Medal className="w-5 h-5 text-tq-sky" />
          </header>
          <RankingTable
            rows={rankingTienda}
            startPos={1}
            currentUserId={user.id}
            userPos={posTienda}
            userPts={userPuntos}
            userNombre={profile?.nombre ?? ""}
            userApellido={profile?.apellido ?? ""}
            showCurrentIfNotTop={posTienda > 10}
          />
        </section>
      )}
    </div>
  );
}

function RankHero({
  pos,
  pts,
  nombre,
  totalParticipantes,
}: {
  pos: number;
  pts: number;
  nombre: string;
  totalParticipantes?: number;
}) {
  const nombreCorto = nombre?.split(" ")[0] || "alumno";
  return (
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
      <Trophy className="absolute -right-6 top-6 w-64 h-64 text-white/[0.04]" strokeWidth={1} />

      <div className="relative px-6 sm:px-10 py-10 sm:py-14 grid lg:grid-cols-[1fr_auto] gap-10 items-end">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.32em] text-tq-gold/85 font-semibold flex items-center gap-2">
            <span className="w-6 h-px bg-tq-gold/70" />
            Liga TQ Academy
          </p>
          <h1 className="font-display text-[2.4rem] sm:text-6xl leading-[1.02] mt-3 break-words text-white">
            {pos > 0 ? (
              <>
                Puesto <span className="italic text-tq-gold">#{pos}</span>
              </>
            ) : (
              <>
                Hola, <span className="italic text-tq-gold">{nombreCorto}</span>
              </>
            )}
          </h1>
          <p className="text-white/70 text-base mt-3 max-w-xl leading-relaxed">
            {pos > 0
              ? `${pts.toLocaleString("es-ES")} puntos acumulados${
                  totalParticipantes ? ` · ${totalParticipantes} participantes` : ""
                }. Sigue completando lecciones para escalar posiciones.`
              : "Aún no estás clasificado. Completa lecciones y exámenes para entrar en el ranking."}
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            <Link
              href="/dashboard/empleado/logros"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/15 hover:bg-white/15 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-tq-gold/90" />
              Mis logros
            </Link>
            <Link
              href="/dashboard/empleado"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/15 hover:bg-white/15 transition-colors"
            >
              Mis cursos
            </Link>
          </div>
        </div>

        {/* Mi tarjeta */}
        <div className="shrink-0 w-full sm:w-auto sm:min-w-[18rem] rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-tq-gold/90 font-semibold">
            Tu posición
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-5xl text-white leading-none tabular-nums">
              {pos > 0 ? `#${pos}` : "—"}
            </span>
            {pos > 0 && pos <= 3 && (
              <Crown className="w-5 h-5 text-tq-gold mb-1" />
            )}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-tq-gold" />
            <span className="font-display text-2xl text-white tabular-nums leading-none">
              {pts.toLocaleString("es-ES")}
            </span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/60 font-semibold ml-0.5">
              pts
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function RankingTable({
  rows,
  startPos,
  currentUserId,
  userPos,
  userPts,
  userNombre,
  userApellido,
  showCurrentIfNotTop,
}: {
  rows: RankingRow[];
  startPos: number;
  currentUserId: string;
  userPos: number;
  userPts: number;
  userNombre: string;
  userApellido: string;
  showCurrentIfNotTop: boolean;
}) {
  const inTop = rows.some((r) => r.usuario_id === currentUserId);

  return (
    <div className="bg-tq-paper rounded-2xl ring-1 ring-tq-ink/8 overflow-hidden divide-y divide-tq-ink/5">
      {rows.map((row, idx) => {
        const pos = startPos + idx;
        const isMe = row.usuario_id === currentUserId;
        return (
          <div
            key={row.usuario_id}
            className={`px-5 py-4 flex items-center gap-4 transition-colors ${
              isMe ? "bg-tq-sky/8 ring-1 ring-inset ring-tq-sky/30" : "hover:bg-tq-ink/[0.02]"
            }`}
          >
            <span className="font-display text-tq-ink/30 text-2xl tabular-nums w-10 flex-shrink-0">
              {String(pos).padStart(2, "0")}
            </span>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-1 ${
                isMe
                  ? "bg-gradient-to-br from-tq-sky to-tq-ink ring-tq-sky/40"
                  : "bg-gradient-to-br from-tq-ink/60 to-tq-ink ring-tq-ink/15"
              }`}
            >
              {initials(row.nombre, row.apellido)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-tq-ink truncate">
                {row.nombre} {row.apellido}
                {isMe && (
                  <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-tq-sky font-semibold">
                    (tú)
                  </span>
                )}
              </p>
              {row.tienda && (
                <p className="text-xs text-tq-ink/50 truncate">{row.tienda}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-tq-gold" />
              <span className="font-display text-base text-tq-ink tabular-nums leading-none">
                {row.puntos_total.toLocaleString("es-ES")}
              </span>
            </div>
          </div>
        );
      })}

      {showCurrentIfNotTop && !inTop && userPos > 0 && (
        <>
          <div className="px-5 py-2 text-center">
            <span className="text-tq-ink/25 tracking-[0.4em] text-xs">· · ·</span>
          </div>
          <div className="px-5 py-4 flex items-center gap-4 bg-tq-sky/8 ring-1 ring-inset ring-tq-sky/30">
            <span className="font-display text-tq-sky text-2xl tabular-nums w-10 flex-shrink-0">
              {String(userPos).padStart(2, "0")}
            </span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tq-sky to-tq-ink ring-1 ring-tq-sky/40 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials(userNombre, userApellido)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-tq-ink">
                {userNombre} {userApellido}
                <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-tq-sky font-semibold">
                  (tú)
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-tq-gold" />
              <span className="font-display text-base text-tq-ink tabular-nums leading-none">
                {userPts.toLocaleString("es-ES")}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyRanking() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-tq-paper ring-1 ring-tq-ink/10 px-8 py-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center text-white">
        <Trophy className="w-7 h-7" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-tq-gold font-semibold mt-5">
        Liga vacía
      </p>
      <h3 className="font-display text-2xl text-tq-ink mt-2">
        Aún no hay datos de ranking
      </h3>
      <p className="text-sm text-tq-ink/60 mt-2 max-w-md mx-auto">
        Completa lecciones y exámenes para aparecer en la clasificación.
      </p>
    </section>
  );
}
