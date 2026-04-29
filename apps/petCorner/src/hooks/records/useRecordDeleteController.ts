import { useState } from "react";

import { useToast } from "../useToast";

type Params<TRecord extends { id?: string }> = {
  recordsById: Map<string, TRecord>;
  recordItemsById: Map<string, string>;
  entityLabel: string;
  successMessage: string;
  onDelete: (recordId: string) => Promise<void>;
  notifyAdminAction: (title: string, message: string) => void;
};

export function useRecordDeleteController<TRecord extends { id?: string }>({
  recordsById,
  recordItemsById,
  entityLabel,
  successMessage,
  onDelete,
  notifyAdminAction,
}: Params<TRecord>) {
  const toast = useToast();
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null);
  const [pendingRecordId, setPendingRecordId] = useState<string | null>(null);
  const recordLabel = pendingRecordId
    ? recordItemsById.get(pendingRecordId) ?? entityLabel
    : "";

  const open = (recordId: string) => {
    if (!recordsById.has(recordId)) {
      toast.warning("Não foi possível localizar o registro.");
      return;
    }

    setPendingRecordId(recordId);
  };

  const close = () => {
    if (busyRecordId && busyRecordId === pendingRecordId) {
      return;
    }

    setPendingRecordId(null);
  };

  const confirm = async () => {
    if (!pendingRecordId) {
      return;
    }

    setBusyRecordId(pendingRecordId);

    try {
      await onDelete(pendingRecordId);
      toast.success(successMessage);
      notifyAdminAction(
        "Registro removido",
        `${entityLabel} ${recordLabel || pendingRecordId} foi removido(a).`
      );
      setPendingRecordId(null);
    } catch {
      toast.warning("Não foi possível excluir o registro agora.");
    } finally {
      setBusyRecordId(null);
    }
  };

  return {
    busyRecordId,
    isOpen: Boolean(pendingRecordId),
    isSubmitting: busyRecordId === pendingRecordId,
    recordLabel,
    open,
    close,
    confirm,
  };
}
