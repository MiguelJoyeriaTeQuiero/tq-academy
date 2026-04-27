import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  computeComplianceStatus,
  STATUS_META,
  type ComplianceStatus,
  diasHasta,
} from "@/lib/compliance";

interface EmpleadoCursoEstado {
  empleadoId: string;
  empleadoNombre: string;
  cursoId: string;
  cursoTitulo: string;
  fechaLimite: string | null;
  porcentaje: number;
  completado: boolean;
  status: ComplianceStatus;
  asignacionId: string;
}

export default async function ComplianceManagerPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, tienda_id")
    .eq("id", user.id)
    .single();
  if (!profile || profile.rol !== "manager") {
    redirect("/dashboard");
  }
  if (!profile.tienda_id) {
    return (
      <div className="rounded-xl border bg-amber-50 border-amber-200 p-6 text-amber-900">
        No tienes una tienda asignada. Contacta con RRHH.
      </div>
    );
  }

  // 1) Empleados de mi tienda
  const { data: empleados } = await supabase
    .from("profiles")
    .select("id, nombre, apellido, departamento_id")
    .eq("tienda_id", profile.tienda_id)
    .eq("activo", true);

  const empleadoIds = (empleados ?? []).map((e) => e.id as string);
  const empleadoNombre = new Map(
    (empleados ?? []).map((e) => [
      e.id as string,
      `${e.nombre} ${e.apellido}`.trim(),
    ]),
  );

  if (empleadoIds.length === 0) {
    return emptyState("No tienes empleados asignados a tu tienda.");
  }

  // 2) Asignaciones obligatorias que afectan a mi equipo:
  //    - destino = cada empleado concreto (tipo_destino: "usuario")
  //    - destino = mi tienda
  //    - destino = departamento de algún empleado
  const deptoIds = Array.from(
    new Set(
      (empleados ?? [])
        .map((e: { departamento_id?: string | null }) => e.departamento_id)
        .filter((v): v is string => !!v),
    ),
  );

  const filters = [
    `and(tipo_destino.eq.usuario,destino_id.in.(${empleadoIds.join(",")}))`,
    `and(tipo_destino.eq.tienda,destino_id.eq.${profile.tienda_id})`,
    deptoIds.length
      ? `and(tipo_destino.eq.departamento,destino_id.in.(${deptoIds.join(",")}))`
      : null,
  ].filter(Boolean) as string[];

  const { data: asignsRaw } = await supabase
    .from("asignaciones")
    .select("id, curso_id, tipo_destino, destino_id, fecha_limite, obligatorio")
    .eq("obligatorio", true)
    .or(filters.join(","));

  const asignaciones = asignsRaw ?? [];
  if (asignaciones.length === 0) {
    return emptyState("Tu equipo no tiene cursos obligatorios pendientes.");
  }

  const cursoIds = Array.from(new Set(asignaciones.map((a) => a.curso_id as string)));
  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, titulo")
    .in("id", cursoIds);
  const cursoTitulo = new Map(
    (cursos ?? []).map((c) => [c.id as string, c.titulo as string]),
  );

  // 3) Progreso de mis empleados en esos cursos
  const { data: progresos } = await supabase
    .from("progreso_cursos")
    .select("usuario_id, curso_id, completado, porcentaje")
    .in("usuario_id", empleadoIds)
    .in("curso_id", cursoIds);

  const progresoMap = new Map<string, { completado: boolean; porcentaje: number }>();
  for (const p of progresos ?? []) {
    progresoMap.set(`${p.usuario_id}|${p.curso_id}`, {
      completado: p.completado as boolean,
      porcentaje: p.porcentaje as number,
    });
  }

  // 4) Expandir: (empleado, asignación) pairs
  const estados: EmpleadoCursoEstado[] = [];
  for (const a of asignaciones) {
    const aplicaA =
      a.tipo_destino === "usuario" ? [a.destino_id as string] : empleadoIds;
    for (const uid of aplicaA) {
      if (!empleadoIds.includes(uid)) continue;
      const prog = progresoMap.get(`${uid}|${a.curso_id}`);
      const status = computeComplianceStatus({
        obligatorio: true,
        fecha_limite: (a.fecha_limite as string | null) ?? null,
        completado: prog?.completado ?? false,
        porcentaje: prog?.porcentaje ?? 0,
      });
      estados.push({
        empleadoId: uid,
        empleadoNombre: empleadoNombre.get(uid) ?? "—",
        cursoId: a.curso_id as string,
        cursoTitulo: cursoTitulo.get(a.curso_id as string) ?? "(curso)",
        fechaLimite: (a.fecha_limite as string | null) ?? null,
        porcentaje: prog?.porcentaje ?? 0,
        completado: prog?.completado ?? false,
        status,
        asignacionId: a.id as string,
      });
    }
  }

  // Ordenar: vencidos > en_riesgo > pendiente > en_curso > completado, luego por fecha
  const statusOrder: Record<ComplianceStatus, number> = {
    vencido: 0,
    en_riesgo: 1,
    pendiente: 2,
    en_curso: 3,
    completado: 4,
  };
  estados.sort((a, b) => {
    const d = statusOrder[a.status] - statusOrder[b.status];
    if (d !== 0) return d;
    const fa = a.fechaLimite ?? "9999";
    const fb = b.fechaLimite ?? "9999";
    return fa.localeCompare(fb);
  });

  const vencidos = estados.filter((e) => e.status === "vencido").length;
  const enRiesgo = estados.filter((e) => e.status === "en_riesgo").length;
  const completados = estados.filter((e) => e.status === "completado").length;
  const cumplPct =
    estados.length > 0 ? Math.round((completados / estados.length) * 100) : 100;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold">Cumplimiento de mi equipo</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Estado de las formaciones obligatorias asignadas a tus empleados.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={ShieldAlert} label="Pendientes" value={estados.length - completados} />
        <Kpi icon={CheckCircle2} label="Cumplimiento" value={`${cumplPct}%`} tone="green" />
        <Kpi icon={AlertTriangle} label="En riesgo" value={enRiesgo} tone="amber" />
        <Kpi icon={AlertCircle} label="Vencidos" value={vencidos} tone="red" />
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Fecha límite</TableHead>
              <TableHead className="text-right">Progreso</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estados.map((e, i) => {
              const meta = STATUS_META[e.status];
              const dias = e.fechaLimite ? diasHasta(e.fechaLimite) : null;
              return (
                <TableRow key={`${e.empleadoId}-${e.asignacionId}-${i}`}>
                  <TableCell className="text-sm font-medium">
                    {e.empleadoNombre}
                  </TableCell>
                  <TableCell className="text-sm">{e.cursoTitulo}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {e.fechaLimite ? (
                      <>
                        {new Intl.DateTimeFormat("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(e.fechaLimite))}
                        {dias !== null && e.status !== "completado" && (
                          <span
                            className={`ml-2 text-xs ${
                              dias < 0
                                ? "text-red-700"
                                : dias <= 7
                                  ? "text-amber-700"
                                  : "text-muted-foreground"
                            }`}
                          >
                            ({dias < 0 ? `${Math.abs(dias)}d vencida` : `${dias}d`})
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {e.porcentaje}%
                  </TableCell>
                  <TableCell>
                    <Badge className={meta.className} variant="secondary">
                      {meta.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function emptyState(msg: string) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-heading font-bold">Cumplimiento de mi equipo</h1>
      <div className="rounded-xl border bg-white p-10 text-center text-sm text-muted-foreground">
        {msg}
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon?: React.ElementType;
  label: string;
  value: string | number;
  tone?: "green" | "amber" | "red";
}) {
  const toneText =
    tone === "green"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "red"
          ? "text-red-700"
          : "text-gray-900";
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="w-4 h-4 text-muted-foreground" /> : null}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-2xl font-semibold mt-1 ${toneText}`}>{value}</p>
    </div>
  );
}
