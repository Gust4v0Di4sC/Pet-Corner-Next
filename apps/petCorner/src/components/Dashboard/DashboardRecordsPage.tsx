import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import logoimg from "../../assets/Logo-home-alt.svg";
import { useClient } from "../../hooks/useClient";
import { useDog } from "../../hooks/useDog";
import { useProducts } from "../../hooks/useProducts";
import type { Client } from "../../types/client";
import type { Dog } from "../../types/dog";
import type { Product } from "../../types/product";
import AppShell from "../layout/AppShell";
import Main from "../Templates/Main";
import { DASHBOARD_ROUTE, getDashboardDomainMeta } from "./dashboard.domain";
import DashboardCreateRecordModal from "./DashboardCreateRecordModal";
import {
  buildDashboardRecordPayload,
  getDashboardRecordFormConfig,
  getDashboardRecordFormData,
  type DashboardDomainRecord,
  type DashboardRecordPayload,
} from "./dashboard.forms";
import DashboardRecordList from "./DashboardRecordList";
import type { DashboardDomainKey } from "./dashboard.types";
import { getRecordGroup } from "./dashboard.utils";
import "./dashboard.css";

type PageProps = {
  domain: DashboardDomainKey;
};

type RecordsLayoutProps = {
  domain: DashboardDomainKey;
  isLoading: boolean;
  records: DashboardDomainRecord[];
  recordGroup: ReturnType<typeof getRecordGroup>;
  onCreate: (payload: DashboardRecordPayload) => Promise<void>;
  onUpdate: (recordId: string, payload: DashboardRecordPayload) => Promise<void>;
  onDelete: (recordId: string) => Promise<void>;
};

function RecordsLayout({
  domain,
  isLoading,
  records,
  recordGroup,
  onCreate,
  onUpdate,
  onDelete,
}: RecordsLayoutProps) {
  const navigate = useNavigate();
  const meta = getDashboardDomainMeta(domain);
  const formConfig = useMemo(() => getDashboardRecordFormConfig(domain), [domain]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    severity: "success" | "warning";
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>(() => ({
    ...formConfig.initialValues,
  }));
  const isEditing = Boolean(activeRecordId);
  const modalTitle = isEditing ? formConfig.editTitle : formConfig.createTitle;
  const modalSubmitLabel = isEditing
    ? formConfig.editSubmitLabel
    : formConfig.createSubmitLabel;

  const recordsById = useMemo(() => {
    const nextMap = new Map<string, DashboardDomainRecord>();

    records.forEach((record) => {
      if (typeof record.id === "string" && record.id) {
        nextMap.set(record.id, record);
      }
    });

    return nextMap;
  }, [records]);

  const recordItemsById = useMemo(() => {
    const nextMap = new Map<string, string>();

    recordGroup.items.forEach((item) => {
      nextMap.set(item.id, item.title);
    });

    return nextMap;
  }, [recordGroup.items]);

  useEffect(() => {
    setFormData({ ...formConfig.initialValues });
  }, [formConfig]);

  useEffect(() => {
    if (!alert) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setAlert(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [alert]);

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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleEditRecord = (recordId: string) => {
    const selectedRecord = recordsById.get(recordId);

    if (!selectedRecord) {
      setAlert({ severity: "warning", message: "Nao foi possivel localizar o registro." });
      return;
    }

    setActiveRecordId(recordId);
    setFormData(getDashboardRecordFormData(domain, selectedRecord));
    setIsFormModalOpen(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    const recordLabel = recordItemsById.get(recordId) ?? formConfig.entityLabel;
    const hasConfirmedDelete = window.confirm(`Deseja realmente excluir "${recordLabel}"?`);

    if (!hasConfirmedDelete) {
      return;
    }

    setBusyRecordId(recordId);

    try {
      await onDelete(recordId);
      setAlert({ severity: "success", message: formConfig.deleteSuccessMessage });
    } catch {
      setAlert({
        severity: "warning",
        message: "Nao foi possivel excluir o registro agora.",
      });
    } finally {
      setBusyRecordId(null);
    }
  };

  const handleSubmitRecord = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formConfig.fields.some((field) => !String(formData[field.name] ?? "").trim())) {
      setAlert({ severity: "warning", message: "Preencha todos os campos antes de salvar." });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildDashboardRecordPayload(domain, formData);

      if (activeRecordId) {
        await onUpdate(activeRecordId, payload);
        setAlert({ severity: "success", message: formConfig.editSuccessMessage });
      } else {
        await onCreate(payload);
        setAlert({ severity: "success", message: formConfig.createSuccessMessage });
      }

      closeFormModal();
    } catch (error) {
      setAlert({
        severity: "warning",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Nao foi possivel salvar o registro agora.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon={meta.icon}
        title={meta.recordsTitle}
        subtitle={meta.recordsSubtitle}
        fillHeight
        contentClassName="records-page-shell"
      >
        <section className="records-page">
          {alert && (
            <Alert
              variant="filled"
              severity={alert.severity}
              onClose={() => setAlert(null)}
            >
              <AlertTitle>{alert.severity === "success" ? "Sucesso" : "Aviso"}</AlertTitle>
              {alert.message}
            </Alert>
          )}

          <button
            type="button"
            className="records-page__back"
            onClick={() => navigate(DASHBOARD_ROUTE)}
          >
            <i className="fa fa-arrow-left" aria-hidden="true" /> Voltar ao dashboard
          </button>

          <DashboardRecordList
            {...recordGroup}
            isLoading={isLoading}
            busyRecordId={busyRecordId}
            className="dashboard-panel--page"
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
          />

          <button
            type="button"
            className="records-page__fab"
            onClick={openCreateModal}
            aria-label={`Adicionar novo registro em ${meta.recordsTitle.toLowerCase()}`}
          >
            <i className="fa fa-plus" aria-hidden="true" />
          </button>

          <DashboardCreateRecordModal
            open={isFormModalOpen}
            title={modalTitle}
            submitLabel={modalSubmitLabel}
            fields={formConfig.fields}
            data={formData}
            isSubmitting={isSubmitting}
            onClose={closeFormModal}
            onInputChange={handleInputChange}
            onSubmit={handleSubmitRecord}
          />
        </section>
      </Main>
    </AppShell>
  );
}

function ClientRecordsPage() {
  const { items, isLoading, create, update, remove } = useClient("clientes");

  return (
    <RecordsLayout
      domain="clientes"
      isLoading={isLoading}
      records={items}
      recordGroup={getRecordGroup("clientes", items, [], [])}
      onCreate={(payload) => create(payload as Omit<Client, "id">)}
      onUpdate={(recordId, payload) => update(recordId, payload as Omit<Client, "id">)}
      onDelete={remove}
    />
  );
}

function DogRecordsPage() {
  const { items, isLoading, create, update, remove } = useDog();

  return (
    <RecordsLayout
      domain="animais"
      isLoading={isLoading}
      records={items}
      recordGroup={getRecordGroup("animais", [], items, [])}
      onCreate={(payload) => create(payload as Omit<Dog, "id">)}
      onUpdate={(recordId, payload) => update(recordId, payload as Omit<Dog, "id">)}
      onDelete={remove}
    />
  );
}

function ProductRecordsPage() {
  const { items, isLoading, create, update, remove } = useProducts();

  return (
    <RecordsLayout
      domain="itens"
      isLoading={isLoading}
      records={items}
      recordGroup={getRecordGroup("itens", [], [], items)}
      onCreate={(payload) => create(payload as Omit<Product, "id">)}
      onUpdate={(recordId, payload) => update(recordId, payload as Omit<Product, "id">)}
      onDelete={remove}
    />
  );
}

export default function DashboardRecordsPage({ domain }: PageProps) {
  if (domain === "animais") {
    return <DogRecordsPage />;
  }

  if (domain === "itens") {
    return <ProductRecordsPage />;
  }

  return <ClientRecordsPage />;
}
