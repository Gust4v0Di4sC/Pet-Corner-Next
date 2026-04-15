// src/pages/Login/components/LoginButton.tsx
type Props = {
  type?: "button" | "submit";
  label: string;
  onHover?: (value: boolean) => void;
};

export default function LoginButton({ type = "button", label, onHover }: Props) {
  return (
    <button
      className="btn-primary login-button"
      type={type}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {label}
    </button>
  );
}
