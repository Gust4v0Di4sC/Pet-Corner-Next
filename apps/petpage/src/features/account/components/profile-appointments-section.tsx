import { ProfileEmptyState, ProfileSectionPanel } from "@/features/account/components/profile-section-panel";
import {
  getAppointmentStatusLabel,
  toDisplayDateTime,
} from "@/features/account/utils/profile-dashboard-formatters";
import type { CustomerAppointment } from "@/features/account/services/customer-profile.service";

type ProfileAppointmentsSectionProps = {
  loading: boolean;
  appointments: CustomerAppointment[];
};

export function ProfileAppointmentsSection({
  loading,
  appointments,
}: ProfileAppointmentsSectionProps) {
  return (
    <ProfileSectionPanel id="profile-section-appointments" title="Agendamentos">
      {loading ? (
        <p className="text-lg text-slate-300">Carregando agendamentos...</p>
      ) : appointments.length === 0 ? (
        <ProfileEmptyState>Nenhum agendamento encontrado para esta conta.</ProfileEmptyState>
      ) : (
        <ul className="space-y-4">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </ul>
      )}
    </ProfileSectionPanel>
  );
}

function AppointmentCard({ appointment }: { appointment: CustomerAppointment }) {
  return (
    <li className="grid gap-3 rounded-2xl border border-slate-700 bg-[#111b2b] px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="text-3xl font-semibold text-slate-100">{appointment.serviceName}</p>
        <p className="text-lg text-slate-400">
          {toDisplayDateTime(appointment.scheduledStartIso)} ate{" "}
          {appointment.scheduledEndTime || "--"}
        </p>
      </div>
      <span className="inline-flex rounded-full bg-[#fb8b24]/20 px-4 py-1.5 text-lg font-semibold text-[#fb8b24]">
        {getAppointmentStatusLabel(appointment.status)}
      </span>
    </li>
  );
}
