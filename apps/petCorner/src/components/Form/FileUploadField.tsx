import { useState, type ChangeEvent } from "react";

import type { FileUploadHandler, FormField, FormInputChangeHandler } from "./form.types";
import { FormFieldFrame } from "./FormFieldFrame";
import { createSyntheticInputChange } from "./form.utils";

type Props = {
  field: FormField;
  value: string;
  disabled: boolean;
  onChange: FormInputChangeHandler;
  onFileUpload?: FileUploadHandler;
};

export function FileUploadField({
  field,
  value,
  disabled,
  onChange,
  onFileUpload,
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const hasImage = Boolean(value.trim());
  const isDisabled = disabled || field.disabled;
  const fileInputId = `${field.name}-file`;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const [selectedFile] = Array.from(event.target.files ?? []);

    if (!selectedFile) {
      return;
    }

    if (!onFileUpload) {
      setUploadError("Upload indisponivel no momento.");
      event.target.value = "";
      return;
    }

    setUploadError("");
    setIsUploading(true);
    setSelectedFileName(selectedFile.name);

    try {
      const uploadedImageUrl = await onFileUpload({
        fieldName: field.name,
        file: selectedFile,
        currentValue: value,
      });

      onChange(createSyntheticInputChange(field.name, uploadedImageUrl));
    } catch (error) {
      setUploadError(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível enviar a imagem."
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    setUploadError("");
    setSelectedFileName("");
    onChange(createSyntheticInputChange(field.name, ""));
  };

  return (
    <FormFieldFrame fieldId={fileInputId} label={field.label} helperText={field.helperText}>
      <div className="form-file-upload">
        <input
          id={fileInputId}
          className="form-file-upload__input"
          type="file"
          accept={field.accept ?? "image/*"}
          disabled={isDisabled || isUploading}
          onChange={handleFileChange}
        />

        <label
          htmlFor={fileInputId}
          className={`form-file-upload__dropzone${
            isDisabled || isUploading ? " is-disabled" : ""
          }`}
          aria-disabled={isDisabled || isUploading}
        >
          <span className="form-file-upload__icon" aria-hidden="true">
            <i className="fa fa-arrow-up-from-bracket" />
          </span>
          <span className="form-file-upload__droptext">Selecionar imagem</span>
          <small className="form-file-upload__hint">JPG, PNG, WEBP, GIF ou AVIF</small>
        </label>

        {selectedFileName ? (
          <small className="form-file-upload__status">
            Arquivo selecionado: <strong>{selectedFileName}</strong>
          </small>
        ) : null}

        <div className="form-file-upload__actions">
          <button
            type="button"
            className="form-file-upload__button"
            onClick={handleRemoveImage}
            disabled={isDisabled || isUploading || !hasImage}
          >
            Remover imagem
          </button>
        </div>

        {isUploading ? (
          <small className="form-file-upload__status">
            <i className="fa fa-spinner fa-spin" aria-hidden="true" /> Enviando imagem...
          </small>
        ) : null}

        {uploadError ? <small className="form-file-upload__error">{uploadError}</small> : null}

        {hasImage ? (
          <figure className="form-file-upload__preview">
            <img src={value} alt={`Preview de ${field.label.toLowerCase()}`} loading="lazy" />
            <figcaption>{value}</figcaption>
          </figure>
        ) : (
          <small className="form-file-upload__status">Nenhuma imagem selecionada.</small>
        )}
      </div>
    </FormFieldFrame>
  );
}
