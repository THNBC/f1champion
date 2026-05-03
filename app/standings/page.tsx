"use client";

import { supabase } from "@/lib/supabase";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Driver = {
    id: string;
    name: string;
    nationality: string | null;
    team_id: string;
};

type Team = {
    id: string;
    name: string;
    country: string | null;
    logo: string | null;
    color: string | null;
};

type RaceResult = {
    race_id: string;
    position: number;
    driver_id: string;
    team_id: string;
    grid: number | null;
    fastest_lap: string | null;
    points: number | null;
    status: string | null;
};

type Circuit = {
    id: string;
    calendar_order: number | null;
};

type DriverStanding = {
    position: number;
    previousPosition: number | null;
    driver: Driver;
    team: Team | null;
    points: number;
    gap: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps: number;
};

type TeamStanding = {
    position: number;
    previousPosition: number | null;
    team: Team;
    points: number;
    gap: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps: number;
};

function parseFastestLap(value: string | null) {
    if (!value) return Number.POSITIVE_INFINITY;

    const match = value.trim().match(/^(\d+):(\d{2})\.(\d{1,3})$/);
    if (!match) return Number.POSITIVE_INFINITY;

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const milliseconds = Number(match[3].padEnd(3, "0"));

    return minutes * 60_000 + seconds * 1000 + milliseconds;
}

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
                className={`text-[11px] font-black transition-transform duration-200 group-hover:scale-125 ${
                    isUp
                        ? "animate-[arrowUp_0.7s_ease-out] text-emerald-500 group-hover:-translate-y-1"
                        : "animate-[arrowDown_0.7s_ease-out] text-red-500 group-hover:translate-y-1"
                }`}
            >
                {isUp ? "▲" : "▼"}
            </span>

            <span
                className={`pointer-events-none absolute left-1/2 top-7 z-30 -translate-x-1/2 whitespace-nowrap rounded-md px-3 py-2 text-[11px] font-bold opacity-0 shadow-xl transition group-hover:opacity-100 ${
                    isUp
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

function StandingsContent() {
    const searchParams = useSearchParams();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [results, setResults] = useState<RaceResult[]>([]);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [activeTab, setActiveTab] = useState<"drivers" | "teams">(
        searchParams.get("tab") === "teams" ? "teams" : "drivers"
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            const { data: driversData } = await supabase
                .from("drivers")
                .select("*")
                .order("slot", { ascending: true });

            const { data: teamsData } = await supabase.from("teams").select("*");

            const { data: resultsData } = await supabase
                .from("race_results")
                .select("*")
                .order("position", { ascending: true });

            const { data: circuitsData } = await supabase
                .from("circuits")
                .select("id, calendar_order")
                .order("calendar_order", { ascending: true });

            setDrivers(driversData || []);
            setTeams(teamsData || []);
            setResults(resultsData || []);
            setCircuits(circuitsData || []);
            setLoading(false);
        }

        loadData();
    }, []);

    const fastestLapByRace = useMemo(() => {
        const map = new Map<string, string>();

        const grouped = results.reduce<Record<string, RaceResult[]>>((acc, result) => {
            if (!acc[result.race_id]) acc[result.race_id] = [];
            acc[result.race_id].push(result);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([raceId, raceResults]) => {
            const fastest = raceResults
                .filter((result) => result.status !== "DNF")
                .sort(
                    (a, b) =>
                        parseFastestLap(a.fastest_lap) -
                        parseFastestLap(b.fastest_lap)
                )[0];

            if (
                fastest?.driver_id &&
                parseFastestLap(fastest.fastest_lap) !== Number.POSITIVE_INFINITY
            ) {
                map.set(raceId, fastest.driver_id);
            }
        });

        return map;
    }, [results]);

    const latestRaceId = useMemo(() => {
        const raceIdsWithResults = new Set(results.map((result) => result.race_id));

        const completedCircuits = circuits
            .filter((circuit) => raceIdsWithResults.has(circuit.id))
            .sort(
                (a, b) =>
                    Number(b.calendar_order ?? 0) - Number(a.calendar_order ?? 0)
            );

        return completedCircuits[0]?.id ?? null;
    }, [circuits, results]);

    const previousResults = useMemo(() => {
        if (!latestRaceId) return [];
        return results.filter((result) => result.race_id !== latestRaceId);
    }, [results, latestRaceId]);

    const previousDriverPositions = useMemo(() => {
        const standings = drivers.map((driver) => {
            const points = previousResults
                .filter((result) => result.driver_id === driver.id)
                .reduce((sum, result) => sum + Number(result.points ?? 0), 0);

            return {
                driverId: driver.id,
                points,
            };
        });

        const sorted = standings.sort((a, b) => b.points - a.points);
        const map = new Map<string, number>();

        sorted.forEach((item, index) => {
            map.set(item.driverId, index + 1);
        });

        return map;
    }, [drivers, previousResults]);

    const previousTeamPositions = useMemo(() => {
        const standings = teams.map((team) => {
            const points = previousResults
                .filter((result) => result.team_id === team.id)
                .reduce((sum, result) => sum + Number(result.points ?? 0), 0);

            return {
                teamId: team.id,
                points,
            };
        });

        const sorted = standings.sort((a, b) => b.points - a.points);
        const map = new Map<string, number>();

        sorted.forEach((item, index) => {
            map.set(item.teamId, index + 1);
        });

        return map;
    }, [teams, previousResults]);

    const driverStandings = useMemo<DriverStanding[]>((() => {
        const standings = drivers.map((driver) => {
            const driverResults = results.filter(
                (result) => result.driver_id === driver.id
            );

            const team = teams.find((item) => item.id === driver.team_id) ?? null;

            const points = driverResults.reduce(
                (sum, result) => sum + Number(result.points ?? 0),
                0
            );

            const wins = driverResults.filter((result) => result.position === 1).length;

            const podiums = driverResults.filter(
                (result) => result.position >= 1 && result.position <= 3
            ).length;

            const poles = driverResults.filter(
                (result) => Number(result.grid) === 1
            ).length;

            const fastestLaps = driverResults.filter(
                (result) => fastestLapByRace.get(result.race_id) === driver.id
            ).length;

            return {
                position: 0,
                previousPosition: null,
                driver,
                team,
                points,
                gap: 0,
                wins,
                podiums,
                poles,
                fastestLaps,
            };
        });

        const sorted = standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.podiums - a.podiums;
        });

        const leaderPoints = sorted[0]?.points ?? 0;

        return sorted.map((item, index) => ({
            ...item,
            position: index + 1,
            previousPosition: previousDriverPositions.get(item.driver.id) ?? null,
            gap: leaderPoints - item.points,
        }));
    }) as () => DriverStanding[], [
        drivers,
        teams,
        results,
        previousDriverPositions,
        fastestLapByRace,
    ]);

    const teamStandings = useMemo<TeamStanding[]>(() => {
        const standings = teams.map((team) => {
            const teamResults = results.filter((result) => result.team_id === team.id);

            const points = teamResults.reduce(
                (sum, result) => sum + Number(result.points ?? 0),
                0
            );

            const wins = teamResults.filter((result) => result.position === 1).length;

            const podiums = teamResults.filter(
                (result) => result.position >= 1 && result.position <= 3
            ).length;

            const poles = teamResults.filter(
                (result) => Number(result.grid) === 1
            ).length;

            const fastestLaps = teamResults.filter(
                (result) => fastestLapByRace.get(result.race_id) === result.driver_id
            ).length;

            return {
                position: 0,
                previousPosition: null,
                team,
                points,
                gap: 0,
                wins,
                podiums,
                poles,
                fastestLaps,
            };
        });

        const sorted = standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.podiums - a.podiums;
        });

        const leaderPoints = sorted[0]?.points ?? 0;

        return sorted.map((item, index) => ({
            ...item,
            position: index + 1,
            previousPosition: previousTeamPositions.get(item.team.id) ?? null,
            gap: leaderPoints - item.points,
        }));
    }, [teams, results, previousTeamPositions, fastestLapByRace]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                Carregando classificação...
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#020407] px-10 py-10 text-white">
            <div className="relative z-10 mx-auto max-w-[1500px]">
                <div className="relative mb-10 min-h-[260px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#070d13] p-10 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
                    {/* IMAGEM FULL */}
                    <div className="pointer-events-none absolute inset-0">
                        <img
                            src={
                                activeTab === "drivers"
                                    ? "/standings/drivers-bg.png"
                                    : "/standings/teams-bg.png"
                            }
                            alt=""
                            className="h-full w-full object-cover object-[80%_center]"
                        />
                    </div>

                    {/* DEGRADE ESQUERDA → DIREITA */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#020407] via-[#020407]/80 to-transparent" />

                    {/* DEGRADE BAIXO (profundidade) */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020407]/90" />

                    <div className="relative z-10 max-w-3xl">
                        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-red-500">
                            Campeonato
                        </p>

                        <h1 className="text-6xl font-black uppercase tracking-tight">
                            Classificação
                        </h1>

                        <p className="mt-5 text-lg text-zinc-400">
                            Confira a classificação atual do campeonato.
                        </p>
                    </div>
                </div>

                <div className="mb-6 flex gap-10 border-b border-zinc-800">
                    <button
                        onClick={() => setActiveTab("drivers")}
                        className={`flex cursor-pointer items-center gap-3 border-b-2 px-4 py-4 text-sm font-black uppercase transition ${
                            activeTab === "drivers"
                                ? "border-red-600 text-red-500"
                                : "border-transparent text-zinc-500 hover:text-white"
                        }`}
                    >
                        Campeonato de Pilotos
                    </button>

                    <button
                        onClick={() => setActiveTab("teams")}
                        className={`flex cursor-pointer items-center gap-3 border-b-2 px-4 py-4 text-sm font-black uppercase transition ${
                            activeTab === "teams"
                                ? "border-red-600 text-red-500"
                                : "border-transparent text-zinc-500 hover:text-white"
                        }`}
                    >
                        Campeonato de Equipes
                    </button>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-[#070d13]/95 p-6 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
                    <div className="relative z-10">
                        {activeTab === "drivers" ? (
                            <>
                                <div className="grid grid-cols-[50px_40px_2fr_2fr_1fr_1fr_1fr_1.2fr_1.2fr] border-b border-zinc-800 px-2 pb-4 text-xs font-black uppercase text-zinc-500">
                                    <span>Pos.</span>
                                    <span />
                                    <span>Piloto</span>
                                    <span>Equipe</span>

                                    <span className="text-center whitespace-nowrap">
                                        Vitórias
                                    </span>

                                    <span className="text-center whitespace-nowrap">
                                        Pódios
                                    </span>

                                    <span className="text-center whitespace-nowrap">
                                        Poles
                                    </span>

                                    <span className="text-center whitespace-nowrap">
                                        Voltas Rápidas
                                    </span>

                                    <span className="flex justify-end">
                                        <span className="w-[76px] text-left">Pts</span>
                                    </span>
                                </div>

                                <div>
                                    {driverStandings.map((item) => (
                                        <div
                                            key={item.driver.id}
                                            className="grid grid-cols-[50px_40px_2fr_2fr_1fr_1fr_1fr_1.2fr_1.2fr] items-center border-b border-zinc-800/80 px-2 py-4 text-sm text-zinc-300 transition hover:bg-white/[0.03]"
                                        >
                                            <span className="text-base font-black text-white">
                                                {item.position}
                                            </span>

                                            <MovementArrow
                                                current={item.position}
                                                previous={item.previousPosition}
                                            />

                                            <div className="min-w-0">
                                                <Link
                                                    href={`/drivers/${item.driver.id}`}
                                                    className="block truncate font-black text-white transition-all duration-200 hover:text-red-400"
                                                >
                                                    {item.driver.name}
                                                </Link>
                                            </div>

                                            <div className="flex min-w-0 items-center gap-3">
                                                {item.team?.logo && (
                                                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-black/30">
                                                        <img
                                                            src={item.team.logo}
                                                            alt={item.team.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                )}

                                                {item.team ? (
                                                    <Link
                                                        href={`/teams/${item.team.id}`}
                                                        className="truncate font-black text-white transition-all duration-200 hover:text-red-400"
                                                    >
                                                        {item.team.name}
                                                    </Link>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </div>

                                            <span className="text-center">
                                                {item.wins}
                                            </span>

                                            <span className="text-center">
                                                {item.podiums}
                                            </span>

                                            <span className="text-center">
                                                {item.poles}
                                            </span>

                                            <span className="text-center">
                                                {item.fastestLaps}
                                            </span>

                                            <div className="flex items-baseline justify-end gap-2">
                                                <span className="min-w-[34px] text-right text-xl font-black text-red-500">
                                                    {item.points}
                                                </span>

                                                <span className="min-w-[42px] text-left text-xs font-bold text-zinc-500/40">
                                                    {item.gap === 0 ? "" : `-${item.gap}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-[50px_40px_2.5fr_1fr_1fr_1fr_1.2fr_1.2fr] border-b border-zinc-800 px-2 pb-4 text-xs font-black uppercase text-zinc-500">
                                    <span>Pos.</span>
                                    <span />
                                    <span>Equipe</span>

                                    <span className="text-center whitespace-nowrap">
                                        Vitórias
                                    </span>

                                    <span className="text-center whitespace-nowrap">
                                        Pódios
                                    </span>

                                    <span className="text-center whitespace-nowrap">
                                        Poles
                                    </span>

                                    <span className="text-center whitespace-nowrap">
                                        Voltas Rápidas
                                    </span>

                                    <span className="flex justify-end">
                                        <span className="w-[76px] text-left">Pts</span>
                                    </span>
                                </div>

                                <div>
                                    {teamStandings.map((item) => (
                                        <div
                                            key={item.team.id}
                                            className="grid grid-cols-[50px_40px_2.5fr_1fr_1fr_1fr_1.2fr_1.2fr] items-center border-b border-zinc-800/80 px-2 py-4 text-sm text-zinc-300 transition hover:bg-white/[0.03]"
                                        >
                                            <span className="text-base font-black text-white">
                                                {item.position}
                                            </span>

                                            <MovementArrow
                                                current={item.position}
                                                previous={item.previousPosition}
                                            />

                                            <div className="flex min-w-0 items-center gap-3">
                                                {item.team.logo && (
                                                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-black/30">
                                                        <img
                                                            src={item.team.logo}
                                                            alt={item.team.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                )}

                                                <Link
                                                    href={`/teams/${item.team.id}`}
                                                    className="truncate font-black text-white transition-all duration-200 hover:text-red-400"
                                                >
                                                    {item.team.name}
                                                </Link>
                                            </div>

                                            <span className="text-center">
                                                {item.wins}
                                            </span>

                                            <span className="text-center">
                                                {item.podiums}
                                            </span>

                                            <span className="text-center">
                                                {item.poles}
                                            </span>

                                            <span className="text-center">
                                                {item.fastestLaps}
                                            </span>

                                            <div className="flex items-baseline justify-end gap-2">
                                                <span className="min-w-[34px] text-right text-xl font-black text-red-500">
                                                    {item.points}
                                                </span>

                                                <span className="min-w-[42px] text-left text-xs font-bold text-zinc-500/40">
                                                    {item.gap === 0 ? "" : `-${item.gap}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <p className="mt-6 text-xs text-zinc-500">
                            Pontos baseados nos resultados salvos em cada corrida.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function StandingsPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                    Carregando classificação...
                </main>
            }
        >
            <StandingsContent />
        </Suspense>
    );
}