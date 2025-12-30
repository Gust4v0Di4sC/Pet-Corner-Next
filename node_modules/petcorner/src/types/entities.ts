import { Timestamp } from 'firebase/firestore'

export type Client = {
  id: string
  name: string
  age: Timestamp
  email: string
  phone: number
}

export type Dog = {
  id: string
  name: string
  age: number
  breed: string
  weight: number
}

export type Product = {
  id: string
  name: string
  price: number
  code: string
  quantity: number
}

// src/types/entities.ts

export type FieldDef<T> = {
  name: keyof T & string;
  label: string;
  type: "text" | "number" | "date";
}


export type ColumnType<K extends RotaKey = RotaKey> = {
  header: string
  accessor: keyof EntityMap[K]
}

export type RotaKey = 'clientes' | 'caes' | 'prods'

export type EntityMap = {
  clientes: Client
  caes: Dog
  prods: Product
}

export type EntityHookReturn<T> = {
  items: T[]
  selected: T | null
  setSelected: (item: T | null) => void
  fetchAll: () => Promise<void>
  create: (data: Omit<T, 'id'>) => Promise<void>
  update: (id: string, data: Omit<T, 'id'>) => Promise<void>
  remove: (id: string) => Promise<void>
  searchByName: (name: string) => Promise<void>
}
