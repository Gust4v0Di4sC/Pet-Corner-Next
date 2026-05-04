"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomerAppointment,
  fetchAppointmentAvailability,
} from "@/features/scheduling/services/customer-appointment.service";
import type { AppointmentSlot } from "@/features/scheduling/types/appointment";
import { dateToDateKey } from "@/features/scheduling/utils/appointment-time";

type UseAppointmentSchedulerOptions = {
  initialServiceId: string;
};

function mapErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function useAppointmentScheduler(options: UseAppointmentSchedulerOptions) {
  const queryClient = useQueryClient();
  const [serviceId, setServiceId] = useState(options.initialServiceId);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [calendarAddUrl, setCalendarAddUrl] = useState<string | null>(null);
  const [calendarMailtoUrl, setCalendarMailtoUrl] = useState<string | null>(null);

  const dateKey = useMemo(
    () => (selectedDate ? dateToDateKey(selectedDate) : ""),
    [selectedDate]
  );

  const availabilityQuery = useQuery({
    queryKey: ["appointments", "availability", serviceId, dateKey],
    enabled: Boolean(serviceId && dateKey),
    queryFn: async () => fetchAppointmentAvailability({ serviceId, dateKey }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!serviceId || !dateKey || !selectedSlot) {
        throw new Error("Selecione serviço, data e horário para agendar.");
      }

      return createCustomerAppointment({
        serviceId,
        dateKey,
        startTime: selectedSlot.startTime,
        notes,
      });
    },
    onSuccess: async (appointment) => {
      setSuccessMessage(
        `Agendamento solicitado para ${appointment.scheduledDateKey} às ${appointment.scheduledStartTime}.`
      );
      setCalendarAddUrl(appointment.googleCalendarAddUrl || null);
      setCalendarMailtoUrl(
        appointment.googleCalendarAddUrl
          ? `mailto:?subject=${encodeURIComponent(
              `Salvar agendamento PetCorner - ${appointment.serviceName}`
            )}&body=${encodeURIComponent(
              `Use este link para salvar no Google Agenda:\n${appointment.googleCalendarAddUrl}`
            )}`
          : null
      );
      setSelectedSlot(null);
      setNotes("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments", "availability"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-profile"] }),
      ]);
    },
  });

  const handleServiceChange = useCallback((nextServiceId: string) => {
    setServiceId(nextServiceId);
    setSelectedSlot(null);
    setSuccessMessage(null);
  }, []);

  const handleDateChange = useCallback((date: Date | null) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSuccessMessage(null);
  }, []);

  const availableSlots = availabilityQuery.data?.slots || [];
  const errorMessage = availabilityQuery.error
    ? mapErrorMessage(availabilityQuery.error, "Não foi possível carregar os horários.")
    : createMutation.error
      ? mapErrorMessage(createMutation.error, "Não foi possível criar o agendamento.")
      : null;

  return {
    serviceId,
    selectedDate,
    selectedSlot,
    notes,
    successMessage,
    calendarAddUrl,
    calendarMailtoUrl,
    slots: availableSlots,
    isLoadingAvailability: availabilityQuery.isFetching,
    isCreating: createMutation.isPending,
    errorMessage,
    setServiceId: handleServiceChange,
    setSelectedDate: handleDateChange,
    setSelectedSlot,
    setNotes,
    submit: createMutation.mutateAsync,
  };
}
