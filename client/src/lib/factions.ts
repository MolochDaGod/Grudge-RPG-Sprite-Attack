// Faction system — three allegiances with emblem art, colors, and lore
export type FactionId = "crusade" | "legion" | "fabled";

export interface FactionDef {
  id: FactionId;
  name: string;
  tagline: string;
  emblemSrc: string;      // path to emblem PNG in /fighter2d/image/factions/
  colorPrimary: string;   // CSS color for UI
  colorSecondary: string;
  borderColor: string;    // glow / border accent
}

export const FACTIONS: Record<FactionId, FactionDef> = {
  crusade: {
    id: "crusade",
    name: "Crusade",
    tagline: "Honor. Steel. Faith.",
    emblemSrc: "/fighter2d/image/factions/crusade.png",
    colorPrimary: "#3b82f6",   // blue
    colorSecondary: "#c0c0c0", // silver
    borderColor: "#60a5fa",
  },
  legion: {
    id: "legion",
    name: "Legion",
    tagline: "Blood. Power. Conquest.",
    emblemSrc: "/fighter2d/image/factions/legion.png",
    colorPrimary: "#dc2626",   // red
    colorSecondary: "#1a1a1a", // black
    borderColor: "#f87171",
  },
  fabled: {
    id: "fabled",
    name: "Fabled",
    tagline: "Nature. Spirit. Balance.",
    emblemSrc: "/fighter2d/image/factions/fabled.png",
    colorPrimary: "#16a34a",   // green
    colorSecondary: "#1a2e1a", // dark green
    borderColor: "#4ade80",
  },
};

export function getFaction(id: FactionId | undefined): FactionDef {
  return FACTIONS[id ?? "crusade"];
}

export const FACTION_IDS: FactionId[] = ["crusade", "legion", "fabled"];
