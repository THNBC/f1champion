import Link from "next/link";
import { SlidersHorizontal, Users, Map } from "lucide-react";

function SettingsCard({
  href,
  icon,
  title,
  description,
  items,
  button,
  className = "",
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
  items: { icon: string; label: string }[];
  button: string;
  className?: string;
}) {
  const Icon = icon;

  return (
    <Link
      href={href}
      className={`group rounded-2xl border border-zinc-800 bg-[#080c11] p-8 shadow-[0_0_50px_rgba(0,0,0,0.35)] transition hover:border-red-600/70 hover:bg-[#0b1017] ${className}`}
    >
      <div className="mb-10 flex items-center gap-8">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center">
          <Icon
            size={70}
            className="text-zinc-500 transition group-hover:scale-110 group-hover:text-red-500 group-hover:drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
          />
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase">{title}</h2>
          <p className="mt-3 text-base text-zinc-400">{description}</p>
        </div>
      </div>

      <div className="space-y-0">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-8 border-b border-zinc-800/80 py-5 text-lg text-zinc-300"
          >
            <span className="w-8 text-3xl text-zinc-500">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-red-600 px-6 py-4 text-center text-sm font-black uppercase tracking-wide text-red-500 transition group-hover:bg-red-600 group-hover:text-white">
        {button}
      </div>
    </Link>
  );
}

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#020407] px-10 py-10 text-white">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-12">
          <p className="mb-6 inline-block border-b-2 border-red-600 pb-2 text-sm font-black uppercase tracking-wide text-red-500">
            Settings
          </p>

          <h1 className="text-5xl font-black tracking-tight">
            Configurações
          </h1>

          <p className="mt-5 text-lg text-zinc-400">
            Gerencie e mantenha todos os dados do campeonato atualizados.
          </p>
        </div>

        {/* GRID AJUSTADO */}
        <section className="grid grid-cols-1 gap-10 xl:grid-cols-2">
          <SettingsCard
            href="/settings/drivers"
            icon={Users}
            title="Pilotos"
            description="Gerencie os pilotos e suas informações."
            button="Gerenciar pilotos"
            items={[
              { icon: "+", label: "Adicionar piloto" },
              { icon: "✎", label: "Editar piloto" },
              { icon: "⌫", label: "Remover piloto" },
            ]}
          />

          <SettingsCard
            href="/settings/circuits"
            icon={Map}
            title="Circuitos"
            description="Gerencie os circuitos e suas informações."
            button="Gerenciar circuitos"
            items={[
              { icon: "+", label: "Adicionar circuito" },
              { icon: "✎", label: "Editar circuito" },
              { icon: "⌫", label: "Remover circuito" },
            ]}
          />

          {/* LOBBY FULL WIDTH */}
          <SettingsCard
            href="/settings/lobby"
            icon={SlidersHorizontal}
            className="xl:col-span-2"
            title="Lobby Config."
            description="Configure regras, assistências e simulação do lobby."
            button="Configurar lobby"
            items={[
              { icon: "›", label: "Opções do lobby e IA" },
              { icon: "›", label: "Restrições de assistência" },
              { icon: "›", label: "Fim de semana e clima" },
              { icon: "›", label: "Regras e bandeiras" },
              { icon: "›", label: "Simulação e colisões" },
            ]}
          />
        </section>
      </div>
    </main>
  );
}