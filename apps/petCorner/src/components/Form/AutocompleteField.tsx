import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { FormField, FormFieldOption, FormInputChangeHandler } from "./form.types";
import { FormFieldFrame } from "./FormFieldFrame";
import { createSyntheticInputChange } from "./form.utils";

type Props = {
  field: FormField;
  value: string;
  disabled: boolean;
  onChange: FormInputChangeHandler;
};

export function AutocompleteField({ field, value, disabled, onChange }: Props) {
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

  const isDisabled = disabled || field.disabled;
  const canOpen = !isDisabled && filteredOptions.length > 0;
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

  const applyOptionValue = (option: FormFieldOption) => {
    onChange(createSyntheticInputChange(field.name, option.value));
    setIsOpen(false);
  };

  const handleInputChange: FormInputChangeHandler = (event) => {
    onChange(event);

    if (!isDisabled) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (!isDisabled && options.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled || filteredOptions.length === 0) {
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
    if (isDisabled || options.length === 0) {
      return;
    }

    setIsOpen((current) => !current);
  };

  return (
    <FormFieldFrame fieldId={field.name} label={field.label} helperText={field.helperText}>
      <div
        className={`form-combobox${isExpanded ? " is-open" : ""}${
          isDisabled ? " is-disabled" : ""
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
            required={field.required !== false}
            placeholder={field.placeholder}
            autoComplete="off"
            disabled={isDisabled}
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
            disabled={isDisabled || options.length === 0}
            aria-label={`Abrir opções de ${field.label.toLowerCase()}`}
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
    </FormFieldFrame>
  );
}
