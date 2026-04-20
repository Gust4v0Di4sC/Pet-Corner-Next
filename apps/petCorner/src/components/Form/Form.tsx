import React, { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import DatePicker from "react-datepicker";
import { IMaskInput } from "react-imask";
import { Tooltip } from "react-tooltip";
import "react-datepicker/dist/react-datepicker.css";

import type { RecordFormField, RecordFormMask, RecordFormOption } from "../Records/record.types";
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

function ComboboxInputField({
  field,
  value,
  onChange,
}: {
  field: RecordFormField;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const options = useMemo(() => field.options ?? [], [field.options]);
  const listboxId = `${field.name}-combobox-listbox`;

  const filteredOptions = useMemo(() => {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      return options;
    }

    return options.filter((option) => {
      const normalizedOptionValue = option.value.toLowerCase();
      const normalizedOptionLabel = option.label.toLowerCase();
      return (
        normalizedOptionValue.includes(normalizedValue) ||
        normalizedOptionLabel.includes(normalizedValue)
      );
    });
  }, [options, value]);

  const canOpen = !field.disabled && filteredOptions.length > 0;
  const isExpanded = isOpen && canOpen;
  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => listboxRef.current,
    estimateSize: () => 46,
    overscan: 8,
  });

  useEffect(() => {
    if (!isExpanded) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((previous) => {
      if (previous < 0) {
        return 0;
      }

      return previous >= filteredOptions.length ? filteredOptions.length - 1 : previous;
    });
  }, [filteredOptions.length, isExpanded]);

  useEffect(() => {
    if (!isExpanded || activeIndex < 0) {
      return;
    }

    rowVirtualizer.scrollToIndex(activeIndex, { align: "auto" });
  }, [activeIndex, isExpanded, rowVirtualizer]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const applyOptionValue = (option: RecordFormOption) => {
    const syntheticEvent = {
      target: {
        name: field.name,
        value: option.value,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
    setIsOpen(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);

    if (!field.disabled) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (!field.disabled && options.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (field.disabled || filteredOptions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((previous) =>
        previous >= filteredOptions.length - 1 ? 0 : previous + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((previous) =>
        previous <= 0 ? filteredOptions.length - 1 : previous - 1
      );
      return;
    }

    if (event.key === "Enter" && isExpanded && activeIndex >= 0) {
      const selectedOption = filteredOptions[activeIndex];

      if (selectedOption) {
        event.preventDefault();
        applyOptionValue(selectedOption);
      }

      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const toggleDropdown = () => {
    if (field.disabled || options.length === 0) {
      return;
    }

    setIsOpen((current) => !current);
  };

  return (
    <div className="box-input">
      <label htmlFor={field.name}>{field.label}</label>
      <div
        className={`form-combobox${isExpanded ? " is-open" : ""}${
          field.disabled ? " is-disabled" : ""
        }`}
        ref={containerRef}
      >
        <div className="form-combobox__control">
          <input
            id={field.name}
            name={field.name}
            type="text"
            inputMode={field.inputMode ?? "text"}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            required
            placeholder={field.placeholder}
            autoComplete="off"
            disabled={field.disabled}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isExpanded}
            aria-haspopup="listbox"
            aria-activedescendant={
              isExpanded && activeIndex >= 0
                ? `${field.name}-combobox-option-${activeIndex}`
                : undefined
            }
          />
          <button
            type="button"
            className="form-combobox__toggle"
            onClick={toggleDropdown}
            disabled={field.disabled || options.length === 0}
            aria-label={`Abrir opcoes de ${field.label.toLowerCase()}`}
            tabIndex={-1}
          >
            <svg
              className={`form-combobox__chevron${isExpanded ? " is-open" : ""}`}
              viewBox="0 0 12 8"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M1 1.25L6 6.25L11 1.25" />
            </svg>
          </button>
        </div>

        {isExpanded ? (
          <ul id={listboxId} className="form-combobox__menu" role="listbox" ref={listboxRef}>
            <li
              className="form-combobox__virtual-space"
              role="presentation"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const option = filteredOptions[virtualRow.index];

                if (!option) {
                  return null;
                }

                const index = virtualRow.index;
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${field.name}-option-${option.value}`}
                  id={`${field.name}-combobox-option-${index}`}
                  type="button"
                  className={`form-combobox__option${isSelected ? " is-selected" : ""}${
                    isActive ? " is-active" : ""
                  }`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyOptionValue(option)}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {option.label}
                </button>
              );
              })}
            </li>
          </ul>
        ) : null}
      </div>
      {field.helperText ? <small className="form__helper">{field.helperText}</small> : null}
    </div>
  );
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
    return <ComboboxInputField field={field} value={value} onChange={onChange} />;
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
