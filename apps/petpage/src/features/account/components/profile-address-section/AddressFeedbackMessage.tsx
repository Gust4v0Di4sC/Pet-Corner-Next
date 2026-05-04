type AddressFeedbackMessageProps = {
  message: string | null;
  isError: boolean;
};

export function AddressFeedbackMessage({
  message,
  isError,
}: AddressFeedbackMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
        isError ? "bg-red-950/45 text-red-200" : "bg-emerald-500/20 text-emerald-300"
      }`}
    >
      {message}
    </p>
  );
}
