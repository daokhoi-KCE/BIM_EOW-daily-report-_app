"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import type { Photo } from "@/lib/types";

export default function PhotoGrid({
  photos,
  onAdd,
  onRemove,
  onView,
}: {
  photos: Photo[];
  onAdd: (file: File) => Promise<void>;
  onRemove: (photo: Photo) => void;
  onView: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const f of files) {
      setUploading((n) => n + 1);
      try {
        await onAdd(f);
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Không tải được ảnh / Upload failed");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((p) => (
        <div
          key={p.id}
          className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-300 shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onView(p.url)}
            alt="evidence"
          />
          <button
            type="button"
            onClick={() => onRemove(p)}
            className="absolute top-0 right-0 bg-black/60 text-white rounded-bl-md w-5 h-5 flex items-center justify-center"
          >
            <X size={11} />
          </button>
        </div>
      ))}
      {uploading > 0 &&
        Array.from({ length: uploading }).map((_, i) => (
          <div
            key={`uploading-${i}`}
            className="w-16 h-16 rounded-md border border-slate-300 flex items-center justify-center bg-slate-100 shrink-0"
          >
            <Loader2 size={18} className="animate-spin text-slate-400" />
          </div>
        ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-16 h-16 rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 hover:border-amber-400 hover:text-amber-600"
      >
        <Camera size={17} />
        <span className="text-[8.5px] mt-0.5 font-semibold">thêm ảnh</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}
