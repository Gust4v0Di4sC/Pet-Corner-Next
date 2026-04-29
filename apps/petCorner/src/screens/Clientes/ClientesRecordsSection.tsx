import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import { RecordBackButton } from "../../components/Records/RecordBackButton";
import { RecordCreateButton } from "../../components/Records/RecordCreateButton";
import RecordDeleteModal from "../../components/Records/RecordDeleteModal";
import RecordFormModal from "../../components/Records/RecordFormModal";
import RecordList from "../../components/Records/RecordList";
import {
  useAdminRecordNotification,
  useRecordDeleteController,
  useRecordFormController,
} from "../../hooks/records";
import type { Client } from "../../types/client";
import {
  buildClientListGroup,
  buildClientPayload,
  clientFormConfig,
  getClientFormData,
} from "./clientes.records";

type Props = {
  items: Client[];
  isLoading: boolean;
  create: (payload: Omit<Client, "id">) => Promise<void>;
  update: (recordId: string, payload: Omit<Client, "id">) => Promise<void>;
  remove: (recordId: string) => Promise<void>;
};

export function ClientesRecordsSection({
  items,
  isLoading,
  create,
  update,
  remove,
}: Props) {
  const navigate = useNavigate();
  const notifyAdminAction = useAdminRecordNotification();
  const listGroup = useMemo(() => buildClientListGroup(items), [items]);
  const recordsById = useMemo(() => {
    return new Map(
      items
        .filter((client): client is Client & { id: string } => Boolean(client.id))
        .map((client) => [client.id, client])
    );
  }, [items]);
  const recordItemsById = useMemo(() => {
    return new Map(listGroup.items.map((item) => [item.id, item.title]));
  }, [listGroup.items]);

  const formController = useRecordFormController({
    recordsById,
    config: clientFormConfig,
    getFormData: getClientFormData,
    buildPayload: buildClientPayload,
    onCreate: create,
    onUpdate: update,
    notifyAdminAction,
  });

  const deleteController = useRecordDeleteController({
    recordsById,
    recordItemsById,
    entityLabel: clientFormConfig.entityLabel,
    successMessage: clientFormConfig.deleteSuccessMessage,
    onDelete: remove,
    notifyAdminAction,
  });

  return (
    <section className="record-management">
      <RecordBackButton onClick={() => navigate(DASHBOARD_ROUTE)} />

      <RecordList
        {...listGroup}
        isLoading={isLoading}
        pageSize={4}
        busyRecordId={deleteController.busyRecordId}
        className="record-panel--page"
        onEditRecord={formController.openEdit}
        onDeleteRecord={deleteController.open}
      />

      <RecordCreateButton
        ariaLabel="Adicionar novo cliente"
        onClick={formController.openCreate}
      />

      <RecordFormModal
        open={formController.isOpen}
        content={formController.content}
        form={{
          fields: formController.fields,
          data: formController.data,
          isSubmitting: formController.isSubmitting,
          onInputChange: formController.handleInputChange,
        }}
        actions={{
          onClose: formController.close,
          onReset: formController.reset,
          onSubmit: formController.submit,
        }}
      />

      <RecordDeleteModal
        open={deleteController.isOpen}
        content={{
          entityLabel: clientFormConfig.entityLabel,
          recordLabel: deleteController.recordLabel,
        }}
        state={{
          isSubmitting: deleteController.isSubmitting,
        }}
        actions={{
          onClose: deleteController.close,
          onConfirm: deleteController.confirm,
        }}
      />
    </section>
  );
}
