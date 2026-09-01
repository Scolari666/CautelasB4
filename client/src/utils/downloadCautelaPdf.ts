import { api } from "../api/client";

export async function downloadCautelaPdf(cautelaId: string) {
  const res = await api.get(`/cautelas/${cautelaId}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cautela-${cautelaId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
