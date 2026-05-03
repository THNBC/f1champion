"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Driver = {
  id: string | number;
  name: string;
  team?: string;
  teamId?: string;
  team_id?: string | number;
};

type Team = {
  id: string | number;
  name: string;
  color?: string;
  logo?: string | null;
};

type Circuit = {
  id: string;
  name: string;
  circuit?: string;
  location?: string;
  date?: string;
  track_length?: string;
  calendar_order?: number;
  is_finished?: boolean;
  country_code?: string;
};

type RaceResult = {
  id?: string | number;
  race_id?: string | number;
  position?: number;
  driver?: string;
  driver_id?: string | number;
  team?: string;
  team_id?: string | number;
  points?: number;
};

function MovementArrow({
  current,
  previous,
}: {
  current: number;
  previous: number | null;
}) {
  if (!previous) return <span />;

  const diff = previous - current;
  if (diff === 0) return <span />;

  const isUp = diff > 0;
  const amount = Math.abs(diff);
  const text = isUp ? `+${amount}` : `-${amount}`;

  return (
    <span className="group relative flex h-5 w-5 items-center justify-center">
      <span
        className={`text-[11px] font-black transition-transform duration-200 group-hover:scale-125 ${isUp
          ? "animate-[arrowUp_0.7s_ease-out] text-emerald-500 group-hover:-translate-y-1"
          : "animate-[arrowDown_0.7s_ease-out] text-red-500 group-hover:translate-y-1"
          }`}
      >
        {isUp ? "▲" : "▼"}
      </span>

      <span
        className={`pointer-events-none absolute left-1/2 top-7 z-30 -translate-x-1/2 whitespace-nowrap rounded-md px-3 py-2 text-[11px] font-bold opacity-0 shadow-xl transition group-hover:opacity-100 ${isUp
          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          : "border border-red-500/40 bg-red-500/10 text-red-400"
          }`}
      >
        {text}
      </span>

      <style jsx>{`
        @keyframes arrowUp {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes arrowDown {
          0% {
            opacity: 0;
            transform: translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </span>
  );
}

export default function HomePage() {
  const [driversData, setDriversData] = useState<Driver[]>([]);
  const [teamsData, setTeamsData] = useState<Team[]>([]);
  const [circuitsData, setCircuitsData] = useState<Circuit[]>([]);
  const [resultsData, setResultsData] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);

      const [driversResponse, teamsResponse, circuitsResponse, resultsResponse] =
        await Promise.all([
          supabase.from("drivers").select("*"),
          supabase.from("teams").select("*"),
          supabase.from("circuits").select("*").order("calendar_order", {
            ascending: true,
          }),
          supabase.from("race_results").select("*"),
        ]);

      if (driversResponse.error) console.error(driversResponse.error);
      if (teamsResponse.error) console.error(teamsResponse.error);
      if (circuitsResponse.error) console.error(circuitsResponse.error);
      if (resultsResponse.error) console.error(resultsResponse.error);

      setDriversData(driversResponse.data ?? []);
      setTeamsData(teamsResponse.data ?? []);
      setCircuitsData(circuitsResponse.data ?? []);
      setResultsData(resultsResponse.data ?? []);

      setLoading(false);
    }

    loadHomeData();
  }, []);

  function getCircuitFlagUrl(countryCode?: string) {
    if (!countryCode) return null;
    return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
  }

  function normalizeRaceImageName(value?: string | number | null) {
    if (!value) return "";

    return String(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function getRaceHeroImage(circuit?: Circuit | null) {
    if (!circuit) return "/races/default.png";

    const name = normalizeRaceImageName(
      circuit.id || circuit.name || circuit.circuit
    );

    return `/races/${name}.png`;
  }

  function getDriverImage(driver?: Driver | null, team?: Team | null) {
    if (!driver || !team) return "/drivers/default.png";

    const teamName = normalizeRaceImageName(team.id || team.name);

    const teamDrivers = driversData.filter(
      (d) => String(d.team_id ?? d.teamId) === String(team.id)
    );

    const index = teamDrivers.findIndex(
      (d) => String(d.id) === String(driver.id)
    );

    return `/drivers/${teamName}${index === 1 ? "1" : ""}.png`;
  }

  function getCarImage(team?: Team | null) {
    if (!team) return "/cars/default-car.png";

    const name = normalizeRaceImageName(team.id || team.name);

    return `/cars/${name}1.png`;
  }

  const nextRace = useMemo(() => {
    return (
      circuitsData.find((circuit) => !circuit.is_finished) ??
      circuitsData[0] ??
      null
    );
  }, [circuitsData]);

  const finishedRaces = useMemo(() => {
    return circuitsData.filter((circuit) => circuit.is_finished);
  }, [circuitsData]);

  const currentRound = finishedRaces.length + 1;

  const selectedCircuit =
    circuitsData.find((circuit) => String(circuit.id) === selectedCircuitId) ??
    nextRace;

  const selectedRaceResults = useMemo(() => {
    if (!selectedCircuit) return [];

    return resultsData
      .filter((result) => String(result.race_id) === String(selectedCircuit.id))
      .sort((a, b) => Number(a.position ?? 999) - Number(b.position ?? 999));
  }, [resultsData, selectedCircuit]);

  const selectedRaceWinnerResult = selectedRaceResults[0] ?? null;

  const selectedRaceWinnerDriver = selectedRaceWinnerResult
    ? driversData.find(
      (driver) =>
        String(driver.id) === String(selectedRaceWinnerResult.driver_id) ||
        driver.name === selectedRaceWinnerResult.driver
    ) ?? null
    : null;

  const selectedRaceWinnerTeam = selectedRaceWinnerResult
    ? teamsData.find(
      (team) =>
        String(team.id) === String(selectedRaceWinnerResult.team_id) ||
        team.name === selectedRaceWinnerResult.team
    ) ?? null
    : null;

  const previousDriverPositions = useMemo(() => {
    const raceIds = [...new Set(resultsData.map((result) => result.race_id))];
    const lastRace = raceIds[raceIds.length - 1];

    const previousResults = resultsData.filter(
      (result) => result.race_id !== lastRace
    );

    const pointsMap = new Map<string, number>();

    previousResults.forEach((result) => {
      if (!result.driver_id && !result.driver) return;

      const key = String(result.driver_id ?? result.driver);
      const current = pointsMap.get(key) ?? 0;

      pointsMap.set(key, current + Number(result.points ?? 0));
    });

    const sorted = Array.from(pointsMap.entries()).sort((a, b) => b[1] - a[1]);
    const map = new Map<string, number>();

    sorted.forEach(([driverId], index) => {
      map.set(driverId, index + 1);
    });

    return map;
  }, [resultsData]);

  const driverStandings = useMemo(() => {
    const pointsByDriver = new Map<string, number>();

    resultsData.forEach((result) => {
      if (!result.driver_id && !result.driver) return;

      const key = String(result.driver_id ?? result.driver);
      const current = pointsByDriver.get(key) ?? 0;

      pointsByDriver.set(key, current + Number(result.points ?? 0));
    });

    const ranking = Array.from(pointsByDriver.entries())
      .map(([driverKey, points]) => {
        const driver =
          driversData.find((item) => String(item.id) === driverKey) ??
          driversData.find((item) => item.name === driverKey);

        const team = teamsData.find(
          (item) =>
            String(item.id) === String(driver?.team_id ?? driver?.teamId) ||
            item.name === driver?.team
        );

        return {
          driver,
          team,
          points,
        };
      })
      .filter((item) => item.driver)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    const leaderPoints = ranking[0]?.points ?? 0;

    return ranking.map((item, index) => ({
      position: index + 1,
      previousPosition:
        previousDriverPositions.get(String(item.driver?.id)) ?? null,
      ...item,
      gap: index === 0 ? "-" : `-${leaderPoints - item.points}`,
    }));
  }, [driversData, teamsData, resultsData, previousDriverPositions]);

  const winnerStanding = selectedRaceWinnerDriver
    ? driverStandings.find(
      (d) => String(d.driver?.id) === String(selectedRaceWinnerDriver.id)
    )
    : null;




  const previousTeamPositions = useMemo(() => {
    const raceIds = [...new Set(resultsData.map((result) => result.race_id))];
    const lastRace = raceIds[raceIds.length - 1];

    const previousResults = resultsData.filter(
      (result) => result.race_id !== lastRace
    );

    const pointsMap = new Map<string, number>();

    previousResults.forEach((result) => {
      const key = String(result.team_id ?? result.team ?? "");
      if (!key) return;

      const current = pointsMap.get(key) ?? 0;
      pointsMap.set(key, current + Number(result.points ?? 0));
    });

    const sorted = Array.from(pointsMap.entries()).sort((a, b) => b[1] - a[1]);
    const map = new Map<string, number>();

    sorted.forEach(([teamId], index) => {
      map.set(teamId, index + 1);
    });

    return map;
  }, [resultsData]);

  const constructorStandings = useMemo(() => {
    const pointsByTeam = new Map<string, number>();

    resultsData.forEach((result) => {
      const key = String(result.team_id ?? result.team ?? "");
      if (!key) return;

      const current = pointsByTeam.get(key) ?? 0;
      pointsByTeam.set(key, current + Number(result.points ?? 0));
    });

    const ranking = Array.from(pointsByTeam.entries())
      .map(([teamKey, points]) => {
        const team =
          teamsData.find((item) => String(item.id) === teamKey) ??
          teamsData.find((item) => item.name === teamKey);

        return {
          team,
          teamName: team?.name ?? teamKey,
          points,
        };
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    const leaderPoints = ranking[0]?.points ?? 0;

    return ranking.map((item, index) => ({
      position: index + 1,
      previousPosition:
        previousTeamPositions.get(String(item.team?.id ?? item.teamName)) ??
        null,
      ...item,
      gap: index === 0 ? "-" : `-${leaderPoints - item.points}`,
    }));
  }, [teamsData, resultsData, previousTeamPositions]);

  const winnerTeamStanding = selectedRaceWinnerTeam
    ? constructorStandings.find(
      (item) =>
        String(item.team?.id) === String(selectedRaceWinnerTeam.id) ||
        item.teamName === selectedRaceWinnerTeam.name
    )
    : null;

  const leader = driverStandings[0];
  const teamLeader = constructorStandings[0];

  const leaderImage = getDriverImage(leader?.driver, leader?.team);
  const teamLeaderImage = getCarImage(teamLeader?.team);

  const selectedWinnerDriverImage = getDriverImage(
    selectedRaceWinnerDriver,
    selectedRaceWinnerTeam
  );

  const selectedWinnerTeamImage = getCarImage(selectedRaceWinnerTeam);

  const selectedCircuitImageName = normalizeRaceImageName(
    selectedCircuit?.id || selectedCircuit?.name || selectedCircuit?.circuit
  );

  const selectedCircuitImage = selectedCircuitImageName
    ? `/gps/${selectedCircuitImageName}.png`
    : "/gps/default.png";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020407] px-8 py-6 text-white">
        Carregando dados...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020407] px-8 py-6 text-white">
      <div className="mx-auto max-w-[1680px] space-y-4">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#070a0e] to-[#020407]">
          <img
            src={getRaceHeroImage(nextRace)}
            alt={nextRace?.name ?? "Pista"}
            className="absolute inset-0 h-full w-full object-cover object-right opacity-80"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 50%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 10%)",
            }}
            onError={(e) => {
              e.currentTarget.src = "/races/default.png";
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#020407] via-[#020407]/80 to-transparent" />

          <div className="relative z-10 grid min-h-[320px] grid-cols-1 lg:grid-cols-[420px_1fr]">
            <div className="flex flex-col justify-center p-10">
              <p className="mb-3 text-sm font-black uppercase tracking-wide text-red-500">
                Próxima corrida
              </p>

              <h1 className="text-6xl font-black uppercase italic leading-none tracking-tight">
                {nextRace?.name ?? "Sem corrida"}
              </h1>

              <div className="mt-6 flex items-center gap-3 text-zinc-300">
                {getCircuitFlagUrl(nextRace?.country_code) ? (
                  <img
                    src={getCircuitFlagUrl(nextRace?.country_code)!}
                    alt="flag"
                    className="h-6 w-9 rounded-sm border border-zinc-700 object-cover"
                  />
                ) : (
                  <span className="h-6 w-9 rounded-sm bg-zinc-700" />
                )}

                <span className="text-sm uppercase">
                  {nextRace?.location ?? nextRace?.circuit ?? "-"}
                </span>

                <span className="text-zinc-500">•</span>

                <span className="text-sm uppercase">
                  {nextRace?.track_length ?? "-"}
                </span>
              </div>

              <p className="mt-5 text-xl font-semibold text-zinc-200">
                {nextRace?.date
                  ? nextRace.date.split("-").reverse().join("/")
                  : "Data não definida"}
              </p>
            </div>
          </div>
        </section>

        {/* STANDINGS */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-[#070a0e] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase">
                Classificação dos pilotos
              </h2>

              <Link
                href="/standings"
                className="text-xs font-bold uppercase text-red-500"
              >
                Ver classificação
              </Link>
            </div>

            <div className="grid grid-cols-[50px_40px_1fr_160px_90px_70px] border-b border-zinc-800 pb-3 text-xs uppercase text-zinc-500">
              <span>Pos</span>
              <span />
              <span>Piloto</span>
              <span>Equipe</span>
              <span>Pontos</span>
              <span>Dif.</span>
            </div>

            {driverStandings.length > 0 ? (
              driverStandings.map((item) => (
                <div
                  key={item.driver?.id}
                  className="grid grid-cols-[50px_40px_1fr_160px_90px_70px] items-center border-b border-zinc-800/70 py-3 text-sm"
                >
                  <span className="font-bold">{item.position}</span>

                  <MovementArrow
                    current={item.position}
                    previous={(item as any).previousPosition}
                  />

                  <Link
                    href={`/drivers/${item.driver?.id}`}
                    className="font-semibold transition hover:text-red-500"
                  >
                    {item.driver?.name}
                  </Link>

                  <Link
                    href={`/teams/${item.team?.id}`}
                    className="flex items-center gap-2 text-zinc-400 transition hover:text-red-500"
                  >
                    {item.team?.logo ? (
                      <img
                        src={item.team.logo}
                        alt={item.team.name}
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <span className="h-3 w-3 rounded-full bg-zinc-600" />
                    )}

                    <span>{item.team?.name ?? "-"}</span>
                  </Link>

                  <span className="font-bold">{item.points}</span>
                  <span className="text-zinc-500">{item.gap}</span>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-zinc-500">
                Nenhum resultado registrado ainda.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#070a0e] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase">
                Classificação das equipes
              </h2>

              <Link
                href="/standings?tab=teams"
                className="text-xs font-bold uppercase text-red-500"
              >
                Ver classificação
              </Link>
            </div>

            <div className="grid grid-cols-[50px_40px_1fr_100px_70px] border-b border-zinc-800 pb-3 text-xs uppercase text-zinc-500">
              <span>Pos</span>
              <span />
              <span>Equipe</span>
              <span>Pontos</span>
              <span>Dif.</span>
            </div>

            {constructorStandings.length > 0 ? (
              constructorStandings.map((item) => (
                <div
                  key={item.team?.id ?? item.teamName}
                  className="grid grid-cols-[50px_40px_1fr_100px_70px] items-center border-b border-zinc-800/70 py-3 text-sm"
                >
                  <span className="font-bold">{item.position}</span>

                  <MovementArrow
                    current={item.position}
                    previous={(item as any).previousPosition}
                  />

                  <Link
                    href={`/teams/${item.team?.id}`}
                    className="flex items-center gap-3 transition hover:text-red-500"
                  >
                    {item.team?.logo ? (
                      <img
                        src={item.team.logo}
                        alt={item.teamName}
                        className="h-7 w-7 object-contain"
                      />
                    ) : (
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: item.team?.color ?? "#71717a",
                        }}
                      />
                    )}

                    <span className="font-semibold">{item.teamName}</span>
                  </Link>

                  <span className="font-bold">{item.points}</span>
                  <span className="text-zinc-500">{item.gap}</span>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-zinc-500">
                Nenhuma pontuação registrada ainda.
              </p>
            )}
          </div>
        </section>

        {/* BOTTOM CARDS */}
        {/* BOTTOM CARDS */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#070a0e] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase">
                Progresso da temporada
              </h2>

              <span className="text-xs font-black uppercase text-red-500">
                Rodada {Math.min(currentRound, circuitsData.length || 24)} /{" "}
                {circuitsData.length || 24}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_220px] items-center gap-5">
              <div>
                <p className="text-sm text-zinc-400">
                  {selectedCircuit?.is_finished ? "Etapa finalizada" : "Próxima etapa"}
                </p>

                <h3 className="mt-1 text-3xl font-black">
                  {selectedCircuit?.name ?? "-"}
                </h3>

                <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                  {getCircuitFlagUrl(selectedCircuit?.country_code) ? (
                    <img
                      src={getCircuitFlagUrl(selectedCircuit?.country_code)!}
                      alt="flag"
                      className="h-4 w-6 rounded-sm border border-zinc-700 object-cover"
                    />
                  ) : (
                    <span className="h-4 w-6 rounded-sm bg-zinc-700" />
                  )}

                  <span>{selectedCircuit?.location ?? selectedCircuit?.circuit ?? "-"}</span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <span>
                    {selectedCircuit?.date
                      ? selectedCircuit.date.split("-").reverse().join("/")
                      : "-"}
                  </span>

                  <span>•</span>

                  <span>{selectedCircuit?.track_length ?? "-"}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <img
                  src={selectedCircuitImage}
                  alt={selectedCircuit?.name ?? "Pista"}
                  className="h-[150px] w-auto object-contain opacity-95"
                  onError={(e) => {
                    e.currentTarget.src = "/gps/default.png";
                  }}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {(circuitsData.length > 0
                ? circuitsData
                : Array.from({ length: 24 }, (_, index) => ({
                  id: String(index + 1),
                  is_finished: false,
                }))
              ).map((circuit, index) => {
                const isSelected = String(circuit.id) === String(selectedCircuit?.id);

                return (
                  <button
                    key={circuit.id}
                    type="button"
                    onClick={() => setSelectedCircuitId(String(circuit.id))}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition hover:scale-110 ${isSelected
                      ? "bg-red-600 text-white ring-2 ring-red-400/60"
                      : circuit.is_finished
                        ? "bg-emerald-500 text-black"
                        : index + 1 === currentRound
                          ? "bg-red-600/70 text-white"
                          : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                      }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#070a0e] p-6">
            <h2 className="mb-6 text-lg font-black uppercase">
              {selectedRaceWinnerDriver ? "Vencedor do GP" : "Líder do campeonato"}
            </h2>

            {selectedRaceWinnerDriver ? (
              <div className="relative min-h-[220px]">
                <div className="relative z-10 max-w-[260px]">
                  <p className="text-7xl font-black">
                    {winnerStanding?.position ?? 1}º
                  </p>

                  <Link
                    href={`/drivers/${selectedRaceWinnerDriver.id}`}
                    className="mt-2 block break-words text-2xl font-black uppercase leading-tight transition hover:text-red-500"
                  >
                    {selectedRaceWinnerDriver.name}
                  </Link>

                  <Link
                    href={`/teams/${selectedRaceWinnerTeam?.id}`}
                    className="mt-2 flex max-w-[230px] items-center gap-2 text-zinc-400 transition hover:text-red-500"
                  >
                    {selectedRaceWinnerTeam?.logo ? (
                      <img
                        src={selectedRaceWinnerTeam.logo}
                        alt={selectedRaceWinnerTeam.name}
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                    ) : (
                      <span className="h-3 w-3 shrink-0 rounded-full bg-zinc-600" />
                    )}

                    <span className="leading-tight">
                      {selectedRaceWinnerTeam?.name ?? "-"}
                    </span>
                  </Link>

                  <p className="mt-6 text-4xl font-black text-red-500">
                    {selectedRaceWinnerResult?.points ?? 25}
                    <span className="ml-2 text-xl text-zinc-400">PTS</span>
                  </p>
                </div>

                <div className="pointer-events-none absolute bottom-0 right-0 h-[220px] w-[280px] overflow-hidden">
                  <img
                    src={selectedWinnerDriverImage}
                    alt={selectedRaceWinnerDriver.name}
                    className="absolute bottom-0 right-0 h-[220px] w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/drivers/default.png";
                    }}
                  />
                </div>
              </div>
            ) : leader ? (
              <div className="relative min-h-[220px]">
                <div className="relative z-10 max-w-[260px]">
                  <p className="text-7xl font-black">{leader.position}º</p>

                  <Link
                    href={`/drivers/${leader.driver?.id}`}
                    className="mt-2 block break-words text-2xl font-black uppercase leading-tight transition hover:text-red-500"
                  >
                    {leader.driver?.name}
                  </Link>

                  <Link
                    href={`/teams/${leader.team?.id}`}
                    className="mt-2 flex max-w-[230px] items-center gap-2 text-zinc-400 transition hover:text-red-500"
                  >
                    {leader.team?.logo ? (
                      <img
                        src={leader.team.logo}
                        alt={leader.team.name}
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                    ) : (
                      <span className="h-3 w-3 shrink-0 rounded-full bg-zinc-600" />
                    )}

                    <span className="leading-tight">{leader.team?.name ?? "-"}</span>
                  </Link>

                  <p className="mt-6 text-4xl font-black text-red-500">
                    {leader.points}
                    <span className="ml-2 text-xl text-zinc-400">PTS</span>
                  </p>
                </div>

                <div className="pointer-events-none absolute bottom-0 right-0 h-[220px] w-[280px] overflow-hidden">
                  <img
                    src={leaderImage}
                    alt={leader.driver?.name}
                    className="absolute bottom-0 right-0 h-[220px] w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/drivers/default.png";
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Nenhum líder definido ainda.</p>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#070a0e] p-6">
            <h2 className="mb-6 text-lg font-black uppercase">
              {selectedRaceWinnerTeam ? "Equipe vencedora" : "Equipe líder"}
            </h2>

            {selectedRaceWinnerTeam ? (
              <div className="relative min-h-[200px]">
                <div className="relative z-10 max-w-[240px]">
                  <p className="text-7xl font-black">
                    {winnerTeamStanding?.position ?? 1}º
                  </p>

                  <Link
                    href={`/teams/${selectedRaceWinnerTeam.id}`}
                    className="mt-2 block break-words text-2xl font-black uppercase leading-tight transition hover:text-red-500"
                  >
                    {selectedRaceWinnerTeam.name}
                  </Link>

                  <p className="mt-6 text-4xl font-black text-red-500">
                    {selectedRaceWinnerResult?.points ?? 25}
                    <span className="ml-2 text-xl text-zinc-400">PTS</span>
                  </p>
                </div>

                <div className="pointer-events-none absolute bottom-0 right-0 h-[200px] w-[260px] overflow-hidden">
                  <img
                    src={selectedWinnerTeamImage}
                    alt={selectedRaceWinnerTeam.name}
                    className="absolute bottom-0 right-0 h-[200px] w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/cars/default-car.png";
                    }}
                  />
                </div>
              </div>
            ) : teamLeader ? (
              <div className="relative min-h-[200px]">
                <div className="relative z-10 max-w-[240px]">
                  <p className="text-7xl font-black">{teamLeader.position}º</p>

                  <Link
                    href={`/teams/${teamLeader.team?.id}`}
                    className="mt-2 block break-words text-2xl font-black uppercase leading-tight transition hover:text-red-500"
                  >
                    {teamLeader.teamName}
                  </Link>

                  <p className="mt-6 text-4xl font-black text-red-500">
                    {teamLeader.points}
                    <span className="ml-2 text-xl text-zinc-400">PTS</span>
                  </p>
                </div>

                <div className="pointer-events-none absolute bottom-0 right-0 h-[200px] w-[260px] overflow-hidden">
                  <img
                    src={teamLeaderImage}
                    alt={teamLeader.teamName}
                    className="absolute bottom-0 right-0 h-[200px] w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/cars/default-car.png";
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Nenhuma equipe líder definida ainda.</p>
            )}
          </div>
        </section>
      </div >
    </main >
  );
}