"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle,
  Trash2,
  Loader2,
  GripVertical,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";

type TipoPregunta = "test" | "verdadero_falso" | "respuesta_corta";

interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  pregunta: string;
  opciones: string[];
  respuesta_correcta: string;
}

interface ExamenData {
  id: string;
  leccion_id: string;
  preguntas: Pregunta[];
  nota_minima: number;
  max_intentos: number;
  tiempo_limite_min: number | null;
}

interface Props {
  examen: ExamenData;
}

function generateId() {
  return crypto.randomUUID();
}

const TIPO_LABELS: Record<TipoPregunta, string> = {
  test: "Opción múltiple",
  verdadero_falso: "Verdadero / Falso",
  respuesta_corta: "Respuesta corta",
};

export function ExamenConstructor({ examen: initialExamen }: Props) {
  const { toast } = useToast();
  const [examen, setExamen] = useState<ExamenData>(initialExamen);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Configuración general ─────────────────────────────────────
  function updateConfig(field: keyof ExamenData, value: unknown) {
    setExamen((prev) => ({ ...prev, [field]: value }));
  }

  // ── Preguntas ─────────────────────────────────────────────────
  function addPregunta() {
    const id = generateId();
    const nueva: Pregunta = {
      id,
      tipo: "test",
      pregunta: "",
      opciones: ["", "", "", ""],
      respuesta_correcta: "",
    };
    setExamen((prev) => ({
      ...prev,
      preguntas: [...prev.preguntas, nueva],
    }));
    setExpandedId(id);
  }

  function updatePregunta(id: string, field: keyof Pregunta, value: unknown) {
    setExamen((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        // Al cambiar tipo, resetear opciones/respuesta
        if (field === "tipo") {
          if (value === "verdadero_falso") {
            updated.opciones = ["Verdadero", "Falso"];
            updated.respuesta_correcta = "";
          } else if (value === "test") {
            updated.opciones = ["", "", "", ""];
            updated.respuesta_correcta = "";
          } else {
            updated.opciones = [];
            updated.respuesta_correcta = "";
          }
        }
        return updated;
      }),
    }));
  }

  function updateOpcion(preguntaId: string, idx: number, value: string) {
    setExamen((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p) => {
        if (p.id !== preguntaId) return p;
        const opciones = [...p.opciones];
        opciones[idx] = value;
        return { ...p, opciones };
      }),
    }));
  }

  function deletePregunta(id: string) {
    setExamen((prev) => ({
      ...prev,
      preguntas: prev.preguntas.filter((p) => p.id !== id),
    }));
    if (expandedId === id) setExpandedId(null);
  }

  // ── Guardar ───────────────────────────────────────────────────
  async function handleSave() {
    // Validar
    for (const p of examen.preguntas) {
      if (!p.pregunta.trim()) {
        toast({ title: "Hay preguntas sin texto", variant: "destructive" });
        return;
      }
      if (p.tipo !== "respuesta_corta" && !p.respuesta_correcta) {
        toast({
          title: `Selecciona la respuesta correcta para: "${p.pregunta}"`,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("examenes")
      .update({
        preguntas: examen.preguntas,
        nota_minima: examen.nota_minima,
        max_intentos: examen.max_intentos,
        tiempo_limite_min: examen.tiempo_limite_min,
      })
      .eq("id", examen.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Examen guardado correctamente" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuración general */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Configuración del examen</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Nota mínima para aprobar (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={examen.nota_minima}
              onChange={(e) => updateConfig("nota_minima", parseInt(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Máx. intentos</Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={examen.max_intentos}
              onChange={(e) => updateConfig("max_intentos", parseInt(e.target.value) || 1)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Tiempo límite (min, vacío = sin límite)</Label>
            <Input
              type="number"
              min={1}
              value={examen.tiempo_limite_min ?? ""}
              onChange={(e) =>
                updateConfig(
                  "tiempo_limite_min",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              placeholder="Sin límite"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Preguntas */}
      <div className="space-y-3">
        {examen.preguntas.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm empty-state py-10">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-sm">Sin preguntas</p>
              <p className="text-gray-400 text-xs mt-0.5">Añade preguntas con el botón de abajo</p>
            </div>
          </div>
        )}

        {examen.preguntas.map((p, idx) => {
          const isOpen = expandedId === p.id;
          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Cabecera de la pregunta */}
              <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-400 w-5 flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="flex-1 text-sm text-gray-700 truncate">
                  {p.pregunta || <span className="text-gray-300 italic">Sin texto</span>}
                </p>
                <span className="text-xs text-[#0099F2] bg-blue-50 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  {TIPO_LABELS[p.tipo]}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : p.id)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400"
                >
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => deletePregunta(p.id)}
                  className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Editor de la pregunta */}
              {isOpen && (
                <div className="px-4 pb-5 pt-1 border-t border-gray-50 space-y-4">
                  {/* Tipo */}
                  <div className="flex gap-2">
                    {(["test", "verdadero_falso", "respuesta_corta"] as TipoPregunta[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updatePregunta(p.id, "tipo", t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          p.tipo === t
                            ? "border-[#0099F2] bg-blue-50 text-[#0099F2]"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {TIPO_LABELS[t]}
                      </button>
                    ))}
                  </div>

                  {/* Texto de la pregunta */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Texto de la pregunta</Label>
                    <Input
                      value={p.pregunta}
                      onChange={(e) => updatePregunta(p.id, "pregunta", e.target.value)}
                      placeholder="Escribe la pregunta aquí..."
                      className="text-sm"
                    />
                  </div>

                  {/* Opciones */}
                  {(p.tipo === "test" || p.tipo === "verdadero_falso") && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">
                        Opciones — selecciona la correcta
                      </Label>
                      {p.opciones.map((op, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updatePregunta(p.id, "respuesta_correcta", op)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                              p.respuesta_correcta === op && op !== ""
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-300"
                            }`}
                          >
                            {p.respuesta_correcta === op && op !== "" && (
                              <span className="block w-full h-full rounded-full" />
                            )}
                          </button>
                          {p.tipo === "test" ? (
                            <Input
                              value={op}
                              onChange={(e) => {
                                // If this was the correct answer, update it too
                                if (p.respuesta_correcta === op) {
                                  updatePregunta(p.id, "respuesta_correcta", e.target.value);
                                }
                                updateOpcion(p.id, oIdx, e.target.value);
                              }}
                              placeholder={`Opción ${oIdx + 1}`}
                              className="h-8 text-sm flex-1"
                            />
                          ) : (
                            <span className="text-sm text-gray-700 flex-1">{op}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Respuesta corta */}
                  {p.tipo === "respuesta_corta" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Respuesta correcta (exacta)</Label>
                      <Input
                        value={p.respuesta_correcta}
                        onChange={(e) =>
                          updatePregunta(p.id, "respuesta_correcta", e.target.value)
                        }
                        placeholder="Respuesta esperada..."
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-400">
                        La comparación ignora mayúsculas y espacios al inicio/fin
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={addPregunta}
          className="flex-1"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Añadir pregunta
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-[#0099F2] hover:bg-[#007DD4] text-white"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar examen
        </Button>
      </div>

      {/* Resumen */}
      {examen.preguntas.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {examen.preguntas.length} pregunta{examen.preguntas.length !== 1 ? "s" : ""} ·
          Aprobado con {examen.nota_minima}% · Máx. {examen.max_intentos} intento
          {examen.max_intentos !== 1 ? "s" : ""}
          {examen.tiempo_limite_min ? ` · ${examen.tiempo_limite_min} min` : ""}
        </p>
      )}
    </div>
  );
}
