"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Trash2, Loader2 } from "lucide-react";

interface Props {
  currentUrl: string | null;
  userName: string;
}

export function AvatarUploader({ currentUrl, userName }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Solo se permiten imágenes", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Máximo 5 MB", variant: "destructive" });
      return;
    }

    setLoading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Error al subir", description: json.error, variant: "destructive" });
        setPreview(currentUrl);
        return;
      }
      setPreview(json.url);
      toast({ title: "Foto actualizada" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!preview) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast({ title: "Error", description: json.error, variant: "destructive" });
        return;
      }
      setPreview(null);
      toast({ title: "Foto eliminada" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0099F2] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        {loading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraRef.current?.click()}
            disabled={loading}
          >
            <Camera className="w-4 h-4 mr-2" />
            Hacer foto
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir desde dispositivo
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Quitar
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG o PNG, máximo 5 MB. En móvil, &quot;Hacer foto&quot; abre la cámara.
        </p>
      </div>
    </div>
  );
}
