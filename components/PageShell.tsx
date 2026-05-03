type PageShellProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: React.ReactNode;
};

export default function PageShell({
  title,
  subtitle,
  eyebrow,
  children,
}: PageShellProps) {
  return (
    <section className="min-h-screen bg-[#020407] px-8 py-8 text-white">
      <div className="mx-auto max-w-[1680px]">
        {eyebrow && (
          <div className="mb-3 inline-block border-b-2 border-red-600 pb-2 text-sm font-bold uppercase tracking-wide text-red-500">
            {eyebrow}
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm text-zinc-400 md:text-base">
              {subtitle}
            </p>
          )}
        </header>

        {children}
      </div>
    </section>
  );
}