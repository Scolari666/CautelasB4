import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../api/client";
import { Category, Estoque, Item } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { PhotoInput } from "../components/PhotoInput";
import { useAuth } from "../context/AuthContext";
import { useStockSocket } from "../hooks/useStockSocket";
import { downloadCautelaPdf } from "../utils/downloadCautelaPdf";

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const [showCautelar, setShowCautelar] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api.get<Item>(`/items/${id}`);
    setItem(res.data);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useStockSocket(load);

  async function handleDelete() {
    if (!item || !confirm(`Remover "${item.name}" dos materiais?`)) return;
    try {
      await api.delete(`/items/${item.id}`);
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível remover o item"));
    }
  }

  async function handleDevolver(cautelaId: string) {
    try {
      await api.post(`/cautelas/${cautelaId}/devolver`, {});
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível devolver"));
    }
  }

  if (!item) return <p className="text-slate-500">Carregando...</p>;

  const activeCautelas = item.cautelas?.filter((c) => c.status === "ATIVA") ?? [];
  const history = item.cautelas?.filter((c) => c.status === "DEVOLVIDA") ?? [];

  return (
    <div>
      <button onClick={() => navigate("/")} className="mb-4 text-sm text-brand-600">
        ← Voltar aos materiais
      </button>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {item.photo ? (
            <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl text-slate-300">📦</div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {item.category.name} · {item.estoque.name}
          </p>
          <h1 className="text-2xl font-bold text-slate-800">{item.name}</h1>
          {item.description && <p className="mt-1 text-slate-600">{item.description}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge label="Disponível" value={item.quantityAvailable} tone="green" />
            <StatusBadge label="Cautelado" value={item.quantityCheckedOut} tone="amber" />
            <StatusBadge label="F.A" value={item.quantityUnavailable} tone="red" />
            <StatusBadge label="Total" value={item.quantityTotal} tone="green" />
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setShowCautelar(true)}
              disabled={item.quantityAvailable <= 0}
              className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
            >
              Cautelar
            </button>
            {user?.role === "ADMIN" && (
              <>
                <button
                  onClick={() => setShowEdit(true)}
                  className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => setShowAdjust(true)}
                  className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Ajustar status
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  Remover
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-2 font-semibold text-slate-800">Cautelas ativas</h2>
        {activeCautelas.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma cautela ativa para este item.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {activeCautelas.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">
                    {c.user.name} {c.user.matricula ? `(${c.user.matricula})` : ""} — {c.quantity} un.
                  </p>
                  <p className="text-slate-500">
                    Desde {new Date(c.takenAt).toLocaleDateString("pt-BR")}
                    {c.purpose ? ` · ${c.purpose}` : ""}
                  </p>
                </div>
                {(user?.role === "ADMIN" || user?.id === c.userId) && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => downloadCautelaPdf(c.id)}
                      className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => handleDevolver(c.id)}
                      className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Devolver
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold text-slate-800">Histórico</h2>
          <ul className="flex flex-col gap-2">
            {history.map((c) => (
              <li key={c.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
                {c.user.name} cautelou {c.quantity} un. em {new Date(c.takenAt).toLocaleDateString("pt-BR")} e devolveu em{" "}
                {c.returnedAt ? new Date(c.returnedAt).toLocaleDateString("pt-BR") : "-"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {showCautelar && <CautelarModal item={item} onClose={() => setShowCautelar(false)} onDone={load} />}
      {showEdit && <EditItemModal item={item} onClose={() => setShowEdit(false)} onDone={load} />}
      {showAdjust && <AdjustModal item={item} onClose={() => setShowAdjust(false)} onDone={load} />}
    </div>
  );
}

function CautelarModal({ item, onClose, onDone }: { item: Item; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [retiradoPorNome, setRetiradoPorNome] = useState("");
  const [retiradoPorTelefone, setRetiradoPorTelefone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/cautelas", {
        itemId: item.id,
        quantity,
        purpose,
        expectedReturnAt: expectedReturnAt || undefined,
        retiradoPorNome: retiradoPorNome || undefined,
        retiradoPorTelefone: retiradoPorTelefone || undefined,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível cautelar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Cautelar "${item.name}"`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm text-slate-600">
          Quantidade (disponível: {item.quantityAvailable})
          <input
            type="number"
            min={1}
            max={item.quantityAvailable}
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-slate-600">
          Nome de quem retirou (opcional)
          <input
            value={retiradoPorNome}
            onChange={(e) => setRetiradoPorNome(e.target.value)}
            placeholder={user?.name ?? "Padrão: seu nome"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-slate-600">
          Telefone de quem retirou (opcional)
          <input
            value={retiradoPorTelefone}
            onChange={(e) => setRetiradoPorTelefone(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-slate-600">
          Finalidade (opcional)
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Ex: instrução de tiro"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-slate-600">
          Previsão de devolução (opcional)
          <input
            type="date"
            value={expectedReturnAt}
            onChange={(e) => setExpectedReturnAt(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Confirmar cautela"}
        </button>
      </form>
    </Modal>
  );
}

function EditItemModal({ item, onClose, onDone }: { item: Item; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [estoqueId, setEstoqueId] = useState(item.estoqueId);
  const [quantityTotal, setQuantityTotal] = useState(item.quantityTotal);
  const [photo, setPhoto] = useState<string | null>(item.photo ?? null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [estoques, setEstoques] = useState<Estoque[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Category[]>("/categories").then((res) => setCategories(res.data));
    api.get<Estoque[]>("/estoques").then((res) => setEstoques(res.data));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/items/${item.id}`, { name, description, categoryId, estoqueId, quantityTotal, photo });
      onDone();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar item" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <PhotoInput value={photo} onChange={setPhoto} />
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={estoqueId}
            onChange={(e) => setEstoqueId(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {estoques.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <label className="text-sm text-slate-600">
          Quantidade total (cautelado + F.A: {item.quantityCheckedOut + item.quantityUnavailable})
          <input
            type="number"
            min={item.quantityCheckedOut + item.quantityUnavailable}
            required
            value={quantityTotal}
            onChange={(e) => setQuantityTotal(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </Modal>
  );
}

function AdjustModal({ item, onClose, onDone }: { item: Item; onClose: () => void; onDone: () => void }) {
  const [to, setTo] = useState<"AVAILABLE" | "UNAVAILABLE">("UNAVAILABLE");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const max = to === "UNAVAILABLE" ? item.quantityAvailable : item.quantityUnavailable;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/items/${item.id}/adjust`, { to, quantity });
      onDone();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível ajustar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Ajustar status do item" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm text-slate-600">
          Mover para
          <select
            value={to}
            onChange={(e) => setTo(e.target.value as "AVAILABLE" | "UNAVAILABLE")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="UNAVAILABLE">F.A (indisponível — manutenção/dano)</option>
            <option value="AVAILABLE">Disponível (retorno de F.A)</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Quantidade (máx. {max})
          <input
            type="number"
            min={1}
            max={max}
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving || max <= 0}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Confirmar ajuste"}
        </button>
      </form>
    </Modal>
  );
}
