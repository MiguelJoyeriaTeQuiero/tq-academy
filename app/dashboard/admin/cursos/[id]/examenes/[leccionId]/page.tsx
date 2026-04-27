import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ExamenConstructor } from "@/components/admin/examen-constructor";

export default async function ExamenPage({
  params,
}: {
  params: { id: string; leccionId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verificar que la lección existe y es de tipo quiz
  const { data: leccion } = await supabase
    .from("lecciones")
    .select("id, titulo, tipo, modulo_id, modulos!inner(curso_id)")
    .eq("id", params.leccionId)
    .single();

  if (!leccion) notFound();

  const modulo = leccion.modulos as unknown as { curso_id: string };
  if (modulo.curso_id !== params.id) notFound();

  if (leccion.tipo !== "quiz") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href={`/dashboard/admin/cursos/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al curso
        </Link>
        <div className="bg-white rounded-xl border border-amber-200 p-6 flex gap-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-800">Esta lección no es de tipo quiz</p>
            <p className="text-sm text-gray-500 mt-1">
              Solo se pueden crear exámenes para lecciones de tipo &ldquo;quiz&rdquo;.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Obtener o crear el examen para esta lección
  let { data: examen } = await supabase
    .from("examenes")
    .select("*")
    .eq("leccion_id", params.leccionId)
    .maybeSingle();

  if (!examen) {
    const { data: nuevo } = await supabase
      .from("examenes")
      .insert({
        leccion_id: params.leccionId,
        preguntas: [],
        nota_minima: 70,
        max_intentos: 3,
        tiempo_limite_min: null,
      })
      .select()
      .single();
    examen = nuevo;
  }

  if (!examen) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link
        href={`/dashboard/admin/cursos/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al curso
      </Link>

      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Constructor de examen
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Lección: <span className="font-medium text-gray-700">{leccion.titulo}</span>
        </p>
      </div>

      <ExamenConstructor examen={examen} />
    </div>
  );
}
