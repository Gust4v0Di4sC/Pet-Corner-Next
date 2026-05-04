import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type PetSectionHeaderActionProps = {
  isFormVisible: boolean;
  onToggleForm: () => void;
};

export function PetSectionHeaderAction({
  isFormVisible,
  onToggleForm,
}: PetSectionHeaderActionProps) {
  return (
    <Button
      type="button"
      onClick={onToggleForm}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-lg font-semibold text-[#fb8b24] transition hover:bg-[#fb8b24]/10"
    >
      <Plus className="h-4 w-4" />
      {isFormVisible ? "Fechar cadastro" : "Adicionar pet"}
    </Button>
  );
}
