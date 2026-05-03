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
      <body className="bg-[#0a0a0a] text-white overflow-x-auto">
        <div className="flex min-w-[1400px]">
          <Sidebar />

          <main className="ml-[260px] w-full p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}