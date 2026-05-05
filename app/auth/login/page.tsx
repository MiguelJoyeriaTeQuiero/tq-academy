"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2, MailCheck, ArrowRight } from "lucide-react";
import { HeartMark, Wordmark } from "@/components/brand/logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resentEmail, setResentEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!email || !password) {
      setError("Introduce email y contraseña");
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === "Email not confirmed" || authError.status === 422) {
          setNeedsConfirmation(true);
          setError(null);
          return;
        }
        setError(
          authError.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : authError.message,
        );
        return;
      }

      let destination = "/dashboard/empleado";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("rol")
          .eq("id", user.id)
          .single();
        if (profile?.rol === "super_admin" || profile?.rol === "admin_rrhh") {
          destination = "/dashboard/admin";
        } else if (profile?.rol === "manager") {
          destination = "/dashboard/manager";
        }
      }
      window.location.replace(destination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error inesperado. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    if (!email) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.resend({ type: "signup", email });
      setResentEmail(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-tq-cream">
      {/* ╔══════════════════════════════════════════════════╗
          ║  Panel editorial izquierdo (oculto en móvil)     ║
          ╚══════════════════════════════════════════════════╝ */}
      <aside className="relative hidden lg:flex lg:w-[55%] tq-aurora tq-noise overflow-hidden">
        {/* Capa decorativa: glifo gigante translúcido */}
        <HeartMark className="absolute -right-24 -bottom-32 w-[640px] h-[640px] text-white/[0.07] animate-tq-float" />
        {/* Filete dorado vertical decorativo */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-tq-gold/40 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between w-full px-14 py-12 text-tq-cream">
          {/* Top */}
          <div className="flex items-end gap-4 fade-in">
            <Wordmark className="h-9 w-auto text-white" />
            <span className="pb-1 text-white/85 text-[11px] uppercase tracking-[0.32em] font-semibold">
              Academy
            </span>
          </div>

          {/* Center — manifiesto */}
          <div className="max-w-xl space-y-6 stagger">
            <p className="tq-eyebrow text-tq-gold/90 [&::before]:bg-tq-gold">
              Desde 1988
            </p>
            <h2 className="font-display font-normal text-white text-[clamp(2.4rem,4.4vw,4rem)] leading-[1.02] tracking-tight">
              Reivindicando el valor de
              <em className="italic text-tq-gold"> lo accesible</em>.
            </h2>
            <p className="text-white/85 max-w-md leading-relaxed text-[15px]">
              Una academia interna para que cada persona del equipo Te Quiero
              brille en su tienda, conozca cada pieza y haga sentir a quien
              entra que la joyería puede ser cercana.
            </p>

            <div className="flex items-center gap-3 pt-4">
              <span className="block w-10 h-px bg-tq-gold" />
              <span className="font-display italic text-white/90 text-sm">
                Formación · Ranking · Logros
              </span>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-end justify-between text-[11px] text-white/80 uppercase tracking-[0.22em] font-semibold">
            <span>Te Quiero Group</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </aside>

      {/* ╔══════════════════════════════════════════════════╗
          ║  Panel formulario derecho                       ║
          ╚══════════════════════════════════════════════════╝ */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Grain sutil */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.5] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,68,107,0.04) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative w-full max-w-md slide-up">
          {/* Logo móvil */}
          <div className="flex lg:hidden items-center justify-center mb-8">
            <Wordmark className="h-10 w-auto text-tq-sky" />
          </div>

          {/* Eyebrow + título */}
          <div className="space-y-2 mb-8">
            <p className="tq-eyebrow">Acceso privado</p>
            <h1 className="tq-headline text-4xl">
              Bienvenido a tu <em className="italic text-tq-ink">academia</em>.
            </h1>
            <p className="text-tq-ink/60 text-sm pt-1">
              Inicia sesión para continuar tu formación.
            </p>
          </div>

          <div className="tq-card p-7 relative overflow-hidden">
            {/* Filete dorado superior */}
            <div className="absolute top-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-tq-gold/60 to-transparent" />

            {needsConfirmation ? (
              <div className="text-center space-y-5 py-2">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-tq-gold/15 flex items-center justify-center ring-1 ring-tq-gold/30">
                    <MailCheck className="w-7 h-7 text-tq-gold2" />
                  </div>
                </div>
                <div>
                  <p className="font-display text-lg text-tq-ink">
                    Confirma tu email
                  </p>
                  <p className="text-sm text-tq-ink/60 mt-1">
                    Tu cuenta <strong className="text-tq-ink">{email}</strong> aún no
                    está verificada. Revisa tu bandeja de entrada.
                  </p>
                </div>

                {resentEmail ? (
                  <p className="text-sm text-emerald-700 font-medium">
                    ✓ Email reenviado — revisa tu bandeja
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                    onClick={resendConfirmation}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reenviar email de confirmación
                  </Button>
                )}

                <p className="text-xs text-tq-ink/50">
                  ¿Ya confirmaste?{" "}
                  <button
                    className="underline cursor-pointer text-tq-sky hover:text-tq-ink"
                    onClick={() => setNeedsConfirmation(false)}
                  >
                    Volver al login
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-tq-ink/80 text-xs uppercase tracking-wider font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@joyeriatequiero.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-11 bg-tq-paper/60 border-tq-ink/15 focus-visible:ring-tq-sky"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-tq-ink/80 text-xs uppercase tracking-wider font-semibold">
                      Contraseña
                    </Label>
                    <Link
                      href="/auth/recuperar-password"
                      className="text-xs text-tq-sky hover:text-tq-ink hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-11 bg-tq-paper/60 border-tq-ink/15 focus-visible:ring-tq-sky"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-tq-ink hover:bg-tq-deep text-white font-medium tracking-wide group"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando…
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-3 pt-1">
                  <span className="flex-1 h-px bg-tq-ink/10" />
                  <span className="text-[10px] uppercase tracking-[0.22em] text-tq-ink/40">
                    Te Quiero · 1988
                  </span>
                  <span className="flex-1 h-px bg-tq-ink/10" />
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-tq-ink/40 text-xs mt-6">
            © {new Date().getFullYear()} Te Quiero Group · Todos los derechos reservados
          </p>
        </div>
      </main>
    </div>
  );
}
