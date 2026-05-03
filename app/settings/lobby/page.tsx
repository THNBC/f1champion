"use client";

import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { mapSessionLabelToKey } from "@/lib/sessionDuration";
import {
    Car,
    ChevronRight,
    Flag,
    SlidersHorizontal,
    Timer,
    Wrench,
} from "lucide-react";

type TabId = "lobby" | "assists" | "weekend" | "rules" | "simulation";

type OptionRow = {
    label: string;
    type: "select" | "toggle" | "range" | "checkbox";
    value: string | boolean | number;
    options?: string[];
};

const tabs: {
    id: TabId;
    label: string;
    icon: any;
    description: string;
}[] = [
        {
            id: "lobby",
            label: "Opções do lobby",
            icon: SlidersHorizontal,
            description: "Contém as opções principais da sessão.",
        },
        {
            id: "assists",
            label: "Restrições de assistência",
            icon: Wrench,
            description: "Define quais assistências estarão disponíveis.",
        },
        {
            id: "weekend",
            label: "Estrutura do fim de semana",
            icon: Timer,
            description: "Configura treino, classificação, corrida e previsão.",
        },
        {
            id: "rules",
            label: "Regras e bandeiras",
            icon: Flag,
            description: "Controla regras, bandeiras, safety car e punições.",
        },
        {
            id: "simulation",
            label: "Configurações de simulação",
            icon: Car,
            description: "Ajusta realismo, dano, pneus e colisões.",
        },
    ];

const initialSettings: Record<TabId, OptionRow[]> = {
    lobby: [
        {
            label: "Categoria do carro",
            type: "select",
            value: "Oficial",
            options: ["Oficial", "World Car"],
        },
        {
            label: "Configuração do carro",
            type: "select",
            value: "Completa",
            options: ["Completa", "Apenas pré-definido", "Fixa"],
        },
        {
            label: "IA",
            type: "toggle",
            value: false,
        },
        {
            label: "Dificuldade da IA",
            type: "range",
            value: 71,
        },
    ],

    assists: [
        {
            label: "Aplicar para todos",
            type: "checkbox",
            value: true,
        },
        {
            label: "Assistências",
            type: "select",
            value: "Amador",
            options: [
                "Iniciante",
                "Amador",
                "Experiente",
                "Profissional",
                "Elite",
                "Personalizado",
            ],
        },
        {
            label: "Assistência de direção",
            type: "select",
            value: "Desligado",
            options: ["Ligado", "Desligado"],
        },
        {
            label: "Assistência de frenagem",
            type: "select",
            value: "Médio",
            options: ["Alto", "Médio", "Baixo", "Desligado"],
        },
        {
            label: "ABS",
            type: "select",
            value: "Ligado",
            options: ["Ligado", "Desligado"],
        },
        {
            label: "Controle de tração",
            type: "select",
            value: "Completo",
            options: ["Completo", "Médio", "Desligado"],
        },
        {
            label: "Linha de corrida",
            type: "select",
            value: "Completa",
            options: ["Completa", "Apenas curvas", "Desligado"],
        },
        {
            label: "Forçar câmera cockpit",
            type: "select",
            value: "Desligado",
            options: ["Ligado", "Desligado"],
        },
        {
            label: "Câmbio",
            type: "select",
            value: "Automático",
            options: ["Automático", "Manual com sugestão", "Manual"],
        },
        {
            label: "Assistência de pit",
            type: "select",
            value: "Ligado",
            options: ["Ligado", "Desligado"],
        },
        {
            label: "Assistência de saída do pit",
            type: "select",
            value: "Ligado",
            options: ["Ligado", "Desligado"],
        },
        {
            label: "Assistência ERS",
            type: "select",
            value: "Ligado",
            options: ["Ligado", "Desligado"],
        },
        {
            label: "Assistência DRS",
            type: "select",
            value: "Ligado",
            options: ["Ligado", "Desligado"],
        },
    ],

    weekend: [
        {
            label: "Formato de treino",
            type: "select",
            value: "Desligado",
            options: ["Desligado", "Sessão única"],
        },
        {
            label: "Formato da classificação",
            type: "select",
            value: "Curta",
            options: ["Nenhuma", "Volta única", "Curta", "Completa"],
        },
        {
            label: "Duração da sessão",
            type: "select",
            value: "Curta (25%)",
            options: [
                "Rápida (3 voltas)",
                "Muito curta (5 voltas)",
                "Curta (25%)",
                "Média (35%)",
                "Longa (50%)",
                "Completa (100%)",
            ],
        },
        {
            label: "Grid de largada",
            type: "select",
            value: "Realista",
            options: ["Classificação", "Realista", "Invertido", "Aleatório"],
        },
        {
            label: "Precisão da previsão",
            type: "select",
            value: "Perfeita",
            options: ["Perfeita", "Aproximada"],
        },
    ],

    rules: [
        {
            label: "Regras e bandeiras",
            type: "select",
            value: "Ligado",
            options: ["Desligado", "Apenas corte de curva", "Ligado"],
        },
        {
            label: "Rigor de corte de curva",
            type: "select",
            value: "Regular",
            options: ["Regular", "Rígido"],
        },
        {
            label: "Parc Fermé",
            type: "toggle",
            value: true,
        },
        {
            label: "Experiência de pit stop",
            type: "select",
            value: "Transmissão",
            options: ["Transmissão", "Imersivo"],
        },
        {
            label: "Safety Car",
            type: "select",
            value: "Desligado",
            options: ["Desligado", "Reduzido", "Padrão", "Aumentado"],
        },
        {
            label: "Experiência do Safety Car",
            type: "select",
            value: "Transmissão",
            options: ["Transmissão", "Imersivo"],
        },
        {
            label: "Volta de formação",
            type: "toggle",
            value: false,
        },
        {
            label: "Experiência da volta de formação",
            type: "select",
            value: "Transmissão",
            options: ["Transmissão", "Imersivo"],
        },
        {
            label: "Bandeira vermelha",
            type: "select",
            value: "Padrão",
            options: ["Desligado", "Reduzido", "Padrão", "Aumentado"],
        },
        {
            label: "Afeta licença",
            type: "toggle",
            value: true,
        },
    ],

    simulation: [
        {
            label: "Performance igual dos carros",
            type: "select",
            value: "Ligado",
            options: ["Desligado", "Ligado"],
        },
        {
            label: "Modo de recuperação",
            type: "select",
            value: "Nenhum",
            options: ["Nenhum", "Automático"],
        },
        {
            label: "Tipo de superfície",
            type: "select",
            value: "Realista",
            options: ["Simplificado", "Realista"],
        },
        {
            label: "Modo combustível baixo",
            type: "select",
            value: "Fácil",
            options: ["Fácil", "Difícil"],
        },
        {
            label: "Largada",
            type: "select",
            value: "Manual",
            options: ["Manual", "Assistida"],
        },
        {
            label: "Temperatura dos pneus",
            type: "select",
            value: "Superfície e carcaça",
            options: ["Apenas superfície", "Superfície e carcaça"],
        },
        {
            label: "Simulação de pneu no pit",
            type: "toggle",
            value: true,
        },
        {
            label: "Saída insegura do pit",
            type: "toggle",
            value: false,
        },
        {
            label: "Dano do carro",
            type: "select",
            value: "Reduzido",
            options: ["Desligado", "Reduzido", "Padrão", "Simulação"],
        },
        {
            label: "Taxa de dano",
            type: "select",
            value: "Reduzido",
            options: ["Reduzido", "Padrão", "Simulação"],
        },
        {
            label: "Colisões",
            type: "select",
            value: "Ligado",
            options: ["Ligado", "Desligado", "Sem colisão entre jogadores"],
        },
        {
            label: "Apenas na primeira volta",
            type: "toggle",
            value: false,
        },
        {
            label: "Proteção contra griefing",
            type: "toggle",
            value: true,
        },
    ],
};

function Toast({
    type,
    message,
    onClose,
}: {
    type: "success" | "error";
    message: string;
    onClose: () => void;
}) {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const leaveTimer = setTimeout(() => {
            setIsLeaving(true);
        }, 2700);

        const closeTimer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => {
            clearTimeout(leaveTimer);
            clearTimeout(closeTimer);
        };
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-10 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isLeaving
                ? "translate-y-4 scale-95 opacity-0 blur-[2px]"
                : "translate-y-0 scale-100 opacity-100 blur-0"
                }`}
        >
            <div
                className={`animate-toast-in rounded-xl border px-6 py-4 shadow-2xl backdrop-blur-md ${type === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-emerald-950/30"
                    : "border-red-500/40 bg-red-500/10 text-red-400 shadow-red-950/30"
                    }`}
            >
                <p className="text-center text-xs font-black uppercase tracking-wide">
                    {type === "success" ? "Sucesso" : "Erro"}
                </p>

                <p className="mt-1 text-center text-sm font-bold text-white">
                    {message}
                </p>
            </div>

            <style jsx>{`
        @keyframes toastIn {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-toast-in {
          animation: toastIn 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
        </div>
    );
}

function SelectControl({
    value,
    options = [],
    disabled,
    onChange,
}: {
    value: string;
    options?: string[];
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <select
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={`h-9 w-full rounded-md border px-4 text-sm font-medium outline-none transition [color-scheme:dark] ${disabled
                ? "cursor-not-allowed border-zinc-700 bg-zinc-900/70 text-zinc-600"
                : "border-zinc-700 bg-black/60 text-white focus:border-red-500"
                }`}
        >
            {options.map((option) => (
                <option key={option} value={option} className="bg-[#05080d] text-white">
                    {option}
                </option>
            ))}
        </select>
    );
}

function ToggleControl({
    value,
    disabled,
    onChange,
}: {
    value: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!value)}
            className={`flex items-center gap-3 text-sm font-bold italic ${disabled ? "cursor-not-allowed text-zinc-600" : "text-zinc-300"
                }`}
        >
            <span>{disabled ? "Desativado" : value ? "Ligado" : "Desligado"}</span>

            <span
                className={`relative h-4 w-9 rounded-full transition ${disabled ? "bg-zinc-800" : value ? "bg-red-500/40" : "bg-zinc-600"
                    }`}
            >
                <span
                    className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition ${value ? "left-[18px] bg-red-500" : "left-0 bg-white"
                        } ${disabled ? "bg-zinc-600" : ""}`}
                />
            </span>
        </button>
    );
}

function CheckboxControl({
    value,
    onChange,
}: {
    value: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-zinc-300">
            <span
                className={`flex h-4 w-4 items-center justify-center rounded-sm border ${value
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-zinc-700 bg-black/60 text-transparent"
                    }`}
            >
                ✓
            </span>

            <input
                type="checkbox"
                checked={value}
                onChange={() => onChange(!value)}
                className="sr-only"
            />

            <span>{value ? "Ligado" : "Desligado"}</span>
        </label>
    );
}

function RangeControl({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="w-full">
            <input
                type="range"
                min={0}
                max={110}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-red-500"
            />

            <p className="mt-1 text-center text-sm font-bold text-zinc-500">
                {value}
            </p>
        </div>
    );
}

export default function LobbyConfigPage() {
    const [activeTab, setActiveTab] = useState<TabId>("lobby");
    const [settings, setSettings] =
        useState<Record<TabId, OptionRow[]>>(initialSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const closeToast = useCallback(() => {
        setToast(null);
    }, []);

    function showToast(type: "success" | "error", message: string) {
        setToast({ type, message });
    }

    const active = tabs.find((tab) => tab.id === activeTab)!;
    const ActiveIcon = active.icon;

    useEffect(() => {
        async function loadSettings() {
            setLoading(true);

            const { data, error } = await supabase
                .from("lobby_settings")
                .select("settings")
                .eq("id", "default")
                .maybeSingle();

            if (error) {
                console.error("Erro ao carregar configurações do lobby:", error);
                setLoading(false);
                return;
            }

            if (data?.settings) {
                setSettings(data.settings as Record<TabId, OptionRow[]>);
            }

            setLoading(false);
        }

        loadSettings();
    }, []);

    function getRowValue(tab: TabId, label: string) {
        return settings[tab].find((row) => row.label === label)?.value;
    }

    function isDisabled(row: OptionRow, tab: TabId) {
        if (tab === "assists" && row.label === "Assistência de saída do pit") {
            return getRowValue("assists", "Assistência de pit") !== "Ligado";
        }

        if (tab === "rules" && row.label === "Experiência do Safety Car") {
            return getRowValue("rules", "Safety Car") === "Desligado";
        }

        if (tab === "rules" && row.label === "Experiência da volta de formação") {
            return getRowValue("rules", "Volta de formação") !== true;
        }

        if (tab === "simulation" && row.label === "Apenas na primeira volta") {
            const collisions = getRowValue("simulation", "Colisões");

            return !(
                collisions === "Desligado" ||
                collisions === "Sem colisão entre jogadores"
            );
        }

        return false;
    }

    function updateRow(index: number, value: string | boolean | number) {
        setSettings((prev) => ({
            ...prev,
            [activeTab]: prev[activeTab].map((row, rowIndex) => {
                if (rowIndex !== index) return row;

                return {
                    ...row,
                    value,
                };
            }),
        }));
    }

    async function handleSave() {
        setSaving(true);

        const sessionDurationLabel = settings.weekend.find(
            (row) => row.label === "Duração da sessão"
        )?.value;

        const sessionDuration = mapSessionLabelToKey(String(sessionDurationLabel));

        const { error } = await supabase.from("lobby_settings").upsert({
            id: "default",
            settings,
            session_duration: sessionDuration,
            updated_at: new Date().toISOString(),
        });

        if (error) {
            console.error("Erro ao salvar configurações do lobby:", error);
            showToast("error", "Erro ao salvar configurações do lobby");
        } else {
            showToast("success", "Configurações do lobby salvas com sucesso");
        }

        setSaving(false);
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                Carregando configurações do lobby...
            </main>
        );
    }

    return (
        <AdminGuard>
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                {toast && (
                    <Toast type={toast.type} message={toast.message} onClose={closeToast} />
                )}

                <div className="mx-auto max-w-[1600px]">
                    <div className="mb-8 flex items-start justify-between gap-6">
                        <div>
                            <p className="mb-3 inline-block border-b-2 border-red-500 pb-2 text-sm font-black uppercase text-red-500">
                                Lobby Config.
                            </p>

                            <h1 className="text-4xl font-black uppercase tracking-tight">
                                Configuração do Lobby
                            </h1>

                            <p className="mt-3 text-sm text-zinc-400">
                                Ajuste as opções principais da sessão do campeonato.
                            </p>
                        </div>

                        <Link
                            href="/settings"
                            className="rounded-lg border border-red-600 px-5 py-3 text-xs font-black uppercase text-red-500 transition hover:bg-red-600 hover:text-white"
                        >
                            ← Voltar
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[500px_1fr]">
                        <aside className="space-y-2">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`group flex h-[52px] w-full items-center justify-between rounded-lg px-5 text-left text-sm font-black uppercase tracking-wide transition ${isActive
                                            ? "bg-zinc-200 text-black"
                                            : "bg-[#070d13] text-red-500 hover:bg-[#0b1017]"
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <Icon
                                                size={18}
                                                className={isActive ? "text-black" : "text-red-500"}
                                            />
                                            {tab.label}
                                        </span>

                                        <ChevronRight
                                            size={30}
                                            strokeWidth={4}
                                            className={isActive ? "text-black" : "text-red-500"}
                                        />
                                    </button>
                                );
                            })}
                        </aside>

                        <section className="min-h-[470px] rounded-xl border border-zinc-800 bg-[#070d13] p-8">
                            <div className="mb-8 flex items-start gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                                    <ActiveIcon size={22} className="text-red-500" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-black">{active.description}</h2>
                                    <p className="mt-2 text-sm text-zinc-400">{active.label}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {settings[activeTab].map((row, index) => {
                                    const disabled = isDisabled(row, activeTab);

                                    return (
                                        <div
                                            key={`${activeTab}-${row.label}`}
                                            className={`grid grid-cols-1 items-center gap-4 border-b border-zinc-800 py-2 last:border-b-0 lg:grid-cols-[470px_1fr] ${disabled ? "opacity-45" : ""
                                                }`}
                                        >
                                            <label className="text-sm font-bold">{row.label}:</label>

                                            <div className="flex justify-end">
                                                {row.type === "select" && (
                                                    <SelectControl
                                                        value={String(row.value)}
                                                        options={row.options}
                                                        disabled={disabled}
                                                        onChange={(value) => updateRow(index, value)}
                                                    />
                                                )}

                                                {row.type === "toggle" && (
                                                    <ToggleControl
                                                        value={Boolean(row.value)}
                                                        disabled={disabled}
                                                        onChange={(value) => updateRow(index, value)}
                                                    />
                                                )}

                                                {row.type === "checkbox" && (
                                                    <CheckboxControl
                                                        value={Boolean(row.value)}
                                                        onChange={(value) => updateRow(index, value)}
                                                    />
                                                )}

                                                {row.type === "range" && (
                                                    <RangeControl
                                                        value={Number(row.value)}
                                                        onChange={(value) => updateRow(index, value)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <div className="mt-7 flex justify-center">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-lg bg-red-600 px-8 py-3 text-sm font-black uppercase transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Salvando..." : "Salvar alterações"}
                        </button>
                    </div>
                </div>
            </main>
        </AdminGuard>
    );

}