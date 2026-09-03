import { api } from "../api/client";

export async function downloadAutoInfracaoPdf(autoId: string, numero: string) {
  const res = await api.get(`/autos-infracao/${autoId}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `anexo-a-${numero}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
