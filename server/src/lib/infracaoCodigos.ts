// Códigos válidos de infração do Anexo A (Art. 18, Decreto Estadual n.º 51.803/2014).
// Precisa ficar em sincronia com client/src/data/anexoAInfracoes.ts.
export const INFRACAO_CODIGOS = [
  "LEVE_A",
  "LEVE_B",
  "MEDIA_A",
  "MEDIA_B",
  "MEDIA_C",
  "MEDIA_D",
  "MEDIA_E",
  "MEDIA_F",
  "MEDIA_G",
  "MEDIA_H",
  "MEDIA_I",
  "MEDIA_J",
  "GRAVE_A",
  "GRAVE_B",
  "GRAVE_C",
  "GRAVE_D",
  "GRAVE_E",
  "GRAVE_F",
  "GRAVE_G",
  "GRAVE_H",
  "GRAVE_I",
  "GRAVE_J",
  "GRAVE_K",
  "GRAVE_L",
  "GRAVE_M",
  "GRAVE_N",
  "GRAVE_O",
  "GRAVE_P",
  "GRAVE_Q",
] as const;

const VALID = new Set<string>(INFRACAO_CODIGOS);

export function isInfracaoCodigo(code: string): boolean {
  return VALID.has(code);
}
