import { useEffect, useMemo, useState } from "react"
import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import { confirmAlert } from "react-confirm-alert"
import "react-confirm-alert/src/react-confirm-alert.css"
import { Timestamp } from "firebase/firestore"

import { useClient } from "../../contexts/ClientContext"
import { useDog } from "../../contexts/DogContext"
import { useProduct } from "../../contexts/ProductContext"
import type {
  EntityMap,
  RotaKey,
  FieldDef,
  ColumnType,
} from "../../types/entities"
import Form from "../Form/Form"
import "../Clientes/cliente.css"

type Mode = "create" | "edit" | "exclude"

type Props<K extends RotaKey> = {
  rotaKey: K
  columns: ColumnType<K>[]
}

// Schema com tipagem simples e direta
const getSchemaForRota = <K extends RotaKey>(rotaKey: K): FieldDef<EntityMap[K]>[] => {
  switch (rotaKey) {
    case "clientes":
      return [
        { name: "name", label: "Nome", type: "text" },
        { name: "age", label: "Data de nascimento", type: "date" },
        { name: "email", label: "E‑mail", type: "email" },
        { name: "phone", label: "Telefone", type: "phone" },
      ] as FieldDef<EntityMap[K]>[]
    case "caes":
      return [
        { name: "name", label: "Nome", type: "text" },
        { name: "age", label: "Idade (anos)", type: "number" },
        { name: "breed", label: "Raça", type: "text" },
        { name: "weight", label: "Peso (kg)", type: "number" },
      ] as FieldDef<EntityMap[K]>[]
    case "prods":
      return [
        { name: "name", label: "Nome", type: "text" },
        { name: "price", label: "Preço", type: "number" },
        { name: "code", label: "Código", type: "text" },
        { name: "quantity", label: "Quantidade", type: "number" },
      ] as FieldDef<EntityMap[K]>[]
    default:
      return [] as FieldDef<EntityMap[K]>[]
  }
}

export default function EntityManager<K extends RotaKey>({
  rotaKey,
  columns,
}: Props<K>) {
  // Hooks invocados sempre (mesma ordem)
  const clientContext = useClient("clientes")
  const dogContext = useDog("caes")
  const productContext = useProduct("prods")

  // Função helper tipada para selecionar o contexto correto
  const getTypedContext = () => {
    if (rotaKey === "clientes") {
      return clientContext as unknown as {
        items: EntityMap[K][]
        selected: EntityMap[K] | null
        setSelected: (item: EntityMap[K] | null) => void
        fetchAll: () => Promise<void>
        create: (data: Omit<EntityMap[K], 'id'>) => Promise<void>
        update: (id: string, data: Omit<EntityMap[K], 'id'>) => Promise<void>
        remove: (id: string) => Promise<void>
        searchByName: (name: string) => Promise<void>
      }
    } else if (rotaKey === "caes") {
      return dogContext as unknown as {
        items: EntityMap[K][]
        selected: EntityMap[K] | null
        setSelected: (item: EntityMap[K] | null) => void
        fetchAll: () => Promise<void>
        create: (data: Omit<EntityMap[K], 'id'>) => Promise<void>
        update: (id: string, data: Omit<EntityMap[K], 'id'>) => Promise<void>
        remove: (id: string) => Promise<void>
        searchByName: (name: string) => Promise<void>
      }
    } else {
      return productContext as unknown as {
        items: EntityMap[K][]
        selected: EntityMap[K] | null
        setSelected: (item: EntityMap[K] | null) => void
        fetchAll: () => Promise<void>
        create: (data: Omit<EntityMap[K], 'id'>) => Promise<void>
        update: (id: string, data: Omit<EntityMap[K], 'id'>) => Promise<void>
        remove: (id: string) => Promise<void>
        searchByName: (name: string) => Promise<void>
      }
    }
  }

  const context = getTypedContext()
  const {
    items,
    selected,
    setSelected,
    fetchAll,
    create,
    update,
    remove,
    searchByName,
  } = context

  // Fields tipados corretamente
  const fields = useMemo<FieldDef<EntityMap[K]>[]>(
    () => getSchemaForRota(rotaKey),
    [rotaKey]
  )

  const [formData, setFormData] = useState<Record<string, string>>(
    () => Object.fromEntries(fields.map((f) => [f.name, ""]))
  )
  const [mode, setMode] = useState<Mode | null>(null)
  const [alert, setAlert] = useState<{ severity: "success" | "warning"; message: string } | null>(null)
  const [searchName, setSearchName] = useState("")

  useEffect(() => {
    fetchAll()
  }, [rotaKey, fetchAll])

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [alert])

  useEffect(() => {
    if (selected) {
      const newForm: Record<string, string> = {}

      fields.forEach((field) => {
        const key = field.name as keyof EntityMap[K]
        const value = (selected as EntityMap[K])[key]

        newForm[field.name] =
          value instanceof Timestamp
            ? value.toDate().toISOString().substring(0, 10)
            : typeof value === 'string' || typeof value === 'number'
            ? value.toString()
            : ''
      })
      setFormData(newForm)
    }
  }, [selected, fields])

  function convertData(): Omit<EntityMap[K], "id"> {
    const result = {} as Record<string, unknown>
    
    fields.forEach((field) => {
      const raw = formData[field.name]
      
      if (raw !== undefined && raw !== '') {
        if (field.type === "date") {
          result[field.name] = Timestamp.fromDate(new Date(raw))
        } else if (field.type === "number") {
          result[field.name] = Number(raw)
        } else {
          result[field.name] = raw
        }
      }
    })
    
    return result as Omit<EntityMap[K], "id">
  }

  

  const handleSubmit = async () => {
    if (fields.some((f) => !formData[f.name])) {
      setAlert({ severity: "warning", message: "Preencha todos os campos." })
      return
    }
    
    const parsed = convertData()
    
    if (mode === "create") {
      await create(parsed)
      setAlert({ severity: "success", message: `${rotaKey} criado com sucesso!` })
      resetUI()
    } else if (mode === "edit" && selected?.id) {
      confirmAlert({
        title: "Confirmar edição",
        message: `Editar item de ${rotaKey}?`,
        buttons: [
          {
            label: "Sim",
            onClick: async () => {
              await update(selected.id, parsed)
              setAlert({ severity: "success", message: `${rotaKey} editado com sucesso!` })
              resetUI()
            },
          },
          { label: "Não" },
        ],
      })
    } else if (mode === "exclude" && selected?.id) {
      confirmAlert({
        title: "Confirmar exclusão",
        message: `Excluir item de ${rotaKey}?`,
        buttons: [
          {
            label: "Sim",
            onClick: async () => {
              await remove(selected.id)
              setAlert({ severity: "success", message: `${rotaKey} excluído com sucesso!` })
              resetUI()
            },
          },
          { label: "Não" },
        ],
      })
    }
  }

  const resetUI = () => {
    setMode(null)
    setSelected(null)
    setFormData(Object.fromEntries(fields.map((f) => [f.name, ""])))
    setSearchName("")
  }

  const handleSearchNameChange = (value: string) => {
    setSearchName(value)
    searchByName(value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }))
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit()
  }

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
                {columns.map((col, i) => (
                  <th key={i}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  {columns.map((col, ci) => {
                    const raw = (row as EntityMap[K])[col.accessor]
                    const display =
                      raw instanceof Timestamp
                        ? raw.toDate().toLocaleDateString()
                        : typeof raw === "string" || typeof raw === "number"
                        ? raw
                        : ""
                    return <td key={ci}>{display}</td>
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
          fields={fields}
          mode={mode}
          searchName={searchName}
          setSearchName={handleSearchNameChange}
          handleInput={handleInputChange}
          handleSubmit={handleFormSubmit}
          handleBack={resetUI}
          textButton={mode === "create" ? "Inserir" : mode === "edit" ? "Alterar" : "Excluir"}
          textTitle={`${mode === "create" ? "Novo" : mode === "edit" ? "Editar" : "Excluir"} ${rotaKey === "clientes" ? "Cliente" : rotaKey === "caes" ? "Cachorro" : "Produto"} `}
        />
      )}
    </>
  )
}