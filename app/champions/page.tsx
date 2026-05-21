"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Team = {
  id: string;
  name: string;
  logo: string | null;
  color: string | null;
};

type Champion = {
  id: number;
  season: number | null;
  year: number | null;
  driver_name: string | null;
  team_name: string | null;
  team_id: string | null;
};

const gridCols = "grid-cols-[220px_180px_1fr_1.2fr]";

export default function ChampionsPage() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [championsRes, teamsRes] = await Promise.all([
      supabase
        .from("champions")
        .select("id, season, year, driver_name, team_name, team_id")
        .order("season", { ascending: true }),

      supabase.from("teams").select("id, name, logo, color"),
    ]);

    if (championsRes.error) {
      console.error("Erro ao carregar campeões:", championsRes.error);
      setLoading(false);
      return;
    }

    setChampions((championsRes.data || []) as Champion[]);
    setTeams((teamsRes.data || []) as Team[]);
    setLoading(false);
  }

  const topChampion = useMemo(() => {
    const counts: Record<string, { name: string; titles: number }> = {};

    champions.forEach((champion) => {
      const driver = champion.driver_name?.trim();

      if (!driver) return;

      if (!counts[driver]) {
        counts[driver] = { name: driver, titles: 0 };
      }

      counts[driver].titles += 1;
    });

    return Object.values(counts).sort((a, b) => b.titles - a.titles)[0] || null;
  }, [champions]);

  function getTeamLogo(teamId: string | null) {
    const team = teams.find((item) => item.id === teamId);

    if (!team?.logo) return "/logos/default.png";
    if (team.logo.startsWith("/")) return team.logo;

    return `/logos/${team.logo}`;
  }

  function getTeamColor(teamId: string | null) {
    const team = teams.find((item) => item.id === teamId);
    return team?.color || "#27272a";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020407] px-10 py-10 text-white">
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <section className="relative mb-10 min-h-[260px] overflow-hidden rounded-[32px] border border-zinc-800 bg-[#070d13] p-10 shadow-[0_0_60px_rgba(0,0,0,0.45)]">

          {/* IMAGEM FULL */}
          <div className="pointer-events-none absolute inset-0">
            <img
              src="/standings/champions-bg.png"
              alt="Hall da fama"
              className="h-full w-full object-cover object-[80%_center]"
            />
          </div>

          {/* DEGRADE ESQUERDA → DIREITA */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#020407] via-[#020407]/80 to-transparent" />

          {/* DEGRADE BAIXO */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020407]/90" />

          {/* CONTEÚDO */}
          <div className="relative z-10 max-w-3xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-red-500">
              Hall da fama
            </p>

            <h1 className="text-6xl font-black uppercase tracking-tight">
              Campeões
            </h1>

            <p className="mt-5 text-lg text-zinc-400">
              Todos os campeões do campeonato ao longo da história.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-10">
              <div>
                <p className="text-5xl font-black">
                  {champions.length}
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                  Temporadas
                </p>
              </div>

              <div className="h-16 w-px bg-zinc-800" />

              <div>
                <p className="text-3xl font-black">
                  {topChampion?.name || "-"}
                </p>

                <p className="mt-2 text-sm font-bold text-yellow-400">
                  {topChampion
                    ? `${topChampion.titles} ${topChampion.titles === 1
                      ? "título"
                      : "títulos"
                    }`
                    : "0 títulos"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-[#080c11] p-12 text-center text-zinc-400">
            Carregando campeões...
          </div>
        ) : champions.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-[#080c11] p-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-zinc-600" />

            <h2 className="text-2xl font-black">
              Nenhum campeão cadastrado
            </h2>

            <p className="mt-3 text-zinc-400">
              Adicione campeões na tabela{" "}
              <span className="font-bold text-white">champions</span>.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-[28px] border border-zinc-800 bg-[#080c11] shadow-[0_0_60px_rgba(0,0,0,0.35)]">
            <div
              className={`grid ${gridCols} border-b border-red-500 bg-black/20 px-[88px] py-5 text-sm font-black uppercase tracking-[0.18em] text-zinc-400`}
            >
              <div>Temporada</div>
              <div>Ano</div>
              <div>Piloto</div>
              <div>Equipe</div>
            </div>

            <div className="space-y-4 p-6">
              {champions.map((champion) => {
                const teamColor = getTeamColor(champion.team_id);

                return (
                  <div
                    key={champion.id}
                    style={{
                      borderColor: `${teamColor}30`,
                    }}
                    className={`group grid ${gridCols} items-center rounded-2xl border bg-[#05070a] px-16 py-7 transition-all duration-300 hover:bg-white/[0.03]`}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = teamColor;
                      e.currentTarget.style.boxShadow = `0 0 30px ${teamColor}25`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${teamColor}30`;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div className="flex items-center">
                      <span className="text-3xl font-black leading-none">
                        {champion.season ?? "-"}ª
                      </span>
                    </div>

                    <div className="flex flex-col items-start">
                      <p className="text-3xl font-black leading-none">
                        {champion.year ?? "-"}
                      </p>

                      <p className="mt-2 text-xs font-black uppercase tracking-widest text-yellow-400">
                        Campeão
                      </p>
                    </div>

                    <div className="flex items-center">
                      <span className="text-2xl font-black leading-none text-white">
                        {champion.driver_name || "Piloto não informado"}
                      </span>
                    </div>

                    <div className="flex items-center gap-5">
                      <img
                        src={getTeamLogo(champion.team_id)}
                        alt={champion.team_name || "Equipe"}
                        className="h-12 w-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/logos/default.png";
                        }}
                      />

                      <span className="text-2xl font-medium leading-none text-zinc-200">
                        {champion.team_name || "Equipe não informada"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}