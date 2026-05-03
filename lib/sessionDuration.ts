export type SessionDurationKey =
    | "rapida"
    | "muito_curta"
    | "curta"
    | "media"
    | "longa"
    | "completa";

/**
 * Converte o texto do UI (ex: "Média (35%)") para chave limpa ("media")
 */
export function mapSessionLabelToKey(value?: string): SessionDurationKey {
    const normalized = String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (normalized.includes("rapida")) return "rapida";
    if (normalized.includes("muito curta")) return "muito_curta";
    if (normalized.includes("curta")) return "curta";
    if (normalized.includes("media")) return "media";
    if (normalized.includes("longa")) return "longa";
    if (normalized.includes("completa")) return "completa";

    return "curta"; // fallback
}

/**
 * Calcula quantas voltas a corrida deve ter baseado na duração
 */
export function calculateSessionLaps(
    totalLaps: number,
    sessionDuration: SessionDurationKey | string
): number {
    const laps = Number(totalLaps || 0);

    if (sessionDuration === "rapida") return 3;
    if (sessionDuration === "muito_curta") return 5;
    if (sessionDuration === "curta") return Math.ceil(laps * 0.25);
    if (sessionDuration === "media") return Math.ceil(laps * 0.35);
    if (sessionDuration === "longa") return Math.ceil(laps * 0.5);
    if (sessionDuration === "completa") return laps;

    return Math.ceil(laps * 0.25);
}