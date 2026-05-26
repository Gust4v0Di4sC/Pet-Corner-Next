import { useEffect, useMemo, useState } from "react";
import logoimg from "../../assets/Logo.svg";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useAppointments } from "../../hooks/useAppointments";
import type { AppointmentSettings, AppointmentStatus } from "../../types/appointment";
import { AppointmentDetailPanel } from "./AppointmentDetailPanel";
import { AppointmentsFilters } from "./AppointmentsFilters";
import { AppointmentsListPanel } from "./AppointmentsListPanel";
import { AppointmentSettingsPanel } from "./AppointmentSettingsPanel";
import { AppointmentsToolbar } from "./AppointmentsToolbar";
import {
  cloneSettings,
  countRequestedAppointments,
} from "./agendamentos.utils";
import "./agendamentos.css";

export default function AgendamentosPage() {
  const appointmentsState = useAppointments();
  const [activeTab, setActiveTab] = useState<"agenda" | "settings">("agenda");
  const [settingsDraft, setSettingsDraft] = useState<AppointmentSettings>(
    cloneSettings(null)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isMessageError, setIsMessageError] = useState(false);

  useEffect(() => {
    if (appointmentsState.settings) {
      setSettingsDraft(cloneSettings(appointmentsState.settings));
    }
  }, [appointmentsState.settings]);

  const requestedCount = useMemo(
    () => countRequestedAppointments(appointmentsState.appointments),
    [appointmentsState.appointments]
  );

  const handleStatusUpdate = async (nextStatus: AppointmentStatus) => {
    if (!appointmentsState.selectedAppointment) {
      setIsMessageError(true);
      setMessage("Selecione um agendamento para atualizar.");
      return;
    }

    try {
      await appointmentsState.updateStatus(appointmentsState.selectedAppointment, nextStatus);
      setIsMessageError(false);
      setMessage("Status do agendamento atualizado.");
    } catch (error) {
      setIsMessageError(true);
      setMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Não foi possível atualizar o agendamento."
      );
    }
  };

  const handleSaveSettings = async () => {
    try {
      await appointmentsState.saveSettings(settingsDraft);
      setIsMessageError(false);
      setMessage("Configuração de agendamentos salva.");
    } catch (error) {
      setIsMessageError(true);
      setMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Não foi possível salvar a configuração."
      );
    }
  };

  const updateWeekday = (
    weekday: string,
    field: "enabled" | "startTime" | "endTime",
    value: boolean | string
  ) => {
    setSettingsDraft((currentSettings) => ({
      ...currentSettings,
      weeklyAvailability: {
        ...currentSettings.weeklyAvailability,
        [weekday]: {
          ...currentSettings.weeklyAvailability[weekday],
          [field]: value,
        },
      },
    }));
  };

  return (
    <AppShell logoSrc={logoimg} chatFabPlacement="resource-fab">
      <Main
        icon="calendar"
        title="Agendamentos"
        subtitle="Agenda de serviços e configuração de disponibilidade"
        fillHeight
        contentClassName="appointments-shell"
      >
        <section className="appointments">
          <AppointmentsToolbar
            activeTab={activeTab}
            isLoading={appointmentsState.isLoading}
            onTabChange={setActiveTab}
            onRefresh={() => void appointmentsState.reloadAppointments()}
          />

          {appointmentsState.appointmentsErrorMessage ? (
            <p role="alert" className="appointments__error">{appointmentsState.appointmentsErrorMessage}</p>
          ) : null}
          {appointmentsState.settingsErrorMessage ? (
            <p role="alert" className="appointments__error">{appointmentsState.settingsErrorMessage}</p>
          ) : null}
          {message ? (
            <p role={isMessageError ? "alert" : "status"} aria-live="polite" className={isMessageError ? "appointments__error" : "appointments__success"}>
              {message}
            </p>
          ) : null}

          {activeTab === "agenda" ? (
            <>
              <AppointmentsFilters
                statusFilter={appointmentsState.statusFilter}
                dateFilter={appointmentsState.dateFilter}
                search={appointmentsState.search}
                onStatusFilterChange={appointmentsState.setStatusFilter}
                onDateFilterChange={appointmentsState.setDateFilter}
                onSearchChange={appointmentsState.setSearch}
              />

              <div id="appointments-agenda-panel" className="appointments__grid" role="tabpanel">
                <AppointmentsListPanel
                  appointments={appointmentsState.appointments}
                  selectedAppointmentId={appointmentsState.selectedAppointment?.id}
                  requestedCount={requestedCount}
                  onSelectAppointment={appointmentsState.setSelectedAppointmentId}
                />

                <AppointmentDetailPanel
                  appointment={appointmentsState.selectedAppointment}
                  isUpdatingStatus={appointmentsState.isUpdatingStatus}
                  onStatusUpdate={(status) => void handleStatusUpdate(status)}
                />
              </div>
            </>
          ) : (
            <AppointmentSettingsPanel
              settings={settingsDraft}
              isSavingSettings={appointmentsState.isSavingSettings}
              onSettingsChange={setSettingsDraft}
              onWeekdayChange={updateWeekday}
              onSaveSettings={() => void handleSaveSettings()}
            />
          )}
        </section>
      </Main>
    </AppShell>
  );
}
