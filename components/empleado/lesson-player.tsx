"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, FileText, HelpCircle } from "lucide-react";
import type { LeccionTipo } from "@/types/database";

interface LessonPlayerProps {
  leccionId: string;
  cursoId: string;
  userId: string;
  tipo: LeccionTipo;
  contenidoUrl: string | null;
  titulo: string;
  completadoMinimoPct: number;
  initialPorcentaje?: number;
  initialCompletado?: boolean;
}

export function LessonPlayer({
  leccionId,
  cursoId,
  userId,
  tipo,
  contenidoUrl,
  titulo,
  completadoMinimoPct,
  initialPorcentaje = 0,
  initialCompletado = false,
}: LessonPlayerProps) {
  const [porcentaje, setPorcentaje] = useState(initialPorcentaje);
  const [completado, setCompletado] = useState(initialCompletado);
  const [guardando, setGuardando] = useState(false);
  const lastSavedRef = useRef(initialPorcentaje);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const guardarProgreso = useCallback(
    async (pct: number, isCompleted: boolean) => {
      if (Math.abs(pct - lastSavedRef.current) < 5 && !isCompleted) return;
      lastSavedRef.current = pct;
      setGuardando(true);

      const supabase = createClient();
      await supabase.from("progreso_lecciones").upsert(
        {
          usuario_id: userId,
          leccion_id: leccionId,
          porcentaje: pct,
          completado: isCompleted,
        },
        { onConflict: "usuario_id,leccion_id" }
      );

      // Recalcular progreso del curso
      if (isCompleted) {
        const { data: todasLecciones } = await supabase
          .from("lecciones")
          .select("id, modulos!inner(curso_id)")
          .eq("modulos.curso_id", cursoId);

        const { data: completadas } = await supabase
          .from("progreso_lecciones")
          .select("id")
          .eq("usuario_id", userId)
          .eq("completado", true)
          .in("leccion_id", (todasLecciones ?? []).map((l) => l.id));

        const total = todasLecciones?.length ?? 0;
        const done = completadas?.length ?? 0;
        const cursoPct = total > 0 ? Math.round((done / total) * 100) : 0;
        const cursoCompleto = cursoPct === 100;

        await supabase.from("progreso_cursos").upsert(
          {
            usuario_id: userId,
            curso_id: cursoId,
            porcentaje: cursoPct,
            completado: cursoCompleto,
            fecha_completado: cursoCompleto ? new Date().toISOString() : null,
          },
          { onConflict: "usuario_id,curso_id" }
        );
      }

      setGuardando(false);
    },
    [userId, leccionId, cursoId]
  );

  // ---- Video tracking ----
  function handleTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget;
    if (!video.duration) return;
    const pct = Math.round((video.currentTime / video.duration) * 100);
    setPorcentaje(pct);

    const isCompleted = pct >= completadoMinimoPct;
    if (isCompleted && !completado) {
      setCompletado(true);
      guardarProgreso(pct, true);
      return;
    }

    // Throttle saves a cada 5 segundos
    if (saveTimerRef.current) return;
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      guardarProgreso(pct, false);
    }, 5000);
  }

  // ---- PDF: marcar completado al cargar ----
  function handlePdfLoad() {
    if (!completado) {
      setPorcentaje(100);
      setCompletado(true);
      guardarProgreso(100, true);
    }
  }

  return (
    <div className="space-y-4">
      {/* Estado de progreso */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {completado ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">Lección completada</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              {porcentaje > 0 ? `${porcentaje}% completado` : "No iniciado"}
            </span>
          )}
          {guardando && <span className="text-xs text-muted-foreground animate-pulse">Guardando...</span>}
        </div>
        <Badge variant={completado ? "default" : "outline"} className={completado ? "bg-green-500" : ""}>
          {porcentaje}%
        </Badge>
      </div>

      <Progress value={porcentaje} className="h-2" />

      {/* Reproductor según tipo */}
      {tipo === "video" && (
        <div className="rounded-xl overflow-hidden bg-black aspect-video">
          {contenidoUrl ? (
            <video
              src={contenidoUrl}
              controls
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                setPorcentaje(100);
                setCompletado(true);
                guardarProgreso(100, true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              <Play className="w-16 h-16" />
              <p className="ml-3">Video no disponible</p>
            </div>
          )}
        </div>
      )}

      {tipo === "pdf" && (
        <div className="rounded-xl overflow-hidden border bg-white" style={{ height: "70vh" }}>
          {contenidoUrl ? (
            <iframe
              src={`${contenidoUrl}#toolbar=1`}
              className="w-full h-full"
              title={titulo}
              onLoad={handlePdfLoad}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <FileText className="w-16 h-16 opacity-30" />
              <p className="ml-3">PDF no disponible</p>
            </div>
          )}
        </div>
      )}

      {tipo === "quiz" && (
        <div className="rounded-xl border bg-white p-12 text-center">
          <HelpCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-heading font-semibold text-lg">Quiz</h3>
          <p className="text-muted-foreground mt-2">
            El módulo de quiz estará disponible en la próxima fase del proyecto.
          </p>
        </div>
      )}

      {tipo === "scorm" && (
        <div className="rounded-xl border bg-white p-12 text-center">
          <Play className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-heading font-semibold text-lg">Contenido SCORM</h3>
          <p className="text-muted-foreground mt-2">
            El soporte SCORM estará disponible en la próxima fase del proyecto.
          </p>
        </div>
      )}
    </div>
  );
}
