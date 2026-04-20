import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import RecordDeleteModal from "./RecordDeleteModal";
import { useToast } from "../../hooks/useToast";
import RecordFormModal from "./RecordFormModal";
import RecordList from "./RecordList";
import type { RecordFormConfig, RecordFormData, RecordListGroup } from "./record.types";
import "./records.css";

type Props<TRecord extends { id?: string }, TPayload> = {
  listGroup: RecordListGroup;
  records: TRecord[];
  formConfig: RecordFormConfig;
  isLoading: boolean;
  listPageSize?: number;
  backRoute: string;
  backLabel?: string;
  showBackButton?: boolean;
  addAriaLabel: string;
  getFormData: (record: TRecord) => RecordFormData;
  buildPayload: (formData: RecordFormData) => TPayload;
  onCreate: (payload: TPayload) => Promise<void>;
  onUpdate: (recordId: string, payload: TPayload) => Promise<void>;
  onDelete: (recordId: string) => Promise<void>;
  onFileUpload?: (params: {
    fieldName: string;
    file: File;
    currentValue: string;
  }) => Promise<string>;
  onInputAsyncEffect?: (params: {
    name: string;
    value: string;
    currentData: RecordFormData;
    nextData: RecordFormData;
    isEditing: boolean;
  }) => Promise<Partial<RecordFormData> | void> | Partial<RecordFormData> | void;
};

export default function RecordManagementView<TRecord extends { id?: string }, TPayload>({
  listGroup,
  records,
  formConfig,
  isLoading,
  listPageSize,
  backRoute,
  backLabel = "Voltar ao dashboard",
  showBackButton = true,
  addAriaLabel,
  getFormData,
  buildPayload,
  onCreate,
  onUpdate,
  onDelete,
  onFileUpload,
  onInputAsyncEffect,
}: Props<TRecord, TPayload>) {
  const navigate = useNavigate();
  const toast = useToast();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null);
  const [pendingDeleteRecordId, setPendingDeleteRecordId] = useState<string | null>(null);
  const latestInputEffectRequestRef = useRef(0);
  const [formData, setFormData] = useState<RecordFormData>(() => ({
    ...formConfig.initialValues,
  }));
  const isEditing = Boolean(activeRecordId);
  const modalTitle = isEditing ? formConfig.editTitle : formConfig.createTitle;
  const modalSubmitLabel = isEditing
    ? formConfig.editSubmitLabel
    : formConfig.createSubmitLabel;

  const recordsById = useMemo(() => {
    const nextMap = new Map<string, TRecord>();

    records.forEach((record) => {
      if (typeof record.id === "string" && record.id) {
        nextMap.set(record.id, record);
      }
    });

    return nextMap;
  }, [records]);

  const recordItemsById = useMemo(() => {
    return new Map(listGroup.items.map((item) => [item.id, item.title]));
  }, [listGroup.items]);
  const resolvedFields = useMemo(
    () =>
      formConfig.resolveFields
        ? formConfig.resolveFields(formData, { isEditing })
        : formConfig.fields,
    [formConfig, formData, isEditing]
  );
  const pendingDeleteRecordLabel = pendingDeleteRecordId
    ? recordItemsById.get(pendingDeleteRecordId) ?? formConfig.entityLabel
    : "";

  const openCreateModal = () => {
    setActiveRecordId(null);
    setFormData({ ...formConfig.initialValues });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setActiveRecordId(null);
    setFormData({ ...formConfig.initialValues });
  };

  const handleResetFormFields = () => {
    setFormData({ ...formConfig.initialValues });
  };

  const closeDeleteModal = () => {
    if (busyRecordId && busyRecordId === pendingDeleteRecordId) {
      return;
    }

    setPendingDeleteRecordId(null);
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const previousDataSnapshot = formData;
    const nextDataSnapshot = formConfig.mapInput
      ? formConfig.mapInput({ name, value, currentData: formData, isEditing })
      : { ...formData, [name]: value };

    setFormData(nextDataSnapshot);

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

      setFormData((currentData) => {
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

  const handleEditRecord = (recordId: string) => {
    const selectedRecord = recordsById.get(recordId);

    if (!selectedRecord) {
      toast.warning("Não foi possível localizar o registro.");
      return;
    }

    setActiveRecordId(recordId);
    setFormData(getFormData(selectedRecord));
    setIsFormModalOpen(true);
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!recordsById.has(recordId)) {
      toast.warning("Não foi possível localizar o registro.");
      return;
    }

    setPendingDeleteRecordId(recordId);
  };

  const handleConfirmDeleteRecord = async () => {
    if (!pendingDeleteRecordId) {
      return;
    }

    setBusyRecordId(pendingDeleteRecordId);

    try {
      await onDelete(pendingDeleteRecordId);
      toast.success(formConfig.deleteSuccessMessage);
      setPendingDeleteRecordId(null);
    } catch {
      toast.warning("Não foi possível excluir o registro agora.");
    } finally {
      setBusyRecordId(null);
    }
  };

  const handleSubmitRecord = async (event: FormEvent) => {
    event.preventDefault();

    if (
      resolvedFields.some(
        (field) =>
          !field.disabled &&
          field.required !== false &&
          !String(formData[field.name] ?? "").trim()
      )
    ) {
      toast.warning("Preencha todos os campos antes de salvar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload(formData);

      if (activeRecordId) {
        await onUpdate(activeRecordId, payload);
        toast.success(formConfig.editSuccessMessage);
      } else {
        await onCreate(payload);
        toast.success(formConfig.createSuccessMessage);
      }

      closeFormModal();
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

  return (
    <section className="record-management">
      {showBackButton ? (
        <button
          type="button"
          className="record-management__back"
          onClick={() => navigate(backRoute)}
        >
          <i className="fa fa-arrow-left" aria-hidden="true" /> {backLabel}
        </button>
      ) : null}

      <RecordList
        {...listGroup}
        isLoading={isLoading}
        pageSize={listPageSize}
        busyRecordId={busyRecordId}
        className="record-panel--page"
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
      />

      <button
        type="button"
        className="record-management__fab"
        onClick={openCreateModal}
        aria-label={addAriaLabel}
      >
        <i className="fa fa-plus" aria-hidden="true" />
      </button>

      <RecordFormModal
        open={isFormModalOpen}
        title={modalTitle}
        submitLabel={modalSubmitLabel}
        resetButtonLabel="Limpar campos"
        fields={resolvedFields}
        data={formData}
        isSubmitting={isSubmitting}
        onClose={closeFormModal}
        onInputChange={handleInputChange}
        onFileUpload={onFileUpload}
        onResetFields={handleResetFormFields}
        onSubmit={handleSubmitRecord}
      />

      <RecordDeleteModal
        open={Boolean(pendingDeleteRecordId)}
        entityLabel={formConfig.entityLabel}
        recordLabel={pendingDeleteRecordLabel}
        isSubmitting={busyRecordId === pendingDeleteRecordId}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDeleteRecord}
      />
    </section>
  );
}
