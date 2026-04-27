import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, ShieldX, Award, Calendar, BookOpen, User } from "lucide-react";
import Link from "next/link";

export default async function VerificarCertificadoPage({
  params,
}: {
  params: { codigo: string };
}) {
  const supabase = createClient();

  const { data: cert } = await supabase
    .from("certificados")
    .select(`
      id,
      fecha_emision,
      codigo_verificacion,
      cursos ( titulo ),
      profiles:usuario_id ( nombre, apellido )
    `)
    .eq("codigo_verificacion", params.codigo)
    .maybeSingle();

  const valido = !!cert;

  const curso = cert?.cursos as unknown as { titulo: string } | null;
  const perfil = cert?.profiles as unknown as {
    nombre: string;
    apellido: string;
  } | null;

  const fecha = cert
    ? new Date(cert.fecha_emision).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00446B] flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-[#00446B]">
              TQ Academy
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-2">Verificación de certificados</p>
        </div>

        {/* Card de resultado */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Banner */}
          <div
            className={`px-8 py-8 text-center ${
              valido
                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100"
                : "bg-gradient-to-br from-red-50 to-rose-50 border-b border-red-100"
            }`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                valido ? "bg-emerald-100" : "bg-red-100"
              }`}
            >
              {valido ? (
                <ShieldCheck className="w-10 h-10 text-emerald-600" />
              ) : (
                <ShieldX className="w-10 h-10 text-red-500" />
              )}
            </div>

            {valido ? (
              <>
                <p className="text-2xl font-heading font-bold text-emerald-800">
                  Certificado válido
                </p>
                <p className="text-emerald-600 text-sm mt-1">
                  Este certificado es auténtico y fue emitido por TQ Academy
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-heading font-bold text-red-700">
                  Certificado no encontrado
                </p>
                <p className="text-red-500 text-sm mt-1">
                  El código introducido no corresponde a ningún certificado válido
                </p>
              </>
            )}
          </div>

          {/* Detalles del certificado */}
          {valido && (
            <div className="px-8 py-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-[#0099F2]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Emitido a</p>
                  <p className="font-semibold text-gray-900">
                    {perfil?.nombre} {perfil?.apellido}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Curso</p>
                  <p className="font-semibold text-gray-900">{curso?.titulo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Fecha de emisión</p>
                  <p className="font-semibold text-gray-900">{fecha}</p>
                </div>
              </div>

              {/* Código */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 mt-2">
                <p className="text-xs text-gray-400 font-medium mb-1">
                  Código de verificación
                </p>
                <p className="font-mono text-sm text-gray-700 tracking-wider">
                  {cert.codigo_verificacion}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} Te Quiero Group
              </p>
              <Link
                href="/auth/login"
                className="text-xs text-[#0099F2] hover:underline font-medium"
              >
                Acceder a TQ Academy →
              </Link>
            </div>
          </div>
        </div>

        {/* Código en URL */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Verificando código:{" "}
          <span className="font-mono text-gray-500">{params.codigo}</span>
        </p>
      </div>
    </div>
  );
}
