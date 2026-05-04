import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Appointment,
  AppointmentSettings,
  AppointmentStatus,
  AppointmentStatusFilter,
} from "../types/appointment";
import {
  getAppointmentSettings,
  listAppointments,
  saveAppointmentSettings,
  updateAppointmentStatus,
} from "../services/appointmentService";

function mapErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && (error as { code?: unknown }).code === "permission-denied") {
    return "Sem permissao para acessar agendamentos.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function useAppointments() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const appointmentsQuery = useQuery({
    queryKey: ["appointments-admin", "list", statusFilter, dateFilter],
    queryFn: async () =>
      listAppointments({
        status: statusFilter,
        dateKey: dateFilter || undefined,
        maxResults: 200,
      }),
  });

  const settingsQuery = useQuery({
    queryKey: ["appointments-admin", "settings"],
    queryFn: getAppointmentSettings,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (input: { appointment: Appointment; nextStatus: AppointmentStatus }) =>
      updateAppointmentStatus(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments-admin", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments-admin", "settings"] }),
      ]);
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: AppointmentSettings) => saveAppointmentSettings(settings),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments-admin", "settings"] });
    },
  });

  const appointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const data = appointmentsQuery.data || [];
    if (!normalizedSearch) {
      return data;
    }

    return data.filter((appointment) =>
      [
        appointment.serviceName,
        appointment.customerName,
        appointment.customerEmail,
        appointment.customerId,
        appointment.scheduledDateKey,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [appointmentsQuery.data, search]);

  const selectedAppointment = useMemo(() => {
    if (!appointments.length) {
      return null;
    }

    if (!selectedAppointmentId) {
      return appointments[0];
    }

    return (
      appointments.find((appointment) => appointment.id === selectedAppointmentId) ||
      appointments[0]
    );
  }, [appointments, selectedAppointmentId]);

  return {
    appointments,
    selectedAppointment,
    selectedAppointmentId,
    setSelectedAppointmentId,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    search,
    setSearch,
    settings: settingsQuery.data || null,
    isLoading: appointmentsQuery.isLoading || settingsQuery.isLoading,
    appointmentsErrorMessage: appointmentsQuery.error
      ? mapErrorMessage(appointmentsQuery.error, "Nao foi possivel carregar agendamentos.")
      : null,
    settingsErrorMessage: settingsQuery.error
      ? mapErrorMessage(settingsQuery.error, "Nao foi possivel carregar configuracoes.")
      : null,
    reloadAppointments: appointmentsQuery.refetch,
    isUpdatingStatus: updateStatusMutation.isPending,
    isSavingSettings: saveSettingsMutation.isPending,
    updateStatus: async (appointment: Appointment, nextStatus: AppointmentStatus) =>
      updateStatusMutation.mutateAsync({ appointment, nextStatus }),
    saveSettings: async (settings: AppointmentSettings) =>
      saveSettingsMutation.mutateAsync(settings),
  };
}
