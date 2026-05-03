"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Driver = {
    id: string;
    name: string;
    nationality: string | null;
    team_id: string;
};

type Team = {
    id: string;
    name: string;
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
    penalty: boolean | null;
    penalty_count: number | null;
    status: string | null;
};

type RaceAward = {
    race_id: string;
    driver_of_the_day: string | null;
    most_overtakes: string | null;
    cleanest_driving: string | null;
};

type Circuit = {
    id: string;
    calendar_order: number | null;
};

type DriverStatistic = {
    position: number;
    previousPosition: number | null;
    driver: Driver;
    team: Team | null;
    participations: number;
    wins: number;
    poles: number;
    fastestLaps: number;
    driverOfTheDay: number;
    mostOvertakes: number;
    cleanestDriving: number;
    penalties: number;
    points: number;
};

function parseFastestLap(value: string | null) {
    if (!value) return Number.POSITIVE_INFINITY;

    const match = value.trim().match(/^(\d+):(\d{2})\.(\d{1,3})$/);
    if (!match) return Number.POSITIVE_INFINITY;

    return (
        Number(match[1]) * 60000 +
        Number(match[2]) * 1000 +
        Number(match[3].padEnd(3, "0"))
    );
}

function HeaderCell({ label, tooltip }: { label: string; tooltip: string }) {
    return (
        <span className="group relative text-center whitespace-nowrap">
            {label}

            <span className="pointer-events-none absolute left-1/2 top-6 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700 bg-[#05080d] px-3 py-2 text-[11px] font-bold text-zinc-200 opacity-0 shadow-xl transition group-hover:opacity-100">
                {tooltip}
            </span>
        </span>
    );
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

export default function StatisticsPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [results, setResults] = useState<RaceResult[]>([]);
    const [awards, setAwards] = useState<RaceAward[]>([]);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
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

            const { data: awardsData } = await supabase.from("race_awards").select("*");

            const { data: circuitsData } = await supabase
                .from("circuits")
                .select("id, calendar_order")
                .order("calendar_order", { ascending: true });

            setDrivers(driversData || []);
            setTeams(teamsData || []);
            setResults(resultsData || []);
            setAwards(awardsData || []);
            setCircuits(circuitsData || []);
            setLoading(false);
        }

        loadData();
    }, []);

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

    const previousAwards = useMemo(() => {
        if (!latestRaceId) return [];
        return awards.filter((award) => award.race_id !== latestRaceId);
    }, [awards, latestRaceId]);

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

    const previousFastestLapByRace = useMemo(() => {
        const map = new Map<string, string>();

        const grouped = previousResults.reduce<Record<string, RaceResult[]>>(
            (acc, result) => {
                if (!acc[result.race_id]) acc[result.race_id] = [];
                acc[result.race_id].push(result);
                return acc;
            },
            {}
        );

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
    }, [previousResults]);

    const previousPositions = useMemo(() => {
        const previousStats = drivers
            .map((driver) => {
                const driverResults = previousResults.filter(
                    (result) => result.driver_id === driver.id
                );

                const participations = driverResults.length;
                const wins = driverResults.filter(
                    (result) => result.position === 1
                ).length;
                const poles = driverResults.filter(
                    (result) => Number(result.grid) === 1
                ).length;
                const fastestLaps = driverResults.filter(
                    (result) =>
                        previousFastestLapByRace.get(result.race_id) === driver.id
                ).length;

                const driverOfTheDay = previousAwards.filter(
                    (award) => award.driver_of_the_day === driver.id
                ).length;

                const mostOvertakes = previousAwards.filter(
                    (award) => award.most_overtakes === driver.id
                ).length;

                const cleanestDriving = previousAwards.filter(
                    (award) => award.cleanest_driving === driver.id
                ).length;

                const penalties = driverResults.reduce((sum, result) => {
                    if (!result.penalty) return sum;
                    return sum + Number(result.penalty_count ?? 1);
                }, 0);

                const points =
                    participations * 1 +
                    wins * 5 +
                    poles * 3 +
                    fastestLaps * 3 +
                    driverOfTheDay * 2 +
                    mostOvertakes * 2 +
                    cleanestDriving * 2 -
                    penalties * 1;

                return {
                    driverId: driver.id,
                    points,
                    wins,
                    poles,
                    fastestLaps,
                };
            })
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.wins !== a.wins) return b.wins - a.wins;
                if (b.poles !== a.poles) return b.poles - a.poles;
                return b.fastestLaps - a.fastestLaps;
            });

        const map = new Map<string, number>();

        previousStats.forEach((item, index) => {
            map.set(item.driverId, index + 1);
        });

        return map;
    }, [drivers, previousResults, previousAwards, previousFastestLapByRace]);

    const statistics = useMemo<DriverStatistic[]>(() => {
        return drivers
            .map((driver) => {
                const driverResults = results.filter(
                    (result) => result.driver_id === driver.id
                );

                const team = teams.find((item) => item.id === driver.team_id) ?? null;

                const participations = driverResults.length;
                const wins = driverResults.filter((result) => result.position === 1).length;
                const poles = driverResults.filter((result) => Number(result.grid) === 1).length;
                const fastestLaps = driverResults.filter(
                    (result) => fastestLapByRace.get(result.race_id) === driver.id
                ).length;

                const driverOfTheDay = awards.filter(
                    (award) => award.driver_of_the_day === driver.id
                ).length;

                const mostOvertakes = awards.filter(
                    (award) => award.most_overtakes === driver.id
                ).length;

                const cleanestDriving = awards.filter(
                    (award) => award.cleanest_driving === driver.id
                ).length;

                const penalties = driverResults.reduce((sum, result) => {
                    if (!result.penalty) return sum;
                    return sum + Number(result.penalty_count ?? 1);
                }, 0);

                const points =
                    participations * 1 +
                    wins * 5 +
                    poles * 3 +
                    fastestLaps * 3 +
                    driverOfTheDay * 2 +
                    mostOvertakes * 2 +
                    cleanestDriving * 2 -
                    penalties * 1;

                return {
                    position: 0,
                    previousPosition: null,
                    driver,
                    team,
                    participations,
                    wins,
                    poles,
                    fastestLaps,
                    driverOfTheDay,
                    mostOvertakes,
                    cleanestDriving,
                    penalties,
                    points,
                };
            })
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.wins !== a.wins) return b.wins - a.wins;
                if (b.poles !== a.poles) return b.poles - a.poles;
                return b.fastestLaps - a.fastestLaps;
            })
            .map((item, index) => ({
                ...item,
                position: index + 1,
                previousPosition: previousPositions.get(item.driver.id) ?? null,
            }));
    }, [drivers, teams, results, awards, fastestLapByRace, previousPositions]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                Carregando estatísticas...
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#020407] px-10 py-10 text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px]" />

            <div className="relative z-10 mx-auto max-w-[1500px]">
                <div className="mb-10 max-w-4xl">
                    <p className="mb-4 inline-block border-b-2 border-red-600 pb-2 text-sm font-black uppercase tracking-wide text-red-500">
                        Estatísticas
                    </p>

                    <h1 className="text-6xl font-black uppercase tracking-tight">
                        Ranking de Performance
                    </h1>

                    <p className="mt-5 text-lg text-zinc-400">
                        Classificação baseada em participação, vitórias, poles, voltas rápidas, prêmios e punições.
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-[#070d13]/95 p-6 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
                    <div className="grid grid-cols-[50px_40px_2fr_1fr_1fr_1fr_1.2fr_1.2fr_1.5fr_1.4fr_1fr_1fr] border-b border-zinc-800 px-2 pb-4 text-xs font-black uppercase text-zinc-500">
                        <span>Pos.</span>
                        <span />
                        <span>Piloto</span>
                        <HeaderCell label="Participação" tooltip="+1 pt" />
                        <HeaderCell label="Vitórias" tooltip="+5 pts" />
                        <HeaderCell label="Poles" tooltip="+3 pts" />
                        <HeaderCell label="Voltas Rápidas" tooltip="+3 pts" />
                        <HeaderCell label="Piloto do Dia" tooltip="+2 pts" />
                        <HeaderCell label="Mais Ultrapassagens" tooltip="+2 pts" />
                        <HeaderCell label="Pilotagem Limpa" tooltip="+2 pts" />
                        <HeaderCell label="Punições" tooltip="-1 pt" />
                        <span className="text-center whitespace-nowrap">Pts</span>
                    </div>

                    <div>
                        {statistics.map((item) => (
                            <div
                                key={item.driver.id}
                                className="grid grid-cols-[50px_40px_2fr_1fr_1fr_1fr_1.2fr_1.2fr_1.5fr_1.4fr_1fr_1fr] items-center border-b border-zinc-800/80 px-2 py-4 text-sm text-zinc-300 transition hover:bg-white/[0.03]"
                            >
                                <span className="text-base font-black text-white">
                                    {item.position}
                                </span>

                                <MovementArrow
                                    current={item.position}
                                    previous={item.previousPosition}
                                />

                                <div className="flex min-w-0 items-center gap-3">
                                    <div
                                        className="h-10 w-1 rounded-full"
                                        style={{
                                            backgroundColor: item.team?.color ?? "#dc2626",
                                        }}
                                    />

                                    <div className="min-w-0">
                                        <Link
                                            href={`/drivers/${item.driver.id}`}
                                            className="block truncate font-black text-white transition-colors duration-200 hover:text-red-400"
                                        >
                                            {item.driver.name}
                                        </Link>

                                        {item.team ? (
                                            <Link
                                                href={`/teams/${item.team.id}`}
                                                className="block truncate text-xs font-bold text-zinc-500 transition-colors duration-200 hover:text-red-400"
                                            >
                                                {item.team.name}
                                            </Link>
                                        ) : (
                                            <span className="block text-xs text-zinc-500">-</span>
                                        )}
                                    </div>
                                </div>

                                <span className="text-center">{item.participations}</span>
                                <span className="text-center">{item.wins}</span>
                                <span className="text-center">{item.poles}</span>
                                <span className="text-center">{item.fastestLaps}</span>
                                <span className="text-center">{item.driverOfTheDay}</span>
                                <span className="text-center">{item.mostOvertakes}</span>
                                <span className="text-center">{item.cleanestDriving}</span>

                                <span
                                    className={`text-center font-black ${
                                        item.penalties > 0
                                            ? "text-red-500"
                                            : "text-zinc-500"
                                    }`}
                                >
                                    {item.penalties}
                                </span>

                                <span className="text-center text-xl font-black text-red-500">
                                    {item.points}
                                </span>
                            </div>
                        ))}
                    </div>

                    <p className="mt-6 text-xs text-zinc-500">
                        Pontuação: participação +1, vitória +5, pole +3, volta rápida +3, piloto do dia +2, mais ultrapassagens +2, pilotagem limpa +2 e punição -1.
                    </p>
                </div>
            </div>
        </main>
    );
}