export function toDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("pt-BR");
}

export function toDisplayDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function toDisplayPetWeight(weight: number): string {
  return weight.toFixed(1).replace(".", ",");
}

export function getAppointmentStatusLabel(status: string): string {
  if (status === "confirmed") return "Confirmado";
  if (status === "canceled") return "Cancelado";
  if (status === "completed") return "Concluido";
  return "Solicitado";
}
