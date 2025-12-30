import React from "react";
import { IMaskInput } from "react-imask";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./form.css";
import { Tooltip } from 'react-tooltip'

// Tipos dos campos
type FieldDef = {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "date" | "number";
};

type FormProps = {
  data: Record<string, string>;
  fields: FieldDef[];
  mode: "create" | "edit" | "exclude";
  handleInput: React.ChangeEventHandler<HTMLInputElement>;
  handleSubmit: React.FormEventHandler;
  handleBack: () => void;
  searchName?: string;
  setSearchName?: (v: string) => void;
  textTitle: string;
  textButton: string;
};


// Máscaras por tipo
const inputMaskByType: Record<string, string | undefined> = {
  phone: "(00) 00000-0000",
  number: "0000000000",
  text: undefined,
  email: undefined,
};

// Utilitário para converter `string` para `Date`
function parseDateFromString(value: string): Date | null {
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

// Utilitário para converter `Date` para `string`
function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Campo com ou sem máscara
function MaskedInputField({
  field,
  value,
  onChange,
  onDateChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDateChange: (fieldName: string, date: Date | null) => void;
}) {
  if (field.type === "date") {
    const selectedDate = parseDateFromString(value);

    return (
      <div className="box-input">
        <label htmlFor={field.name}>{field.label}</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => onDateChange(field.name, date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="DD/MM/AAAA"
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          className="form-control"
          id={field.name}
          name={field.name}
          autoComplete="off"
        />
      </div>
    );
  }

  const mask = inputMaskByType[field.type];

  if (mask) {
    return (
      <div className="box-input">
        <label htmlFor={field.name}>{field.label}</label>
        <IMaskInput
          mask={mask}
          id={field.name}
          name={field.name}
          value={value}
          placeholder={
            field.type === "phone" ? "(XX) XXXXX-XXXX" : ""
          }
          inputMode={
            field.type === "number"
              ? "numeric"
              : field.type === "phone"
              ? "tel"
              : "text"
          }
          autoComplete={field.type === "phone" ? "tel" : "off"}
          required
          onAccept={(val) => {
            const syntheticEvent = {
              target: {
                name: field.name,
                value: val,
              },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }}
        />
      </div>
    );
  }

  return (
    <div className="box-input">
      <label htmlFor={field.name}>{field.label}</label>
      <input
        id={field.name}
        name={field.name}
        type={field.type === "email" ? "email" : "text"}
        inputMode={field.type === "email" ? "email" : "text"}
        value={value}
        onChange={onChange}
        required
        placeholder={field.type === "email" ? "email@exemplo.com" : ""}
        autoComplete={field.type === "email" ? "email" : "off"}
      />
    </div>
  );
}

// Componente principal
export default function Form({
  data,
  fields,
  mode,
  handleInput,
  handleSubmit,
  handleBack,
  searchName,
  setSearchName,
  textTitle,
  textButton,
}: FormProps) {
  const handleDateChange = (fieldName: string, date: Date | null) => {
    const formatted = date ? formatDateToString(date) : "";
    const syntheticEvent = {
      target: {
        name: fieldName,
        value: formatted,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleInput(syntheticEvent);
  };



  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>{textTitle}</h2>

      {mode !== "create" && (
        <div className="box-input">
          <Tooltip id="my-tooltip" />
          <label htmlFor="searchName">Buscar por nome:</label>
          <input
            id="searchName"
            type="text"
            name="searchName"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={`Digite aqui o nome do ${textTitle.toLowerCase()} a ser editado`}
            data-tooltip-place="top"
            placeholder={`Buscar por ${textTitle.toLowerCase()}`}
            value={searchName || ""}
            onChange={(e) => setSearchName?.(e.target.value)}
          />
        </div>
      )}

      {(mode === "create" || mode === "edit") &&
        fields.map((field) => (
          <MaskedInputField
            key={field.name}
            field={field}
            value={data[field.name] ?? ""}
            onChange={handleInput}
            onDateChange={handleDateChange}
          />
        ))}

      <section className="box-button-tab">
        <button  type="submit">{textButton}</button>
        <button type="button" onClick={handleBack}>
          Voltar
        </button>
      </section>
    </form>
  );
}
