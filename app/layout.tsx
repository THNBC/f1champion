import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "F1 Champion",
  description: "Sistema de campeonato F1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0a0a0a] text-white">
        <div className="flex">
          {/* Sidebar */}
         <div className="hidden md:block">
  <Sidebar />
</div>

          {/* Conteúdo */}
          <main className="w-full p-4 md:ml-[260px] md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}