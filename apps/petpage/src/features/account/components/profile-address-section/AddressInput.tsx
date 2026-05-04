import type { ChangeEventHandler } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { darkInputClassName, darkLabelClassName } from "@/features/account/components/profile-form-styles";
import type { AddressFormState } from "@/features/account/types/profile-dashboard";

type AddressInputProps = {
  id: string;
  name: keyof AddressFormState;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  className?: string;
};

export function AddressInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  className,
}: AddressInputProps) {
  return (
    <div className={`space-y-1 ${className || ""}`}>
      <Label htmlFor={id} className={darkLabelClassName}>
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={darkInputClassName}
        placeholder={placeholder}
      />
    </div>
  );
}
