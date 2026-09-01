interface Props {
  value: string | null | undefined;
  onChange: (dataUrl: string | null) => void;
}

export function PhotoInput({ value, onChange }: Props) {
  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {value ? (
          <img src={value} alt="Prévia" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">📷</div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="text-sm"
        />
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-left text-xs text-red-600">
            Remover foto
          </button>
        )}
      </div>
    </div>
  );
}
