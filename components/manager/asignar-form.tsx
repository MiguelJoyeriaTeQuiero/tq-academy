"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Users, User, Calendar, Loader2, CheckCircle } from "lucide-react";

interface Curso {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
}

interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

interface AsignacionExistente {
  curso_id: string;
  tipo_destino: string;
  destino_id: string;
}

interface Props {
  cursos: Curso[];
  equipo: Empleado[];
  tiendaId: string | null;
  departamentoId: string | null;
  asignacionesExistentes: AsignacionExistente[];
}

export function ManagerAsignarForm({
  cursos, equipo, tiendaId, departamentoId, asignacionesExistentes,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [cursoId, setCursoId] = useState("");
  const [destino, setDestino] = useState<"equipo" | "usuario">("equipo");
  const [usuarioId, setUsuarioId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [obligatorio, setObligatorio] = useState(false);
  const [loading, setLoading] = useState(false);

  function estaAsignado(cId: string, tipo: string, destinoId: string) {
    return asignacionesExistentes.some(
      (a) => a.curso_id === cId && a.tipo_destino === tipo && a.destino_id === destinoId
    );
  }

  const yaAsignado = cursoId && (
    destino === "equipo"
      ? estaAsignado(cursoId, tiendaId ? "tienda" : "departamento", tiendaId ?? departamentoId ?? "")
      : estaAsignado(cursoId, "usuario", usuarioId)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cursoId) { toast({ title: "Selecciona un curso", variant: "destructive" }); return; }
    if (destino === "usuario" && !usuarioId) { toast({ title: "Selecciona un empleado", variant: "destructive" }); return; }

    const tipoDestino = destino === "equipo"
      ? (tiendaId ? "tienda" : "departamento")
      : "usuario";
    const destinoId = destino === "equipo"
      ? (tiendaId ?? departamentoId ?? "")
      : usuarioId;

    if (!destinoId) {
      toast({ title: "No se pudo determinar el destino", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/asignaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id: cursoId,
          tipo_destino: tipoDestino,
          destino_id: destinoId,
          fecha_limite: fechaLimite || null,
          obligatorio,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Error al asignar");
      }

      toast({ title: "Curso asignado correctamente" });
      router.refresh();
      setCursoId("");
      setUsuarioId("");
      setFechaLimite("");
      setObligatorio(false);
    } catch (err) {
      toast({
        title: "Error al asignar",
        description: err instanceof Error ? err.message : "Inténtalo de nuevo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Seleccionar curso */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-[#0099F2]" />
          <h3 className="font-semibold text-gray-900 text-sm">Selecciona un curso</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
          {cursos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No hay cursos activos disponibles</p>
          ) : cursos.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCursoId(c.id)}
              className={`text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                cursoId === c.id
                  ? "border-[#0099F2] bg-blue-50 text-[#0099F2] font-medium"
                  : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              {c.titulo}
            </button>
          ))}
        </div>
      </div>

      {/* Destino */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#0099F2]" />
          <h3 className="font-semibold text-gray-900 text-sm">Destino</h3>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setDestino("equipo")}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
              destino === "equipo"
                ? "border-[#0099F2] bg-blue-50 text-[#0099F2]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Todo el equipo
          </button>
          <button
            type="button"
            onClick={() => setDestino("usuario")}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
              destino === "usuario"
                ? "border-[#0099F2] bg-blue-50 text-[#0099F2]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <User className="w-3.5 h-3.5 inline mr-1" />
            Empleado específico
          </button>
        </div>

        {destino === "usuario" && (
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0099F2] focus:outline-none focus:ring-2 focus:ring-[#0099F2]/20"
          >
            <option value="">Selecciona empleado...</option>
            {equipo.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} {emp.apellido} — {emp.email}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Opciones */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-[#0099F2]" />
          <h3 className="font-semibold text-gray-900 text-sm">Opciones</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">Fecha límite (opcional)</label>
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0099F2] focus:outline-none focus:ring-2 focus:ring-[#0099F2]/20"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={obligatorio}
              onChange={(e) => setObligatorio(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0099F2] accent-[#0099F2]"
            />
            <span className="text-sm text-gray-700">Marcar como obligatorio</span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5">
        {yaAsignado && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            Este curso ya está asignado al destino seleccionado
          </div>
        )}
        <Button type="submit" disabled={loading || !!yaAsignado} className="w-full h-10 bg-[#0099F2] hover:bg-[#007DD4] text-white">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Asignando...</>
          ) : (
            "Asignar curso"
          )}
        </Button>
      </div>
    </form>
  );
}
