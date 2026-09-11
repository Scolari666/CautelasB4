interface Props {
  label: string;
  value: number;
  tone: "green" | "amber" | "red";
}

const toneClasses: Record<Props["tone"], string> = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

export function StatusBadge({ label, value, tone }: Props) {
  const broken = value < 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        broken ? "bg-red-600 text-white" : toneClasses[tone]
      }`}
      title={broken ? "Valor inválido — use \"Corrigir estoque\" para consertar" : undefined}
    >
      {broken && "⚠ "}
      {label}: {value}
    </span>
  );
}
