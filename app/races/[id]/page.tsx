"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Driver = {
    id: string;
    name: string;
    nationality?: string | null;
    team_id: string;
    image?: string | null;
    photo?: string | null;
    driver_image?: string | null;
};

type Team = {
    id: string;
    name: string;
    logo?: string | null;
    color?: string | null;
};

type Circuit = {
    id: string;
    name: string;
    grand_prix?: string | null;
    country?: string | null;
    country_code?: string | null;
    location?: string | null;
    date?: string | null;
    laps?: number | null;
    length?: string | null;
    flag?: string | null;
    track_image?: string | null;
    country_color?: string | null;
};

type RaceResult = {
    id?: number;
    race_id: string;
    position: number;
    driver_id: string;
    team_id: string;
    grid: number;
    stops: number;
    fastest_lap: string;
    penalty: boolean;
    penalty_count: number;
    penalty_seconds: number;
    time_or_gap: string;
    points: number;
    status: "Normal" | "DNF";
};

type Awards = {
    race_id: string;
    driver_of_the_day?: string | null;
    most_overtakes?: string | null;
    cleanest_driving?: string | null;
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
    interlagos: "4.309 km",
    vegas: "6.201 km",
    lusail: "5.419 km",
    qatar: "5.419 km",
    abudhabi: "5.281 km",
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
};

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

export default function RaceDetailsPage() {
    const params = useParams();
    const raceId = String(params.id);

    const [circuit, setCircuit] = useState<Circuit | null>(null);
    const [results, setResults] = useState<RaceResult[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [awards, setAwards] = useState<Awards | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            const { data: circuitData } = await supabase
                .from("circuits")
                .select("*")
                .eq("id", raceId)
                .single();

            const { data: resultsData } = await supabase
                .from("race_results")
                .select("*")
                .eq("race_id", raceId)
                .order("position", { ascending: true });

            const { data: driversData } = await supabase
                .from("drivers")
                .select("*")
                .order("slot", { ascending: true });

            const { data: teamsData } = await supabase.from("teams").select("*");

            const { data: awardsData } = await supabase
                .from("race_awards")
                .select("*")
                .eq("race_id", raceId)
                .maybeSingle();

            setCircuit(circuitData || null);
            setResults((resultsData || []) as RaceResult[]);
            setDrivers((driversData || []) as Driver[]);
            setTeams((teamsData || []) as Team[]);
            setAwards((awardsData || null) as Awards | null);

            setLoading(false);
        }

        loadData();
    }, [raceId]);

    function getDriver(driverId?: string | null) {
        return drivers.find((driver) => String(driver.id) === String(driverId));
    }

    function getTeam(teamId?: string | null) {
        return teams.find((team) => String(team.id) === String(teamId));
    }

    function getDriverName(driverId?: string | null) {
        return getDriver(driverId)?.name ?? "-";
    }

    function getTeamName(teamId?: string | null) {
        return getTeam(teamId)?.name ?? "-";
    }

    function getTeamLogo(teamId?: string | null) {
        return getTeam(teamId)?.logo ?? "";
    }

    function getDriverImage(driverId?: string | null) {
        const driver = getDriver(driverId);
        if (!driver) return "/drivers/default.png";

        const team = getTeam(driver.team_id);
        if (!team) return "/drivers/default.png";

        const teamImageName = normalizeImageName(team.id || team.name);

        const teamDrivers = drivers.filter(
            (item) => String(item.team_id) === String(driver.team_id)
        );

        const driverIndexInTeam = teamDrivers.findIndex(
            (item) => String(item.id) === String(driver.id)
        );

        const imagePath = teamImageName
            ? `/drivers/${teamImageName}${driverIndexInTeam === 1 ? "1" : ""}.png`
            : "/drivers/default.png";

        return imagePath;
    }

    function HighlightCard({
        icon,
        label,
        driverId,
    }: {
        icon: string;
        label: string;
        driverId?: string | null;
    }) {
        const driver = getDriver(driverId);
        const team = getTeam(driver?.team_id);
        const driverImage = getDriverImage(driverId);

        return (
            <div className="relative min-h-[150px] overflow-hidden rounded-xl border border-zinc-800 bg-[#070d13] p-5 transition duration-300 hover:border-red-500/40">
                <div className="relative z-10 flex h-full items-center gap-4 pr-24">
                    <img
                        src={icon}
                        alt={label}
                        className="h-9 w-9 shrink-0 object-contain"
                    />

                    <div>
                        <p className="text-xs font-black uppercase text-zinc-500">
                            {label}
                        </p>

                        <h3 className="mt-2 text-xl font-black">
                            {driver?.name ?? "-"}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-400">
                            {team?.name ?? "-"}
                        </p>
                    </div>
                </div>

                <img
                    src={driverImage}
                    alt={driver?.name ?? "Piloto"}
                    className="absolute bottom-0 right-6 h-[150px] w-auto object-contain object-bottom opacity-95"
                    onError={(event) => {
                        if (!event.currentTarget.src.includes("default.png")) {
                            event.currentTarget.src = "/drivers/default.png";
                        }
                    }}
                />

                <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#070d13]/10 via-[#070d13]/10 to-transparent" />
            </div>
        );
    }

    function getFlagUrl(countryCode?: string | null) {
        if (!countryCode) return null;
        return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
    }

    function formatDate(dateStr?: string | null) {
        if (!dateStr) return "-";

        if (dateStr.includes("/")) {
            const [day, month, year] = dateStr.split("/");
            const date = new Date(`${year}-${month}-${day}`);

            return date.toLocaleDateString("pt-BR");
        }

        return dateStr;
    }

    function getCircuitDistance(circuit: Circuit | null) {
        if (!circuit) return "-";

        if (circuit.length && circuit.length.trim() !== "") {
            return circuit.length.includes("km")
                ? circuit.length
                : `${circuit.length} km`;
        }

        const search =
            `${circuit.name} ${circuit.grand_prix} ${circuit.location} ${circuit.country}`.toLowerCase();

        const found = Object.keys(CIRCUIT_DISTANCES).find((key) =>
            search.includes(key)
        );

        return found ? CIRCUIT_DISTANCES[found] : "-";
    }

    function getCountryName(code?: string | null, fallback?: string | null) {
        if (fallback && fallback.trim() !== "") return fallback;

        if (!code) return "";

        return COUNTRY_NAMES[code.toLowerCase()] || code.toUpperCase();
    }

    const fastestLap = useMemo(() => {
        const laps = results
            .map((result) => result.fastest_lap)
            .filter(Boolean);

        return laps.sort()[0] || "";
    }, [results]);

    const winner = results.find((result) => result.position === 1);
    const winnerDriver = getDriver(winner?.driver_id);
    const winnerTeam = getTeam(winner?.team_id);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                Carregando corrida...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
            <div className="mx-auto max-w-[1500px]">
                <div className="mb-8 flex items-start justify-between gap-6">
                    <div>
                        <div className="mb-4 flex items-center gap-3 text-sm font-black uppercase text-zinc-500">
                            <Link
                                href="/calendar"
                                className="text-red-500 hover:text-red-400"
                            >
                                Calendário
                            </Link>
                            <span>›</span>
                            <span>{circuit?.grand_prix || circuit?.name}</span>
                            <span>›</span>
                            <span>Resultados</span>
                        </div>

                        <h1 className="text-4xl font-black">
                            {circuit?.grand_prix || circuit?.name}
                        </h1>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-zinc-400">
                            <span className="flex items-center gap-2">
                                {getFlagUrl(circuit?.country_code) ? (
                                    <img
                                        src={getFlagUrl(circuit?.country_code) ?? ""}
                                        alt={circuit?.country ?? "flag"}
                                        className="h-5 w-7 rounded-sm object-cover shadow-sm"
                                    />
                                ) : (
                                    <span>{circuit?.flag}</span>
                                )}
                                {circuit?.name}
                            </span>

                            <span>•</span>
                            <span>{circuit?.location}</span>

                            <span>•</span>
                            <span>{formatDate(circuit?.date)}</span>

                            <span>•</span>
                            <span>{circuit?.laps ?? "-"} Voltas</span>

                            <span>•</span>
                            <span>{getCircuitDistance(circuit)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/calendar"
                            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-black uppercase text-zinc-300 transition hover:border-red-500 hover:text-red-400"
                        >
                            Voltar
                        </Link>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                    <div>
                        <section className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <HighlightCard
                                icon="/icons/destaque.png"
                                label="Piloto do dia"
                                driverId={awards?.driver_of_the_day}
                            />

                            <HighlightCard
                                icon="/icons/overtake.png"
                                label="Mais ultrapassagens"
                                driverId={awards?.most_overtakes}
                            />

                            <HighlightCard
                                icon="/icons/defense.png"
                                label="Pilotagem limpa"
                                driverId={awards?.cleanest_driving}
                            />
                        </section>

                        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-[#070d13]">
                            <div className="grid grid-cols-[60px_1.4fr_1.3fr_80px_90px_130px_150px_70px] gap-3 border-b border-zinc-800 px-5 py-4 text-xs font-black uppercase text-zinc-500">
                                <span>Pos</span>
                                <span>Piloto</span>
                                <span>Equipe</span>
                                <span>Grid</span>
                                <span>Paradas</span>
                                <span>Melhor volta</span>
                                <span>Tempo / Diferença</span>
                                <span>Pts</span>
                            </div>

                            {results.length === 0 && (
                                <div className="px-5 py-10 text-center text-zinc-500">
                                    Nenhum resultado cadastrado.
                                </div>
                            )}

                            {results.map((result) => {
                                const driver = getDriver(result.driver_id);
                                const team = getTeam(result.team_id);
                                const teamLogo = getTeamLogo(result.team_id);

                                const isFastestLap =
                                    result.fastest_lap &&
                                    fastestLap &&
                                    result.fastest_lap === fastestLap;

                                const hasPenalty =
                                    result.penalty && Number(result.penalty_seconds) > 0;

                                return (
                                    <div
                                        key={`${result.race_id}-${result.position}`}
                                        className="grid grid-cols-[60px_1.4fr_1.3fr_80px_90px_130px_150px_70px] items-center gap-3 border-b border-zinc-800 px-5 py-4 text-sm last:border-b-0"
                                    >
                                        <span className="font-bold">{result.position}</span>

                                        <div className="relative flex items-center">
                                            <Link
                                                href={`/drivers/${driver?.id}`}
                                                className="font-black text-white transition hover:text-red-400"
                                            >
                                                {driver?.name ?? "-"}
                                            </Link>

                                            <div className="absolute -left-6">
                                                <MovementArrow
                                                    current={result.position}
                                                    previous={result.grid || null}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {teamLogo && (
                                                <img
                                                    src={teamLogo}
                                                    alt={team?.name ?? "team"}
                                                    className="h-9 w-9 rounded object-contain"
                                                />
                                            )}

                                            <Link
                                                href={`/teams/${team?.id}`}
                                                className="text-sm font-semibold text-zinc-400 transition hover:text-red-400"
                                            >
                                                {team?.name ?? "-"}
                                            </Link>
                                        </div>

                                        <span>{result.grid ?? "-"}</span>
                                        <span>{result.stops ?? "-"}</span>

                                        <span
                                            className={
                                                isFastestLap
                                                    ? "font-black text-fuchsia-400"
                                                    : "text-zinc-300"
                                            }
                                        >
                                            {result.fastest_lap || "-"}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className={
                                                    result.status === "DNF"
                                                        ? "font-black text-red-500"
                                                        : result.position === 1
                                                            ? "font-black text-yellow-400"
                                                            : "text-zinc-300"
                                                }
                                            >
                                                {result.status === "DNF"
                                                    ? "DNF"
                                                    : result.time_or_gap || "-"}
                                            </span>

                                            {hasPenalty && result.status !== "DNF" && (
                                                <div className="group relative flex items-center gap-1">
                                                    <div className="relative h-4 w-6 overflow-hidden rounded-[2px] bg-white">
                                                        <div className="absolute inset-0 bg-black [clip-path:polygon(0_0,100%_0,0_100%)]" />
                                                    </div>

                                                    <span className="text-xs font-black text-red-400">
                                                        +{result.penalty_seconds}s
                                                    </span>

                                                    <div className="pointer-events-none absolute left-0 top-full mt-1 rounded-md bg-black px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                                                        x{result.penalty_count || 1}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <span className="flex items-center gap-1 font-bold">
                                            <span>
                                                {isFastestLap && result.status !== "DNF" && result.position <= 5
                                                    ? (result.points ?? 0) - 1
                                                    : result.points ?? 0}
                                            </span>

                                            {isFastestLap && result.status !== "DNF" && result.position <= 5 && (
                                                <span className="text-xs font-bold text-zinc-500/40">
                                                    +1
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                        </section>
                    </div>

                    <aside className="space-y-5">
                        <section className="rounded-xl border border-zinc-800 bg-[#070d13] p-5">
                            <h2 className="mb-4 text-sm font-black uppercase text-zinc-300">
                                {circuit?.name}
                            </h2>

                            {circuit?.track_image && (
                                <img
                                    src={circuit.track_image}
                                    alt={circuit.name}
                                    className="mb-5 h-48 w-full rounded-lg object-cover"
                                />
                            )}

                            <div className="grid grid-cols-3 gap-3 border-t border-zinc-800 pt-4 text-sm">
                                <div>
                                    <p className="text-xs font-bold uppercase text-zinc-500">
                                        Comprimento
                                    </p>
                                    <p className="mt-1 font-black">
                                        {getCircuitDistance(circuit)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase text-zinc-500">
                                        Voltas
                                    </p>
                                    <p className="mt-1 font-black">
                                        {circuit?.laps ?? "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase text-zinc-500">
                                        País
                                    </p>

                                    <div className="mt-1 flex items-center font-black">
                                        {circuit?.country_code && (
                                            <div className="group relative">
                                                <img
                                                    src={`https://flagcdn.com/w40/${circuit.country_code.toLowerCase()}.png`}
                                                    className="h-4 w-6 rounded-sm object-cover"
                                                    alt={
                                                        getCountryName(
                                                            circuit.country_code,
                                                            circuit.country
                                                        ) || "País"
                                                    }
                                                />

                                                <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                                                    {getCountryName(
                                                        circuit.country_code,
                                                        circuit.country
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-zinc-800 bg-[#070d13] p-5">
                            <h2 className="mb-4 text-sm font-black uppercase text-zinc-300">
                                Informações da corrida
                            </h2>

                            <div className="space-y-4 text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="text-zinc-400">Vencedor</span>
                                    <span className="font-bold">
                                        {winnerDriver?.name ?? "-"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-zinc-400">Equipe</span>
                                    <span className="font-bold">
                                        {winnerTeam?.name ?? "-"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-zinc-400">Tempo</span>
                                    <span className="font-bold text-yellow-400">
                                        {winner?.time_or_gap ?? "-"}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}