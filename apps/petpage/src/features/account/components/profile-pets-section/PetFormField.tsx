import type { ChangeEventHandler, HTMLInputTypeAttribute } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { darkInputClassName, darkLabelClassName } from "@/features/account/components/profile-form-styles";
import type { PetFormState } from "@/features/account/types/profile-dashboard";

type PetFormFieldProps = {
  id: string;
  name: keyof PetFormState;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  type?: HTMLInputTypeAttribute;
  min?: number;
  step?: string;
};

export function PetFormField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  type,
  min,
  step,
}: PetFormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className={darkLabelClassName}>
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={onChange}
        className={darkInputClassName}
        placeholder={placeholder}
      />
    </div>
  );
}
