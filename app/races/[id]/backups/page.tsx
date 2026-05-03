"use client";

import { supabase } from "@/lib/supabase";
import AdminGuard from "@/components/AdminGuard";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Image as ImageIcon, AlertTriangle } from "lucide-react";

type Backup = {
    id: string;
    race_id: string;
    file_url: string;
    file_path: string;
    type: string;
    created_at: string;
};

export default function RaceBackupsPage() {
    const params = useParams();
    const raceId = String(params.id);

    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [backupToDelete, setBackupToDelete] = useState<Backup | null>(null);
    const [deleting, setDeleting] = useState(false);

    async function loadBackups() {
        setLoading(true);

        const { data, error } = await supabase
            .from("race_backups")
            .select("*")
            .eq("race_id", raceId)
            .order("created_at", { ascending: false });

        if (!error) {
            setBackups(data || []);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadBackups();
    }, [raceId]);

    async function handleUpload(file: File | null) {
        if (!file) return;

        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

        if (!allowedTypes.includes(file.type)) {
            alert("Envie apenas imagens PNG, JPG ou WEBP.");
            return;
        }

        setUploading(true);

        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${raceId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("race-backups")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from("race-backups")
                .getPublicUrl(filePath);

            const { error: insertError } = await supabase
                .from("race_backups")
                .insert({
                    race_id: raceId,
                    file_url: publicUrlData.publicUrl,
                    file_path: filePath,
                    type: "image",
                });

            if (insertError) throw insertError;

            await loadBackups();
        } catch (error) {
            console.error(error);
            alert("Erro ao enviar backup.");
        } finally {
            setUploading(false);
        }
    }

    async function confirmDeleteBackup() {
        if (!backupToDelete) return;

        setDeleting(true);

        try {
            await supabase.storage
                .from("race-backups")
                .remove([backupToDelete.file_path]);

            const { error } = await supabase
                .from("race_backups")
                .delete()
                .eq("id", backupToDelete.id);

            if (error) throw error;

            setBackups((prev) =>
                prev.filter((item) => item.id !== backupToDelete.id)
            );

            setBackupToDelete(null);
        } catch (error) {
            console.error(error);
            alert("Erro ao deletar backup.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <AdminGuard>
            <main className="min-h-screen bg-[#020407] px-8 py-8 text-white">
                <div className="mx-auto max-w-[1400px]">
                    <div className="mb-8 flex items-start justify-between gap-6">
                        <div>
                            <div className="mb-4 flex items-center gap-3 text-sm font-black uppercase text-zinc-500">
                                <Link href="/settings" className="text-red-500 hover:text-red-400">
                                    Settings
                                </Link>
                                <span>›</span>
                                <Link
                                    href={`/races/${raceId}/edit`}
                                    className="text-red-500 hover:text-red-400"
                                >
                                    Editar corrida
                                </Link>
                                <span>›</span>
                                <span>Backups</span>
                            </div>

                            <h1 className="text-4xl font-black">Backups da Corrida</h1>

                            <p className="mt-2 text-zinc-400">
                                Envie prints dos resultados para comparar depois com o sistema.
                            </p>
                        </div>

                        <Link
                            href={`/races/${raceId}/edit`}
                            className="rounded-lg border border-red-700 px-6 py-3 text-xs font-black uppercase text-red-500 transition hover:bg-red-600 hover:text-white"
                        >
                            ← Voltar para edição
                        </Link>
                    </div>

                    <section className="mb-6 rounded-2xl border border-zinc-800 bg-[#070d13] p-6 shadow-[0_0_50px_rgba(0,0,0,0.35)]">
                        <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-black/20 px-6 py-8 text-center transition hover:border-red-600 hover:bg-red-600/5">
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                            />

                            <div className="text-zinc-400">
                                <ImageIcon size={32} />
                            </div>

                            <p className="mt-4 text-lg font-black">
                                {uploading ? "Enviando imagem..." : "Enviar backup"}
                            </p>

                            <p className="mt-2 text-sm text-zinc-400">PNG, JPG ou WEBP</p>
                        </label>
                    </section>

                    <section className="rounded-2xl border border-zinc-800 bg-[#070d13] p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-black">Imagens salvas</h2>

                            <span className="text-sm font-bold text-zinc-500">
                                {backups.length} backup(s)
                            </span>
                        </div>

                        {loading ? (
                            <p className="text-zinc-400">Carregando backups...</p>
                        ) : backups.length === 0 ? (
                            <div className="rounded-xl border border-zinc-800 bg-black/20 p-10 text-center">
                                <p className="text-lg font-black text-zinc-300">
                                    Nenhum backup enviado ainda.
                                </p>

                                <p className="mt-2 text-sm text-zinc-500">
                                    Envie um print do resultado geral ou dos cards finais.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {backups.map((backup) => (
                                    <div
                                        key={backup.id}
                                        className="group overflow-hidden rounded-xl border border-zinc-800 bg-black/30"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSelectedImage(backup.file_url)}
                                            className="block w-full overflow-hidden bg-black"
                                        >
                                            <img
                                                src={backup.file_url}
                                                alt="Backup da corrida"
                                                className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        </button>

                                        <div className="flex items-center justify-between gap-3 p-4">
                                            <div>
                                                <p className="text-xs font-black uppercase text-red-500">
                                                    Backup de imagem
                                                </p>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {new Date(backup.created_at).toLocaleString("pt-BR")}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setBackupToDelete(backup)}
                                                className="rounded-md border border-red-700 px-3 py-2 text-xs font-black uppercase text-red-500 transition hover:bg-red-600 hover:text-white"
                                            >
                                                Deletar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {selectedImage && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-6">
                        <button
                            type="button"
                            onClick={() => setSelectedImage(null)}
                            className="absolute right-6 top-6 rounded-lg border border-zinc-700 bg-black px-4 py-2 text-sm font-black uppercase text-white transition hover:border-red-600 hover:text-red-500"
                        >
                            Fechar
                        </button>

                        <a
                            href={selectedImage}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute left-6 top-6 rounded-lg border border-zinc-700 bg-black px-4 py-2 text-sm font-black uppercase text-zinc-300 transition hover:border-red-600 hover:bg-red-600 hover:text-white"
                        >
                            Abrir em nova aba
                        </a>

                        <img
                            src={selectedImage}
                            alt="Backup ampliado"
                            className="max-h-[90vh] max-w-[95vw] rounded-xl border border-zinc-700 object-contain shadow-2xl"
                        />
                    </div>
                )}

                {backupToDelete && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#070d13] p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-700 bg-red-600/10 text-red-500">
                                    <AlertTriangle size={22} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-white">
                                        Deletar backup
                                    </h2>
                                    <p className="text-xs font-bold uppercase text-zinc-500">
                                        Esta ação não pode ser desfeita
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm leading-relaxed text-zinc-400">
                                Tem certeza que deseja deletar este backup? A imagem será removida do
                                Storage e também da lista de backups da corrida.
                            </p>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={() => setBackupToDelete(null)}
                                    className="rounded-md border border-zinc-700 px-5 py-3 text-xs font-black uppercase text-zinc-300 transition hover:border-red-600 hover:text-red-500 disabled:opacity-60"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={confirmDeleteBackup}
                                    className="rounded-md bg-red-600 px-5 py-3 text-xs font-black uppercase text-white transition hover:bg-red-500 disabled:opacity-60"
                                >
                                    {deleting ? "Deletando..." : "Deletar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </AdminGuard>
    );
}