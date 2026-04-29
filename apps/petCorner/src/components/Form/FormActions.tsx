import type { FormActionsProps } from "./form.types";

export function FormActions({
  submitLabel,
  backLabel = "Voltar",
  resetLabel = "Limpar campos",
  disabled = false,
  onBack,
  onReset,
}: FormActionsProps) {
  return (
    <section className="box-button-tab">
      <button type="submit" disabled={disabled}>
        {submitLabel}
      </button>

      {onReset ? (
        <button type="button" onClick={onReset} disabled={disabled}>
          {resetLabel}
        </button>
      ) : null}

      <button type="button" onClick={onBack} disabled={disabled}>
        {backLabel}
      </button>
    </section>
  );
}
