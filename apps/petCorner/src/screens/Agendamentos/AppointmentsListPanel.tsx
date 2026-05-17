import type { Appointment } from "../../types/appointment";
import {
  formatCountLabel,
  formatDateTime,
  getCustomerListLabel,
  getStatusClassName,
} from "./agendamentos.utils";
import { getAppointmentStatusLabel } from "../../services/appointmentService";

type AppointmentsListPanelProps = {
  appointments: Appointment[];
  selectedAppointmentId?: string;
  requestedCount: number;
  onSelectAppointment: (appointmentId: string) => void;
};

export function AppointmentsListPanel({
  appointments,
  selectedAppointmentId,
  requestedCount,
  onSelectAppointment,
}: AppointmentsListPanelProps) {
  return (
    <article className="appointments__panel appointments__panel--list">
      <header className="appointments__panel-header">
        <h3>Agenda</h3>
        <small>
          {formatCountLabel(appointments.length, "resultado", "resultados")} |{" "}
          {formatCountLabel(requestedCount, "pendente", "pendentes")}
        </small>
      </header>

      {!appointments.length ? (
        <p className="appointments__empty">Nenhum agendamento encontrado.</p>
      ) : (
        <ul className="appointments__list">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <button
                type="button"
                className={selectedAppointmentId === appointment.id ? "is-active" : ""}
                onClick={() => onSelectAppointment(appointment.id)}
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
  );
}
