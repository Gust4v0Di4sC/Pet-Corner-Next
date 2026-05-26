import { AppIcon } from "../../components/icons/AppIcon";

type AppointmentsToolbarProps = {
  activeTab: "agenda" | "settings";
  isLoading: boolean;
  onTabChange: (tab: "agenda" | "settings") => void;
  onRefresh: () => void;
};

export function AppointmentsToolbar({
  activeTab,
  isLoading,
  onTabChange,
  onRefresh,
}: AppointmentsToolbarProps) {
  return (
    <header className="appointments__toolbar">
      <div className="appointments__tabs" role="tablist" aria-label="Agendamentos">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "agenda"}
          aria-controls="appointments-agenda-panel"
          className={activeTab === "agenda" ? "is-active" : ""}
          onClick={() => onTabChange("agenda")}
        >
          Agenda
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "settings"}
          aria-controls="appointments-settings-panel"
          className={activeTab === "settings" ? "is-active" : ""}
          onClick={() => onTabChange("settings")}
        >
          Configuração
        </button>
      </div>

      <button
        type="button"
        className="appointments__refresh"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <AppIcon name={isLoading ? "spinner" : "rotate-right"} spin={isLoading} />
        Atualizar
      </button>
    </header>
  );
}
