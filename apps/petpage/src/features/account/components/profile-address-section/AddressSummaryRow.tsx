type AddressSummaryRowProps = {
  label: string;
  value?: string;
};

export function AddressSummaryRow({ label, value }: AddressSummaryRowProps) {
  return (
    <p>
      <span className="font-semibold text-slate-100">{label}:</span> {value || "--"}
    </p>
  );
}
