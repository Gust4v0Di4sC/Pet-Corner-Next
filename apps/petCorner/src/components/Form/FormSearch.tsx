import { Tooltip } from "react-tooltip";

import type { FormSearchProps } from "./form.types";

export function FormSearch({
  value,
  label = "Buscar por nome:",
  placeholder = "Buscar por nome",
  tooltip,
  onChange,
}: FormSearchProps) {
  return (
    <div className="box-input">
      <Tooltip id="form-search-tooltip" />

      <label htmlFor="searchName">{label}</label>

      <input
        id="searchName"
        type="text"
        name="searchName"
        data-tooltip-id="form-search-tooltip"
        data-tooltip-content={tooltip}
        data-tooltip-place="top"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
