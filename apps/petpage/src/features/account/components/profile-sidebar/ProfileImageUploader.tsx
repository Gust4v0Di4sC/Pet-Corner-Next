import type { ChangeEventHandler } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileImageUploaderProps = {
  accept: string;
  isUploading: boolean;
  onProfileImageSelected: ChangeEventHandler<HTMLInputElement>;
};

export function ProfileImageUploader({
  accept,
  isUploading,
  onProfileImageSelected,
}: ProfileImageUploaderProps) {
  return (
    <Label className="mt-2 block">
      <span className="sr-only">Enviar foto de perfil</span>
      <Input
        type="file"
        accept={accept}
        onChange={onProfileImageSelected}
        disabled={isUploading}
        className="hidden"
      />
      <span className="inline-flex cursor-pointer rounded-full border border-slate-600 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-[#fb8b24] hover:text-[#fb8b24]">
        {isUploading ? "Enviando..." : "Alterar foto"}
      </span>
    </Label>
  );
}
