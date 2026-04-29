import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import type { RecordFormConfig, RecordFormData } from "../../components/Records/record.types";
import { useToast } from "../useToast";

type InputAsyncEffect = (params: {
  name: string;
  value: string;
  currentData: RecordFormData;
  nextData: RecordFormData;
  isEditing: boolean;
}) => Promise<Partial<RecordFormData> | void> | Partial<RecordFormData> | void;

type Params<TRecord extends { id?: string }, TPayload> = {
  recordsById: Map<string, TRecord>;
  config: RecordFormConfig;
  getFormData: (record: TRecord) => RecordFormData;
  buildPayload: (formData: RecordFormData) => TPayload;
  onCreate: (payload: TPayload) => Promise<void>;
  onUpdate: (recordId: string, payload: TPayload) => Promise<void>;
  onInputAsyncEffect?: InputAsyncEffect;
  notifyAdminAction: (title: string, message: string) => void;
};

export function useRecordFormController<TRecord extends { id?: string }, TPayload>({
  recordsById,
  config,
  getFormData,
  buildPayload,
  onCreate,
  onUpdate,
  onInputAsyncEffect,
  notifyAdminAction,
}: Params<TRecord, TPayload>) {
  const toast = useToast();
  const latestInputEffectRequestRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [data, setData] = useState<RecordFormData>(() => ({ ...config.initialValues }));
  const isEditing = Boolean(activeRecordId);

  const fields = useMemo(
    () =>
      config.resolveFields
        ? config.resolveFields(data, { isEditing })
        : config.fields,
    [config, data, isEditing]
  );

  const content = {
    title: isEditing ? config.editTitle : config.createTitle,
    submitLabel: isEditing ? config.editSubmitLabel : config.createSubmitLabel,
    resetLabel: "Limpar campos",
  };

  const openCreate = () => {
    setActiveRecordId(null);
    setData({ ...config.initialValues });
    setIsOpen(true);
  };

  const close = () => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setActiveRecordId(null);
    setData({ ...config.initialValues });
  };

  const reset = () => {
    setData({ ...config.initialValues });
  };

  const openEdit = (recordId: string) => {
    const selectedRecord = recordsById.get(recordId);

    if (!selectedRecord) {
      toast.warning("Não foi possível localizar o registro.");
      return;
    }

    setActiveRecordId(recordId);
    setData(getFormData(selectedRecord));
    setIsOpen(true);
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const previousDataSnapshot = data;
    const nextDataSnapshot = config.mapInput
      ? config.mapInput({ name, value, currentData: data, isEditing })
      : { ...data, [name]: value };

    setData(nextDataSnapshot);

    if (!onInputAsyncEffect) {
      return;
    }

    const requestId = ++latestInputEffectRequestRef.current;

    void Promise.resolve(
      onInputAsyncEffect({
        name,
        value,
        currentData: previousDataSnapshot,
        nextData: nextDataSnapshot,
        isEditing,
      })
    ).then((patch) => {
      if (!patch || requestId !== latestInputEffectRequestRef.current) {
        return;
      }

      setData((currentData) => {
        const nextData = { ...currentData };

        Object.entries(patch).forEach(([fieldName, fieldValue]) => {
          if (typeof fieldValue === "string") {
            nextData[fieldName] = fieldValue;
          }
        });

        return nextData;
      });
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (
      fields.some(
        (field) =>
          !field.disabled &&
          field.required !== false &&
          !String(data[field.name] ?? "").trim()
      )
    ) {
      toast.warning("Preencha todos os campos antes de salvar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload(data);

      if (activeRecordId) {
        await onUpdate(activeRecordId, payload);
        toast.success(config.editSuccessMessage);
        notifyAdminAction(
          "Registro atualizado",
          `${config.entityLabel} ${String(data.name ?? "").trim() || activeRecordId} foi atualizado(a).`
        );
      } else {
        await onCreate(payload);
        toast.success(config.createSuccessMessage);
        notifyAdminAction(
          "Novo registro criado",
          `${config.entityLabel} ${String(data.name ?? "").trim() || "sem nome"} foi cadastrado(a).`
        );
      }

      setIsOpen(false);
      setActiveRecordId(null);
      setData({ ...config.initialValues });
    } catch (error) {
      toast.warning(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível salvar o registro agora."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    content,
    data,
    fields,
    isOpen,
    isSubmitting,
    openCreate,
    openEdit,
    close,
    reset,
    submit,
    handleInputChange,
  };
}
