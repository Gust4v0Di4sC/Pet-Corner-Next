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
import type { Testimonial } from "../../types/testimonial";
import {
  buildTestimonialListGroup,
  buildTestimonialPayload,
  getTestimonialFormData,
  testimonialFormConfig,
} from "./depoimentos.records";

type Props = {
  items: Testimonial[];
  isLoading: boolean;
  create: (payload: Omit<Testimonial, "id">) => Promise<void>;
  update: (recordId: string, payload: Omit<Testimonial, "id">) => Promise<void>;
  remove: (recordId: string) => Promise<void>;
};

export function DepoimentosRecordsSection({
  items,
  isLoading,
  create,
  update,
  remove,
}: Props) {
  const navigate = useNavigate();
  const notifyAdminAction = useAdminRecordNotification();
  const listGroup = useMemo(() => buildTestimonialListGroup(items), [items]);
  const recordsById = useMemo(() => {
    return new Map(
      items
        .filter(
          (testimonial): testimonial is Testimonial & { id: string } =>
            typeof testimonial.id === "string" && Boolean(testimonial.id)
        )
        .map((testimonial) => [testimonial.id, testimonial])
    );
  }, [items]);
  const recordItemsById = useMemo(() => {
    return new Map(listGroup.items.map((item) => [item.id, item.title]));
  }, [listGroup.items]);

  const formController = useRecordFormController({
    recordsById,
    config: testimonialFormConfig,
    getFormData: getTestimonialFormData,
    buildPayload: buildTestimonialPayload,
    onCreate: create,
    onUpdate: update,
    notifyAdminAction,
  });

  const deleteController = useRecordDeleteController({
    recordsById,
    recordItemsById,
    entityLabel: testimonialFormConfig.entityLabel,
    successMessage: testimonialFormConfig.deleteSuccessMessage,
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
        ariaLabel="Adicionar novo depoimento"
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
          entityLabel: testimonialFormConfig.entityLabel,
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
