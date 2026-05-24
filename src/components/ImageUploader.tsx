import { useState, useRef, type DragEvent as ReactDragEvent } from "react";

interface Props {
  onUpload: (dataUrl: string) => void;
  currentImage?: string;
}

export default function ImageUploader({ onUpload, currentImage }: Props) {
  const [preview, setPreview] = useState<string | null>(
    currentImage || null
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreview(url);
      onUpload(url);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: ReactDragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="封面预览"
            className="w-full h-48 object-cover bg-navy-100"
          />
          <div className="absolute inset-0 bg-black/30 md:bg-black/0 md:group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 md:opacity-0 md:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onUpload("");
              }}
              className="btn-danger text-xs py-1.5 px-3"
            >
              <i className="fa-regular fa-trash-can" />
              移除
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-secondary text-xs py-1.5 px-3 border-white text-white hover:bg-white hover:text-navy-900"
            >
              <i className="fa-regular fa-rotate" />
              更换
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full h-36 border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
            dragging
              ? "border-gold-500 bg-gold-50"
              : "border-ink-200 bg-ink-50 hover:border-ink-300"
          }`}
        >
          <i className="fa-regular fa-image text-2xl text-ink-300" />
          <span className="font-serif text-sm text-ink-400">
            点击或拖拽上传封面图
          </span>
          <span className="font-mono text-[10px] text-ink-300">
            PNG / JPG / WebP &middot; 最大 5MB
          </span>
        </button>
      )}
    </div>
  );
}
