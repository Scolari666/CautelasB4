export const POA_ESTOQUE_NAME = "SMA POA";
export const CACHOEIRINHA_ESTOQUE_NAME = "SMA Cachoeirinha";
export const B4_ESTOQUE_NAME = "Almoxarifado B4";

export type Location = "POA" | "CACHOEIRINHA" | "B4";

export function estoqueLocation(estoqueName: string): Location | null {
  if (estoqueName === POA_ESTOQUE_NAME) return "POA";
  if (estoqueName === CACHOEIRINHA_ESTOQUE_NAME) return "CACHOEIRINHA";
  if (estoqueName === B4_ESTOQUE_NAME) return "B4";
  return null;
}

export function pelotaoLocation(pelotao: string | null | undefined): Location | null {
  if (pelotao === "Sargentos" || pelotao === "B4") return null;
  const match = /^(\d{1,2})º Pelotão$/.exec(pelotao ?? "");
  if (!match) return null;
  const n = Number(match[1]);
  if (n >= 1 && n <= 8) return "POA";
  if (n >= 9 && n <= 16) return "CACHOEIRINHA";
  return null;
}

export function userLocationAccess(pelotao: string | null | undefined, role: string): Set<Location> {
  if (role === "ADMIN" || pelotao === "Sargentos" || pelotao === "B4") {
    return new Set(["POA", "CACHOEIRINHA", "B4"]);
  }
  const loc = pelotaoLocation(pelotao);
  return loc ? new Set([loc]) : new Set();
}

export function canAccessEstoque(estoqueName: string, pelotao: string | null | undefined, role: string): boolean {
  const loc = estoqueLocation(estoqueName);
  if (loc === null) return true;
  return userLocationAccess(pelotao, role).has(loc);
}
