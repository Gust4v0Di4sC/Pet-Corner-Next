import { Timestamp } from 'firebase/firestore'

export type Client = {
  id?: string
  name: string
  age: Timestamp
  email: string
  phone: number
}
