export type DashboardDomainKey = "clientes" | "animais" | "itens";

export type DashboardSummaryCardData = {
  key: DashboardDomainKey;
  title: string;
  value: string;
  helper: string;
  accent: string;
};

export type DashboardChartData = {
  label: string;
  value: number;
  helper?: string;
  accent?: string;
};

export type DashboardChartKind = "bar" | "donut";

export type DashboardChartSection = {
  title: string;
  subtitle: string;
  kind: DashboardChartKind;
  data: DashboardChartData[];
  emptyMessage: string;
};

export type DashboardQuickStat = {
  label: string;
  value: string;
};

export type DashboardRecordItem = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  badge: string;
};

export type DashboardRecordGroup = {
  title: string;
  subtitle: string;
  emptyMessage: string;
  items: DashboardRecordItem[];
};
