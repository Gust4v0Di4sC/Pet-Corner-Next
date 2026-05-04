import type { ChangeEventHandler, FormEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { AddressInput } from "@/features/account/components/profile-address-section/AddressInput";
import type { AddressFormState } from "@/features/account/types/profile-dashboard";

type AddressFormProps = {
  addressForm: AddressFormState;
  isSavingAddress: boolean;
  onAddressInputChange: ChangeEventHandler<HTMLInputElement>;
  onAddressSubmit: FormEventHandler<HTMLFormElement>;
};

export function AddressForm({
  addressForm,
  isSavingAddress,
  onAddressInputChange,
  onAddressSubmit,
}: AddressFormProps) {
  return (
    <form
      className="grid gap-3 rounded-2xl border border-slate-700 bg-[#111b2b] p-4 sm:grid-cols-2"
      onSubmit={onAddressSubmit}
    >
      <AddressInput
        id="address-zipCode"
        name="zipCode"
        label="CEP"
        value={addressForm.zipCode}
        onChange={onAddressInputChange}
        placeholder="00000-000"
        className="sm:col-span-2"
      />
      <AddressInput
        id="address-street"
        name="street"
        label="Rua"
        value={addressForm.street}
        onChange={onAddressInputChange}
        placeholder="Rua das Patas"
        className="sm:col-span-2"
      />
      <AddressInput
        id="address-number"
        name="number"
        label="Numero"
        value={addressForm.number}
        onChange={onAddressInputChange}
        placeholder="42"
      />
      <AddressInput
        id="address-district"
        name="district"
        label="Bairro"
        value={addressForm.district}
        onChange={onAddressInputChange}
        placeholder="Centro"
      />
      <AddressInput
        id="address-city"
        name="city"
        label="Cidade"
        value={addressForm.city}
        onChange={onAddressInputChange}
        placeholder="Campo Grande"
      />
      <AddressInput
        id="address-state"
        name="state"
        label="Estado"
        value={addressForm.state}
        onChange={onAddressInputChange}
        placeholder="MS"
      />
      <AddressInput
        id="address-complement"
        name="complement"
        label="Complemento"
        value={addressForm.complement}
        onChange={onAddressInputChange}
        placeholder="Apartamento, referencia, etc."
        className="sm:col-span-2"
      />

      <div className="sm:col-span-2">
        <Button
          type="submit"
          disabled={isSavingAddress}
          className="h-10 w-full rounded-full bg-[#fb8b24] text-base font-semibold text-white hover:bg-[#ef7e14] disabled:opacity-60"
        >
          {isSavingAddress ? "Salvando endereco..." : "Salvar endereco"}
        </Button>
      </div>
    </form>
  );
}
