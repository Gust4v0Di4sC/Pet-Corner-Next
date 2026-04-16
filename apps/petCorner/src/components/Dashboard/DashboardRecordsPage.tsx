import { useNavigate } from "react-router-dom";

import logoimg from "../../assets/Logo-home-alt.svg";
import { useClient } from "../../hooks/useClient";
import { useDog } from "../../hooks/useDog";
import { useProducts } from "../../hooks/useProducts";
import AppShell from "../layout/AppShell";
import Main from "../Templates/Main";
import { DASHBOARD_ROUTE, getDashboardDomainMeta } from "./dashboard.domain";
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
  recordGroup: ReturnType<typeof getRecordGroup>;
};

function RecordsLayout({ domain, isLoading, recordGroup }: RecordsLayoutProps) {
  const navigate = useNavigate();
  const meta = getDashboardDomainMeta(domain);

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
            className="dashboard-panel--page"
          />
        </section>
      </Main>
    </AppShell>
  );
}

function ClientRecordsPage() {
  const { items, isLoading } = useClient("clientes");

  return (
    <RecordsLayout
      domain="clientes"
      isLoading={isLoading}
      recordGroup={getRecordGroup("clientes", items, [], [])}
    />
  );
}

function DogRecordsPage() {
  const { items, isLoading } = useDog();

  return (
    <RecordsLayout
      domain="animais"
      isLoading={isLoading}
      recordGroup={getRecordGroup("animais", [], items, [])}
    />
  );
}

function ProductRecordsPage() {
  const { items, isLoading } = useProducts();

  return (
    <RecordsLayout
      domain="itens"
      isLoading={isLoading}
      recordGroup={getRecordGroup("itens", [], [], items)}
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
