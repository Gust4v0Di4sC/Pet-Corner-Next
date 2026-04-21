import { Tooltip } from "react-tooltip";

import { FormFieldRenderer } from "./FormFieldRenderer";
import type { FormProps } from "./form.types";
import { createSyntheticInputChange, formatDateToString } from "./form.utils";
import "./form.css";

export default function Form({
  data,
  fields,
  mode,
  handleInput,
  handleFileUpload,
  handleSubmit,
  handleBack,
  handleResetFields,
  searchName,
  setSearchName,
  textTitle,
  textButton,
  className = "",
  backButtonLabel = "Voltar",
  resetButtonLabel = "Limpar campos",
  disableActions = false,
}: FormProps) {
  const handleDateChange = (fieldName: string, date: Date | null) => {
    handleInput(
      createSyntheticInputChange(fieldName, date ? formatDateToString(date) : "")
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`form ${className}`.trim()}>
      <h2>{textTitle}</h2>

      {mode !== "create" ? (
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
      ) : null}

      {(mode === "create" || mode === "edit") &&
        fields.map((field) => (
          <FormFieldRenderer
            key={field.name}
            field={field}
            value={data[field.name] ?? ""}
            disableActions={disableActions}
            onChange={handleInput}
            onDateChange={handleDateChange}
            onFileUpload={handleFileUpload}
          />
        ))}

      <section className="box-button-tab">
        <button type="submit" disabled={disableActions}>
          {textButton}
        </button>
        {handleResetFields ? (
          <button type="button" onClick={handleResetFields} disabled={disableActions}>
            {resetButtonLabel}
          </button>
        ) : null}
        <button type="button" onClick={handleBack} disabled={disableActions}>
          {backButtonLabel}
        </button>
      </section>
    </form>
  );
}
