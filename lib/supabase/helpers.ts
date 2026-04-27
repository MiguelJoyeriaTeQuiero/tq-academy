/**
 * Type-safe query helpers para Supabase JS v2 con TypeScript 5.9+.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile, Curso, Leccion } from "@/types/database";

type DB = Database;
type SC = SupabaseClient<DB>;

export async function getProfile(supabase: SC, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data: data as Profile | null, error };
}

export async function getCurso(supabase: SC, cursoId: string) {
  const { data, error } = await supabase
    .from("cursos")
    .select("*")
    .eq("id", cursoId)
    .single();
  return { data: data as Curso | null, error };
}

export async function getLeccion(supabase: SC, leccionId: string) {
  const { data, error } = await supabase
    .from("lecciones")
    .select("*")
    .eq("id", leccionId)
    .single();
  return { data: data as Leccion | null, error };
}
