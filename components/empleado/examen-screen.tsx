"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  AlertTriangle,
  Loader2,
  RotateCcw,
  ChevronRight,
} from "lucide-react";

type TipoPregunta = "test" | "verdadero_falso" | "respuesta_corta";

interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  pregunta: string;
  opciones: string[];
  respuesta_correcta: string;
}

interface IntentoResumen {
  id: string;
  nota: number;
  aprobado: boolean;
  duracion_seg: number | null;
  created_at: string;
}

interface ResultadoDetalle {
  correcta: boolean;
  respuesta_dada: string;
  respuesta_esperada: string;
}

interface ResultadoExamen {
  nota: number;
  aprobado: boolean;
  correctas: number;
  total: number;
  nota_minima: number;
  detalle: Record<string, ResultadoDetalle>;
}

interface Props {
  examenId: string;
  preguntas: Pregunta[];
  notaMinima: number;
  maxIntentos: number;
  tiempoLimiteMin: number | null;
  intentosPrevios: IntentoResumen[];
  leccionId?: string;
  cursoId?: string;
  userId?: string;
  intentarPath?: string;
  titulo?: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ExamenScreen({
  examenId,
  preguntas,
  notaMinima,
  maxIntentos,
  tiempoLimiteMin,
  intentosPrevios: initialIntentos,
  intentarPath,
  titulo,
}: Props) {
  const { toast } = useToast();
  const [intentos, setIntentos] = useState(initialIntentos);
  const [fase, setFase] = useState<"inicio" | "examen" | "resultado">("inicio");
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<ResultadoExamen | null>(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [timerSec, setTimerSec] = useState(
    tiempoLimiteMin ? tiempoLimiteMin * 60 : 0
  );

  const intentosUsados = intentos.length;
  const intentosRestantes = maxIntentos - intentosUsados;
  const aprobado = intentos.some((i) => i.aprobado);
  const mejorNota = intentos.length > 0 ? Math.max(...intentos.map((i) => i.nota)) : null;

  // Timer countdown
  const handleSubmit = useCallback(async () => {
    const duracion = Math.round((Date.now() - startTime) / 1000);
    setLoading(true);
    try {
      const url = intentarPath ?? `/api/examenes/${examenId}/intentar`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas, duracion_seg: duracion }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Error al enviar", variant: "destructive" });
        return;
      }
      setResultado(data);
      setIntentos((prev) => [
        {
          id: data.intento_id,
          nota: data.nota,
          aprobado: data.aprobado,
          duracion_seg: duracion,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setFase("resultado");
    } finally {
      setLoading(false);
    }
  }, [examenId, intentarPath, respuestas, startTime, toast]);

  useEffect(() => {
    if (fase !== "examen" || !tiempoLimiteMin) return;
    const interval = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fase, tiempoLimiteMin, handleSubmit]);

  function startExamen() {
    setRespuestas({});
    setResultado(null);
    setStartTime(Date.now());
    setTimerSec(tiempoLimiteMin ? tiempoLimiteMin * 60 : 0);
    setFase("examen");
  }

  const preguntasSinResponder = preguntas.filter((p) => !respuestas[p.id]);
  const puedeEnviar = preguntasSinResponder.length === 0;

  // ── FASE: INICIO ──────────────────────────────────────────────
  if (fase === "inicio") {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0099F2]/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#0099F2]" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-gray-900">{titulo ?? "Examen"}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {preguntas.length} pregunta{preguntas.length !== 1 ? "s" : ""} ·
                Aprueba con {notaMinima}%
                {tiempoLimiteMin ? ` · ${tiempoLimiteMin} min` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-50">
          <div className="text-center">
            <p className="text-2xl font-bold font-heading text-gray-900">{intentosUsados}</p>
            <p className="text-xs text-gray-400 mt-0.5">intentos usados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-heading text-gray-900">{intentosRestantes}</p>
            <p className="text-xs text-gray-400 mt-0.5">intentos restantes</p>
          </div>
          <div className="text-center">
            <p
              className={`text-2xl font-bold font-heading ${
                mejorNota === null
                  ? "text-gray-300"
                  : mejorNota >= notaMinima
                  ? "text-emerald-600"
                  : "text-red-500"
              }`}
            >
              {mejorNota !== null ? `${mejorNota}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">mejor nota</p>
          </div>
        </div>

        {/* Historial de intentos */}
        {intentos.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Historial
            </p>
            <div className="space-y-2">
              {intentos.map((intento, idx) => (
                <div
                  key={intento.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 text-gray-500">
                    {intento.aprobado ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span>Intento {intentos.length - idx}</span>
                    {intento.duracion_seg && (
                      <span className="text-gray-300">
                        · {formatTime(intento.duracion_seg)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-semibold ${
                      intento.aprobado ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {intento.nota}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acción */}
        <div className="px-6 py-5">
          {aprobado ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">¡Examen superado!</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Puedes repetirlo para mejorar tu nota ({intentosRestantes} intento
                  {intentosRestantes !== 1 ? "s" : ""} restante
                  {intentosRestantes !== 1 ? "s" : ""})
                </p>
              </div>
            </div>
          ) : intentosRestantes <= 0 ? (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-700">
                Has agotado todos los intentos para este examen
              </p>
            </div>
          ) : null}

          {intentosRestantes > 0 && (
            <Button
              className="w-full mt-3 bg-[#0099F2] hover:bg-[#007DD4] text-white h-11"
              onClick={startExamen}
            >
              {intentosUsados === 0 ? "Comenzar examen" : "Nuevo intento"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── FASE: EXAMEN ──────────────────────────────────────────────
  if (fase === "examen") {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header con timer */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">
            {preguntasSinResponder.length > 0
              ? `${preguntas.length - preguntasSinResponder.length} / ${preguntas.length} respondidas`
              : "Todas respondidas ✓"}
          </p>
          {tiempoLimiteMin && (
            <div
              className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums ${
                timerSec < 60 ? "text-red-500" : "text-gray-600"
              }`}
            >
              <Clock className="w-4 h-4" />
              {formatTime(timerSec)}
            </div>
          )}
        </div>

        {/* Preguntas */}
        <div className="divide-y divide-gray-50">
          {preguntas.map((p, idx) => (
            <div key={p.id} className="px-6 py-5">
              <p className="text-sm font-medium text-gray-800 mb-3">
                <span className="text-[#0099F2] font-semibold mr-2">{idx + 1}.</span>
                {p.pregunta}
              </p>

              {p.tipo === "respuesta_corta" ? (
                <input
                  type="text"
                  value={respuestas[p.id] ?? ""}
                  onChange={(e) =>
                    setRespuestas((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  placeholder="Tu respuesta..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0099F2] focus:outline-none focus:ring-2 focus:ring-[#0099F2]/20"
                />
              ) : (
                <div className="space-y-2">
                  {p.opciones.map((op, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() =>
                        setRespuestas((prev) => ({ ...prev, [p.id]: op }))
                      }
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                        respuestas[p.id] === op
                          ? "border-[#0099F2] bg-blue-50 text-[#0099F2] font-medium"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-50">
          {!puedeEnviar && (
            <p className="text-xs text-amber-600 mb-3">
              Faltan {preguntasSinResponder.length} pregunta
              {preguntasSinResponder.length !== 1 ? "s" : ""} por responder
            </p>
          )}
          <Button
            className="w-full bg-[#0099F2] hover:bg-[#007DD4] text-white h-11"
            onClick={handleSubmit}
            disabled={!puedeEnviar || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Enviar respuestas
          </Button>
        </div>
      </div>
    );
  }

  // ── FASE: RESULTADO ───────────────────────────────────────────
  if (fase === "resultado" && resultado) {
    const nuevosRestantes = maxIntentos - intentos.length;
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Resultado principal */}
        <div
          className={`px-6 py-8 text-center border-b border-gray-50 ${
            resultado.aprobado ? "bg-emerald-50" : "bg-red-50"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              resultado.aprobado ? "bg-emerald-100" : "bg-red-100"
            }`}
          >
            {resultado.aprobado ? (
              <Trophy className="w-8 h-8 text-emerald-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          <p className="text-5xl font-bold font-heading text-gray-900 mb-1">{resultado.nota}%</p>
          <p
            className={`text-sm font-semibold ${
              resultado.aprobado ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {resultado.aprobado ? "¡Aprobado!" : `No aprobado · mínimo ${resultado.nota_minima}%`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {resultado.correctas} de {resultado.total} correctas
          </p>
        </div>

        {/* Desglose de preguntas */}
        <div className="divide-y divide-gray-50">
          {preguntas.map((p, idx) => {
            const det = resultado.detalle[p.id];
            return (
              <div key={p.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  {det?.correcta ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-400 mr-1">{idx + 1}.</span>
                      {p.pregunta}
                    </p>
                    {!det?.correcta && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-red-500">
                          Tu respuesta:{" "}
                          <span className="font-medium">{det?.respuesta_dada || "(sin responder)"}</span>
                        </p>
                        <p className="text-xs text-emerald-600">
                          Respuesta correcta:{" "}
                          <span className="font-medium">{det?.respuesta_esperada}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Acciones */}
        <div className="px-6 py-5 border-t border-gray-50 space-y-3">
          {nuevosRestantes > 0 && !resultado.aprobado && (
            <Button
              variant="outline"
              className="w-full"
              onClick={startExamen}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reintentar ({nuevosRestantes} intento{nuevosRestantes !== 1 ? "s" : ""} restante
              {nuevosRestantes !== 1 ? "s" : ""})
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={() => setFase("inicio")}
          >
            Ver historial
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
