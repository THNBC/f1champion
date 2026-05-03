"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type AvailableCircuit = {
    id: string;
    name: string;
    location: string;
    flag: string;
    country_code: string;
    track_image: string;
    track_length: string;
    date?: string;
};

const availableCircuits: AvailableCircuit[] = [
    { id: "bahrain", name: "Bahrain International Circuit", location: "Sakhir, Bahrain", flag: "🇧🇭", country_code: "bh", track_image: "/gps/bahrain.png", track_length: "5.412 km" },
    { id: "saudi", name: "Jeddah Corniche Circuit", location: "Jeddah, Saudi Arabia", flag: "🇸🇦", country_code: "sa", track_image: "/gps/saudi.png", track_length: "6.174 km" },
    { id: "australia", name: "Albert Park Circuit", location: "Melbourne, Australia", flag: "🇦🇺", country_code: "au", track_image: "/gps/australia.png", track_length: "5.278 km" },
    { id: "china", name: "Shanghai International Circuit", location: "Shanghai, China", flag: "🇨🇳", country_code: "cn", track_image: "/gps/china.png", track_length: "5.451 km" },
    { id: "japan", name: "Suzuka Circuit", location: "Suzuka, Japan", flag: "🇯🇵", country_code: "jp", track_image: "/gps/japan.png", track_length: "5.807 km" },
    { id: "monaco", name: "Monaco Circuit", location: "Monte Carlo, Monaco", flag: "🇲🇨", country_code: "mc", track_image: "/gps/monaco.png", track_length: "3.337 km" },
    { id: "imola", name: "Imola Circuit", location: "Imola, Italy", flag: "🇮🇹", country_code: "it", track_image: "/gps/imola.png", track_length: "4.909 km" },
    { id: "spain", name: "Barcelona Circuit", location: "Barcelona, Spain", flag: "🇪🇸", country_code: "es", track_image: "/gps/spain.png", track_length: "4.657 km" },
    { id: "canada", name: "Gilles Villeneuve Circuit", location: "Montreal, Canada", flag: "🇨🇦", country_code: "ca", track_image: "/gps/canada.png", track_length: "4.361 km" },
    { id: "austria", name: "Red Bull Ring", location: "Spielberg, Austria", flag: "🇦🇹", country_code: "at", track_image: "/gps/austria.png", track_length: "4.318 km" },
    { id: "silverstone", name: "Silverstone Circuit", location: "UK", flag: "🇬🇧", country_code: "gb", track_image: "/gps/silverstone.png", track_length: "5.891 km" },
    { id: "hungary", name: "Hungaroring", location: "Budapest, Hungary", flag: "🇭🇺", country_code: "hu", track_image: "/gps/hungary.png", track_length: "4.381 km" },
    { id: "spa", name: "Spa-Francorchamps", location: "Belgium", flag: "🇧🇪", country_code: "be", track_image: "/gps/spa.png", track_length: "7.004 km" },
    { id: "zandvoort", name: "Zandvoort", location: "Netherlands", flag: "🇳🇱", country_code: "nl", track_image: "/gps/zandvoort.png", track_length: "4.259 km" },
    { id: "monza", name: "Monza Circuit", location: "Italy", flag: "🇮🇹", country_code: "it", track_image: "/gps/monza.png", track_length: "5.793 km" },
    { id: "baku", name: "Baku City Circuit", location: "Azerbaijan", flag: "🇦🇿", country_code: "az", track_image: "/gps/baku.png", track_length: "6.003 km" },
    { id: "singapore", name: "Singapore Circuit", location: "Singapore", flag: "🇸🇬", country_code: "sg", track_image: "/gps/singapore.png", track_length: "4.940 km" },
    { id: "texas", name: "COTA", location: "USA", flag: "🇺🇸", country_code: "us", track_image: "/gps/texas.png", track_length: "5.513 km" },
    { id: "mexico", name: "Mexico GP", location: "Mexico City", flag: "🇲🇽", country_code: "mx", track_image: "/gps/mexico.png", track_length: "4.304 km" },
    { id: "lasvegas", name: "Las Vegas", location: "USA", flag: "🇺🇸", country_code: "us", track_image: "/gps/lasvegas.png", track_length: "6.201 km" },
    { id: "qatar", name: "Qatar GP", location: "Qatar", flag: "🇶🇦", country_code: "qa", track_image: "/gps/qatar.png", track_length: "5.419 km" },
    { id: "abudhabi", name: "Abu Dhabi", location: "UAE", flag: "🇦🇪", country_code: "ae", track_image: "/gps/abudhabi.png", track_length: "5.281 km" },
    { id: "miami", name: "Miami GP", location: "USA", flag: "🇺🇸", country_code: "us", track_image: "/gps/miami.png", track_length: "5.412 km" },
    { id: "interlagos", name: "Interlagos", location: "Brazil", flag: "🇧🇷", country_code: "br", track_image: "/gps/interlagos.png", track_length: "4.309 km" },
];

type CircuitSlot = {
    slot: number;
    circuitId: string;
    isOpen: boolean;
    isFinished: boolean;
};

export default function SettingsCircuitsPage() {
    const [slots, setSlots] = useState<CircuitSlot[]>(
        Array.from({ length: 24 }, (_, index) => ({
            slot: index + 1,
            circuitId: "",
            isOpen: false,
            isFinished: false,
        }))
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{
        type: "success" | "error";
        message: string;
        isLeaving: boolean;
    } | null>(null);

    const selectRefs = useRef<(HTMLSelectElement | null)[]>([]);
    const [dbCircuits, setDbCircuits] = useState<any[]>([]);

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
        async function loadCircuits() {
            setLoading(true);

            const { data, error } = await supabase
                .from("circuits")
                .select("*")
                .order("calendar_order", { ascending: true });

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }

            if (data) {
                setDbCircuits(data);
            }

            if (data && data.length > 0) {
                setSlots((prev) =>
                    prev.map((slot) => {
                        const found = data.find(
                            (circuit) => circuit.calendar_order === slot.slot
                        );

                        return found
                            ? {
                                ...slot,
                                circuitId: found.id,
                                isFinished: found.is_finished === true,
                                isOpen: false,
                            }
                            : slot;
                    })
                );
            }

            setLoading(false);
        }

        loadCircuits();
    }, []);

    function getCircuitFlagUrl(countryCode?: string) {
        if (!countryCode) return null;
        return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
    }

    function openSlot(slotNumber: number) {
        setSlots((prev) =>
            prev.map((slot) => ({
                ...slot,
                isOpen: slot.slot === slotNumber,
            }))
        );

        setTimeout(() => {
            const select = selectRefs.current[slotNumber - 1] as
                | (HTMLSelectElement & { showPicker?: () => void })
                | null;

            select?.focus();

            if (select?.showPicker) {
                select.showPicker();
            } else {
                select?.click();
            }
        }, 100);
    }

    function changeCircuit(slotNumber: number, circuitId: string) {
        setSlots((prev) =>
            prev.map((slot) =>
                slot.slot === slotNumber
                    ? { ...slot, circuitId, isOpen: false, isFinished: false }
                    : slot
            )
        );
    }

    function removeCircuit(slotNumber: number) {
        setSlots((prev) => {
            const remainingCircuits = prev
                .filter((slot) => slot.slot !== slotNumber)
                .filter((slot) => slot.circuitId)
                .map((slot) => ({
                    circuitId: slot.circuitId,
                    isFinished: slot.isFinished,
                }));

            return prev.map((slot, index) => {
                const circuit = remainingCircuits[index];

                return {
                    ...slot,
                    circuitId: circuit?.circuitId ?? "",
                    isFinished: circuit?.isFinished ?? false,
                    isOpen: false,
                };
            });
        });
    }

    async function handleSave() {
        setSaving(true);

        try {
            const selectedCircuits = slots
                .filter((slot) => slot.circuitId)
                .map((slot) => {
                    const circuit = availableCircuits.find(
                        (item) => item.id === slot.circuitId
                    );

                    if (!circuit) return null;

                    return {
                        ...circuit,
                        calendar_order: slot.slot,
                        selected: true,
                        is_finished: slot.isFinished,
                    };
                })
                .filter(Boolean);

            const { error: disableError } = await supabase
                .from("circuits")
                .update({
                    selected: false,
                    calendar_order: null,
                })
                .neq("id", "");

            if (disableError) throw disableError;

            if (selectedCircuits.length > 0) {
                const { error: upsertError } = await supabase
                    .from("circuits")
                    .upsert(selectedCircuits, { onConflict: "id" });

                if (upsertError) throw upsertError;
            }

            showToast("success", "Circuitos salvos com sucesso");
        } catch (err) {
            console.error("Erro ao salvar circuitos:", err);
            showToast("error", "Erro ao salvar circuitos");
        } finally {
            setSaving(false);
        }
    }

    function toggleFinished(slotNumber: number) {
        setSlots((prev) =>
            prev.map((slot) =>
                slot.slot === slotNumber
                    ? { ...slot, isFinished: !slot.isFinished }
                    : slot
            )
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                Carregando circuitos...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
            {toast && (
                <div
                    className={`fixed bottom-10 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${toast.isLeaving
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
                        <p className="text-center text-xs font-black uppercase tracking-wide">
                            {toast.type === "success" ? "Sucesso" : "Erro"}
                        </p>

                        <p className="mt-1 text-center text-sm font-bold text-white">
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
                        <p className="mb-3 inline-block border-b-2 border-red-600 pb-2 text-sm font-black uppercase text-red-500">
                            Settings
                        </p>

                        <h1 className="text-4xl font-black">Configurar Circuitos</h1>

                        <p className="mt-3 text-sm text-zinc-400">
                            Selecione os circuitos que serão utilizados no campeonato.
                        </p>
                    </div>

                    <Link
                        href="/settings"
                        className="rounded-lg border border-red-700 px-5 py-3 text-xs font-black uppercase text-red-500 transition hover:bg-red-600 hover:text-white"
                    >
                        Voltar
                    </Link>
                </div>

                <section className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {slots.map((slot, index) => {
                        const circuit = availableCircuits.find(
                            (item) => item.id === slot.circuitId
                        );

                        const dbCircuit = dbCircuits.find(
                            (item) => item.id === slot.circuitId
                        );

                        const flagUrl = getCircuitFlagUrl(circuit?.country_code);

                        return (
                            <div
                                key={slot.slot}
                                className={`group relative min-h-[240px] overflow-hidden rounded-xl border bg-[#070d13] p-4 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.025] hover:shadow-[0_18px_45px_rgba(0,0,0,0.45)] ${slot.isOpen
                                        ? "border-red-600"
                                        : slot.isFinished
                                            ? "border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.10)]"
                                            : "border-zinc-800 hover:border-red-600/50"
                                    }`}
                            >
                                <div className="relative z-30 mb-3 grid grid-cols-[40px_1fr_32px] items-center gap-2">
                                    <span className="text-lg font-black leading-none">
                                        {String(slot.slot).padStart(2, "0")}
                                    </span>

                                    {circuit && !slot.isOpen ? (
                                        <label className="flex h-[28px] w-[130px] cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#070d13] px-2 text-[8px] font-black uppercase tracking-wide text-zinc-500 transition-all duration-300 ease-out hover:text-white">
                                            <span
                                                className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border text-[9px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${slot.isFinished
                                                        ? "scale-100 border-emerald-500 bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.55)]"
                                                        : "scale-90 border-zinc-700 bg-zinc-900 text-transparent shadow-none"
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${slot.isFinished ? "scale-100 opacity-100" : "scale-0 opacity-0"
                                                        }`}
                                                >
                                                    ✓
                                                </span>
                                            </span>

                                            <span
                                                className={`text-[8px] font-black uppercase tracking-wide transition-all duration-300 ${slot.isFinished ? "text-emerald-400" : "text-zinc-500"
                                                    }`}
                                            >
                                                {slot.isFinished ? "Finalizado" : "Aberto"}
                                            </span>

                                            <input
                                                type="checkbox"
                                                checked={slot.isFinished}
                                                onChange={() => toggleFinished(slot.slot)}
                                                className="sr-only"
                                            />

                                            <span
                                                className={`relative h-4 w-7 rounded-full border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${slot.isFinished
                                                        ? "border-emerald-500/60 bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                                                        : "border-zinc-700 bg-zinc-900 shadow-none"
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${slot.isFinished
                                                            ? "left-[13px] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                                                            : "left-0.5 bg-zinc-500"
                                                        }`}
                                                />
                                            </span>
                                        </label>
                                    ) : (
                                        <span />
                                    )}

                                    {circuit && !slot.isOpen ? (
                                        <button
                                            type="button"
                                            onClick={() => removeCircuit(slot.slot)}
                                            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-black/30 text-sm font-black text-red-500 transition hover:border-red-500 hover:bg-red-600 hover:text-white"
                                            title="Excluir pista"
                                        >
                                            ×
                                        </button>
                                    ) : (
                                        <span />
                                    )}
                                </div>

                                {slot.isOpen ? (
                                    <div className="relative z-10 mt-6">
                                        <select
                                            ref={(el) => {
                                                selectRefs.current[index] = el;
                                            }}
                                            value={slot.circuitId}
                                            onChange={(e) => changeCircuit(slot.slot, e.target.value)}
                                            className={`w-full rounded-md border border-zinc-700 bg-[#05080c] px-3 py-3 text-sm outline-none transition focus:border-red-500 ${!slot.circuitId ? "text-zinc-500" : "text-white"
                                                }`}
                                        >
                                            <option value="" disabled hidden>
                                                Selecionar circuito
                                            </option>

                                            {availableCircuits
                                                .filter((circuitOption) => {
                                                    const alreadySelected = slots.some(
                                                        (otherSlot) =>
                                                            otherSlot.slot !== slot.slot &&
                                                            otherSlot.circuitId === circuitOption.id
                                                    );

                                                    return !alreadySelected;
                                                })
                                                .map((circuit) => (
                                                    <option
                                                        key={circuit.id}
                                                        value={circuit.id}
                                                        className="bg-[#05080c] text-white"
                                                    >
                                                        {circuit.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                ) : circuit ? (
                                    <div className="relative z-10 mt-4 flex h-[185px] flex-col justify-between">
                                        <button
                                            type="button"
                                            onClick={() => openSlot(slot.slot)}
                                            className="min-w-0 pr-7 text-left"
                                        >
                                            <div className="flex items-center gap-2">
                                                {flagUrl ? (
                                                    <img
                                                        src={flagUrl}
                                                        alt={`${circuit.location} flag`}
                                                        className="h-4 w-6 rounded-sm border border-zinc-700 object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-lg leading-none">
                                                        {circuit.flag}
                                                    </span>
                                                )}

                                                <p className="truncate text-sm font-black">
                                                    {circuit.name}
                                                </p>
                                            </div>

                                            <p className="mt-1 text-xs text-zinc-500">
                                                {circuit.location} •{" "}
                                                {dbCircuit?.date
                                                    ? dbCircuit.date.split("-").reverse().join("/")
                                                    : "-"}
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => openSlot(slot.slot)}
                                            className="flex flex-1 items-center justify-center"
                                        >
                                            <img
                                                src={circuit.track_image}
                                                alt={circuit.name}
                                                className="h-20 max-w-[150px] object-contain opacity-90 transition duration-300 group-hover:scale-110"
                                            />
                                        </button>

                                        <Link
                                            href={`/races/${circuit.id}/edit`}
                                            className="flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-black/30 px-3 py-2 text-xs font-black uppercase text-zinc-200 transition hover:border-red-600 hover:text-red-500"
                                        >
                                            ✎ Editar resultados
                                        </Link>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => openSlot(slot.slot)}
                                        className="absolute inset-0 z-10 flex items-center justify-center"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-gradient-to-br from-[#05080c] to-[#0d141d] shadow-[0_0_30px_rgba(0,0,0,0.45)] transition-all duration-300 group-hover:scale-110 group-hover:border-red-500 group-hover:shadow-[0_0_35px_rgba(220,38,38,0.25)]">
                                                <svg
                                                    className="h-7 w-7 text-zinc-400 group-hover:text-red-500"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M12 5v14M5 12h14"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </div>

                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition group-hover:text-red-500">
                                                adicionar pista
                                            </span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </section>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-md bg-red-600 px-8 py-3 text-sm font-black uppercase transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                </div>
            </div>
        </main>
    );
}