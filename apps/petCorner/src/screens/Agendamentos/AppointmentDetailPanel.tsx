import { useEffect, useState } from "react";
import { AppIcon } from "../../components/icons/AppIcon";
import {
  APPOINTMENT_STATUS_OPTIONS,
  getAppointmentStatusLabel,
} from "../../services/appointmentService";
import type { Appointment, AppointmentStatus } from "../../types/appointment";
import {
  formatCurrency,
  formatDateTime,
  getCalendarEmailStatusLabel,
  getCustomerDisplayName,
  getStatusClassName,
} from "./agendamentos.utils";

type AppointmentDetailPanelProps = {
  appointment: Appointment | null;
  isUpdatingStatus: boolean;
  onStatusUpdate: (nextStatus: AppointmentStatus) => void;
};

export function AppointmentDetailPanel({
  appointment,
  isUpdatingStatus,
  onStatusUpdate,
}: AppointmentDetailPanelProps) {
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>("requested");

  useEffect(() => {
    if (appointment) {
      setSelectedStatus(appointment.status);
    }
  }, [appointment]);

  const hasStatusChanged = Boolean(appointment && selectedStatus !== appointment.status);

  return (
    <article className="appointments__panel appointments__panel--detail">
      <header className="appointments__panel-header">
        <h3>Detalhes</h3>
        {appointment ? (
          <span className={getStatusClassName(appointment.status)}>
            {getAppointmentStatusLabel(appointment.status)}
          </span>
        ) : null}
      </header>

      {!appointment ? (
        <p className="appointments__empty">
          Selecione um agendamento para visualizar os detalhes.
        </p>
      ) : (
        <div className="appointments__detail">
          <div className="appointments__summary">
            <article>
              <span>Serviço</span>
              <strong>{appointment.serviceName}</strong>
            </article>
            <article>
              <span>Valor</span>
              <strong>{formatCurrency(appointment.servicePrice)}</strong>
            </article>
            <article>
              <span>Duração</span>
              <strong>{appointment.serviceDurationMinutes} min</strong>
            </article>
          </div>

          <div className="appointments__detail-layout">
            <div className="appointments__detail-main">
              <section className="appointments__detail-section">
                <h4>Cliente</h4>
                <div className="appointments__customer">
                  <strong>{getCustomerDisplayName(appointment)}</strong>
                  {appointment.customerEmail ? (
                    <a href={`mailto:${appointment.customerEmail}`}>
                      {appointment.customerEmail}
                    </a>
                  ) : (
                    <span>E-mail não informado</span>
                  )}
                </div>
              </section>

              <section className="appointments__detail-section">
                <h4>Horário</h4>
                <p>
                  {formatDateTime(appointment.scheduledStartIso)} até{" "}
                  {appointment.scheduledEndTime}
                </p>
              </section>

              <section className="appointments__detail-section">
                <h4>Observações</h4>
                <p>{appointment.notes || "Nenhuma observação informada."}</p>
              </section>

              <section className="appointments__detail-section">
                <h4>Google Agenda</h4>
                <p>
                  E-mail automático:{" "}
                  <strong>{getCalendarEmailStatusLabel(appointment.calendarEmailStatus)}</strong>
                </p>
                {appointment.googleCalendarAddUrl ? (
                  <p>
                    <a href={appointment.googleCalendarAddUrl} target="_blank" rel="noreferrer">
                      Abrir link para salvar na agenda
                    </a>
                  </p>
                ) : (
                  <p>Link não gerado.</p>
                )}
              </section>
            </div>

            <aside className="appointments__status-panel" aria-label="Ações do agendamento">
              <label className="appointments__status-field">
                <span>Status</span>
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value as AppointmentStatus)}
                  disabled={isUpdatingStatus}
                >
                  {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getAppointmentStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="appointments__action-save-status"
                onClick={() => onStatusUpdate(selectedStatus)}
                disabled={isUpdatingStatus || !hasStatusChanged}
              >
                <AppIcon
                  name={isUpdatingStatus ? "spinner" : "circle-check"}
                  spin={isUpdatingStatus}
                />
                Salvar status
              </button>

              <div className="appointments__actions">
                <button
                  type="button"
                  className="appointments__action-confirm"
                  onClick={() => onStatusUpdate("confirmed")}
                  disabled={isUpdatingStatus || appointment.status === "confirmed"}
                >
                  <AppIcon name="circle-check" />
                  Confirmar
                </button>
                <button
                  type="button"
                  className="appointments__action-complete"
                  onClick={() => onStatusUpdate("completed")}
                  disabled={isUpdatingStatus || appointment.status === "completed"}
                >
                  <AppIcon name="calendar" />
                  Concluir
                </button>
                <button
                  type="button"
                  className="appointments__danger"
                  onClick={() => onStatusUpdate("canceled")}
                  disabled={isUpdatingStatus || appointment.status === "canceled"}
                >
                  <AppIcon name="times" />
                  Cancelar
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </article>
  );
}
