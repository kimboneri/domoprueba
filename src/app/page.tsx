"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [configError, setConfigError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Obtiene el cliente de Supabase de forma lazy.
   * Si faltan las variables de entorno, registra el error de configuración.
   */
  const getSupabase = (): ReturnType<typeof createClient> | null => {
    try {
      return createClient();
    } catch (err: unknown) {
      setConfigError(
        err instanceof Error ? err.message : "Error de configuración de Supabase"
      );
      return null;
    }
  };

  /**
   * Alterna entre modo login y registro.
   * Limpia mensajes de error y éxito al cambiar de modo.
   */
  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setConfigError(null);
  };

  /**
   * Maneja el envío del formulario de login o registro.
   * Valida campos, llama a Supabase Auth y redirige al dashboard si tiene éxito.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        setSuccess("Sesión iniciada correctamente. Redirigiendo...");
        await new Promise((r) => setTimeout(r, 800));
        router.push("/dashboard");
      } else {
        if (password !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden");
        }
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
        setSuccess(
          "Registro exitoso. Revisa tu correo para confirmar la cuenta si es necesario."
        );
        await new Promise((r) => setTimeout(r, 1200));
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado"
      );
    } finally {
      setLoading(false);
    }
  };

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="max-w-md bg-white p-8 rounded-xl shadow-sm border border-red-200">
          <h1 className="text-xl font-bold text-red-800 mb-2">Configuración requerida</h1>
          <p className="text-red-700 mb-6">{configError}</p>
          <p className="text-sm text-zinc-500">
            Añade tus credenciales reales de Supabase en <code className="bg-zinc-100 px-1.5 py-0.5 rounded">.env.local</code> y reinicia el servidor de desarrollo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </h1>
            <p className="text-zinc-500 mt-2">
              {mode === "login"
                ? "Bienvenido de vuelta. Inicia sesión para continuar."
                : "Regístrate para comenzar a usar la aplicación."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 rounded bg-green-50 border border-green-100 text-green-700 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 rounded border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2 rounded border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded bg-indigo-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              {loading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-200 text-center">
            <button
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="text-sm text-indigo-600 hover:underline font-medium"
            >
              {mode === "login"
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-zinc-400">
          Impulsado por Next.js + Supabase Auth
        </div>
      </div>
    </div>
  );
}
