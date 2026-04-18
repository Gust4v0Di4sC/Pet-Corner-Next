import React from "react";
import DatePicker from "react-datepicker";
import { IMaskInput } from "react-imask";
import { Tooltip } from "react-tooltip";
import "react-datepicker/dist/react-datepicker.css";

import type { RecordFormField, RecordFormMask } from "../Records/record.types";
import "./form.css";

type FormProps = {
  data: Record<string, string>;
  fields: RecordFormField[];
  mode: "create" | "edit" | "exclude";
  handleInput: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  handleSubmit: React.FormEventHandler;
  handleBack: () => void;
  searchName?: string;
  setSearchName?: (value: string) => void;
  textTitle: string;
  textButton: string;
  className?: string;
  backButtonLabel?: string;
  disableActions?: boolean;
};

const defaultMaskByType: Partial<Record<RecordFormField["type"], RecordFormMask>> = {
  phone: { mask: "(00) 00000-0000" },
};

function parseDateFromString(value: string): Date | null {
  const parts = value.split("/");

  if (parts.length !== 3) {
    return null;
  }

  const [day, month, year] = parts.map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getFieldMask(field: RecordFormField): RecordFormMask | undefined {
  return field.mask ?? defaultMaskByType[field.type];
}

function MaskedInputField({
  field,
  value,
  onChange,
  onDateChange,
}: {
  field: RecordFormField;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDateChange: (fieldName: string, date: Date | null) => void;
}) {
  if (field.type === "date") {
    return (
      <div className="box-input">
        <label htmlFor={field.name}>{field.label}</label>
        <DatePicker
          selected={parseDateFromString(value)}
          onChange={(date) => onDateChange(field.name, date)}
          dateFormat="dd/MM/yyyy"
          placeholderText={field.placeholder ?? "DD/MM/AAAA"}
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          className="form-control"
          id={field.name}
          name={field.name}
          autoComplete="off"
          disabled={field.disabled}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="box-input">
        <label htmlFor={field.name}>{field.label}</label>
        <select
          id={field.name}
          name={field.name}
          value={value}
          onChange={onChange}
          required
          disabled={field.disabled}
        >
          <option value="">{field.placeholder ?? `Selecione ${field.label.toLowerCase()}`}</option>
          {(field.options ?? []).map((option) => (
            <option key={`${field.name}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.helperText ? <small className="form__helper">{field.helperText}</small> : null}
      </div>
    );
  }

  if (field.type === "autocomplete") {
    const listId = `${field.name}-options`;

    return (
      <div className="box-input">
        <label htmlFor={field.name}>{field.label}</label>
        <input
          id={field.name}
          name={field.name}
          type="text"
          list={listId}
          inputMode={field.inputMode ?? "text"}
          value={value}
          onChange={onChange}
          required
          placeholder={field.placeholder}
          autoComplete="off"
          disabled={field.disabled}
        />
        <datalist id={listId}>
          {(field.options ?? []).map((option) => (
            <option
              key={`${field.name}-${option.value}`}
              value={option.value}
              label={option.label}
            />
          ))}
        </datalist>
        {field.helperText ? <small className="form__helper">{field.helperText}</small> : null}
      </div>
    );
  }

  const mask = getFieldMask(field);

  if (mask) {
    const maskProps = mask as Record<string, unknown>;

    return (
      <div className="box-input">
        <label htmlFor={field.name}>{field.label}</label>
        <IMaskInput
          {...maskProps}
          id={field.name}
          name={field.name}
          value={value}
          placeholder={field.placeholder ?? (field.type === "phone" ? "(XX) XXXXX-XXXX" : "")}
          inputMode={
            field.inputMode ??
            (field.type === "number" ? "decimal" : field.type === "phone" ? "tel" : "text")
          }
          autoComplete={field.type === "phone" ? "tel" : "off"}
          disabled={field.disabled}
          required
          onAccept={(acceptedValue) => {
            const syntheticEvent = {
              target: {
                name: field.name,
                value: String(acceptedValue ?? ""),
              },
            } as React.ChangeEvent<HTMLInputElement>;

            onChange(syntheticEvent);
          }}
        />
        {field.helperText ? <small className="form__helper">{field.helperText}</small> : null}
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
        inputMode={
          field.inputMode ??
          (field.type === "email" ? "email" : field.type === "number" ? "decimal" : "text")
        }
        value={value}
        onChange={onChange}
        required
        placeholder={field.placeholder ?? (field.type === "email" ? "email@exemplo.com" : "")}
        autoComplete={field.type === "email" ? "email" : "off"}
        disabled={field.disabled}
      />
      {field.helperText ? <small className="form__helper">{field.helperText}</small> : null}
    </div>
  );
}

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
  className = "",
  backButtonLabel = "Voltar",
  disableActions = false,
}: FormProps) {
  const handleDateChange = (fieldName: string, date: Date | null) => {
    const syntheticEvent = {
      target: {
        name: fieldName,
        value: date ? formatDateToString(date) : "",
      },
    } as React.ChangeEvent<HTMLInputElement>;

    handleInput(syntheticEvent);
  };

  return (
    <form onSubmit={handleSubmit} className={`form ${className}`.trim()}>
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
            onChange={(event) => setSearchName?.(event.target.value)}
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
        <button type="submit" disabled={disableActions}>
          {textButton}
        </button>
        <button type="button" onClick={handleBack} disabled={disableActions}>
          {backButtonLabel}
        </button>
      </section>
    </form>
  );
}
