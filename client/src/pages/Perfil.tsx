import { FormEvent, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { PhotoInput } from "../components/PhotoInput";

export function Perfil() {
  const { user, refreshUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSaved, setAvatarSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  if (!user) return null;

  async function handleAvatarChange(dataUrl: string | null) {
    setAvatarUrl(dataUrl);
    setAvatarSaving(true);
    setAvatarError("");
    setAvatarSaved(false);
    try {
      await api.patch("/users/me/avatar", { avatarUrl: dataUrl });
      await refreshUser();
      setAvatarSaved(true);
    } catch (err) {
      setAvatarError(apiErrorMessage(err, "Não foi possível salvar a foto"));
    } finally {
      setAvatarSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmação não corresponde à nova senha");
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch("/users/me/password", { currentPassword, newPassword });
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(apiErrorMessage(err, "Não foi possível alterar a senha"));
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Meu Perfil</h1>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Foto de perfil</h2>
        <PhotoInput value={avatarUrl} onChange={handleAvatarChange} />
        {avatarSaving && <p className="mt-2 text-xs text-slate-400">Salvando...</p>}
        {avatarSaved && !avatarSaving && <p className="mt-2 text-xs text-emerald-600">Foto atualizada.</p>}
        {avatarError && <p className="mt-2 text-xs text-red-600">{avatarError}</p>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Alterar senha</h2>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          <input
            required
            type="password"
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Nova senha (mín. 6 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordSaved && <p className="text-sm text-emerald-600">Senha alterada com sucesso.</p>}
          <button
            type="submit"
            disabled={passwordSaving}
            className="self-start rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {passwordSaving ? "Salvando..." : "Alterar senha"}
          </button>
        </form>
      </section>
    </div>
  );
}
