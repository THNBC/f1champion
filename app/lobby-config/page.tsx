"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

type TabId = "lobby" | "assists" | "weekend" | "rules" | "simulation";

type OptionRow = {
  label: string;
  type: "select" | "toggle" | "range" | "checkbox";
  value: string | boolean | number;
  options?: string[];
};

type SettingsData = Record<TabId, OptionRow[]>;

const initialSettings: SettingsData = {
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

function getValue(settings: SettingsData, tab: TabId, label: string) {
  return settings[tab].find((item) => item.label === label)?.value;
}

function formatValue(value: string | boolean | number | undefined) {
  if (value === undefined || value === null || value === "") return "-";

  if (typeof value === "boolean") {
    return value ? "Ligado" : "Desligado";
  }

  return String(value);
}

function SettingLine({
  label,
  value,
}: {
  label: string;
  value: string | boolean | number | undefined;
}) {
  return (
    <p className="text-[15px] leading-7 text-zinc-300">
      <span className="text-zinc-400">{label}: </span>
      <span className="font-black text-white">{formatValue(value)}</span>
    </p>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-black text-white">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

export default function LobbyConfigPage() {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [loading, setLoading] = useState(true);

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
        setSettings(data.settings as SettingsData);
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
        Carregando configurações do lobby...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex items-start justify-start gap-6">
          <div>
            <p className="mb-3 inline-block border-b-2 border-red-500 pb-2 text-sm font-black uppercase text-red-500">
              Configuração do Lobby
            </p>

            <h1 className="text-4xl font-black uppercase tracking-tight">
              Configurações do Lobby
            </h1>

            <p className="mt-3 text-sm text-zinc-400">
              Resumo das configurações oficiais da sessão do campeonato.
            </p>
          </div>


        </div>

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#070d13] p-8 shadow-[0_0_50px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute inset-0 opacity-40" />

          <div className="mb-8">
            <h2 className="text-2xl font-black text-white">
              Configurações do Jogo
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Configuração atual salva no painel administrativo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="space-y-8">
              <SettingsGroup title="Opções do Lobby">
                <SettingLine
                  label="Categoria do carro"
                  value={getValue(settings, "lobby", "Categoria do carro")}
                />

                <SettingLine
                  label="Configuração do carro"
                  value={getValue(settings, "lobby", "Configuração do carro")}
                />
              </SettingsGroup>

              <SettingsGroup title="Restrições de Assistência">
                <SettingLine
                  label="Assistência de direção"
                  value={getValue(settings, "assists", "Assistência de direção")}
                />

                <SettingLine
                  label="Assistência de frenagem"
                  value={getValue(settings, "assists", "Assistência de frenagem")}
                />

                <SettingLine
                  label="Freios ABS"
                  value={getValue(settings, "assists", "ABS")}
                />

                <SettingLine
                  label="Controle de tração"
                  value={getValue(settings, "assists", "Controle de tração")}
                />

                <SettingLine
                  label="Linha de corrida"
                  value={getValue(settings, "assists", "Linha de corrida")}
                />

                <SettingLine
                  label="Forçar câmera cockpit"
                  value={getValue(settings, "assists", "Forçar câmera cockpit")}
                />

                <SettingLine
                  label="Câmbio"
                  value={getValue(settings, "assists", "Câmbio")}
                />

                <SettingLine
                  label="Assistência de pit"
                  value={getValue(settings, "assists", "Assistência de pit")}
                />

                <SettingLine
                  label="Assistência de saída do pit"
                  value={getValue(settings, "assists", "Assistência de saída do pit")}
                />

                <SettingLine
                  label="Assistência ERS"
                  value={getValue(settings, "assists", "Assistência ERS")}
                />

                <SettingLine
                  label="Assistência DRS"
                  value={getValue(settings, "assists", "Assistência DRS")}
                />
              </SettingsGroup>

              <SettingsGroup title="Configurações de IA">
                <SettingLine
                  label="IA"
                  value={getValue(settings, "lobby", "IA")}
                />

                <SettingLine
                  label="Dificuldade da IA"
                  value={getValue(settings, "lobby", "Dificuldade da IA")}
                />
              </SettingsGroup>
            </div>

            <div className="space-y-24">
              <SettingsGroup title="Configurações de Simulação">
                <SettingLine
                  label="Performance igual dos carros"
                  value={getValue(settings, "simulation", "Performance igual dos carros")}
                />

                <SettingLine
                  label="Modo de recuperação"
                  value={getValue(settings, "simulation", "Modo de recuperação")}
                />

                <SettingLine
                  label="Tipo de superfície"
                  value={getValue(settings, "simulation", "Tipo de superfície")}
                />

                <SettingLine
                  label="Modo combustível baixo"
                  value={getValue(settings, "simulation", "Modo combustível baixo")}
                />

                <SettingLine
                  label="Tipo de largada"
                  value={getValue(settings, "simulation", "Largada")}
                />

                <SettingLine
                  label="Temperatura dos pneus"
                  value={getValue(settings, "simulation", "Temperatura dos pneus")}
                />

                <SettingLine
                  label="Simulação de pneu no pit"
                  value={getValue(settings, "simulation", "Simulação de pneu no pit")}
                />

                <SettingLine
                  label="Saída insegura do pit"
                  value={getValue(settings, "simulation", "Saída insegura do pit")}
                />

                <SettingLine
                  label="Dano do carro"
                  value={getValue(settings, "simulation", "Dano do carro")}
                />

                <SettingLine
                  label="Taxa de dano"
                  value={getValue(settings, "simulation", "Taxa de dano")}
                />
              </SettingsGroup>

              <SettingsGroup title="Estrutura do Fim de Semana">
                <SettingLine
                  label="Formato de treino"
                  value={getValue(settings, "weekend", "Formato de treino")}
                />

                <SettingLine
                  label="Formato da classificação"
                  value={getValue(settings, "weekend", "Formato da classificação")}
                />

                <SettingLine
                  label="Duração da sessão"
                  value={getValue(settings, "weekend", "Duração da sessão")}
                />

                <SettingLine
                  label="Grid de largada"
                  value={getValue(settings, "weekend", "Grid de largada")}
                />
              </SettingsGroup>
            </div>

            <div className="space-y-12">
              <SettingsGroup title="Regras e Bandeiras">
                <SettingLine
                  label="Regras e bandeiras"
                  value={getValue(settings, "rules", "Regras e bandeiras")}
                />

                <SettingLine
                  label="Rigor de corte de curva"
                  value={getValue(settings, "rules", "Rigor de corte de curva")}
                />

                <SettingLine
                  label="Parc Fermé"
                  value={getValue(settings, "rules", "Parc Fermé")}
                />

                <SettingLine
                  label="Experiência de pit stop"
                  value={getValue(settings, "rules", "Experiência de pit stop")}
                />

                <SettingLine
                  label="Safety Car"
                  value={getValue(settings, "rules", "Safety Car")}
                />

                <SettingLine
                  label="Experiência do Safety Car"
                  value={getValue(settings, "rules", "Experiência do Safety Car")}
                />

                <SettingLine
                  label="Volta de formação"
                  value={getValue(settings, "rules", "Volta de formação")}
                />

                <SettingLine
                  label="Experiência da volta de formação"
                  value={getValue(settings, "rules", "Experiência da volta de formação")}
                />

                <SettingLine
                  label="Bandeira vermelha"
                  value={getValue(settings, "rules", "Bandeira vermelha")}
                />

                <SettingLine
                  label="Afeta nível de licença"
                  value={getValue(settings, "rules", "Afeta licença")}
                />
              </SettingsGroup>

              <SettingsGroup title="Configurações de Colisão">
                <SettingLine
                  label="Colisões"
                  value={getValue(settings, "simulation", "Colisões")}
                />

                <SettingLine
                  label="Sem colisão na primeira volta"
                  value={getValue(settings, "simulation", "Apenas na primeira volta")}
                />

                <SettingLine
                  label="Proteção contra griefing"
                  value={getValue(settings, "simulation", "Proteção contra griefing")}
                />
              </SettingsGroup>

              <SettingsGroup title="Clima e Tempo">
                <SettingLine
                  label="Precisão da previsão"
                  value={getValue(settings, "weekend", "Precisão da previsão")}
                />
              </SettingsGroup>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}