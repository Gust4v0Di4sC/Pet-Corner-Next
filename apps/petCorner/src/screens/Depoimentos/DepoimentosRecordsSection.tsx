import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import { RecordBackButton } from "../../components/Records/RecordBackButton";
import RecordDeleteModal from "../../components/Records/RecordDeleteModal";
import RecordList from "../../components/Records/RecordList";
import {
  useAdminRecordNotification,
  useRecordDeleteController,
} from "../../hooks/records";
import type { Testimonial } from "../../types/testimonial";
import {
  buildTestimonialListGroup,
  testimonialFormConfig,
} from "./depoimentos.records";

type Props = {
  items: Testimonial[];
  isLoading: boolean;
  remove: (recordId: string) => Promise<void>;
};

export function DepoimentosRecordsSection({
  items,
  isLoading,
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
        pageSize={3}
        searchPlaceholder="Pesquisar depoimentos"
        busyRecordId={deleteController.busyRecordId}
        className="record-panel--page"
        onDeleteRecord={deleteController.open}
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
