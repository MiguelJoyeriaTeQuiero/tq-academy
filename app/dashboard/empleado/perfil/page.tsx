import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CambiarPasswordForm } from "@/components/empleado/cambiar-password-form";
import { AvatarUploader } from "@/components/empleado/avatar-uploader";
import {
  FormacionesExternasSection,
  type FormacionExterna,
} from "@/components/empleado/formaciones-externas-section";
import {
  UserCircle2,
  Mail,
  Building2,
  FolderOpen,
  ShieldCheck,
  CalendarDays,
  Trophy,
  Award,
  Flame,
  CheckCircle2,
  BookOpenCheck,
  Sparkles,
} from "lucide-react";
import type { UserRol } from "@/types/database";

export const dynamic = "force-dynamic";

const ROL_LABEL: Record<UserRol, string> = {
  super_admin: "Super Admin",
  admin_rrhh: "Admin RRHH",
  manager: "Manager",
  empleado: "Empleado",
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "TQ"
  );
}

export default async function PerfilEmpleadoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "nombre, apellido, email, rol, avatar_url, created_at, tienda_id, departamento_id",
    )
    .eq("id", user.id)
    .single();

  const [
    { data: tienda },
    { data: depto },
    { data: formaciones },
    { data: progreso },
    { count: certificadosCount },
    { data: puntos },
  ] = await Promise.all([
    profile?.tienda_id
      ? supabase
          .from("tiendas")
          .select("nombre, isla")
          .eq("id", profile.tienda_id)
          .single()
      : Promise.resolve({ data: null }),
    profile?.departamento_id
      ? supabase
          .from("departamentos")
          .select("nombre")
          .eq("id", profile.departamento_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("formaciones_externas")
      .select("*")
      .eq("user_id", user.id)
      .order("fecha_emision", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("progreso_cursos")
      .select("completado")
      .eq("usuario_id", user.id),
    supabase
      .from("certificados")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", user.id),
    supabase
      .from("puntos")
      .select("puntos_total, racha_dias")
      .eq("usuario_id", user.id)
      .maybeSingle(),
  ]);

  const nombreCompleto =
    `${profile?.nombre ?? ""} ${profile?.apellido ?? ""}`.trim();
  const email = profile?.email ?? user.email ?? "";
  const fechaAlta = profile?.created_at
    ? new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(profile.created_at))
    : "—";

  const cursosCompletados =
    (progreso ?? []).filter((p) => p.completado).length;
  const cursosEnCurso =
    (progreso ?? []).filter((p) => !p.completado).length;
  const totalFormaciones = (formaciones ?? []).length;
  const horasFormacion = (formaciones ?? []).reduce(
    (s, f) => s + (Number(f.horas) || 0),
    0,
  );
  const puntosTotales = (puntos as { puntos_total?: number } | null)?.puntos_total ?? 0;
  const racha = (puntos as { racha_dias?: number } | null)?.racha_dias ?? 0;

  const tiendaStr = tienda
    ? `${tienda.nombre}${tienda.isla ? ` · ${tienda.isla}` : ""}`
    : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ═══ HERO CARNET ═══════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl bg-tq-ink text-white">
        {/* texturas */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(circle_at_15%_20%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
        <div className="absolute -top-32 -right-20 w-[34rem] h-[34rem] rounded-full bg-tq-sky/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-tq-gold/20 blur-3xl pointer-events-none" />
        {/* filetes */}
        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-tq-gold/70 to-transparent" />
        <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
        {/* monograma decorativo enorme */}
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 font-display text-[16rem] leading-none text-white/[0.04] pointer-events-none select-none">
          {initials(nombreCompleto || email)}
        </div>

        <div className="relative px-7 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
          {/* Avatar con halo dorado */}
          <div className="relative flex-shrink-0 mx-auto lg:mx-0">
            {/* halo gold rings */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-tq-gold via-tq-sky to-tq-gold blur-md opacity-60 animate-pulse" />
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden ring-4 ring-tq-gold/60 ring-offset-4 ring-offset-tq-ink shadow-2xl bg-gradient-to-br from-tq-sky to-tq-ink flex items-center justify-center">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-5xl text-white">
                  {initials(nombreCompleto || email)}
                </span>
              )}
            </div>
            {/* badge rol flotante */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-tq-gold text-tq-ink text-[10px] uppercase tracking-[0.22em] font-semibold shadow-lg whitespace-nowrap">
              {profile?.rol ? ROL_LABEL[profile.rol as UserRol] : "—"}
            </div>
          </div>

          {/* Identidad */}
          <div className="text-center lg:text-left min-w-0">
            <p className="text-[10px] uppercase tracking-[0.32em] text-tq-gold/85 font-semibold flex items-center gap-2 justify-center lg:justify-start">
              <span className="w-6 h-px bg-tq-gold/70" />
              Carnet personal · TQ Academy
            </p>
            <h1 className="font-display text-[2.4rem] sm:text-5xl leading-[1.05] mt-3 break-words text-white">
              {profile?.nombre || "—"}{" "}
              <span className="italic text-tq-gold">
                {profile?.apellido || ""}
              </span>
            </h1>
            <p className="text-white/55 text-sm mt-2 truncate">{email}</p>

            {/* meta */}
            <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start mt-4">
              {tiendaStr && (
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/75 font-semibold px-3 py-1 rounded-full bg-white/8 ring-1 ring-white/15">
                  <Building2 className="w-3 h-3 text-tq-gold/90" />
                  {tiendaStr}
                </span>
              )}
              {depto?.nombre && (
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/75 font-semibold px-3 py-1 rounded-full bg-white/8 ring-1 ring-white/15">
                  <FolderOpen className="w-3 h-3 text-tq-gold/90" />
                  {depto.nombre}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/55 font-semibold px-3 py-1 rounded-full bg-white/5 ring-1 ring-white/10">
                <CalendarDays className="w-3 h-3" />
                Desde {fechaAlta}
              </span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-white/10">
          <HeroStat
            icon={CheckCircle2}
            value={cursosCompletados}
            label="Cursos completados"
          />
          <HeroStat
            icon={BookOpenCheck}
            value={cursosEnCurso}
            label="En curso"
          />
          <HeroStat
            icon={Award}
            value={certificadosCount ?? 0}
            label="Certificados"
            highlight
          />
          <HeroStat
            icon={Trophy}
            value={puntosTotales}
            label="Puntos totales"
          />
          <HeroStat
            icon={Flame}
            value={`${racha}d`}
            label="Racha"
          />
        </div>
      </section>

      {/* ═══ AVATAR + INFO en dos columnas ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
        {/* Avatar uploader card */}
        <section className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-6">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-tq-sky" />
              <p className="tq-eyebrow">Imagen</p>
            </div>
            <h2 className="tq-headline text-xl">Foto de perfil</h2>
            <p className="text-tq-ink/55 text-sm mt-1.5">
              Aparecerá en el menú lateral, en rankings y en tus certificados.
            </p>
            <div className="mt-5">
              <AvatarUploader
                currentUrl={profile?.avatar_url ?? null}
                userName={nombreCompleto || email}
              />
            </div>
          </div>
        </section>

        {/* Datos personales card con vertical rule dorada */}
        <section className="relative bg-white rounded-2xl border border-tq-ink/10 shadow-tq-soft overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-tq-gold/40 to-transparent" />
          {/* línea vertical decorativa */}
          <div className="absolute left-0 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-tq-gold/40 to-transparent" />
          <div className="px-6 pt-7 pb-6">
            <div className="flex items-center gap-2 mb-1">
              <UserCircle2 className="w-4 h-4 text-tq-sky" />
              <p className="tq-eyebrow">Datos</p>
            </div>
            <h2 className="tq-headline text-xl">Información personal</h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mt-5">
              <Field
                icon={UserCircle2}
                label="Nombre completo"
                value={nombreCompleto || "—"}
              />
              <Field icon={Mail} label="Email" value={email} />
              <Field
                icon={ShieldCheck}
                label="Rol"
                value={profile?.rol ? ROL_LABEL[profile.rol as UserRol] : "—"}
              />
              <Field
                icon={Building2}
                label="Tienda"
                value={tiendaStr ?? "—"}
              />
              <Field
                icon={FolderOpen}
                label="Departamento"
                value={depto?.nombre ?? "—"}
              />
              <Field
                icon={CalendarDays}
                label="Miembro desde"
                value={fechaAlta}
              />
            </dl>

            <p className="text-[11px] text-tq-ink/45 mt-6 italic flex items-center gap-2">
              <span className="w-4 h-px bg-tq-gold/40" />
              ¿Algún dato incorrecto? Contacta con RRHH.
            </p>
          </div>
        </section>
      </div>

      {/* ═══ Resumen formación externa (mini KPI) ═══════════ */}
      {totalFormaciones > 0 && (
        <section className="grid grid-cols-2 gap-px bg-tq-ink/10 rounded-2xl overflow-hidden border border-tq-ink/10 shadow-tq-soft">
          <ProfileMiniKpi
            icon={Award}
            value={totalFormaciones}
            label="Formaciones externas"
            accent="gold"
          />
          <ProfileMiniKpi
            icon={CalendarDays}
            value={`${horasFormacion}h`}
            label="Horas acumuladas"
            accent="sky"
          />
        </section>
      )}

      {/* ═══ Formaciones externas ════════════════════════════ */}
      <FormacionesExternasSection
        initial={(formaciones ?? []) as FormacionExterna[]}
      />

      {/* ═══ Seguridad ══════════════════════════════════════ */}
      <CambiarPasswordForm email={email} />
    </div>
  );
}

function HeroStat({
  icon: Icon,
  value,
  label,
  highlight,
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="relative px-5 py-5 sm:py-6 border-r last:border-r-0 border-white/10 group hover:bg-white/[0.03] transition-colors">
      <div
        className={`flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] font-semibold ${
          highlight ? "text-tq-gold" : "text-white/55"
        }`}
      >
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <p className="font-display text-3xl sm:text-4xl text-white tabular-nums leading-none mt-2">
        {typeof value === "number" ? value.toLocaleString("es-ES") : value}
      </p>
      {highlight && (
        <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-tq-gold/70 to-transparent" />
      )}
    </div>
  );
}

function ProfileMiniKpi({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  accent: "sky" | "gold";
}) {
  const tones =
    accent === "sky"
      ? "from-tq-sky/15 to-tq-sky/5 text-tq-sky"
      : "from-tq-gold/25 to-tq-gold/5 text-tq-gold2";
  return (
    <div className="bg-white p-5 sm:p-6 flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/50 font-semibold">
          {label}
        </p>
        <p className="font-display text-3xl sm:text-4xl text-tq-ink mt-2 tabular-nums leading-none">
          {typeof value === "number" ? value.toLocaleString("es-ES") : value}
        </p>
      </div>
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${tones}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-tq-paper flex items-center justify-center flex-shrink-0 ring-1 ring-tq-ink/10">
        <Icon className="w-4 h-4 text-tq-ink/55" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/45 font-semibold">
          {label}
        </dt>
        <dd className="font-display text-base text-tq-ink truncate mt-0.5">
          {value}
        </dd>
      </div>
    </div>
  );
}
