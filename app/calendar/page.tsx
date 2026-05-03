"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Flag, Ruler, Trophy } from "lucide-react";

type Circuit = {
  id: number;
  name: string;
  grand_prix: string;
  country: string;
  country_code: string | null;
  location: string;
  date: string;
  laps: number;
  length: string | null;
  flag?: string | null;
  track_image: string;
  country_color?: string | null;
  calendar_order: number;
  selected: boolean;
  winner?: string | null;
};

const CIRCUIT_DISTANCES: Record<string, string> = {
  bahrain: "5.412 km",
  jeddah: "6.174 km",
  albert: "5.278 km",
  suzuka: "5.807 km",
  shanghai: "5.451 km",
  miami: "5.412 km",
  imola: "4.909 km",
  monaco: "3.337 km",
  villeneuve: "4.361 km",
  barcelona: "4.657 km",
  "red bull ring": "4.318 km",
  silverstone: "5.891 km",
  hungaroring: "4.381 km",
  spa: "7.004 km",
  zandvoort: "4.259 km",
  monza: "5.793 km",
  baku: "6.003 km",
  singapore: "4.940 km",
  cota: "5.513 km",
  mexico: "4.304 km",
  "hermanos rodriguez": "4.304 km",
  interlagos: "4.309 km",
  "josé carlos pace": "4.309 km",
  vegas: "6.201 km",
  lusail: "5.419 km",
  qatar: "5.419 km",
  "yas marina": "5.281 km",
  abu: "5.281 km",
};

function getCircuitDistance(circuit: Circuit) {
  if (circuit.length && circuit.length.trim() !== "") {
    return circuit.length.includes("km")
      ? circuit.length
      : `${circuit.length} km`;
  }

  const searchText =
    `${circuit.name} ${circuit.grand_prix} ${circuit.location} ${circuit.country}`.toLowerCase();

  const foundKey = Object.keys(CIRCUIT_DISTANCES).find((key) =>
    searchText.includes(key)
  );

  return foundKey ? CIRCUIT_DISTANCES[foundKey] : "-";
}

function formatWinnerName(winner?: string | null) {
  if (!winner || winner.trim() === "") return "-";
  return winner;
}

export default function CalendarPage() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircuits();
  }, []);

  async function loadCircuits() {
    setLoading(true);

    const { data: circuitsData, error: circuitsError } = await supabase
      .from("circuits")
      .select("*")
      .eq("selected", true)
      .order("calendar_order", { ascending: true });

    if (circuitsError) {
      console.error("Erro ao carregar calendário:", circuitsError);
      setCircuits([]);
      setLoading(false);
      return;
    }

    const { data: resultsData, error: resultsError } = await supabase
      .from("race_results")
      .select("race_id, driver_id, position")
      .eq("position", 1);

    if (resultsError) {
      console.error("Erro ao carregar vencedores:", resultsError);
      setCircuits((circuitsData || []) as Circuit[]);
      setLoading(false);
      return;
    }

    const driverIds = Array.from(
      new Set((resultsData || []).map((r) => r.driver_id).filter(Boolean))
    );

    const { data: driversData } = await supabase
      .from("drivers")
      .select("id, name")
      .in("id", driverIds);

    const driversMap = new Map<string, string>();

    (driversData || []).forEach((d) => {
      driversMap.set(String(d.id), d.name);
    });

    const winnersMap = new Map<string, string>();

    (resultsData || []).forEach((r) => {
      const name = driversMap.get(String(r.driver_id));

      if (r.race_id && name) {
        winnersMap.set(String(r.race_id), name);
      }
    });

    const circuitsWithWinners = ((circuitsData || []) as Circuit[]).map(
      (circuit) => ({
        ...circuit,
        winner: winnersMap.get(String(circuit.id)) || "",
      })
    );

    setCircuits(circuitsWithWinners);
    setLoading(false);
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "";

    const [day, month, year] = dateStr.split("/");
    const date = new Date(`${year}-${month}-${day}`);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  function renderCard(circuit: Circuit) {
    const isLocked = !circuit.winner;

    const flagUrl = circuit.country_code
      ? `https://flagcdn.com/w40/${circuit.country_code.toLowerCase()}.png`
      : circuit.flag;

    return (
      <div
        className={`group relative overflow-hidden rounded-xl border bg-[#070d13] transition-all duration-300 ${isLocked
          ? "border-zinc-900 opacity-55"
          : "border-zinc-800 hover:scale-[1.02] hover:bg-white/[0.03]"
          }`}
      >
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={circuit.track_image}
            alt={circuit.name}
            className={`h-full w-full object-cover transition-transform duration-500 ${isLocked ? "grayscale" : "group-hover:scale-105"
              }`}
          />

          <div
            className={`absolute left-2 top-2 rounded-md px-2 py-1 text-xs font-bold text-white ${isLocked ? "bg-red-950/70" : "bg-red-600"
              }`}
          >
            {circuit.calendar_order}
          </div>

          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <img
                src="/icons/block.png"
                alt="Bloqueado"
                className="relative h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]"
              />
            </div>
          )}
        </div>

        <div className="p-4">
          <div
            className="mb-2 flex items-center gap-2 text-xs uppercase text-zinc-400"
            title={circuit.location}
          >
            {flagUrl && (
              <img
                src={flagUrl}
                alt={circuit.country}
                className="h-4 w-5 object-cover"
              />
            )}

            <span>
              {circuit.location} {circuit.country}
            </span>
          </div>

          <h2 className="mb-1 text-lg font-semibold leading-tight">
            {circuit.name}
          </h2>

          <p className="mb-4 text-sm text-zinc-400">
            {formatDate(circuit.date)}
          </p>

          <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
            <div>
              <p className="flex items-center gap-1 opacity-60">
                <Flag size={14} className="text-zinc-400 group-hover:text-red-400 transition" />
                <span>LAPS</span>
              </p>
              <p className="font-medium text-white">{circuit.laps}</p>
            </div>

            <div>
              <p className="flex items-center gap-1 opacity-60">
                <Ruler size={14} className="text-zinc-400 group-hover:text-red-400 transition" />
                <span>DISTÂNCIA</span>
              </p>
              <p className="font-medium text-white">
                {getCircuitDistance(circuit)}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1 opacity-60">
                <Trophy size={14} className="text-zinc-400 group-hover:text-red-400 transition" />
                <span>WINNER</span>
              </p>
              <p className="truncate font-medium text-white">
                {formatWinnerName(circuit.winner)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020407] px-6 py-8 text-white">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold tracking-wide text-red-600">
          CALENDÁRIO
        </p>

        <h1 className="mb-2 text-3xl font-bold md:text-4xl">
          TEMPORADA 2026
        </h1>

        <p className="text-zinc-400">
          Acompanhe todas as corridas e detalhes da temporada.
        </p>
      </div>

      {loading && (
        <div className="text-zinc-400">Carregando calendário...</div>
      )}

      {!loading && circuits.length === 0 && (
        <div className="text-zinc-400">Nenhuma corrida encontrada.</div>
      )}

      {!loading && circuits.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {circuits.map((circuit) => {
            const isLocked = !circuit.winner;

            if (isLocked) {
              return (
                <div
                  key={circuit.id}
                  className="group cursor-not-allowed hover:animate-[shake_0.35s_ease-in-out]"
                >
                  {renderCard(circuit)}
                </div>
              );
            }

            return (
              <Link
                key={circuit.id}
                href={`/races/${circuit.id}`}
                className="group cursor-pointer"
              >
                {renderCard(circuit)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}