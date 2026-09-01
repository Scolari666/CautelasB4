import { useState } from "react";

interface Props {
  value: string | null | undefined;
  onChange: (dataUrl: string | null) => void;
}

const MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.82;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.onerror = () => reject(new Error("Não foi possível ler a imagem"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

export function PhotoInput({ value, onChange }: Props) {
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const dataUrl = await resizeImage(file);
      onChange(dataUrl);
    } catch {
      setError("Não foi possível processar essa foto. Tente outra imagem.");
    }
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
        {error && <p className="text-xs text-red-600">{error}</p>}
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-left text-xs text-red-600">
            Remover foto
          </button>
        )}
      </div>
    </div>
  );
}
