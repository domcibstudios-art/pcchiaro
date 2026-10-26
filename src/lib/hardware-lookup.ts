import fs from "node:fs";
import path from "node:path";

export interface CpuInfo {
  id: string;
  aliases: string[];
  canonicalName: string;
  vendor: string;
  family: string;
  realArchitecture: string;
  releaseYear: number;
  rebadgeYear: number | null;
  isRebadge: boolean;
  rebadgeNotes: string | null;
  win11Supported: number;
  cores: number;
  threads: number;
  igpuModel: string | null;
  category: "laptop" | "desktop_gaming" | "desktop_office" | "mini_pc";
  antiTrapWarning: string | null;
}

export interface GpuInfo {
  id: string;
  aliases: string[];
  canonicalName: string;
  vendor: string;
  type: "dedicated" | "integrated";
  realArchitecture: string;
  releaseYear: number;
  computeUnits: number;
  shaders: number;
  standardVramGb: number;
  memoryType: string;
  tier1080p: "non_adatto" | "limitato" | "idoneo";
  gamingVerdict: string;
  antiTrapWarning: string | null;
}

// Cache in memoria
let cachedCpus: CpuInfo[] | null = null;
let cachedGpus: GpuInfo[] | null = null;

function loadDatabases() {
  if (!cachedCpus) {
    const cpuPath = path.resolve(process.cwd(), "data", "hardware-db", "cpus.json");
    if (fs.existsSync(cpuPath)) {
      cachedCpus = JSON.parse(fs.readFileSync(cpuPath, "utf-8"));
    } else {
      cachedCpus = [];
    }
  }

  if (!cachedGpus) {
    const gpuPath = path.resolve(process.cwd(), "data", "hardware-db", "gpus.json");
    if (fs.existsSync(gpuPath)) {
      cachedGpus = JSON.parse(fs.readFileSync(gpuPath, "utf-8"));
    } else {
      cachedGpus = [];
    }
  }
}

/**
 * Normalizza il nome rimuovendo caratteri speciali, spazi extra e prefissi
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[™®]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Cerca un processore nel database storico hardware locale
 */
export function lookupCpu(rawName: string): CpuInfo | null {
  loadDatabases();
  if (!cachedCpus || cachedCpus.length === 0) return null;

  const normalized = normalizeName(rawName);

  // 1. Ricerca esatta per alias
  for (const cpu of cachedCpus) {
    for (const alias of cpu.aliases) {
      if (normalized.includes(normalizeName(alias))) {
        return cpu;
      }
    }
  }

  // 2. Ricerca per canonicalName
  for (const cpu of cachedCpus) {
    if (normalized.includes(normalizeName(cpu.canonicalName))) {
      return cpu;
    }
  }

  return null;
}

/**
 * Cerca una scheda video nel database storico hardware locale
 */
export function lookupGpu(rawName: string): GpuInfo | null {
  loadDatabases();
  if (!cachedGpus || cachedGpus.length === 0) return null;

  const normalized = normalizeName(rawName);

  // 1. Ricerca esatta per alias
  for (const gpu of cachedGpus) {
    for (const alias of gpu.aliases) {
      if (normalized.includes(normalizeName(alias))) {
        return gpu;
      }
    }
  }

  // 2. Ricerca per canonicalName
  for (const gpu of cachedGpus) {
    if (normalized.includes(normalizeName(gpu.canonicalName))) {
      return gpu;
    }
  }

  return null;
}
