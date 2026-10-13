"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomerAppointment,
  fetchAppointmentAvailability,
  fetchCustomerAppointmentPets,
  sendCustomerAppointmentEmail,
} from "@/features/scheduling/services/customer-appointment.service";
import type { AppointmentSlot } from "@/features/scheduling/types/appointment";
import { dateToDateKey } from "@/features/scheduling/utils/appointment-time";
import { getUserErrorMessage } from "@/lib/errors/user-error-messages";

type UseAppointmentSchedulerOptions = {
  initialServiceId: string;
};

function mapErrorMessage(error: unknown, fallback: string): string {
  return getUserErrorMessage(error, fallback, {
    permissionMessage:
      "Sua sessao expirou. Entre novamente para consultar ou criar agendamentos.",
  });
}

export function useAppointmentScheduler(options: UseAppointmentSchedulerOptions) {
  const queryClient = useQueryClient();
  const [serviceId, setServiceId] = useState(options.initialServiceId);
  const [petId, setPetId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [calendarAddUrl, setCalendarAddUrl] = useState<string | null>(null);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);

  const dateKey = useMemo(
    () => (selectedDate ? dateToDateKey(selectedDate) : ""),
    [selectedDate]
  );

  const availabilityQuery = useQuery({
    queryKey: ["appointments", "availability", serviceId, dateKey],
    enabled: Boolean(serviceId && dateKey),
    queryFn: async () => fetchAppointmentAvailability({ serviceId, dateKey }),
  });

  const petsQuery = useQuery({
    queryKey: ["customer-profile", "appointment-pets"],
    queryFn: fetchCustomerAppointmentPets,
  });

  const pets = petsQuery.data || [];
  const selectedPetId = petId || pets[0]?.id || "";

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPetId) {
        throw new Error("Cadastre e selecione um pet antes de solicitar o agendamento.");
      }

      if (!serviceId || !dateKey || !selectedSlot) {
        throw new Error("Selecione servico, data e horario para agendar.");
      }

      return createCustomerAppointment({
        serviceId,
        petId: selectedPetId,
        dateKey,
        startTime: selectedSlot.startTime,
        notes,
      });
    },
    onSuccess: async (appointment) => {
      setSuccessMessage(
        `Agendamento solicitado para ${appointment.petName} em ${appointment.scheduledDateKey} as ${appointment.scheduledStartTime}.`
      );
      setCalendarAddUrl(appointment.googleCalendarAddUrl || null);
      setCreatedAppointmentId(appointment.id);
      setEmailSuccessMessage(null);
      setSelectedSlot(null);
      setNotes("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointments", "availability"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-profile"] }),
      ]);
    },
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      if (!createdAppointmentId) {
        throw new Error("Crie o agendamento antes de enviar a confirmacao.");
      }
      await sendCustomerAppointmentEmail(createdAppointmentId);
    },
    onSuccess: () => {
      setEmailSuccessMessage("Confirmacao enviada para o e-mail atual da sua conta.");
    },
  });

  const handleServiceChange = useCallback((nextServiceId: string) => {
    setServiceId(nextServiceId);
    setSelectedSlot(null);
    setSuccessMessage(null);
    setEmailSuccessMessage(null);
  }, []);

  const handleDateChange = useCallback((date: Date | null) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSuccessMessage(null);
    setEmailSuccessMessage(null);
  }, []);

  const availableSlots = availabilityQuery.data?.slots || [];
  const errorMessage = availabilityQuery.error
    ? mapErrorMessage(availabilityQuery.error, "Nao foi possivel carregar os horarios.")
    : petsQuery.error
      ? mapErrorMessage(petsQuery.error, "Nao foi possivel carregar seus pets.")
      : createMutation.error
        ? mapErrorMessage(createMutation.error, "Nao foi possivel criar o agendamento.")
        : emailMutation.error
          ? mapErrorMessage(
              emailMutation.error,
              "Nao foi possivel enviar a confirmacao por e-mail."
            )
          : null;

  return {
    serviceId,
    petId: selectedPetId,
    pets,
    selectedDate,
    selectedSlot,
    notes,
    successMessage,
    emailSuccessMessage,
    calendarAddUrl,
    slots: availableSlots,
    isLoadingAvailability: availabilityQuery.isFetching,
    isLoadingPets: petsQuery.isLoading,
    isCreating: createMutation.isPending,
    isSendingEmail: emailMutation.isPending,
    errorMessage,
    setServiceId: handleServiceChange,
    setPetId,
    setSelectedDate: handleDateChange,
    setSelectedSlot,
    setNotes,
    submit: createMutation.mutateAsync,
    sendConfirmationEmail: emailMutation.mutateAsync,
  };
}
