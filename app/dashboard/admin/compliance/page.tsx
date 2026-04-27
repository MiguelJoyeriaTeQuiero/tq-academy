import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
  emptyCounts,
  incrementCounts,
  type ComplianceCounts,
  type ComplianceStatus,
} from "@/lib/compliance";
import type { TipoDestino } from "@/types/database";

interface AsignacionRow {
  id: string;
  curso_id: string;
  tipo_destino: TipoDestino;
  destino_id: string;
  fecha_limite: string | null;
  obligatorio: boolean;
}

interface Row {
  asignacion: AsignacionRow;
  cursoTitulo: string;
  destinoLabel: string;
  counts: ComplianceCounts;
  usuariosIds: string[];
}

export default async function ComplianceAdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!profile || !["super_admin", "admin_rrhh"].includes(profile.rol as string)) {
    redirect("/dashboard");
  }

  // 1) Asignaciones obligatorias
  const { data: asignsRaw } = await supabase
    .from("asignaciones")
    .select("id, curso_id, tipo_destino, destino_id, fecha_limite, obligatorio")
    .eq("obligatorio", true)
    .order("fecha_limite", { ascending: true, nullsFirst: false });

  const asignaciones = (asignsRaw ?? []) as AsignacionRow[];

  // 2) Resolver títulos de curso y labels de destino en bulk
  const cursoIds = Array.from(new Set(asignaciones.map((a) => a.curso_id)));
  const tiendaIds = asignaciones
    .filter((a) => a.tipo_destino === "tienda")
    .map((a) => a.destino_id);
  const deptIds = asignaciones
    .filter((a) => a.tipo_destino === "departamento")
    .map((a) => a.destino_id);
  const usuarioDestIds = asignaciones
    .filter((a) => a.tipo_destino === "usuario")
    .map((a) => a.destino_id);

  const [{ data: cursos }, { data: tiendas }, { data: deptos }, { data: usuariosDest }] =
    await Promise.all([
      cursoIds.length
        ? supabase.from("cursos").select("id, titulo").in("id", cursoIds)
        : Promise.resolve({ data: [] }),
      tiendaIds.length
        ? supabase.from("tiendas").select("id, nombre, isla").in("id", tiendaIds)
        : Promise.resolve({ data: [] }),
      deptIds.length
        ? supabase.from("departamentos").select("id, nombre").in("id", deptIds)
        : Promise.resolve({ data: [] }),
      usuarioDestIds.length
        ? supabase
            .from("profiles")
            .select("id, nombre, apellido")
            .in("id", usuarioDestIds)
        : Promise.resolve({ data: [] }),
    ]);

  const cursoTitulo = new Map((cursos ?? []).map((c) => [c.id as string, c.titulo as string]));
  const tiendaLabel = new Map(
    (tiendas ?? []).map((t) => [
      t.id as string,
      `${t.nombre} · ${t.isla}`,
    ]),
  );
  const deptLabel = new Map(
    (deptos ?? []).map((d) => [d.id as string, d.nombre as string]),
  );
  const usuarioLabel = new Map(
    (usuariosDest ?? []).map((u) => [
      u.id as string,
      `${u.nombre} ${u.apellido}`.trim(),
    ]),
  );

  // 3) Por cada asignación, expandir usuarios destino + progreso
  //    Batch por tienda/depto para ahorrar queries.
  const usuariosPorTienda = new Map<string, string[]>();
  const usuariosPorDepto = new Map<string, string[]>();

  if (tiendaIds.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, tienda_id")
      .in("tienda_id", tiendaIds)
      .eq("activo", true);
    for (const p of data ?? []) {
      const arr = usuariosPorTienda.get(p.tienda_id as string) ?? [];
      arr.push(p.id as string);
      usuariosPorTienda.set(p.tienda_id as string, arr);
    }
  }

  if (deptIds.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, departamento_id")
      .in("departamento_id", deptIds)
      .eq("activo", true);
    for (const p of data ?? []) {
      const arr = usuariosPorDepto.get(p.departamento_id as string) ?? [];
      arr.push(p.id as string);
      usuariosPorDepto.set(p.departamento_id as string, arr);
    }
  }

  function resolveUsuarios(a: AsignacionRow): string[] {
    if (a.tipo_destino === "usuario") return [a.destino_id];
    if (a.tipo_destino === "tienda") return usuariosPorTienda.get(a.destino_id) ?? [];
    return usuariosPorDepto.get(a.destino_id) ?? [];
  }

  // 4) Progreso en bulk: para todos los (usuario, curso) involucrados.
  const todasParejas: Array<{ usuario_id: string; curso_id: string }> = [];
  const usuariosPorAsignacion = new Map<string, string[]>();
  for (const a of asignaciones) {
    const us = resolveUsuarios(a);
    usuariosPorAsignacion.set(a.id, us);
    for (const uid of us) {
      todasParejas.push({ usuario_id: uid, curso_id: a.curso_id });
    }
  }
  const uniqueUsuarios = Array.from(new Set(todasParejas.map((p) => p.usuario_id)));
  const uniqueCursos = Array.from(new Set(todasParejas.map((p) => p.curso_id)));

  const progresoMap = new Map<string, { completado: boolean; porcentaje: number }>();
  if (uniqueUsuarios.length && uniqueCursos.length) {
    const { data: progresos } = await supabase
      .from("progreso_cursos")
      .select("usuario_id, curso_id, completado, porcentaje")
      .in("usuario_id", uniqueUsuarios)
      .in("curso_id", uniqueCursos);
    for (const p of progresos ?? []) {
      progresoMap.set(`${p.usuario_id}|${p.curso_id}`, {
        completado: p.completado as boolean,
        porcentaje: p.porcentaje as number,
      });
    }
  }

  // 5) Construir filas agregadas
  const rows: Row[] = asignaciones.map((a) => {
    const usuarios = usuariosPorAsignacion.get(a.id) ?? [];
    const counts = emptyCounts();
    for (const uid of usuarios) {
      const p = progresoMap.get(`${uid}|${a.curso_id}`);
      const status = computeComplianceStatus({
        obligatorio: a.obligatorio,
        fecha_limite: a.fecha_limite,
        completado: p?.completado ?? false,
        porcentaje: p?.porcentaje ?? 0,
      });
      incrementCounts(counts, status);
    }

    const destinoLabel =
      a.tipo_destino === "usuario"
        ? `👤 ${usuarioLabel.get(a.destino_id) ?? "Usuario"}`
        : a.tipo_destino === "tienda"
          ? `🏬 ${tiendaLabel.get(a.destino_id) ?? "Tienda"}`
          : `🏛 ${deptLabel.get(a.destino_id) ?? "Departamento"}`;

    return {
      asignacion: a,
      cursoTitulo: cursoTitulo.get(a.curso_id) ?? "(curso eliminado)",
      destinoLabel,
      counts,
      usuariosIds: usuarios,
    };
  });

  // 6) KPIs globales
  const totales = rows.reduce<ComplianceCounts>(
    (acc, r) => ({
      total: acc.total + r.counts.total,
      completado: acc.completado + r.counts.completado,
      en_curso: acc.en_curso + r.counts.en_curso,
      pendiente: acc.pendiente + r.counts.pendiente,
      en_riesgo: acc.en_riesgo + r.counts.en_riesgo,
      vencido: acc.vencido + r.counts.vencido,
    }),
    emptyCounts(),
  );
  const cumplimientoPct =
    totales.total > 0 ? Math.round((totales.completado / totales.total) * 100) : 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Cumplimiento formativo</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Asignaciones obligatorias y estado por destinatario.
          </p>
        </div>
        <Link
          href="/api/notifications/schedule-reminders"
          className="text-xs text-muted-foreground underline"
        >
          {/* placeholder para una acción futura */}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi
          icon={ShieldAlert}
          label="Asignaciones obligatorias"
          value={rows.length}
        />
        <Kpi
          icon={CheckCircle2}
          label="Cumplimiento"
          value={`${cumplimientoPct}%`}
          tone="green"
        />
        <Kpi
          icon={AlertTriangle}
          label="En riesgo"
          value={totales.en_riesgo}
          tone="amber"
        />
        <Kpi
          icon={AlertCircle}
          label="Vencidos"
          value={totales.vencido}
          tone="red"
        />
        <Kpi label="Total destinatarios" value={totales.total} />
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Fecha límite</TableHead>
              <TableHead className="text-right">Usuarios</TableHead>
              <TableHead className="text-right">Completados</TableHead>
              <TableHead className="text-right">En curso</TableHead>
              <TableHead className="text-right">Sin iniciar</TableHead>
              <TableHead className="text-right">En riesgo</TableHead>
              <TableHead className="text-right">Vencidos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.asignacion.id}>
                <TableCell className="font-medium text-sm">{r.cursoTitulo}</TableCell>
                <TableCell className="text-sm">{r.destinoLabel}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {r.asignacion.fecha_limite ? (
                    formatFecha(r.asignacion.fecha_limite)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{r.counts.total}</TableCell>
                <Num status="completado" value={r.counts.completado} />
                <Num status="en_curso" value={r.counts.en_curso} />
                <Num status="pendiente" value={r.counts.pendiente} />
                <Num status="en_riesgo" value={r.counts.en_riesgo} />
                <Num status="vencido" value={r.counts.vencido} />
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  No hay asignaciones obligatorias todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
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

function Num({ status, value }: { status: ComplianceStatus; value: number }) {
  const cls =
    value === 0
      ? "text-muted-foreground"
      : status === "vencido"
        ? "text-red-700 font-semibold"
        : status === "en_riesgo"
          ? "text-amber-700 font-semibold"
          : status === "completado"
            ? "text-emerald-700"
            : "";
  return <TableCell className={`text-right text-sm ${cls}`}>{value}</TableCell>;
}
