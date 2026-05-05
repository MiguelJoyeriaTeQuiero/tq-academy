import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Mail, Building2, Layers, CalendarDays,
  BookOpen, CheckCircle2, Clock, GraduationCap, Award, ExternalLink,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ROL_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin_rrhh: "Admin RRHH",
  manager: "Manager",
  empleado: "Empleado",
};

const ROL_TONE: Record<string, string> = {
  super_admin: "bg-tq-ink/10 text-tq-ink ring-tq-ink/20",
  admin_rrhh: "bg-tq-sky/10 text-tq-sky ring-tq-sky/30",
  manager: "bg-tq-gold/15 text-tq-gold2 ring-tq-gold/40",
  empleado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const FORMACION_LABEL: Record<string, string> = {
  master: "Máster",
  postgrado: "Postgrado",
  grado: "Grado",
  curso: "Curso",
  taller: "Taller",
  certificacion: "Certificación",
  jornada: "Jornada",
  congreso: "Congreso",
  otro: "Otro",
};

const FORMACION_TONE: Record<string, string> = {
  master: "bg-purple-50 text-purple-700 ring-purple-200",
  postgrado: "bg-violet-50 text-violet-700 ring-violet-200",
  grado: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  curso: "bg-tq-sky/10 text-tq-sky ring-tq-sky/30",
  taller: "bg-tq-gold/15 text-tq-gold2 ring-tq-gold/40",
  certificacion: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  jornada: "bg-orange-50 text-orange-700 ring-orange-200",
  congreso: "bg-pink-50 text-pink-700 ring-pink-200",
  otro: "bg-tq-ink/8 text-tq-ink/60 ring-tq-ink/15",
};

function initials(nombre: string, apellido: string) {
  return (
    [nombre[0], apellido[0]]
      .filter(Boolean)
      .map((c) => c.toUpperCase())
      .join("") || "?"
  );
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatFechaCorta(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default async function FichaUsuarioPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [
    { data: usuario },
    { data: progresoCursos },
    { data: asignacionesDirectas },
    { data: formaciones },
    { data: certificados },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, tiendas(nombre, isla), departamentos(nombre)")
      .eq("id", params.id)
      .single(),

    // Cursos con progreso real del usuario
    supabase
      .from("progreso_cursos")
      .select("*, cursos(id, titulo, imagen_url, activo)")
      .eq("usuario_id", params.id)
      .order("updated_at", { ascending: false }),

    // Asignaciones directas al usuario (puede haber cursos sin progreso aún)
    supabase
      .from("asignaciones")
      .select("*, cursos(id, titulo, imagen_url, activo)")
      .eq("tipo_destino", "usuario")
      .eq("destino_id", params.id),

    // Formaciones externas
    supabase
      .from("formaciones_externas")
      .select("*")
      .eq("user_id", params.id)
      .order("fecha_emision", { ascending: false }),

    // Certificados de cursos
    supabase
      .from("certificados")
      .select("*, cursos(titulo)")
      .eq("usuario_id", params.id)
      .order("fecha_emision", { ascending: false }),
  ]);

  if (!usuario) notFound();

  const fullName = `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim() || usuario.email;
  const tienda = (usuario.tiendas as any)?.nombre ?? null;
  const isla = (usuario.tiendas as any)?.isla ?? null;
  const depto = (usuario.departamentos as any)?.nombre ?? null;

  // Construir lista unificada de cursos
  const progMap = new Map((progresoCursos ?? []).map((p) => [(p.cursos as any)?.id, p]));
  const asigMap = new Map((asignacionesDirectas ?? []).map((a) => [(a.cursos as any)?.id, a]));

  // Todos los cursos únicos (con o sin progreso)
  const cursosIds = new Set([...progMap.keys(), ...asigMap.keys()].filter(Boolean));
  const cursos = Array.from(cursosIds).map((id) => {
    const prog = progMap.get(id);
    const asig = asigMap.get(id);
    const curso = (prog?.cursos ?? asig?.cursos) as any;
    return { id, titulo: curso?.titulo ?? "—", imagen_url: curso?.imagen_url ?? null, progreso: prog ?? null, asignacion: asig ?? null };
  });

  const cursosCompletados = cursos.filter((c) => c.progreso?.completado);
  const cursosEnCurso = cursos.filter((c) => c.progreso && !c.progreso.completado);
  const cursosAsignadosSinIniciar = cursos.filter((c) => !c.progreso && c.asignacion);
  const totalHorasFormacion = (formaciones ?? []).reduce((s, f) => s + (f.horas ?? 0), 0);

  return (
    <div className="max-w-4xl space-y-6">
      {/* ── Back ──────────────────────────────────────────── */}
      <Link
        href="/dashboard/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-tq-ink/50 hover:text-tq-ink transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Usuarios
      </Link>

      {/* ── Hero card ─────────────────────────────────────── */}
      <div className="tq-card overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-tq-ink via-tq-deep to-[#0a2040] relative">
          <div className="absolute inset-0 tq-noise opacity-30" />
          {/* línea dorada inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />
          {/* Botón editar — ancla arriba a la derecha del banner */}
          <div className="absolute top-4 right-5">
            <Link
              href={`/dashboard/admin/usuarios/${params.id}/editar`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <Pencil className="w-3 h-3" />
              Editar
            </Link>
          </div>
        </div>

        {/* Avatar — absolute sobre el borde del banner */}
        <div className="relative px-6 pb-6">
          <div className="absolute -top-10 left-6">
            {usuario.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={usuario.avatar_url}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-tq-card"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center text-white text-2xl font-semibold ring-4 ring-white shadow-tq-card">
                {initials(usuario.nombre ?? "", usuario.apellido ?? "")}
              </div>
            )}
          </div>

          {/* Nombre y badges — empujan hacia abajo dejando espacio al avatar */}
          <div className="pt-14">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`inline-flex items-center text-[10px] uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-full ring-1 ${
                  ROL_TONE[usuario.rol as string] ?? "bg-tq-paper text-tq-ink/60 ring-tq-ink/15"
                }`}
              >
                {ROL_LABEL[usuario.rol as string] ?? usuario.rol}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${
                usuario.activo
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-rose-50 text-rose-600 ring-rose-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${usuario.activo ? "bg-emerald-500" : "bg-rose-400"}`} />
                {usuario.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-tq-ink leading-tight">{fullName}</h1>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-tq-ink/8">
            <InfoChip icon={Mail} label={usuario.email} />
            {tienda && <InfoChip icon={Building2} label={tienda} sub={isla ?? undefined} />}
            {depto && <InfoChip icon={Layers} label={depto} />}
            <InfoChip icon={CalendarDays} label={`Alta: ${formatFecha(usuario.created_at)}`} />
          </div>
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Cursos activos",    value: cursos.length,                icon: BookOpen,      color: "text-tq-sky" },
          { label: "Completados",        value: cursosCompletados.length,     icon: CheckCircle2,  color: "text-emerald-600" },
          { label: "En curso",           value: cursosEnCurso.length,         icon: Clock,         color: "text-amber-600" },
          { label: "Formaciones externas", value: formaciones?.length ?? 0,  icon: GraduationCap, color: "text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="tq-card p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-tq-ink/50 leading-tight">{label}</span>
              <Icon className={`w-4 h-4 ${color} opacity-70 shrink-0`} />
            </div>
            <p className={`text-3xl font-display font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Cursos ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-tq-ink/40" />
          <h2 className="font-semibold text-tq-ink">Cursos</h2>
          <span className="text-xs text-tq-ink/40 ml-1">{cursos.length} total</span>
        </div>

        {cursos.length === 0 ? (
          <div className="tq-card p-8 text-center">
            <BookOpen className="w-8 h-8 text-tq-ink/20 mx-auto mb-2" />
            <p className="text-sm text-tq-ink/50">No tiene cursos asignados ni en progreso.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* En curso */}
            {cursosEnCurso.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> En curso ({cursosEnCurso.length})
                </p>
                <div className="space-y-2">
                  {cursosEnCurso.map((c) => (
                    <CursoRow key={c.id} curso={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Completados */}
            {cursosCompletados.length > 0 && (
              <div className={cursosEnCurso.length > 0 ? "mt-4" : ""}>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-600 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Completados ({cursosCompletados.length})
                </p>
                <div className="space-y-2">
                  {cursosCompletados.map((c) => (
                    <CursoRow key={c.id} curso={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Asignados sin iniciar */}
            {cursosAsignadosSinIniciar.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-tq-ink/40 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> Sin iniciar ({cursosAsignadosSinIniciar.length})
                </p>
                <div className="space-y-2">
                  {cursosAsignadosSinIniciar.map((c) => (
                    <CursoRow key={c.id} curso={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Certificados ───────────────────────────────────── */}
      {(certificados?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-tq-ink/40" />
            <h2 className="font-semibold text-tq-ink">Certificados obtenidos</h2>
          </div>
          <div className="tq-card divide-y divide-tq-ink/6">
            {certificados!.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-tq-gold/15 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-tq-gold2" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-tq-ink truncate">{(cert.cursos as any)?.titulo ?? "—"}</p>
                    <p className="text-xs text-tq-ink/50">{formatFechaCorta(cert.fecha_emision)}</p>
                  </div>
                </div>
                {cert.url_pdf && (
                  <a
                    href={cert.url_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-xs text-tq-sky hover:underline"
                  >
                    PDF <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Formaciones externas ───────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-4 h-4 text-tq-ink/40" />
          <h2 className="font-semibold text-tq-ink">Formaciones externas</h2>
          {totalHorasFormacion > 0 && (
            <span className="text-xs text-tq-ink/45 ml-1">{totalHorasFormacion} h totales</span>
          )}
        </div>

        {(formaciones?.length ?? 0) === 0 ? (
          <div className="tq-card p-8 text-center">
            <GraduationCap className="w-8 h-8 text-tq-ink/20 mx-auto mb-2" />
            <p className="text-sm text-tq-ink/50">Sin formaciones externas registradas.</p>
          </div>
        ) : (
          <div className="tq-card divide-y divide-tq-ink/6">
            {formaciones!.map((f) => (
              <div key={f.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium text-tq-ink">{f.titulo}</p>
                    <span className={`inline-flex items-center text-[10px] uppercase tracking-[0.12em] font-semibold px-1.5 py-0.5 rounded-full ring-1 ${
                      FORMACION_TONE[f.tipo] ?? "bg-tq-paper text-tq-ink/60 ring-tq-ink/15"
                    }`}>
                      {FORMACION_LABEL[f.tipo] ?? f.tipo}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tq-ink/55">
                    {f.entidad && <span>{f.entidad}</span>}
                    {f.fecha_emision && <span>{formatFechaCorta(f.fecha_emision)}</span>}
                    {f.horas != null && f.horas > 0 && <span>{f.horas} h</span>}
                  </div>
                  {f.descripcion && (
                    <p className="text-xs text-tq-ink/45 mt-1 line-clamp-2">{f.descripcion}</p>
                  )}
                </div>
                {f.archivo_url && (
                  <a
                    href={f.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-xs text-tq-sky hover:underline mt-0.5"
                  >
                    Ver cert. <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function InfoChip({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-tq-ink/65">
      <Icon className="w-3.5 h-3.5 text-tq-ink/35 shrink-0" />
      <span>{label}</span>
      {sub && <span className="text-tq-ink/35">· {sub}</span>}
    </div>
  );
}

function CursoRow({ curso }: { curso: { id: string; titulo: string; imagen_url: string | null; progreso: any; asignacion: any } }) {
  const pct = curso.progreso?.porcentaje ?? 0;
  const completado = curso.progreso?.completado ?? false;
  const sinIniciar = !curso.progreso;

  return (
    <div className="tq-card px-4 py-3 flex items-center gap-4">
      {/* icono / imagen */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        completado ? "bg-emerald-100" : sinIniciar ? "bg-tq-ink/5" : "bg-tq-sky/10"
      }`}>
        {completado
          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          : sinIniciar
          ? <BookOpen className="w-4 h-4 text-tq-ink/30" />
          : <Clock className="w-4 h-4 text-tq-sky" />
        }
      </div>

      {/* título + barra */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-tq-ink truncate leading-tight">{curso.titulo}</p>
        {!sinIniciar && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-tq-ink/8 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completado ? "bg-emerald-500" : "bg-tq-sky"}`}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
            <span className="text-[11px] text-tq-ink/45 tabular-nums shrink-0">{pct}%</span>
          </div>
        )}
      </div>

      {/* fecha completado / límite */}
      <div className="text-right shrink-0 hidden sm:block">
        {completado && curso.progreso?.fecha_completado && (
          <p className="text-[11px] text-emerald-600 font-medium">
            {new Date(curso.progreso.fecha_completado).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
        {!completado && curso.asignacion?.fecha_limite && (
          <p className="text-[11px] text-tq-ink/40">
            Límite: {new Date(curso.asignacion.fecha_limite).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </p>
        )}
        {sinIniciar && curso.asignacion?.obligatorio && (
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full ring-1 ring-amber-200">
            Obligatorio
          </span>
        )}
      </div>
    </div>
  );
}
