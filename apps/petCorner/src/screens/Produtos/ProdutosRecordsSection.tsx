import { useMemo } from "react";

import type { FileUploadHandler } from "../../components/Form/form.types";
import { RecordCreateButton } from "../../components/Records/RecordCreateButton";
import RecordDeleteModal from "../../components/Records/RecordDeleteModal";
import RecordFormModal from "../../components/Records/RecordFormModal";
import RecordList from "../../components/Records/RecordList";
import type { RecordFormData } from "../../components/Records/record.types";
import {
  useAdminRecordNotification,
  useRecordDeleteController,
  useRecordFormController,
} from "../../hooks/records";
import type { Product } from "../../types/product";
import type { ProductCatalogItem } from "../../types/productCatalog";
import {
  buildProductListGroup,
  buildProductPayload,
  createProductFormConfig,
  getProductFormData,
} from "./produtos.records";

type InputAsyncEffect = (params: {
  name: string;
  value: string;
  currentData: RecordFormData;
  nextData: RecordFormData;
  isEditing: boolean;
}) => Promise<Partial<RecordFormData> | void> | Partial<RecordFormData> | void;

type Props = {
  items: Product[];
  isLoading: boolean;
  catalogItems: ProductCatalogItem[];
  create: (payload: Omit<Product, "id">) => Promise<void>;
  update: (recordId: string, payload: Omit<Product, "id">) => Promise<void>;
  remove: (recordId: string) => Promise<void>;
  onFileUpload: FileUploadHandler;
  onInputAsyncEffect: InputAsyncEffect;
};

export function ProdutosRecordsSection({
  items,
  isLoading,
  catalogItems,
  create,
  update,
  remove,
  onFileUpload,
  onInputAsyncEffect,
}: Props) {
  const notifyAdminAction = useAdminRecordNotification();
  const formConfig = useMemo(() => createProductFormConfig(catalogItems), [catalogItems]);
  const listGroup = useMemo(() => buildProductListGroup(items), [items]);
  const recordsById = useMemo(() => {
    return new Map(
      items
        .filter(
          (product): product is Product & { id: string } =>
            typeof product.id === "string" && Boolean(product.id)
        )
        .map((product) => [product.id, product])
    );
  }, [items]);
  const recordItemsById = useMemo(() => {
    return new Map(listGroup.items.map((item) => [item.id, item.title]));
  }, [listGroup.items]);

  const formController = useRecordFormController({
    recordsById,
    config: formConfig,
    getFormData: getProductFormData,
    buildPayload: buildProductPayload,
    onCreate: create,
    onUpdate: update,
    onInputAsyncEffect,
    notifyAdminAction,
  });

  const deleteController = useRecordDeleteController({
    recordsById,
    recordItemsById,
    entityLabel: formConfig.entityLabel,
    successMessage: formConfig.deleteSuccessMessage,
    onDelete: remove,
    notifyAdminAction,
  });

  return (
    <section className="record-management">
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
        ariaLabel="Adicionar novo produto"
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
          onFileUpload,
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
          entityLabel: formConfig.entityLabel,
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
