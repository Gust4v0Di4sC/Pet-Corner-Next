import { Button } from "@/components/ui/button";

type ProfileSidebarBackdropProps = {
  isVisible: boolean;
  onClose: () => void;
};

export function ProfileSidebarBackdrop({
  isVisible,
  onClose,
}: ProfileSidebarBackdropProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={onClose}
      aria-label="Fechar menu lateral"
      className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
    />
  );
}
