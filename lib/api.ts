const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Foco {
  lat: number;
  lon: number;
  brightness: number;
  nivel: "CRITICO" | "ALERTA" | "MONITORANDO";
  cidade: string;
  dist_km: number;
  satelite: string;
  data: string;
  hora: string;
  frp: string;
  confidence: string;
  daynight: string;
}

export interface RespostaFocos {
  focos: Foco[];
  total: number;
  criticos: number;
  alertas: number;
  nivel_geral: "CRITICO" | "ALERTA" | "SEGURO";
  ultima_atualizacao: string;
}

export interface Drone {
  id: string;
  nome: string;
  base: string;
  lat_base: number;
  lon_base: number;
  status: "DISPONIVEL" | "EM_MISSAO" | "MANUTENCAO";
  bateria: number;
  missao_lat: number | null;
  missao_lon: number | null;
  missao_alvo: string | null;
}

export interface RespostaDrones {
  drones: Drone[];
  total: number;
  disponiveis: number;
  em_missao: number;
  manutencao: number;
}

export interface Deteccao {
  classe: string;
  confianca: number;
  nivel: "CRITICO" | "ALERTA" | "MONITORANDO";
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export interface RespostaAnalise {
  deteccoes: Deteccao[];
  total: number;
  nivel_geral: string;
  fonte: string;
}

export async function getFocos(force = false): Promise<RespostaFocos> {
  const res = await fetch(`${BASE}/api/focos${force ? "?force=true" : ""}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function getDrones(): Promise<RespostaDrones> {
  const res = await fetch(`${BASE}/api/drones`, { cache: "no-store" });
  return res.json();
}

export async function analisarImagem(file: File): Promise<RespostaAnalise> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/analisar`, { method: "POST", body: form });
  return res.json();
}

export function criarWebSocket(): WebSocket {
  const url = BASE.replace(/^http/, "ws");
  return new WebSocket(`${url}/ws/camera`);
}

export interface LeituraSensor {
  device_id: string;
  temperatura: number | null;
  umidade: number | null;
  fumaca: number;
  nivel: "NORMAL" | "ATENCAO" | "PERIGO";
  timestamp: string;
}

export interface RespostaSensores {
  leituras: LeituraSensor[];
  total: number;
}

export async function getSensores(): Promise<RespostaSensores> {
  const res = await fetch(`${BASE}/api/sensores`, { cache: "no-store" });
  return res.json();
}

export async function getUltimoSensor(): Promise<{ leitura: LeituraSensor | null }> {
  const res = await fetch(`${BASE}/api/sensores/ultimo`, { cache: "no-store" });
  return res.json();
}
