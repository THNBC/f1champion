"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const TEAM_FALLBACK_2025 = {
    "red bull racing": {
        country_code: "at",
        country: "Áustria",
        team_principal: "Christian Horner",
        technical_director: "Pierre Waché",
        chassis: "RB21",
        power_unit: "Honda RBPT",
        base: "Milton Keynes, Reino Unido",
        debut: "2005",
        website: "redbullracing.com",
    },
    ferrari: {
        country_code: "it",
        country: "Itália",
        team_principal: "Frédéric Vasseur",
        technical_director: "Loïc Serra",
        chassis: "SF-25",
        power_unit: "Ferrari",
        base: "Maranello, Itália",
        debut: "1950",
        website: "ferrari.com",
    },
    mercedes: {
        country_code: "de",
        country: "Alemanha",
        team_principal: "Toto Wolff",
        technical_director: "James Allison",
        chassis: "W16",
        power_unit: "Mercedes",
        base: "Brackley, Reino Unido",
        debut: "2010",
        website: "mercedesamgf1.com",
    },
    mclaren: {
        country_code: "gb",
        country: "Reino Unido",
        team_principal: "Andrea Stella",
        technical_director: "Peter Prodromou",
        chassis: "MCL39",
        power_unit: "Mercedes",
        base: "Woking, Reino Unido",
        debut: "1966",
        website: "mclaren.com/racing",
    },
    "aston martin": {
        country_code: "gb",
        country: "Reino Unido",
        team_principal: "Mike Krack",
        technical_director: "Dan Fallows",
        chassis: "AMR25",
        power_unit: "Mercedes",
        base: "Silverstone, Reino Unido",
        debut: "1959",
        website: "astonmartinf1.com",
    },
    alpine: {
        country_code: "fr",
        country: "França",
        team_principal: "Bruno Famin",
        technical_director: "David Sanchez",
        chassis: "A525",
        power_unit: "Renault",
        base: "Enstone, Reino Unido",
        debut: "1986",
        website: "alpinecars.com",
    },
    williams: {
        country_code: "gb",
        country: "Reino Unido",
        team_principal: "James Vowles",
        technical_director: "Pat Fry",
        chassis: "FW47",
        power_unit: "Mercedes",
        base: "Grove, Reino Unido",
        debut: "1977",
        website: "williamsf1.com",
    },
    rb: {
        country_code: "it",
        country: "Itália",
        team_principal: "Laurent Mekies",
        technical_director: "Jody Egginton",
        chassis: "VCARB 02",
        power_unit: "Honda RBPT",
        base: "Faenza, Itália",
        debut: "2006",
        website: "visacashapprb.com",
    },
    sauber: {
        country_code: "ch",
        country: "Suíça",
        team_principal: "Jonathan Wheatley",
        technical_director: "James Key",
        chassis: "C45",
        power_unit: "Ferrari",
        base: "Hinwil, Suíça",
        debut: "1993",
        website: "sauber-group.com",
    },
    haas: {
        country_code: "us",
        country: "Estados Unidos",
        team_principal: "Ayao Komatsu",
        technical_director: "Andrea De Zordo",
        chassis: "VF-25",
        power_unit: "Ferrari",
        base: "Kannapolis, Estados Unidos",
        debut: "2016",
        website: "haasf1team.com",
    },
};



type Team = {
    id: string;
    name: string;
    full_name?: string | null;
    country?: string | null;
    country_code?: string | null;
    logo?: string | null;
    color?: string | null;
    car_image?: string | null;
    image?: string | null;
    principal?: string | null;
    team_principal?: string | null;
    technical_director?: string | null;
    chassis?: string | null;
    power_unit?: string | null;
    base?: string | null;
    debut?: string | number | null;
    website?: string | null;
};

type Driver = {
    id: string;
    name: string;
    nationality?: string | null;
    country?: string | null;
    country_code?: string | null;
    number?: string | number | null;
    team_id: string;
    image?: string | null;
    photo?: string | null;
    driver_image?: string | null;
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
    calendar_order?: number | null;
};

const COUNTRY_NAMES: Record<string, string> = {
    br: "Brasil",
    us: "Estados Unidos",
    gb: "Reino Unido",
    it: "Itália",
    fr: "França",
    es: "Espanha",
    de: "Alemanha",
    nl: "Holanda",
    be: "Bélgica",
    at: "Áustria",
    hu: "Hungria",
    mc: "Mônaco",
    jp: "Japão",
    cn: "China",
    au: "Austrália",
    ca: "Canadá",
    mx: "México",
    qa: "Catar",
    ae: "Emirados Árabes",
    sa: "Arábia Saudita",
    sg: "Singapura",
    bh: "Bahrein",
    az: "Azerbaijão",
};
function normalizeImageName(value?: string | null) {
    if (!value) return "";

    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}


function getFlagUrl(code?: string | null) {
    if (!code) return null;
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

function getCountryName(code?: string | null, fallback?: string | null) {
    if (fallback && fallback.trim() !== "") return fallback;
    if (!code) return "-";
    return COUNTRY_NAMES[code.toLowerCase()] || code.toUpperCase();
}

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

export default function TeamProfilePage() {
    const params = useParams();
    const teamId = String(params.id);

    const [team, setTeam] = useState<Team | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [results, setResults] = useState<RaceResult[]>([]);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            const { data: teamData } = await supabase
                .from("teams")
                .select("*")
                .eq("id", teamId)
                .single();

            const { data: driversData } = await supabase
                .from("drivers")
                .select("*")
                .eq("team_id", teamId)
                .order("slot", { ascending: true });

            const { data: resultsData } = await supabase
                .from("race_results")
                .select("*");

            const { data: circuitsData } = await supabase
                .from("circuits")
                .select("id, calendar_order")
                .order("calendar_order", { ascending: true });

            setTeam((teamData || null) as Team | null);
            setDrivers((driversData || []) as Driver[]);
            setResults((resultsData || []) as RaceResult[]);
            setCircuits((circuitsData || []) as Circuit[]);
            setLoading(false);
        }

        loadData();
    }, [teamId]);

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

    const teamResults = useMemo(() => {
        return results.filter((result) => result.team_id === teamId);
    }, [results, teamId]);

    const teamStats = useMemo(() => {
        const races = new Set(teamResults.map((result) => result.race_id)).size;

        const points = teamResults.reduce(
            (sum, result) => sum + Number(result.points ?? 0),
            0
        );

        const wins = teamResults.filter((result) => result.position === 1).length;

        const podiums = teamResults.filter(
            (result) => result.position >= 1 && result.position <= 3
        ).length;

        const poles = teamResults.filter((result) => Number(result.grid) === 1).length;

        const averagePosition =
            teamResults.length > 0
                ? (
                    teamResults.reduce(
                        (sum, result) => sum + Number(result.position || 0),
                        0
                    ) / teamResults.length
                ).toFixed(1)
                : "-";

        const fastestLaps = teamResults.filter(
            (result) => fastestLapByRace.get(result.race_id) === result.driver_id
        ).length;

        return {
            races,
            points,
            wins,
            podiums,
            poles,
            averagePosition,
            fastestLaps,
        };
    }, [teamResults, fastestLapByRace]);

    const driverCards = useMemo(() => {
        const teamImageName = normalizeImageName(team?.id || team?.name);

        return drivers.map((driver, index) => {
            const driverResults = results.filter(
                (result) => result.driver_id === driver.id
            );

            const points = driverResults.reduce(
                (sum, result) => sum + Number(result.points ?? 0),
                0
            );

            const image = teamImageName
                ? `/drivers/${teamImageName}${index === 1 ? "1" : ""}.png`
                : "/drivers/default.png";

            return {
                driver,
                points,
                image,
            };
        });
    }, [drivers, results, team]);

    const championshipPosition = useMemo(() => {
        const teamIds = Array.from(new Set(results.map((result) => result.team_id)));

        const standings = teamIds
            .map((id) => {
                const points = results
                    .filter((result) => result.team_id === id)
                    .reduce((sum, result) => sum + Number(result.points ?? 0), 0);

                const wins = results.filter(
                    (result) => result.team_id === id && result.position === 1
                ).length;

                return {
                    id,
                    points,
                    wins,
                };
            })
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return b.wins - a.wins;
            });

        const index = standings.findIndex((item) => item.id === teamId);

        return index >= 0 ? index + 1 : "-";
    }, [results, teamId]);

    const teamKey = (team?.name || "").toLowerCase();

    const fallback =
        (TEAM_FALLBACK_2025 as Record<string, any>)[teamKey] ||
        Object.entries(TEAM_FALLBACK_2025).find(([key]) =>
            teamKey.includes(key)
        )?.[1];

    const teamColor = team?.color || "#ef4444";
    const logo = team?.logo || "";
    const TEAM_CAR_MAP: Record<string, string> = {
        "red bull": "redbull",
        "rb": "rb",
        "haas": "haas",
        "williams": "williams",
        "aston martin": "astonmartin",
        "alpine": "alpine",
        "ferrari": "ferrari",
        "sauber": "sauber",
        "mclaren": "mclaren",
        "mercedes": "mercedes",
    };

    const teamNameNormalized = (team?.name || "").toLowerCase();

    const carFileName =
        Object.entries(TEAM_CAR_MAP).find(([key]) =>
            teamNameNormalized.includes(key)
        )?.[1] || "default-car";

    const carImage = `/cars/${carFileName}1.png`;

    const countryCode = team?.country_code || fallback?.country_code || null;

    const countryName = getCountryName(
        countryCode,
        team?.country || fallback?.country
    );

    const principal =
        team?.team_principal || team?.principal || fallback?.team_principal || "-";

    const technicalDirector =
        team?.technical_director || fallback?.technical_director || "-";

    const chassis = team?.chassis || fallback?.chassis || "-";

    const powerUnit = team?.power_unit || fallback?.power_unit || "-";

    const base = team?.base || fallback?.base || "-";
    const debut = team?.debut || fallback?.debut || "-";
    const website = team?.website || fallback?.website || "-";

    if (loading) {
        return (
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                Carregando perfil da equipe...
            </main>
        );
    }

    if (!team) {
        return (
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                Equipe não encontrada.
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
            <div className="mx-auto max-w-[1500px]">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm font-black uppercase text-zinc-500">
                        <Link href="/standings" className="text-red-500 hover:text-red-400">
                            Classificação
                        </Link>
                        <span>›</span>
                        <span>{team.name}</span>
                    </div>

                    <Link
                        href="/standings"
                        className="rounded-lg border border-red-700 px-5 py-3 text-xs font-black uppercase text-red-500 transition hover:bg-red-600 hover:text-white"
                    >
                        ← Voltar
                    </Link>
                </div>

                <section
                    className="relative overflow-hidden rounded-2xl border border-zinc-800"
                    style={{
                        background: `
            linear-gradient(
                315deg,
                ${teamColor}55 0%,
                ${teamColor}33 20%,
                ${teamColor}15 40%,
                #060a10 75%,
                #060a10 100%
            ),
            radial-gradient(circle at 85% 30%, ${teamColor}22, transparent 60%)
        `,
                    }}
                >
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            background: `radial-gradient(circle at 25% 45%, ${teamColor}33, transparent 42%)`,
                        }}
                    />

                    <div className="relative grid min-h-[200px] grid-cols-1 items-center gap-8 px-8 py-8 lg:grid-cols-[360px_1fr_560px]">
                        <div>
                            {logo && (
                                <img
                                    src={logo}
                                    alt={team.name}
                                    className="mb-8 h-24 w-auto object-contain"
                                />
                            )}

                            <h1 className="max-w-[360px] text-5xl font-black uppercase leading-[0.95] tracking-tight">
                                {team.full_name || team.name}
                            </h1>

                            <div className="mt-6 flex items-center gap-3 text-sm font-bold uppercase text-zinc-200">
                                {getFlagUrl(countryCode) && (
                                    <img
                                        src={getFlagUrl(countryCode) ?? ""}
                                        alt={countryName}
                                        className="h-5 w-8 rounded-sm object-cover"
                                    />
                                )}
                                <span>{countryName}</span>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-zinc-800 pt-5 text-sm">
                                <div>
                                    <p className="text-xs font-black uppercase text-zinc-500">
                                        Chefe da equipe
                                    </p>
                                    <p className="mt-1 font-bold">{principal}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase text-zinc-500">
                                        Diretor técnico
                                    </p>
                                    <p className="mt-1 font-bold">
                                        {technicalDirector}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase text-zinc-500">
                                        Chassi
                                    </p>
                                    <p className="mt-1 font-bold">{chassis}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase text-zinc-500">
                                        Motor
                                    </p>
                                    <p className="mt-1 font-bold">{powerUnit}</p>
                                </div>
                            </div>
                        </div>

                        <div />

                        <div className="relative flex items-center justify-center">
                            <img
                                src={carImage}
                                alt={team.name}
                                className="relative z-10 h-[390px] w-auto object-contain drop-shadow-2xl"
                                style={{ transform: "translateX(-170px)" }}
                            />
                        </div>
                    </div>
                </section>



                <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr_1fr]">
                    <section className="rounded-2xl border border-zinc-800 bg-[#070d13] p-6">
                        <h2 className="mb-5 text-lg font-black uppercase">
                            Sobre {team.name}
                        </h2>

                        <p className="text-sm leading-7 text-zinc-400">
                            {team.full_name || team.name} compete na temporada atual com foco em performance, consistência e desenvolvimento ao longo do campeonato.
                        </p>

                        <div className="mt-8 space-y-4 border-t border-zinc-800 pt-5 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-bold uppercase text-zinc-500">
                                    Base
                                </span>
                                <span className="text-right font-bold">
                                    {base}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="font-bold uppercase text-zinc-500">
                                    Estreia
                                </span>
                                <span className="text-right font-bold">
                                    {debut}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="font-bold uppercase text-zinc-500">
                                    Website
                                </span>
                                <span className="text-right font-bold text-red-500">
                                    {website !== "-" ? (
                                        <a
                                            href={`https://${website}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="hover:underline"
                                        >
                                            {website}
                                        </a>
                                    ) : (
                                        "-"
                                    )}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-zinc-800 bg-[#070d13] p-6">
                        <h2 className="mb-5 text-lg font-black uppercase">
                            Pilotos
                        </h2>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {driverCards.map(({ driver, points, image }) => {
                                const driverCountryCode = driver.country_code || null;
                                const driverCountry = getCountryName(
                                    driverCountryCode,
                                    driver.nationality || driver.country
                                );

                                return (
                                    <div
                                        key={driver.id}
                                        className="overflow-hidden rounded-xl border border-zinc-800 bg-black/25"
                                    >
                                        <div className="relative h-56 overflow-hidden">
                                            <span className="absolute left-4 top-4 z-10 text-sm font-black text-red-500">
                                                {points} PTS
                                            </span>

                                            <img
                                                src={image}
                                                alt={driver.name}
                                                className="h-full w-full object-contain object-bottom"
                                            />
                                        </div>

                                        <div className="p-4">
                                            <h3 className="text-xl font-black">
                                                {driver.name}
                                            </h3>

                                            <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase text-zinc-400">
                                                {getFlagUrl(driverCountryCode) && (
                                                    <img
                                                        src={getFlagUrl(driverCountryCode) ?? ""}
                                                        alt={driverCountry}
                                                        className="h-4 w-6 rounded-sm object-cover"
                                                    />
                                                )}
                                                <span>{driverCountry}</span>
                                            </div>

                                            <Link
                                                href={`/drivers/${driver.id}`}
                                                className="mt-5 block rounded-lg border border-zinc-700 px-4 py-3 text-center text-xs font-black uppercase text-zinc-300 transition hover:border-red-600 hover:text-red-500"
                                            >
                                                Ver perfil do piloto
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <Link
                            href="/drivers"
                            className="mt-5 block rounded-lg border border-zinc-700 px-5 py-3 text-center text-xs font-black uppercase text-zinc-300 transition hover:border-red-600 hover:text-red-500"
                        >
                            Ver todos os pilotos
                        </Link>
                    </section>

                    <section className="rounded-2xl border border-zinc-800 bg-[#070d13] p-6">
                        <h2 className="mb-5 text-lg font-black uppercase">
                            Performance da temporada
                        </h2>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-zinc-800 pb-3">
                                <span className="font-bold uppercase text-zinc-500">
                                    Corridas
                                </span>
                                <span className="font-black">{teamStats.races}</span>
                            </div>

                            <div className="flex justify-between border-b border-zinc-800 pb-3">
                                <span className="font-bold uppercase text-zinc-500">
                                    Vitórias
                                </span>
                                <span className="font-black">{teamStats.wins}</span>
                            </div>

                            <div className="flex justify-between border-b border-zinc-800 pb-3">
                                <span className="font-bold uppercase text-zinc-500">
                                    Pódios
                                </span>
                                <span className="font-black">{teamStats.podiums}</span>
                            </div>

                            <div className="flex justify-between border-b border-zinc-800 pb-3">
                                <span className="font-bold uppercase text-zinc-500">
                                    Poles
                                </span>
                                <span className="font-black">{teamStats.poles}</span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-3">
                                <span className="font-bold uppercase text-zinc-500">
                                    Pos. média
                                </span>
                                <span
                                    className={`font-black ${Number(teamStats.averagePosition) < 3.1
                                        ? "text-emerald-400"
                                        : ""
                                        }`}
                                >
                                    {teamStats.averagePosition}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-800 pb-3">
                                <span className="font-bold uppercase text-zinc-500">
                                    Voltas rápidas
                                </span>
                                <span className="font-black">{teamStats.fastestLaps}</span>
                            </div>

                            <div className="flex justify-between pt-2">
                                <span className="font-bold uppercase text-zinc-500">
                                    Pts no campeonato
                                </span>
                                <span className="text-xl font-black text-red-500">
                                    {teamStats.points}
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/standings"
                            className="mt-8 block rounded-lg border border-zinc-700 px-5 py-3 text-center text-xs font-black uppercase text-zinc-300 transition hover:border-red-600 hover:text-red-500"
                        >
                            Ver classificação
                        </Link>
                    </section>
                </div>
            </div>
        </main>
    );
}