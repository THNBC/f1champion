"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";

type Driver = {
    id: string;
    name: string;
    nationality: string;
    team_id: string;
};

type Team = {
    id: string;
    name: string;
};

type Circuit = {
    id: string;
    name: string;
    location: string;
    flag: string;
    country?: string;
    country_code?: string;
    laps?: number;
    date?: string;
    is_finished?: boolean;
};

type ResultRow = {
    position: number;
    driver_id: string;
    team_id: string;
    status: "Normal" | "DNF";
    grid: number;
    stops: number;
    fastest_lap: string;
    penalty: boolean;
    penalty_count: number;
    penalty_seconds: number;
    time_or_gap: string;
    points: number;
};

const defaultPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

function parseLapToMs(value: string) {
    const match = value.trim().match(/^(\d+):(\d{2})\.(\d{1,3})$/);
    if (!match) return Number.POSITIVE_INFINITY;

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const milliseconds = Number(match[3].padEnd(3, "0"));

    return minutes * 60000 + seconds * 1000 + milliseconds;
}

export default function EditRaceResultsPage() {
    const params = useParams();
    const raceId = String(params.id);

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [circuit, setCircuit] = useState<Circuit | null>(null);

    const [laps, setLaps] = useState("57");
    const [date, setDate] = useState("");

    const [driverOfTheDay, setDriverOfTheDay] = useState("");
    const [mostOvertakes, setMostOvertakes] = useState("");
    const [cleanestDriving, setCleanestDriving] = useState("");

    const [rows, setRows] = useState<ResultRow[]>(
        Array.from({ length: 10 }, (_, index) => ({
            position: index + 1,
            driver_id: "",
            team_id: "",
            status: "Normal",
            grid: 0,
            stops: 0,
            fastest_lap: "",
            penalty: false,
            penalty_count: 0,
            penalty_seconds: 0,
            time_or_gap: "",
            points: defaultPoints[index] ?? 0,
        }))
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [openPenaltyRow, setOpenPenaltyRow] = useState<number | null>(null);
    const [toast, setToast] = useState<{
        type: "success" | "error";
        message: string;
        isLeaving: boolean;
    } | null>(null);

    function showToast(type: "success" | "error", message: string) {
        setToast({ type, message, isLeaving: false });

        setTimeout(() => {
            setToast((current) => {
                if (!current) return current;

                return {
                    ...current,
                    isLeaving: true,
                };
            });
        }, 2700);

        setTimeout(() => {
            setToast(null);
        }, 3000);
    }

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            const { data: driversData } = await supabase
                .from("drivers")
                .select("*")
                .order("slot", { ascending: true });

            const { data: teamsData } = await supabase.from("teams").select("*");

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

            const { data: awardsData } = await supabase
                .from("race_awards")
                .select("*")
                .eq("race_id", raceId)
                .maybeSingle();

            setDrivers(driversData || []);
            setTeams(teamsData || []);

            if (circuitData) {
                setCircuit(circuitData);
                setLaps(String(circuitData.laps ?? "57"));
                setDate(circuitData.date ?? "");
            }

            if (awardsData) {
                setDriverOfTheDay(awardsData.driver_of_the_day || "");
                setMostOvertakes(awardsData.most_overtakes || "");
                setCleanestDriving(awardsData.cleanest_driving || "");
            }

            if (resultsData && resultsData.length > 0) {
                setRows(
                    resultsData.map((result) => ({
                        position: result.position,
                        driver_id: result.driver_id,
                        team_id: result.team_id,
                        status: result.status === "DNF" ? "DNF" : "Normal",
                        grid: result.grid ?? 0,
                        stops: result.stops ?? 0,
                        fastest_lap: result.fastest_lap ?? "",
                        penalty: result.penalty ?? false,
                        penalty_count: result.penalty_count ?? 0,
                        penalty_seconds: result.penalty_seconds ?? 0,
                        time_or_gap: result.time_or_gap ?? "",
                        points:
                            result.status === "DNF"
                                ? 0
                                : defaultPoints[result.position - 1] ?? 0,
                    }))
                );
            }

            setLoading(false);
        }

        loadData();
    }, [raceId]);

    function formatFastestLap(value: string) {
        const digits = value.replace(/\D/g, "").slice(0, 6);

        if (digits.length <= 1) return digits;
        if (digits.length <= 3) return `${digits.slice(0, 1)}:${digits.slice(1)}`;

        return `${digits.slice(0, 1)}:${digits.slice(1, 3)}.${digits.slice(3)}`;
    }



    function formatLeaderTime(value: string) {
        const digits = value.replace(/\D/g, "").slice(0, 7);

        if (!digits) return "";
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;

        return `${digits.slice(0, 2)}:${digits.slice(2, 4)}.${digits.slice(4)}`;
    }

    function formatGapFromLeader(value: string) {
        const digits = value.replace(/\D/g, "").slice(0, 7);

        if (!digits) return "";

        if (digits.length <= 2) {
            return `+${Number(digits)}`;
        }

        if (digits.length <= 4) {
            const seconds = Number(digits.slice(0, digits.length - 3));
            const milliseconds = digits.slice(-3);

            return `+${seconds}.${milliseconds}`;
        }

        if (digits.length === 5) {
            const seconds = Number(digits.slice(0, 2));
            const milliseconds = digits.slice(2, 5);

            return `+${seconds}.${milliseconds}`;
        }

        return `+${Number(digits.slice(0, 1))}:${digits.slice(1, 3)}.${digits.slice(3, 6)}`;
    }

    function formatGapTime(value: string) {
        const digits = value.replace(/\D/g, "");

        if (!digits) return "";

        if (digits.length === 1) {
            const laps = Number(digits);
            return `${laps} ${laps === 1 ? "Lap" : "Laps"}`;
        }

        return formatGapFromLeader(digits);
    }
    function updateRow(
        index: number,
        field: keyof ResultRow,
        value: string | number | boolean
    ) {
        setRows((prev) =>
            prev.map((row, rowIndex) => {
                if (rowIndex !== index) return row;

                const updated = {
                    ...row,
                    [field]: value,
                };

                if (field === "driver_id") {
                    const driver = drivers.find((item) => item.id === value);
                    updated.team_id = driver?.team_id ?? "";
                }

                if (field === "status") {
                    if (value === "DNF") {
                        updated.time_or_gap = "DNF";
                        updated.points = 0;
                    }

                    if (value === "Normal" && row.status === "DNF") {
                        updated.time_or_gap = "";
                        updated.fastest_lap = "";
                    }
                }

                if (field === "fastest_lap") {
                    updated.fastest_lap = formatFastestLap(String(value));
                }

                if (field === "time_or_gap") {
                    if (updated.status === "DNF") {
                        updated.time_or_gap = "DNF";
                    } else {
                        const rawValue = String(value).trim();

                        if (index === 0) {
                            updated.time_or_gap = formatLeaderTime(rawValue);
                        } else {
                            updated.time_or_gap = formatGapTime(rawValue);
                        }
                    }
                }

                const tempRows = prev.map((r, i) =>
                    i === index ? updated : r
                );

                const validRows = tempRows.filter((row) => row.driver_id);

                const fastestLapDriverId = validRows
                    .filter((row, i) => {
                        const isTop10 = i < 10;
                        const isNormal = row.status !== "DNF";
                        const hasValidLap =
                            parseLapToMs(row.fastest_lap) !== Number.POSITIVE_INFINITY;

                        return isTop10 && isNormal && hasValidLap;
                    })
                    .sort(
                        (a, b) => parseLapToMs(a.fastest_lap) - parseLapToMs(b.fastest_lap)
                    )[0]?.driver_id;

                updated.points =
                    updated.status === "DNF"
                        ? 0
                        : (defaultPoints[index] ?? 0) +
                        (index < 5 && updated.driver_id === fastestLapDriverId ? 1 : 0);

                return updated;
            })
        );
    }

    function addRow() {
        setRows((prev) => [
            ...prev,
            {
                position: prev.length + 1,
                driver_id: "",
                team_id: "",
                status: "Normal",
                grid: 0, // mantém padrão correto
                stops: 0, // igual ao inicial
                fastest_lap: "",
                penalty: false,
                penalty_count: 0,
                penalty_seconds: 0,
                time_or_gap: "",
                points: defaultPoints[prev.length] ?? 0,
            },
        ]);
    }

    function removeLastRow() {
        setRows((prev) => {
            if (prev.length <= 1) return prev;

            const updated = prev.slice(0, -1);

            // 🔥 reordena posições (importante)
            return updated.map((row, index) => ({
                ...row,
                position: index + 1,
                points: defaultPoints[index] ?? 0,
            }));
        });
    }
    function clearAllRows() {
        if (!confirm("Deseja limpar todos os pilotos?")) return;

        setRows(
            Array.from({ length: 10 }, (_, index) => ({
                position: index + 1,
                driver_id: "",
                team_id: "",
                status: "Normal",
                grid: 0,
                stops: 0,
                fastest_lap: "",
                penalty: false,
                penalty_count: 0,
                penalty_seconds: 0,
                time_or_gap: "",
                points: defaultPoints[index] ?? 0,
            }))
        );
    }
    async function handleSave() {
        setSaving(true);
        const leader = rows.find((row, index) => index === 0 && row.driver_id);

        await supabase
            .from("circuits")
            .update({
                is_finished: Boolean(leader),
                winner: leader ? leader.driver_id : null,
            })
            .eq("id", raceId);
        try {
            // 🔥 1. salva circuito (laps + data)
            await supabase
                .from("circuits")
                .update({
                    laps: Number(laps),
                    date: date || null,
                })
                .eq("id", raceId);

            // 🔥 2. limpa resultados antigos
            await supabase
                .from("race_results")
                .delete()
                .eq("race_id", raceId);

            // 🔥 3. monta novos resultados

            const validRows = rows.filter((row) => row.driver_id);

            const fastestLapDriverId = validRows
                .filter((row, index) => {
                    const isTop10 = index < 5;
                    const isNormal = row.status !== "DNF";
                    const hasValidLap =
                        parseLapToMs(row.fastest_lap) !== Number.POSITIVE_INFINITY;

                    return isTop10 && isNormal && hasValidLap;
                })
                .sort(
                    (a, b) => parseLapToMs(a.fastest_lap) - parseLapToMs(b.fastest_lap)
                )[0]?.driver_id;

            const resultsToInsert = validRows.map((row, index) => {
                const basePoints =
                    row.status === "DNF" ? 0 : defaultPoints[index] ?? 0;

                const fastestLapBonus =
                    index < 5 &&
                        row.status !== "DNF" &&
                        row.driver_id === fastestLapDriverId
                        ? 1
                        : 0;

                return {
                    race_id: raceId,
                    position: index + 1,
                    driver_id: row.driver_id,
                    team_id: row.team_id,
                    grid: Number(row.grid),
                    stops: Number(row.stops),
                    fastest_lap: row.fastest_lap,
                    penalty: row.penalty,
                    penalty_count: row.penalty_count,
                    penalty_seconds: row.penalty_seconds,
                    time_or_gap: row.status === "DNF" ? "DNF" : row.time_or_gap,
                    points: basePoints + fastestLapBonus,
                    status: row.status,
                };
            });

            if (resultsToInsert.length > 0) {
                const { error } = await supabase
                    .from("race_results")
                    .insert(resultsToInsert);

                if (error) throw error;
            }

            // 🔥 4. pega o líder (P1)
            const leader = rows.find((row, index) => index === 0 && row.driver_id);

            // 🔥 5. atualiza finalização automática
            await supabase
                .from("circuits")
                .update({
                    is_finished: Boolean(leader),
                    winner: leader ? leader.driver_id : null,
                })
                .eq("id", raceId);

            setCircuit((prev) =>
                prev
                    ? {
                        ...prev,
                        is_finished: Boolean(leader),
                    }
                    : prev
            );

            // 🔥 6. salva awards
            await supabase.from("race_awards").upsert({
                race_id: raceId,
                driver_of_the_day: driverOfTheDay || null,
                most_overtakes: mostOvertakes || null,
                cleanest_driving: cleanestDriving || null,
            });

            showToast("success", "Resultados salvos com sucesso");
        } catch (err) {
            console.error(err);
            showToast("error", "Erro ao salvar resultados");
        } finally {
            setSaving(false);
        }
    }



    function getTeamName(teamId: string) {
        return teams.find((team) => team.id === teamId)?.name ?? "-";
    }
    function getCircuitFlagUrl() {
        if (!circuit) return null;

        const countryMap: Record<string, string> = {
            australia: "au",
            bahrein: "bh",
            bahrain: "bh",
            "arabia saudita": "sa",
            saudi: "sa",
            japão: "jp",
            japan: "jp",
            china: "cn",
            miami: "us",
            estadosunidos: "us",
            "estados unidos": "us",
            usa: "us",
            itália: "it",
            italy: "it",
            monaco: "mc",
            mônaco: "mc",
            canada: "ca",
            canadá: "ca",
            espanha: "es",
            spain: "es",
            austria: "at",
            "reino unido": "gb",
            greatbritain: "gb",
            "great britain": "gb",
            hungria: "hu",
            hungary: "hu",
            belgica: "be",
            bélgica: "be",
            belgium: "be",
            holanda: "nl",
            netherlands: "nl",
            zandvoort: "nl",
            azerbaijão: "az",
            azerbaijan: "az",
            singapura: "sg",
            singapore: "sg",
            mexico: "mx",
            méxico: "mx",
            brasil: "br",
            brazil: "br",
            catar: "qa",
            qatar: "qa",
            abu: "ae",
            "abu dhabi": "ae",
            emirados: "ae",
        };

        const raw =
            circuit.country_code ||
            circuit.country ||
            circuit.location ||
            circuit.name ||
            "";

        const normalized = raw
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

        const code =
            normalized.length === 2
                ? normalized
                : countryMap[normalized] ||
                Object.keys(countryMap).find((key) => normalized.includes(key));

        if (!code) return null;

        return `https://flagcdn.com/w80/${countryMap[code] || code}.png`;
    }
    if (loading) {
        return (
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                Carregando resultados...
            </main>
        );
    }

    return (
        <AdminGuard>
        <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
            {toast && (
                <div
                    className={`fixed bottom-10 left-1/2 z-[999] -translate-x-1/2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${toast.isLeaving
                            ? "translate-y-4 scale-95 opacity-0 blur-[2px]"
                            : "translate-y-0 scale-100 opacity-100 blur-0"
                        }`}
                >
                    <div
                        className={`animate-toast-in rounded-xl border px-6 py-4 shadow-2xl backdrop-blur-md ${toast.type === "success"
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-emerald-950/30"
                                : "border-red-500/40 bg-red-500/10 text-red-400 shadow-red-950/30"
                            }`}
                    >
                        <p className="text-xs font-black uppercase tracking-wide text-center">
                            {toast.type === "success" ? "Sucesso" : "Erro"}
                        </p>

                        <p className="mt-1 text-sm font-bold text-white text-center">
                            {toast.message}
                        </p>
                    </div>

                    <style jsx>{`
                        @keyframes toastIn {
                            0% {
                                opacity: 0;
                                transform: translateY(20px) scale(0.95);
                            }

                            100% {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                            }
                        }

                        .animate-toast-in {
                            animation: toastIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
                        }
                    `}</style>
                </div>
            )}

            <div className="mx-auto max-w-[1500px]">
                <div className="mb-8 flex items-start justify-between gap-6">
                    <div>
                        <div className="mb-4 flex items-center gap-3 text-sm font-black uppercase text-zinc-500">
                            <Link href="/settings" className="text-red-500 hover:text-red-400">
                                Settings
                            </Link>
                            <span>›</span>
                            <Link
                                href="/settings/circuits"
                                className="text-red-500 hover:text-red-400"
                            >
                                Circuits
                            </Link>
                            <span>›</span>
                            <span>Editar resultados</span>
                        </div>

                        <h1 className="text-4xl font-black">
                            Editar Resultados da Classificação
                        </h1>

                        <p className="mt-2 text-zinc-400">
                            Edite os resultados da classificação da corrida abaixo.
                        </p>
                    </div>

                    <Link
                        href="/settings/circuits"
                        className="rounded-lg border border-red-700 px-6 py-3 text-xs font-black uppercase text-red-500 transition hover:bg-red-600 hover:text-white"
                    >
                        ← Voltar para circuitos
                    </Link>
                </div>

                <section className="mb-4 rounded-xl border border-zinc-800 bg-[#070d13] p-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_180px_220px]">
                        <div>
                            <div className="flex items-center gap-4">
                                {getCircuitFlagUrl() ? (
                                    <img
                                        src={getCircuitFlagUrl() ?? ""}
                                        alt={circuit?.name ?? "Bandeira da corrida"}
                                        className="h-8 w-12 rounded-md border border-zinc-700 object-cover shadow"
                                    />
                                ) : (
                                    <span className="text-3xl">{circuit?.flag}</span>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-black">{circuit?.name}</h2>


                                        </div>

                                        {circuit?.is_finished && (
                                            <span className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-400">
                                                ✓ Concluída
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-400">{circuit?.location}</p>
                                </div>
                            </div>
                        </div>

                        <label className="block">
                            <span className="mb-2 block text-sm font-bold text-zinc-400">
                                Voltas
                            </span>
                            <input
                                value={laps}
                                onChange={(e) => setLaps(e.target.value)}
                                className="w-full rounded-md border border-zinc-700 bg-black/30 px-3 py-3 outline-none focus:border-red-500"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-bold text-zinc-400">
                                Data
                            </span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-md border border-zinc-700 bg-[#05080d] px-3 py-3 text-white outline-none focus:border-red-500 [color-scheme:dark]"
                            />
                        </label>
                    </div>
                </section>

                <section className="mb-4 grid grid-cols-1 gap-4 rounded-xl border border-zinc-800 bg-[#070d13] p-5 lg:grid-cols-3">
                    {[
                        {
                            icon: "🏆",
                            label: "Piloto do dia",
                            value: driverOfTheDay,
                            setter: setDriverOfTheDay,
                        },
                        {
                            icon: "↔",
                            label: "Mais ultrapassagens",
                            value: mostOvertakes,
                            setter: setMostOvertakes,
                        },
                        {
                            icon: "🛡",
                            label: "Pilotagem limpa",
                            value: cleanestDriving,
                            setter: setCleanestDriving,
                        },
                    ].map((item) => (
                        <label key={item.label} className="block">
                            <div className="mb-2 flex items-center gap-3 text-sm font-bold text-zinc-400">
                                <span className="text-2xl">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>

                            <select
                                value={item.value || ""}
                                onChange={(e) => item.setter(e.target.value)}
                                className={`w-full rounded-md border border-zinc-700 bg-[#05080d] px-3 py-3 outline-none focus:border-red-500 appearance-none ${!item.value ? "text-zinc-500" : "text-white"
                                    }`}
                            >
                                <option value="" disabled hidden>
                                    Selecionar piloto
                                </option>

                                {drivers.map((driver) => (
                                    <option
                                        key={driver.id}
                                        value={driver.id}
                                        className="bg-[#05080d] text-white"
                                    >
                                        {driver.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ))}
                </section>

                <section className="rounded-xl border border-zinc-800 bg-[#070d13] p-5">
                    <div className="mb-3 grid grid-cols-[50px_1.4fr_1.2fr_110px_80px_90px_130px_90px_130px_70px] gap-3 text-xs font-black uppercase text-zinc-500">
                        <span>Pos</span>
                        <span>Piloto</span>
                        <span>Equipe</span>
                        <span>Status</span>
                        <span>Grid</span>
                        <span>Paradas</span>
                        <span>Melhor volta</span>
                        <span>Punição</span>
                        <span>Tempo total</span>
                        <span>Pts</span>
                    </div>

                    <div className="space-y-2">
                        {rows.map((row, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-[50px_1.4fr_1.2fr_110px_80px_90px_130px_90px_130px_70px] items-center gap-3"
                            >
                                <span className="font-bold">{index + 1}</span>

                                <select
                                    value={row.driver_id || ""}
                                    onChange={(e) => updateRow(index, "driver_id", e.target.value)}
                                    className={`rounded-md border border-zinc-700 bg-[#05080d] px-3 py-2 outline-none transition focus:border-red-500 appearance-none ${!row.driver_id ? "text-zinc-500" : "text-white"
                                        }`}
                                >
                                    <option value="" disabled hidden>
                                        Selecionar piloto
                                    </option>

                                    {drivers
                                        .filter((driver) => {
                                            const alreadySelected = rows.some(
                                                (otherRow) =>
                                                    otherRow !== row &&
                                                    otherRow.driver_id === driver.id
                                            );

                                            return !alreadySelected;
                                        })
                                        .map((driver) => (
                                            <option
                                                key={driver.id}
                                                value={driver.id}
                                                className="bg-[#05080d] text-white"
                                            >
                                                {driver.name}
                                            </option>
                                        ))}
                                </select>

                                <div className="rounded-md border border-zinc-700 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                                    {getTeamName(row.team_id)}
                                </div>

                                <select
                                    value={row.status || "Normal"}
                                    onChange={(e) =>
                                        updateRow(index, "status", e.target.value as ResultRow["status"])
                                    }
                                    className={`rounded-md border border-zinc-700 bg-[#05080d] px-3 py-2 outline-none transition focus:border-red-500 appearance-none ${!row.status ? "text-zinc-500" : "text-white"
                                        }`}
                                >
                                    <option value="Normal" className="bg-[#05080d] text-white">
                                        Normal
                                    </option>
                                    <option value="DNF" className="bg-[#05080d] text-white">
                                        DNF
                                    </option>
                                </select>

                                <input
                                    value={row.grid === 0 ? "" : row.grid}
                                    placeholder="0"
                                    onChange={(e) =>
                                        updateRow(index, "grid", e.target.value === "" ? 0 : Number(e.target.value))
                                    }
                                    className="rounded-md border border-zinc-700 bg-black/30 px-3 py-2 outline-none focus:border-red-500"
                                />

                                <input
                                    value={row.stops === 0 ? "" : row.stops}
                                    placeholder="0"
                                    onChange={(e) =>
                                        updateRow(index, "stops", e.target.value === "" ? 0 : Number(e.target.value))
                                    }
                                    className="rounded-md border border-zinc-700 bg-black/30 px-3 py-2 outline-none focus:border-red-500"
                                />

                                <input
                                    value={row.fastest_lap}
                                    placeholder="0:00.000"
                                    maxLength={8}
                                    onChange={(e) => updateRow(index, "fastest_lap", e.target.value)}
                                    className="rounded-md border border-zinc-700 bg-black/30 px-3 py-2 outline-none focus:border-red-500"
                                />

                                <div className="relative flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextValue = !row.penalty;

                                            updateRow(index, "penalty", nextValue);

                                            if (nextValue) {
                                                setOpenPenaltyRow(index);
                                            } else {
                                                updateRow(index, "penalty_count", 0);
                                                updateRow(index, "penalty_seconds", 0);
                                                setOpenPenaltyRow(null);
                                            }
                                        }}
                                        className={`rounded-md border px-3 py-2 text-xs font-black uppercase transition ${row.penalty
                                            ? "border-red-600 bg-red-600/15 text-red-400"
                                            : "border-zinc-700 bg-black/30 text-zinc-400 hover:border-red-600 hover:text-red-400"
                                            }`}
                                    >
                                        {row.penalty
                                            ? `${row.penalty_count}x ${row.penalty_seconds}s`
                                            : "Não"}
                                    </button>

                                    {openPenaltyRow === index && row.penalty && (
                                        <div className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-zinc-700 bg-[#05080d] p-4 shadow-2xl">
                                            <div className="mb-3 text-xs font-black uppercase text-zinc-400">
                                                Punição
                                            </div>

                                            <label className="mb-3 block">
                                                <span className="mb-1 block text-[11px] font-bold uppercase text-zinc-500">
                                                    Quantidade
                                                </span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={row.penalty_count}
                                                    onChange={(e) =>
                                                        updateRow(index, "penalty_count", Number(e.target.value))
                                                    }
                                                    className="w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-red-500"
                                                />
                                            </label>

                                            <label className="block">
                                                <span className="mb-1 block text-[11px] font-bold uppercase text-zinc-500">
                                                    Segundos adicionados
                                                </span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={row.penalty_seconds}
                                                    onChange={(e) =>
                                                        updateRow(index, "penalty_seconds", Number(e.target.value))
                                                    }
                                                    className="w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-red-500"
                                                />
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => setOpenPenaltyRow(null)}
                                                className="mt-4 w-full rounded-md bg-red-600 px-3 py-2 text-xs font-black uppercase transition hover:bg-red-500"
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <input
                                    value={row.time_or_gap}
                                    placeholder={index === 0 ? "00:00.000" : "+00.000"}
                                    maxLength={index === 0 ? 9 : 8}
                                    disabled={row.status === "DNF"}
                                    onChange={(e) => updateRow(index, "time_or_gap", e.target.value)}
                                    className="rounded-md border border-zinc-700 bg-black/30 px-3 py-2 outline-none focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                />

                                <input
                                    value={row.points}
                                    readOnly
                                    className="rounded-md border border-zinc-700 bg-black/20 px-3 py-2 text-zinc-400 outline-none"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            onClick={addRow}
                            className="rounded-md border border-zinc-700 px-5 py-3 text-sm font-black uppercase text-zinc-300 transition hover:border-red-600 hover:text-red-500"
                        >
                            + Adicionar piloto
                        </button>

                        <button
                            onClick={removeLastRow}
                            className="rounded-md border border-zinc-700 px-5 py-3 text-sm font-black uppercase text-zinc-300 transition hover:border-red-600 hover:text-red-500"
                        >
                            − Remover piloto
                        </button>
                        <button
                            onClick={clearAllRows}
                            className="rounded-md border border-zinc-700 px-5 py-3 text-sm font-black uppercase text-zinc-300 transition hover:border-yellow-500 hover:text-yellow-400"
                        >
                            Limpar
                        </button>
                    </div>
                </section>

                <div className="mt-6 flex justify-end gap-4">
                    <Link
                        href="/settings/circuits"
                        className="rounded-md border border-zinc-700 px-8 py-3 text-sm font-black uppercase text-zinc-300 transition hover:border-red-600 hover:text-red-500"
                    >
                        Cancelar
                    </Link>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-md bg-red-600 px-8 py-3 text-sm font-black uppercase transition hover:bg-red-500 disabled:opacity-60"
                    >
                        {saving ? "Salvando..." : "Salvar resultados"}
                    </button>
                </div>
            </div>
        </main>
        </AdminGuard>
    );
}