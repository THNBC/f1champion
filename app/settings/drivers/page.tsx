"use client";

import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

const teams = [
  {
    id: "redbull",
    name: "Oracle Red Bull Racing",
    country: "Austria",
    logo: "/logos/redbull.png",
    color: "#0845b4",
  },
  {
    id: "ferrari",
    name: "Scuderia Ferrari HP",
    country: "Italy",
    logo: "/logos/ferrari.png",
    color: "#dc0000",
  },
  {
    id: "mercedes",
    name: "Mercedes-AMG PETRONAS F1 Team",
    country: "Germany",
    logo: "/logos/mercedes.png",
    color: "#00d2be",
  },
  {
    id: "mclaren",
    name: "McLaren Formula 1 Team",
    country: "UK",
    logo: "/logos/mclaren.png",
    color: "#ff8700",
  },
  {
    id: "astonmartin",
    name: "Aston Martin Aramco F1 Team",
    country: "UK",
    logo: "/logos/aston.png",
    color: "#006f62",
  },
  {
    id: "alpine",
    name: "BWT Alpine F1 Team",
    country: "France",
    logo: "/logos/alpine.png",
    color: "#2293d1",
  },
  {
    id: "williams",
    name: "Williams Racing",
    country: "UK",
    logo: "/logos/williams.png",
    color: "#005aff",
  },
  {
    id: "rb",
    name: "Visa Cash App RB F1 Team",
    country: "Italy",
    logo: "/logos/rb.png",
    color: "#6692ff",
  },
  {
    id: "kicks sauber",
    name: "Stake F1 Team Kick Sauber",
    country: "Switzerland",
    logo: "/logos/sauber.png",
    color: "#52e252",
  },
  {
    id: "haas",
    name: "MoneyGram Haas F1 Team",
    country: "USA",
    logo: "/logos/haas.png",
    color: "#b6babd",
  },
];

const defaultPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

type DriverInput = {
  name: string;
  nationality: string;
};

type DriversByTeam = Record<string, DriverInput[]>;

function createEmptyData(): DriversByTeam {
  const initial: DriversByTeam = {};

  teams.forEach((team) => {
    initial[team.id] = [
      { name: "", nationality: "" },
      { name: "", nationality: "" },
    ];
  });

  return initial;
}

export default function SettingsDriversPage() {
  const [data, setData] = useState<DriversByTeam>(createEmptyData());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    async function loadDrivers() {
      setLoading(true);

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*");

      if (teamsError) {
        console.error(teamsError);
      }

      if (!teamsData || teamsData.length === 0) {
        await supabase.from("teams").upsert(teams);
      }

      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("*")
        .order("id", { ascending: true });

      if (driversError) {
        console.error(driversError);
        setLoading(false);
        return;
      }

      const initial = createEmptyData();

      driversData?.forEach((driver) => {
        const teamId = driver.team_id as string;
        const slot = driver.slot as number | null;

        if (!initial[teamId]) return;

        const index =
          typeof slot === "number"
            ? slot
            : initial[teamId].findIndex((d) => !d.name);

        if (index < 0 || index > 1) return;

        initial[teamId][index] = {
          name: driver.name ?? "",
          nationality: driver.nationality ?? "",
        };
      });

      setData(initial);
      setLoading(false);
    }

    loadDrivers();
  }, []);

  function handleChange(
    teamId: string,
    index: number,
    field: keyof DriverInput,
    value: string
  ) {
    setData((prev) => ({
      ...prev,
      [teamId]: prev[teamId].map((driver, driverIndex) =>
        driverIndex === index ? { ...driver, [field]: value } : driver
      ),
    }));
  }

  async function removeDriver(teamId: string, index: number) {
    try {
      const driverId = `${teamId}-${index + 1}`;

      // limpa awards
      await supabase
        .from("race_awards")
        .update({
          driver_of_the_day: null,
          most_overtakes: null,
          cleanest_driving: null,
        })
        .or(
          `driver_of_the_day.eq.${driverId},most_overtakes.eq.${driverId},cleanest_driving.eq.${driverId}`
        );

      // pega corridas afetadas
      const { data: affectedResults, error: affectedError } = await supabase
        .from("race_results")
        .select("race_id")
        .eq("driver_id", driverId);

      if (affectedError) throw affectedError;

      const raceIds = Array.from(
        new Set((affectedResults || []).map((r) => r.race_id))
      );

      // remove resultados do piloto
      await supabase.from("race_results").delete().eq("driver_id", driverId);

      // recalcula posições
      for (const raceId of raceIds) {
        const { data: results, error } = await supabase
          .from("race_results")
          .select("*")
          .eq("race_id", raceId)
          .order("position", { ascending: true });

        if (error) throw error;

        // limpa corrida
        await supabase.from("race_results").delete().eq("race_id", raceId);

        const updated = (results || []).map((r, i) => ({
          race_id: r.race_id,
          driver_id: r.driver_id,
          team_id: r.team_id,
          grid: r.grid,
          stops: r.stops,
          fastest_lap: r.fastest_lap,
          penalty: r.penalty,
          penalty_count: r.penalty_count,
          penalty_seconds: r.penalty_seconds,
          time_or_gap: r.time_or_gap,
          status: r.status,
          position: i + 1,
          points: defaultPoints[i] ?? 0,
        }));

        if (updated.length > 0) {
          const { error: insertError } = await supabase
            .from("race_results")
            .insert(updated);

          if (insertError) throw insertError;
        }
      }

      // remove piloto
      const { error: deleteError } = await supabase
        .from("drivers")
        .delete()
        .eq("id", driverId);

      if (deleteError) throw deleteError;

      // 🔥 IMPORTANTE: NÃO auto realoca
      setData((prev) => ({
        ...prev,
        [teamId]: prev[teamId].map((d, i) =>
          i === index ? { name: "", nationality: "" } : d
        ),
      }));
    } catch (err) {
      console.error("Erro ao remover piloto:", err);
      showToast("error", "Erro ao remover piloto");
    }
  }

  async function handleSave() {
    setSaving(true);

    try {
      await supabase.from("teams").upsert(teams);

      const inserts = Object.entries(data).flatMap(([teamId, drivers]) =>
        drivers
          .map((driver, index) => ({
            id: `${teamId}-${index + 1}`,
            name: driver.name.trim(),
            nationality: driver.nationality.trim(),
            team_id: teamId,
            slot: index,
          }))
          .filter((driver) => driver.name)
      );

      if (inserts.length > 0) {
        const { error } = await supabase
          .from("drivers")
          .upsert(inserts, { onConflict: "id" });

        if (error) throw error;
      }

      showToast("success", "Pilotos salvos com sucesso");
    } catch (err) {
      console.error("Erro ao salvar pilotos:", err);
      showToast("error", "Erro ao salvar pilotos");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
        Carregando pilotos...
      </main>
    );
  }

  return (
    <AdminGuard>
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
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3 text-sm font-black uppercase text-zinc-500">
              <Link href="/settings" className="text-red-500 hover:text-red-400">
                Settings
              </Link>
              <span>›</span>
              <span>Drivers</span>
            </div>

            <h1 className="text-4xl font-black">Configurar Pilotos</h1>

            <p className="mt-2 text-sm text-zinc-400">
              Preencha os pilotos e suas nacionalidades por equipe.
            </p>
          </div>

          <Link
            href="/settings"
            className="rounded-lg border border-red-700 px-6 py-3 text-xs font-black uppercase text-red-500 transition hover:bg-red-600 hover:text-white"
          >
            ← Voltar
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-5">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border border-zinc-800 bg-[#070a0e] p-5"
            >
              <div className="mb-6 flex items-center gap-3">
               <div className="h-9 w-9 overflow-hidden">
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <h2 className="flex-1 text-sm font-black leading-tight text-white">
                  {team.name}
                </h2>
              </div>

              {data[team.id]?.map((driver, index) => (
                <div key={index} className="relative mb-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Piloto {index + 1}
                    </label>

                    <button
                      type="button"
                      onClick={() => removeDriver(team.id, index)}
                      className="rounded-md border border-zinc-800 bg-black/40 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-red-500 transition hover:border-red-500 hover:bg-red-600 hover:text-white"
                    >
                      Remover
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Nome do piloto"
                    value={driver.name}
                    onChange={(e) =>
                      handleChange(team.id, index, "name", e.target.value)
                    }
                    className="mb-4 w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                  />

                  <label className="mb-2 block text-xs font-semibold text-zinc-300">
                    Nacionalidade
                  </label>

                  <input
                    type="text"
                    placeholder="Nacionalidade"
                    value={driver.nationality}
                    onChange={(e) =>
                      handleChange(team.id, index, "nationality", e.target.value)
                    }
                    className="w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

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
    </AdminGuard>
  );
}