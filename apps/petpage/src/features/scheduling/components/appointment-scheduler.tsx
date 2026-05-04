"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { type FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLandingServices } from "@/features/marketing/hooks/use-landing-services";
import { useAppointmentScheduler } from "@/features/scheduling/hooks/use-appointment-scheduler";

type AppointmentSchedulerProps = {
  initialServiceId: string;
  customerName: string;
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "Selecione uma data";
  }

  return value.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function AppointmentScheduler({
  initialServiceId,
  customerName,
}: AppointmentSchedulerProps) {
  const { services, isLoading: isLoadingServices, errorMessage: servicesError } = useLandingServices();
  const scheduler = useAppointmentScheduler({ initialServiceId });
  const { serviceId, setServiceId } = scheduler;

  useEffect(() => {
    if (serviceId || !services.length) {
      return;
    }

    setServiceId(services[0].id);
  }, [serviceId, services, setServiceId]);

  const selectedService = services.find((service) => service.id === scheduler.serviceId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await scheduler.submit();
    } catch {
      return;
    }
  };

  return (
    <section className="bg-[#f6f2e8] py-10 md:py-16">
      <div className="container mx-auto grid min-w-0 gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <header className="min-w-0 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fb8b24]">
            Agendamento online
          </p>
          <div className="space-y-3">
            <h1 className="text-balance text-3xl font-bold text-slate-800 sm:text-4xl md:text-5xl">
              Escolha o melhor horário para o seu pet
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
              Olá, {customerName}. Selecione um serviço, escolha uma data disponível e envie a
              solicitação para confirmação da equipe Pet Corner.
            </p>
          </div>

          {selectedService ? (
            <div className="rounded-lg border border-slate-300/80 bg-white/75 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{selectedService.title}</p>
              <p className="mt-1">{selectedService.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                {selectedService.duration} | {selectedService.price}
              </p>
            </div>
          ) : null}
        </header>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="min-w-0 space-y-5 rounded-lg border border-slate-200 bg-[#efefef] p-4 shadow-[0_20px_45px_-35px_rgba(30,41,59,0.7)] sm:p-5 md:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appointment-service" className="text-sm font-semibold text-slate-700">
                Serviço
              </Label>
              <Select
                id="appointment-service"
                value={scheduler.serviceId}
                onChange={(event) => scheduler.setServiceId(event.target.value)}
                disabled={isLoadingServices}
                className="h-11 rounded-lg border-slate-300 bg-white px-3 text-sm text-slate-800"
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Data</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <DatePicker
                  selected={scheduler.selectedDate}
                  onChange={(date) => scheduler.setSelectedDate(date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#fb8b24] focus:ring-2 focus:ring-[#fb8b24]/20"
                  placeholderText="DD/MM/AAAA"
                />
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Horários disponíveis</h2>
                <p className="text-sm text-slate-500">{formatDate(scheduler.selectedDate)}</p>
              </div>
              {scheduler.isLoadingAvailability ? (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Carregando
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {scheduler.slots.length ? (
                scheduler.slots.map((slot) => {
                  const isSelected = scheduler.selectedSlot?.startTime === slot.startTime;

                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => scheduler.setSelectedSlot(slot)}
                      className={`inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-lg border px-2 text-sm font-semibold transition sm:px-3 ${
                        isSelected
                          ? "border-[#fb8b24] bg-[#fb8b24] text-white"
                          : slot.available
                            ? "border-slate-300 bg-white text-slate-700 hover:border-[#fb8b24] hover:text-[#fb8b24]"
                            : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      {slot.startTime}
                    </button>
                  );
                })
              ) : (
                <p className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white/75 p-4 text-center text-sm text-slate-500">
                  Nenhum horário disponível para esta data.
                </p>
              )}
            </div>
          </section>

          <div className="space-y-2">
            <Label htmlFor="appointment-notes" className="text-sm font-semibold text-slate-700">
              Observações
            </Label>
            <Textarea
              id="appointment-notes"
              value={scheduler.notes}
              onChange={(event) => scheduler.setNotes(event.target.value)}
              maxLength={500}
              placeholder="Conte algo importante sobre o pet ou o atendimento."
              className="min-h-24 rounded-lg border-slate-300 bg-white text-sm text-slate-800"
            />
          </div>

          {servicesError || scheduler.errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {servicesError || scheduler.errorMessage}
            </p>
          ) : null}

          {scheduler.successMessage ? (
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700">
              <p className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {scheduler.successMessage}
              </p>
              {scheduler.calendarAddUrl ? (
                <div className="grid gap-2 sm:flex sm:flex-wrap">
                  <Button
                    asChild
                    className="h-10 w-full rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 sm:w-auto"
                  >
                    <a href={scheduler.calendarAddUrl} target="_blank" rel="noreferrer">
                      Adicionar ao Google Agenda
                    </a>
                  </Button>
                  {scheduler.calendarMailtoUrl ? (
                    <Button
                      asChild
                      className="h-10 w-full rounded-lg border border-emerald-300 bg-white px-4 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 sm:w-auto"
                    >
                      <a href={scheduler.calendarMailtoUrl}>Enviar link por e-mail</a>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={!scheduler.selectedSlot || scheduler.isCreating}
            className="h-11 w-full rounded-lg bg-[#fb8b24] text-sm font-semibold text-white hover:bg-[#ef7e14] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {scheduler.isCreating ? "Solicitando agendamento..." : "Solicitar agendamento"}
          </Button>
        </form>
      </div>
    </section>
  );
}
