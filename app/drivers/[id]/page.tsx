"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Driver = {
    id: string;
    name: string;
    nationality?: string | null;
    country?: string | null;
    country_code?: string | null;
    number?: number | string | null;
    driver_number?: number | string | null;
    team_id?: string | null;
    image?: string | null;
    photo?: string | null;
    driver_image?: string | null;
};

type Team = {
    id: string;
    name: string;
    full_name?: string | null;
    logo?: string | null;
    car_image?: string | null;
    image?: string | null;
    color?: string | null;
    chassis?: string | null;
    car_name?: string | null;
    car_model?: string | null;
};

type Circuit = {
    id: string;
    name: string;
    grand_prix?: string | null;
    country?: string | null;
    country_code?: string | null;
    location?: string | null;
    date?: string | null;
    flag?: string | null;
};

type RaceResult = {
    id?: number;
    race_id: string;
    position: number;
    driver_id: string;
    team_id: string;
    grid: number;
    stops?: number | null;
    fastest_lap?: string | null;
    penalty?: boolean | null;
    penalty_count?: number | null;
    penalty_seconds?: number | null;
    time_or_gap?: string | null;
    points: number;
    status?: "Normal" | "DNF" | string;
};

type RaceAward = {
    race_id: string;
    driver_of_the_day?: string | null;
    most_overtakes?: string | null;
    cleanest_driving?: string | null;
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

const COUNTRY_CODE_BY_NAME: Record<string, string> = {
    brasil: "br",
    brazil: "br",
    brasileiro: "br",
    brasileira: "br",

    estadosunidos: "us",
    estadosunidense: "us",
    unitedstates: "us",
    usa: "us",
    americano: "us",
    americana: "us",

    reinounido: "gb",
    unitedkingdom: "gb",
    uk: "gb",
    britanico: "gb",
    britanica: "gb",
    inglaterra: "gb",
    english: "gb",

    italia: "it",
    italy: "it",
    italiano: "it",
    italiana: "it",

    franca: "fr",
    france: "fr",
    frances: "fr",
    francesa: "fr",

    espanha: "es",
    spain: "es",
    espanhol: "es",
    espanhola: "es",

    alemanha: "de",
    germany: "de",
    alemao: "de",
    alema: "de",

    holanda: "nl",
    netherlands: "nl",
    neerlandes: "nl",
    neerlandesa: "nl",

    belgica: "be",
    belgium: "be",
    belga: "be",

    austria: "at",
    austriaco: "at",
    austriaca: "at",

    monaco: "mc",
    monegasco: "mc",
    monegasca: "mc",

    japao: "jp",
    japan: "jp",
    japones: "jp",
    japonesa: "jp",

    china: "cn",
    chines: "cn",
    chinesa: "cn",

    australia: "au",
    australiano: "au",
    australiana: "au",

    canada: "ca",
    canadense: "ca",

    mexico: "mx",
    mexicano: "mx",
    mexicana: "mx",

    catar: "qa",
    qatar: "qa",

    emiradosarabes: "ae",
    unitedarabemirates: "ae",
    uae: "ae",

    arabiasaudita: "sa",
    saudiarabia: "sa",

    singapura: "sg",
    singapore: "sg",

    bahrein: "bh",
    bahrain: "bh",

    azerbaijao: "az",
    azerbaijan: "az",
};

function ordinal(value: number) {
    return `${value}º`;
}

function normalizeCountryKey(value?: string | null) {
    if (!value) return "";

    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");
}

function getDriverCountryCode(driver?: Driver | null) {
    if (driver?.country_code && driver.country_code.trim() !== "") {
        return driver.country_code.toLowerCase();
    }

    const countryKey = normalizeCountryKey(driver?.country);
    const nationalityKey = normalizeCountryKey(driver?.nationality);

    return COUNTRY_CODE_BY_NAME[countryKey] || COUNTRY_CODE_BY_NAME[nationalityKey] || null;
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

function normalizeFastestLap(value?: string | null) {
    return value && value.trim() !== "" ? value : "-";
}

function normalizeImageName(value?: string | null) {
    if (!value) return "";

    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
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

export default function DriverProfilePage() {
    const params = useParams();
    const driverId = String(params.id);

    const [driver, setDriver] = useState<Driver | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [teamDrivers, setTeamDrivers] = useState<Driver[]>([]);
    const [results, setResults] = useState<RaceResult[]>([]);
    const [allResults, setAllResults] = useState<RaceResult[]>([]);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [awards, setAwards] = useState<RaceAward[]>([]);
    const [loading, setLoading] = useState(true);
    

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            const { data: driverData } = await supabase
                .from("drivers")
                .select("*")
                .eq("id", driverId)
                .single();

            if (driverData?.team_id) {
                const { data: teamData } = await supabase
                    .from("teams")
                    .select("*")
                    .eq("id", driverData.team_id)
                    .single();

                const { data: teamDriversData } = await supabase
                    .from("drivers")
                    .select("*")
                    .eq("team_id", driverData.team_id)
                    .order("id", { ascending: true });

                setTeam((teamData || null) as Team | null);
                setTeamDrivers((teamDriversData || []) as Driver[]);
            }

            const { data: resultsData } = await supabase
                .from("race_results")
                .select("*")
                .eq("driver_id", driverId)
                .order("position", { ascending: true });

            const { data: allResultsData } = await supabase
                .from("race_results")
                .select("*");

            const { data: circuitsData } = await supabase.from("circuits").select("*");

            const { data: awardsData } = await supabase.from("race_awards").select("*");

            setDriver((driverData || null) as Driver | null);
            setResults((resultsData || []) as RaceResult[]);
            setAllResults((allResultsData || []) as RaceResult[]);
            setCircuits((circuitsData || []) as Circuit[]);
            setAwards((awardsData || []) as RaceAward[]);
            setLoading(false);
        }

        loadData();
    }, [driverId]);

    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => {
            const circuitA = circuits.find((circuit) => circuit.id === a.race_id);
            const circuitB = circuits.find((circuit) => circuit.id === b.race_id);

            const dateA = circuitA?.date ?? "";
            const dateB = circuitB?.date ?? "";

            return dateA.localeCompare(dateB);
        });
    }, [results, circuits]);

    const driverPosition = useMemo(() => {
        const pointsByDriver = new Map<string, number>();

        allResults.forEach((result) => {
            if (!result.driver_id) return;

            const key = String(result.driver_id);
            const current = pointsByDriver.get(key) ?? 0;

            pointsByDriver.set(key, current + Number(result.points || 0));
        });

        const ranking = Array.from(pointsByDriver.entries())
            .map(([id, points]) => ({ id, points }))
            .sort((a, b) => b.points - a.points);

        const position =
            ranking.findIndex((item) => String(item.id) === String(driverId)) + 1;

        return position > 0 ? position : null;
    }, [allResults, driverId]);

    function isFastestLap(result: RaceResult) {
        const raceResults = allResults.filter(
            (item) => item.race_id === result.race_id
        );

        const laps = raceResults
            .map((item) => item.fastest_lap)
            .filter(Boolean)
            .sort();

        return (
            !!result.fastest_lap &&
            laps.length > 0 &&
            result.fastest_lap === laps[0]
        );
    }

    const stats = useMemo(() => {
        const races = results.length;
        const wins = results.filter((result) => result.position === 1).length;
        const podiums = results.filter((result) => result.position <= 3).length;
        const poles = results.filter((result) => result.grid === 1).length;
        const averagePosition =
            races > 0
                ? (
                    results.reduce(
                        (total, result) => total + Number(result.position || 0),
                        0
                    ) / races
                ).toFixed(1)
                : "-";
        const points = results.reduce(
            (total, result) => total + Number(result.points || 0),
            0
        );

        const fastestLaps = results.filter((result) => {
            const raceResults = allResults.filter(
                (item) => item.race_id === result.race_id
            );

            const laps = raceResults
                .map((item) => item.fastest_lap)
                .filter(Boolean)
                .sort();

            return (
                !!result.fastest_lap &&
                laps.length > 0 &&
                result.fastest_lap === laps[0]
            );
        }).length;

        return {
            races,
            wins,
            podiums,
            poles,
            averagePosition,
            fastestLaps,
            points,
        };
    }, [results, allResults]);

    function getCircuit(raceId?: string | null) {
        return circuits.find((circuit) => circuit.id === raceId);
    }

    const teamImageName = normalizeImageName(team?.id || team?.name);

    const driverIndexInTeam = teamDrivers.findIndex(
        (item) => String(item.id) === String(driver?.id)
    );

    const driverImage = teamImageName
        ? `/drivers/${teamImageName}${driverIndexInTeam === 1 ? "1" : ""}.png`
        : "/drivers/default.png";

    const teamLogo = team?.logo || "";
    const carImageName = normalizeImageName(team?.id || team?.name);

    const carImage = carImageName
        ? `/cars/${carImageName}.png`
        : "/cars/default-car.png";

    const chassisName = team?.chassis || team?.name || "Chassi";

    const driverNumber = driver?.number || driver?.driver_number || null;
    const countryCode = getDriverCountryCode(driver);
    const countryName = getCountryName(
        countryCode,
        driver?.nationality || driver?.country
    );
    const teamColor = team?.color || "#ef4444";

    if (loading) {
  return (
    <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
      Carregando perfil do piloto...
    </main>
  );
}
    

    if (!driver) {
  return (
    <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
      Piloto não encontrado.
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
                        <span>{driver.name}</span>
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

                    {driverNumber && (
                        <div className="absolute right-16 top-4 select-none text-[220px] font-black leading-none text-transparent opacity-50 [-webkit-text-stroke:2px_rgba(239,68,68,0.55)]">
                            {driverNumber}
                        </div>
                    )}

                    <div className="relative grid min-h-[330px] grid-cols-1 items-center gap-8 px-8 pt-8 lg:grid-cols-[280px_1fr_520px]">
                        <div className="flex justify-center lg:justify-start">
                            <img
                                src={driverImage}
                                alt={driver.name}
                                className="h-[310px] w-auto object-contain object-bottom"
                                onError={(event) => {
                                    event.currentTarget.src = "/drivers/default.png";
                                }}
                            />
                        </div>

                        <div className="pb-12">
                            {driverPosition && (
                                <div className="mb-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                                        Posição no campeonato
                                    </p>

                                    <div className="mt-2 inline-flex items-center rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 shadow-[0_0_18px_rgba(220,38,38,0.08)]">
                                        <span className="text-4xl font-black leading-none text-red-500">
                                            {driverPosition}º
                                        </span>
                                    </div>
                                </div>
                            )}

                            <h1 className="max-w-[420px] text-5xl font-black uppercase leading-[0.95] tracking-tight">
                                {driver.name}
                            </h1>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-center gap-3 text-sm font-bold uppercase text-zinc-200">
                                    {countryCode ? (
                                        <img
                                            src={getFlagUrl(countryCode) ?? ""}
                                            alt={countryName}
                                            className="h-5 w-8 rounded-sm border border-zinc-700 object-cover"
                                        />
                                    ) : (
                                        <span className="text-lg">🏁</span>
                                    )}

                                    <span>{countryName}</span>
                                </div>

                                <Link
                                    href={`/teams/${team?.id}`}
                                    className="flex w-fit items-center gap-3 text-sm font-bold uppercase text-zinc-200 transition hover:text-red-400"
                                >
                                    {teamLogo && (
                                        <img
                                            src={teamLogo}
                                            alt={team?.name ?? "Equipe"}
                                            className="h-8 w-8 object-contain"
                                        />
                                    )}
                                    <span>{team?.full_name || team?.name || "-"}</span>
                                </Link>
                            </div>
                        </div>

                        <div className="relative hidden h-full flex-col items-end justify-center lg:flex -mt-6">
                            <div className="relative z-20 mb-1 flex items-center gap-3 text-right">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                                        Chassi
                                    </p>
                                    <p className="whitespace-nowrap text-4xl font-black uppercase leading-none tracking-wider text-white">
                                        {chassisName}
                                    </p>
                                </div>

                                {teamLogo && (
                                    <img
                                        src={teamLogo}
                                        alt={team?.name ?? "Equipe"}
                                        className="h-13 w-13 object-contain"
                                    />
                                )}
                            </div>

                            <img
                                src={carImage}
                                alt={team?.name ?? "Carro"}
                                className="relative z-10 max-h-[320px] w-full object-contain drop-shadow-2xl"
                                onError={(event) => {
                                    event.currentTarget.src = "/cars/default-car.png";
                                }}
                            />
                        </div>
                    </div>

                    <div className="relative mx-6 mb-6 grid grid-cols-2 overflow-hidden rounded-xl border border-zinc-800 bg-black/35 backdrop-blur md:grid-cols-3 xl:grid-cols-7">
                        {[
                            { icon: "/icons/race.png", label: "Corridas", value: stats.races },
                            { icon: "/icons/trophy.png", label: "Vitórias", value: stats.wins },
                            { icon: "/icons/podio.png", label: "Pódios", value: stats.podiums },
                            { icon: "/icons/pole.png", label: "Poles", value: stats.poles },
                            { icon: "/icons/media.png", label: "Pos. média", value: stats.averagePosition },
                            { icon: "/icons/time.png", label: "Voltas rápidas", value: stats.fastestLaps },
                            { icon: "◔", label: "Pontos", value: stats.points },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center gap-4 border-b border-r border-zinc-800 px-6 py-5 last:border-r-0 md:border-b-0"
                            >
                                {typeof item.icon === "string" && item.icon.startsWith("/") ? (
                                    <img
                                        src={item.icon}
                                        alt={item.label}
                                        className="h-8 w-8 object-contain"
                                    />
                                ) : (
                                    <span className="text-3xl text-red-500">
                                        {item.icon}
                                    </span>
                                )}
                                <div>
                                    <p className="text-[11px] font-black uppercase text-zinc-500">
                                        {item.label}
                                    </p>
                                    <p
                                        className={`text-2xl font-black ${item.label === "Pos. média" && Number(item.value) < 3.1
                                            ? "text-emerald-400"
                                            : ""
                                            }`}
                                    >
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-800 bg-[#070d13] p-8">
                    <h2 className="mb-7 text-xl font-black uppercase">
                        Resultados da temporada
                    </h2>

                    <div className="grid grid-cols-[70px_1.5fr_110px_130px_130px_90px] gap-4 border-b border-zinc-800 pb-4 text-xs font-black uppercase text-zinc-500">
                        <span>Round</span>
                        <span>Grand Prix</span>
                        <span>Grid</span>
                        <span>Resultado</span>
                        <span>Melhor volta</span>
                        <span>Pontos</span>
                    </div>

                    {sortedResults.length === 0 && (
                        <div className="py-12 text-center text-zinc-500">
                            Nenhum resultado registrado para este piloto.
                        </div>
                    )}

                    {sortedResults.map((result, index) => {
                        const circuit = getCircuit(result.race_id);
                        const fastest = isFastestLap(result);

                        return (
                            <div
                                key={`${result.race_id}-${result.position}`}
                                className="grid grid-cols-[70px_1.5fr_110px_130px_130px_90px] items-center gap-4 border-b border-zinc-800 py-4 text-sm last:border-b-0"
                            >
                                <span className="font-bold">{index + 1}</span>

                                <Link
                                    href={`/races/${result.race_id}`}
                                    className="flex items-center gap-3 font-bold text-white transition hover:text-red-400"
                                >
                                    {getFlagUrl(circuit?.country_code) ? (
                                        <img
                                            src={getFlagUrl(circuit?.country_code) ?? ""}
                                            alt={circuit?.country ?? "País"}
                                            className="h-5 w-8 rounded-sm object-cover"
                                        />
                                    ) : (
                                        <span>{circuit?.flag}</span>
                                    )}

                                    <span>{circuit?.grand_prix || circuit?.name || "-"}</span>
                                </Link>

                                <span className="font-bold">
                                    {result.grid ? ordinal(Number(result.grid)) : "-"}
                                </span>

                                <div className="relative flex items-center font-bold">
                                    <span>
                                        {result.status === "DNF"
                                            ? "DNF"
                                            : ordinal(Number(result.position))}
                                    </span>

                                    {result.status !== "DNF" && (
                                        <div className="absolute -left-7">
                                            <MovementArrow
                                                current={Number(result.position)}
                                                previous={result.grid || null}
                                            />
                                        </div>
                                    )}
                                </div>

                                <span
                                    className={
                                        fastest ? "font-black text-fuchsia-400" : "text-zinc-400"
                                    }
                                >
                                    {normalizeFastestLap(result.fastest_lap)}
                                </span>

                                <span className="font-black">{result.points ?? 0}</span>
                            </div>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}