"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Inicializa el cliente de Supabase tras el montaje y carga la sesión actual.
   * Se suscribe a cambios de auth para mantener el estado sincronizado.
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const client = createClient();
        if (!mounted) return;
        setSupabase(client);

        const { data } = await client.auth.getSession();
        if (!mounted) return;
        setUser(data.session?.user ?? null);
        setLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        setConfigError(
          err instanceof Error ? err.message : "Error de configuración de Supabase"
        );
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Se suscribe a cambios de estado de auth para mantener la sesión sincronizada.
   * Si la sesión se cierra, redirige al login.
   */
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  /**
   * Cierra la sesión del usuario y redirige al login.
   */
  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
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

  if (!supabase || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-600 text-lg">DomoApp</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded border border-zinc-300 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Panel de inicio
          </h1>
          <p className="text-zinc-500 mb-6">
            Has iniciado sesión correctamente. Bienvenido a tu área privada.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded border border-zinc-200 bg-indigo-50">
              <h3 className="text-sm font-semibold text-indigo-700">Estado</h3>
              <p className="text-xs text-zinc-500 mt-1">Autenticado</p>
            </div>
            <div className="p-4 rounded border border-zinc-200 bg-green-50">
              <h3 className="text-sm font-semibold text-green-700">Usuario</h3>
              <p className="text-xs text-zinc-500 mt-1">
                {user.email}
              </p>
            </div>
            <div className="p-4 rounded border border-zinc-200 bg-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-700">Ruta</h3>
              <p className="text-xs text-zinc-500 mt-1">/dashboard</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
