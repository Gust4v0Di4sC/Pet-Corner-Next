import {
  APPOINTMENT_STATUS_OPTIONS,
  getAppointmentStatusLabel,
} from "../../services/appointmentService";
import type { AppointmentStatusFilter } from "../../types/appointment";

type AppointmentsFiltersProps = {
  statusFilter: AppointmentStatusFilter;
  dateFilter: string;
  search: string;
  onStatusFilterChange: (status: AppointmentStatusFilter) => void;
  onDateFilterChange: (date: string) => void;
  onSearchChange: (search: string) => void;
};

export function AppointmentsFilters({
  statusFilter,
  dateFilter,
  search,
  onStatusFilterChange,
  onDateFilterChange,
  onSearchChange,
}: AppointmentsFiltersProps) {
  return (
    <div className="appointments__filters">
      <label>
        <span>Status</span>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as AppointmentStatusFilter)}
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
          value={dateFilter}
          onChange={(event) => onDateFilterChange(event.target.value)}
        />
      </label>

      <label className="appointments__search">
        <span>Busca</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="cliente, e-mail, servico ou data"
          aria-label="Buscar por cliente, e-mail, servico ou data"
        />
      </label>
    </div>
  );
}

