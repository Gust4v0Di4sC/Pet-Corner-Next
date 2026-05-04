import { useEffect, useMemo, useState } from "react";
import logoimg from "../../assets/Logo.svg";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useAppointments } from "../../hooks/useAppointments";
import {
  APPOINTMENT_STATUS_OPTIONS,
  DEFAULT_APPOINTMENT_SETTINGS,
  getAppointmentStatusLabel,
} from "../../services/appointmentService";
import type {
  AppointmentSettings,
  AppointmentStatus,
  AppointmentStatusFilter,
} from "../../types/appointment";
import "./agendamentos.css";

const WEEKDAY_LABELS: Record<string, string> = {
  "0": "Domingo",
  "1": "Segunda",
  "2": "Terça",
  "3": "Quarta",
  "4": "Quinta",
  "5": "Sexta",
  "6": "Sábado",
};

const CALENDAR_EMAIL_STATUS_LABELS: Record<string, string> = {
  sent: "E-mail enviado",
  disabled: "Envio automático desativado",
  missing_config: "Configuração de e-mail pendente",
  missing_email: "Cliente sem e-mail",
  error: "Erro no envio",
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function getStatusClassName(status: AppointmentStatus): string {
  return `appointments__status appointments__status--${status}`;
}

function getCustomerDisplayName(appointment: { customerName: string; customerEmail: string }): string {
  const name = appointment.customerName.trim();
  const email = appointment.customerEmail.trim();
  return name && name.toLowerCase() !== email.toLowerCase() ? name : "Nome não informado";
}

function getCustomerListLabel(appointment: {
  customerName: string;
  customerEmail: string;
}): string {
  const name = appointment.customerName.trim();
  const email = appointment.customerEmail.trim();
  return name && name.toLowerCase() !== email.toLowerCase()
    ? name
    : email || "Cliente não identificado";
}

function getCalendarEmailStatusLabel(status: string): string {
  return CALENDAR_EMAIL_STATUS_LABELS[status] || "Status não informado";
}

function formatCountLabel(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function cloneSettings(settings: AppointmentSettings | null): AppointmentSettings {
  const source = settings || DEFAULT_APPOINTMENT_SETTINGS;
  return {
    timezone: source.timezone,
    slotIntervalMinutes: source.slotIntervalMinutes,
    minAdvanceHours: source.minAdvanceHours,
    maxDaysAhead: source.maxDaysAhead,
    weeklyAvailability: Object.fromEntries(
      Object.entries(source.weeklyAvailability).map(([weekday, day]) => [
        weekday,
        { ...day },
      ])
    ),
  };
}

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
    () =>
      appointmentsState.appointments.filter((appointment) => appointment.status === "requested")
        .length,
    [appointmentsState.appointments]
  );
  const selectedAppointment = appointmentsState.selectedAppointment;

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
          <header className="appointments__toolbar">
            <div className="appointments__tabs" role="tablist" aria-label="Agendamentos">
              <button
                type="button"
                className={activeTab === "agenda" ? "is-active" : ""}
                onClick={() => setActiveTab("agenda")}
              >
                Agenda
              </button>
              <button
                type="button"
                className={activeTab === "settings" ? "is-active" : ""}
                onClick={() => setActiveTab("settings")}
              >
                Configuração
              </button>
            </div>

            <button
              type="button"
              className="appointments__refresh"
              onClick={() => void appointmentsState.reloadAppointments()}
              disabled={appointmentsState.isLoading}
            >
              <i className={`fa ${appointmentsState.isLoading ? "fa-spinner fa-spin" : "fa-rotate-right"}`} />
              Atualizar
            </button>
          </header>

          {appointmentsState.appointmentsErrorMessage ? (
            <p className="appointments__error">{appointmentsState.appointmentsErrorMessage}</p>
          ) : null}
          {appointmentsState.settingsErrorMessage ? (
            <p className="appointments__error">{appointmentsState.settingsErrorMessage}</p>
          ) : null}
          {message ? (
            <p className={isMessageError ? "appointments__error" : "appointments__success"}>
              {message}
            </p>
          ) : null}

          {activeTab === "agenda" ? (
            <>
              <div className="appointments__filters">
                <label>
                  <span>Status</span>
                  <select
                    value={appointmentsState.statusFilter}
                    onChange={(event) =>
                      appointmentsState.setStatusFilter(
                        event.target.value as AppointmentStatusFilter
                      )
                    }
                  >
                    <option value="all">Todos</option>
                    {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {getAppointmentStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Data</span>
                  <input
                    type="date"
                    value={appointmentsState.dateFilter}
                    onChange={(event) => appointmentsState.setDateFilter(event.target.value)}
                  />
                </label>

                <label className="appointments__search">
                  <span>Busca</span>
                  <input
                    value={appointmentsState.search}
                    onChange={(event) => appointmentsState.setSearch(event.target.value)}
                    placeholder="cliente, e-mail, serviço ou data"
                    aria-label="Buscar por cliente, e-mail, serviço ou data"
                  />
                </label>
              </div>

              <div className="appointments__grid">
                <article className="appointments__panel appointments__panel--list">
                  <header className="appointments__panel-header">
                    <h3>Agenda</h3>
                    <small>
                      {formatCountLabel(appointmentsState.appointments.length, "resultado", "resultados")} |{" "}
                      {formatCountLabel(requestedCount, "pendente", "pendentes")}
                    </small>
                  </header>

                  {!appointmentsState.appointments.length ? (
                    <p className="appointments__empty">Nenhum agendamento encontrado.</p>
                  ) : (
                    <ul className="appointments__list">
                      {appointmentsState.appointments.map((appointment) => (
                        <li key={appointment.id}>
                          <button
                            type="button"
                            className={
                              appointmentsState.selectedAppointment?.id === appointment.id
                                ? "is-active"
                                : ""
                            }
                            onClick={() =>
                              appointmentsState.setSelectedAppointmentId(appointment.id)
                            }
                          >
                            <div>
                              <strong>{appointment.serviceName}</strong>
                              <p>{getCustomerListLabel(appointment)}</p>
                            </div>
                            <span className={getStatusClassName(appointment.status)}>
                              {getAppointmentStatusLabel(appointment.status)}
                            </span>
                            <small>{formatDateTime(appointment.scheduledStartIso)}</small>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                <article className="appointments__panel appointments__panel--detail">
                  <header className="appointments__panel-header">
                    <h3>Detalhes</h3>
                    {selectedAppointment ? (
                      <span className={getStatusClassName(selectedAppointment.status)}>
                        {getAppointmentStatusLabel(selectedAppointment.status)}
                      </span>
                    ) : null}
                  </header>

                  {!selectedAppointment ? (
                    <p className="appointments__empty">
                      Selecione um agendamento para visualizar os detalhes.
                    </p>
                  ) : (
                    <div className="appointments__detail">
                      <div className="appointments__summary">
                        <article>
                          <span>Serviço</span>
                          <strong>{selectedAppointment.serviceName}</strong>
                        </article>
                        <article>
                          <span>Valor</span>
                          <strong>
                            {formatCurrency(selectedAppointment.servicePrice)}
                          </strong>
                        </article>
                        <article>
                          <span>Duração</span>
                          <strong>
                            {selectedAppointment.serviceDurationMinutes} min
                          </strong>
                        </article>
                      </div>

                      <section className="appointments__detail-section">
                        <h4>Cliente</h4>
                        <div className="appointments__customer">
                          <strong>{getCustomerDisplayName(selectedAppointment)}</strong>
                          {selectedAppointment.customerEmail ? (
                            <a href={`mailto:${selectedAppointment.customerEmail}`}>
                              {selectedAppointment.customerEmail}
                            </a>
                          ) : (
                            <span>E-mail não informado</span>
                          )}
                        </div>
                      </section>

                      <section className="appointments__detail-section">
                        <h4>Horário</h4>
                        <p>
                          {formatDateTime(selectedAppointment.scheduledStartIso)} até{" "}
                          {selectedAppointment.scheduledEndTime}
                        </p>
                      </section>

                      <section className="appointments__detail-section">
                        <h4>Observações</h4>
                        <p>{selectedAppointment.notes || "Nenhuma observação informada."}</p>
                      </section>

                      <section className="appointments__detail-section">
                        <h4>Google Agenda</h4>
                        <p>
                          E-mail automático:{" "}
                          <strong>
                            {getCalendarEmailStatusLabel(selectedAppointment.calendarEmailStatus)}
                          </strong>
                        </p>
                        {selectedAppointment.googleCalendarAddUrl ? (
                          <p>
                            <a
                              href={selectedAppointment.googleCalendarAddUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Abrir link para salvar na agenda
                            </a>
                          </p>
                        ) : (
                          <p>Link não gerado.</p>
                        )}
                      </section>

                      <div className="appointments__actions">
                        <button
                          type="button"
                          className="appointments__action-confirm"
                          onClick={() => void handleStatusUpdate("confirmed")}
                          disabled={
                            appointmentsState.isUpdatingStatus ||
                            selectedAppointment.status === "confirmed" ||
                            selectedAppointment.status === "completed" ||
                            selectedAppointment.status === "canceled"
                          }
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="appointments__action-complete"
                          onClick={() => void handleStatusUpdate("completed")}
                          disabled={
                            appointmentsState.isUpdatingStatus ||
                            selectedAppointment.status !== "confirmed"
                          }
                        >
                          Concluir
                        </button>
                        <button
                          type="button"
                          className="appointments__danger"
                          onClick={() => void handleStatusUpdate("canceled")}
                          disabled={
                            appointmentsState.isUpdatingStatus ||
                            selectedAppointment.status === "canceled" ||
                            selectedAppointment.status === "completed"
                          }
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              </div>
            </>
          ) : (
            <article className="appointments__panel appointments__settings">
              <header className="appointments__panel-header">
                <h3>Disponibilidade semanal</h3>
                <small>{settingsDraft.timezone}</small>
              </header>

              <div className="appointments__settings-grid">
                <label>
                <span>Intervalo (min)</span>
                  <input
                    type="number"
                    min={5}
                    value={settingsDraft.slotIntervalMinutes}
                    onChange={(event) =>
                      setSettingsDraft((currentSettings) => ({
                        ...currentSettings,
                        slotIntervalMinutes: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Antecedência mínima (h)</span>
                  <input
                    type="number"
                    min={0}
                    value={settingsDraft.minAdvanceHours}
                    onChange={(event) =>
                      setSettingsDraft((currentSettings) => ({
                        ...currentSettings,
                        minAdvanceHours: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Dias futuros</span>
                  <input
                    type="number"
                    min={1}
                    value={settingsDraft.maxDaysAhead}
                    onChange={(event) =>
                      setSettingsDraft((currentSettings) => ({
                        ...currentSettings,
                        maxDaysAhead: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              </div>

              <div className="appointments__weekday-list">
                {Object.entries(WEEKDAY_LABELS).map(([weekday, label]) => {
                  const day = settingsDraft.weeklyAvailability[weekday];
                  return (
                    <div key={weekday} className="appointments__weekday">
                      <label className="appointments__weekday-toggle">
                        <input
                          type="checkbox"
                          checked={day.enabled}
                          onChange={(event) =>
                            updateWeekday(weekday, "enabled", event.target.checked)
                          }
                        />
                        <span>{label}</span>
                      </label>
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(event) =>
                          updateWeekday(weekday, "startTime", event.target.value)
                        }
                        disabled={!day.enabled}
                      />
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(event) =>
                          updateWeekday(weekday, "endTime", event.target.value)
                        }
                        disabled={!day.enabled}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="appointments__save"
                onClick={() => void handleSaveSettings()}
                disabled={appointmentsState.isSavingSettings}
              >
                {appointmentsState.isSavingSettings ? "Salvando..." : "Salvar configuração"}
              </button>
            </article>
          )}
        </section>
      </Main>
    </AppShell>
  );
}
