"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  Calendar,
  BarChart3,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Race = {
  id: string;
  name: string;
  location: string | null;
  country: string | null;
  date: string | null;
  country_code: string | null;
  track_length: string | null;
  calendar_order: number | null;
  is_finished: boolean | null;
};

function getCountryName(race: Race) {
  if (race.country) return race.country;

  const location = race.location || "";
  const parts = location.split(",").map((item) => item.trim());

  return parts[parts.length - 1] || "";
}

export default function Sidebar() {
  const pathname = usePathname();
  const [races, setRaces] = useState<Race[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔥 verifica se está logado (AdminGuard)
  useEffect(() => {
    const auth = localStorage.getItem("f1-admin-auth");
    setIsAdmin(auth === "true");
  }, []);

  // 🔥 logout
  function handleLogout() {
    localStorage.removeItem("f1-admin-auth");
    window.location.href = "/";
  }

  useEffect(() => {
    async function loadRaces() {
      const { data, error } = await supabase
        .from("circuits")
        .select(`
          id,
          name,
          location,
          country,
          date,
          country_code,
          track_length,
          calendar_order,
          is_finished
        `)
        .order("calendar_order", { ascending: true });

      if (error) {
        console.log("SIDEBAR RACES ERROR:", error);
        setRaces([]);
        return;
      }

      setRaces((data ?? []) as Race[]);
    }

    loadRaces();
  }, []);

  const nextRace = useMemo(() => {
    if (!races.length) return null;
    return races.find((race) => race.is_finished !== true) ?? null;
  }, [races]);

  const countryName = nextRace ? getCountryName(nextRace) : "";

  const menu = [
    { name: "Home", href: "/", icon: Home },
    { name: "Classificação", href: "/standings", icon: Trophy },
    { name: "Calendário", href: "/calendar", icon: Calendar },
    { name: "Estatísticas", href: "/statistics", icon: BarChart3 },
    { name: "Lobby Config.", href: "/lobby-config", icon: SlidersHorizontal },
  ];

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[260px] flex-col justify-between border-r border-zinc-900 bg-[#050608] p-6 text-white">

      <div>
        <div className="mb-10">
          <img src="/icons/f1-logo.png" alt="F1" className="w-30" />
        </div>

        <nav className="flex flex-col gap-2">
          {menu.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 transition ${isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/10 hover:text-red-500"
                  }`}
              >
                <span
                  className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-red-600 transition-all duration-300 ${isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                    }`}
                />

                <Icon size={24} className="relative z-10" />

                <span className="relative z-10 text-sm font-bold">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        {nextRace ? (
          <div className="rounded-xl border border-red-600/30 bg-gradient-to-br from-red-600/10 to-transparent p-4">
            <p className="mb-2 text-xs font-bold uppercase text-red-500">
              Próxima corrida
            </p>

            <h3 className="text-lg font-bold">{nextRace.name}</h3>

            <p className="mt-1 text-xs text-zinc-400">
              <span>{nextRace.date || "Data a definir"}</span>

              {nextRace.track_length && (
                <>
                  <span> • </span>
                  <span>{String(nextRace.track_length)}</span>
                </>
              )}
            </p>

            {(nextRace.country_code || countryName) && (
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                {nextRace.country_code && (
                  <img
                    src={`https://flagcdn.com/w40/${nextRace.country_code.toLowerCase()}.png`}
                    alt={countryName || "flag"}
                    className="h-4 w-6 object-cover"
                  />
                )}

                {countryName && <span>{countryName}</span>}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-white/[0.03] p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Próxima corrida
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              Todas as corridas foram finalizadas
            </p>
          </div>
        )}

        {/* SETTINGS */}
        <Link
          href="/settings"
          className="group flex items-center justify-center rounded-xl border border-zinc-800 p-3 text-zinc-400 transition hover:bg-white/10 hover:text-red-500"
        >
          <Settings size={20} />
        </Link>

        {/* LOGOUT (SÓ SE ESTIVER LOGADO) */}
        {isAdmin && (
          <button
            onClick={handleLogout}
            className="group flex items-center justify-center rounded-xl border border-zinc-800 p-3 text-xs font-black uppercase tracking-wide text-zinc-500 transition hover:border-red-500 hover:text-red-500"
          >
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}