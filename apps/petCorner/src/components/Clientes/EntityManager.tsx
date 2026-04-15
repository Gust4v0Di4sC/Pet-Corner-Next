import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

import Form from "../Form/Form";
import "../Clientes/cliente.css"; // seu CSS da tabela

type Mode = "create" | "edit" | "exclude";

export type ColumnDef<T> = {
  header: string;
  accessor: keyof T & string;
};

export type FieldType = "text" | "email" | "phone" | "number" | "date";

export type FieldDef<T> = {
  name: keyof T & string;
  label: string;
  type: FieldType;
};

export type CrudApi<T extends { id?: string }> = {
  items: T[];
  selected: T | null;
  setSelected: (item: T | null) => void;
  fetchAll: () => Promise<void>;
  create: (data: Omit<T, "id">) => Promise<void>;
  update: (id: string, data: Omit<T, "id">) => Promise<void>;
  remove: (id: string) => Promise<void>;
  searchByName: (name: string) => Promise<void>;
  isLoading?: boolean;
};

type Props<T extends { id?: string }> = {
  labelSingular: string; // "Cliente", "Cachorro", "Produto"
  columns: ColumnDef<T>[];
  fields: FieldDef<T>[];

  api: CrudApi<T>;

  // converte item selecionado -> strings do Form
  toForm: (selected: T | null) => Record<string, string>;

  // converte strings do Form -> payload tipado pro create/update
  fromForm: (formData: Record<string, string>) => Omit<T, "id">;
};

export default function EntityManager<T extends { id?: string }>({
  labelSingular,
  columns,
  fields,
  api,
  toForm,
  fromForm,
}: Props<T>) {
  const { items, selected, setSelected, fetchAll, create, update, remove, searchByName } = api;

  const [mode, setMode] = useState<Mode | null>(null);
  const [alert, setAlert] = useState<{ severity: "success" | "warning"; message: string } | null>(null);
  const [searchName, setSearchName] = useState("");

  // mantém o formData como "string record" porque seu <Form/> usa isso
  const emptyForm = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.name, ""])),
    [fields]
  );
  const [formData, setFormData] = useState<Record<string, string>>(emptyForm);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(t);
  }, [alert]);

  // quando selecionar item, popula form via toForm
  useEffect(() => {
    setFormData(selected ? toForm(selected) : emptyForm);
  }, [selected, toForm, emptyForm]);

  const resetUI = () => {
    setMode(null);
    setSelected(null);
    setFormData(emptyForm);
    setSearchName("");
  };

  const handleSearch = (value: string) => {
    setSearchName(value);
    searchByName(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitCore = async () => {
    if (fields.some((f) => !formData[f.name])) {
      setAlert({ severity: "warning", message: "Preencha todos os campos." });
      return;
    }

    const payload = fromForm(formData);

    if (mode === "create") {
      await create(payload);
      setAlert({ severity: "success", message: `${labelSingular} criado com sucesso!` });
      resetUI();
      return;
    }

    if (!selected?.id) {
      setAlert({ severity: "warning", message: `Selecione um ${labelSingular.toLowerCase()} primeiro.` });
      return;
    }

    if (mode === "edit") {
      confirmAlert({
        title: "Confirmar edição",
        message: `Editar ${labelSingular}?`,
        buttons: [
          {
            label: "Sim",
            onClick: async () => {
              await update(selected.id!, payload);
              setAlert({ severity: "success", message: `${labelSingular} editado com sucesso!` });
              resetUI();
            },
          },
          { label: "Não" },
        ],
      });
      return;
    }

    if (mode === "exclude") {
      confirmAlert({
        title: "Confirmar exclusão",
        message: `Excluir ${labelSingular}?`,
        buttons: [
          {
            label: "Sim",
            onClick: async () => {
              await remove(selected.id!);
              setAlert({ severity: "success", message: `${labelSingular} excluído com sucesso!` });
              resetUI();
            },
          },
          { label: "Não" },
        ],
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitCore();
  };

  return (
    <>
      {alert && (
        <Alert variant="filled" severity={alert.severity} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
          <AlertTitle>{alert.severity === "warning" ? "Aviso" : "Sucesso"}</AlertTitle>
          {alert.message}
        </Alert>
      )}

      {!mode ? (
        <>
          <table className="tabela">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.accessor}>{col.header}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row)}
                  style={{
                    cursor: "pointer",
                    opacity: selected?.id === row.id ? 0.85 : 1,
                  }}
                >
                  {columns.map((col) => {
                    const value = (row as any)[col.accessor];
                    return <td key={col.accessor}>{String(value ?? "")}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <section className="box-button-tab">
            <button onClick={() => setMode("create")}>Cadastrar</button>
            <button onClick={() => setMode("edit")}>Editar</button>
            <button onClick={() => setMode("exclude")}>Excluir</button>
          </section>
        </>
      ) : (
        <Form
          data={formData}
          fields={fields as any} // se seu Form já usa FieldDef compatível, pode remover esse cast
          mode={mode}
          searchName={searchName}
          setSearchName={handleSearch}
          handleInput={handleInputChange}
          handleSubmit={handleFormSubmit}
          handleBack={resetUI}
          textButton={mode === "create" ? "Inserir" : mode === "edit" ? "Alterar" : "Excluir"}
          textTitle={`${mode === "create" ? "Novo" : mode === "edit" ? "Editar" : "Excluir"} ${labelSingular}`}
        />
      )}
    </>
  );
}
