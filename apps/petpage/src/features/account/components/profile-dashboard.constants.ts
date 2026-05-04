import { Box, CalendarClock, Heart, MapPin, PawPrint } from "lucide-react";
import { DEFAULT_ANIMAL_TYPE } from "@/features/account/utils/pet-options";
import type {
  AddressFormState,
  PetFormState,
  SectionNavItem,
} from "@/features/account/types/profile-dashboard";

export const SECTION_NAV_ITEMS: SectionNavItem[] = [
  { id: "pets", label: "Meus pets", icon: PawPrint },
  { id: "appointments", label: "Agendamentos", icon: CalendarClock },
  { id: "orders", label: "Pedidos", icon: Box },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "address", label: "Enderecos", icon: MapPin },
];

export const INITIAL_PET_FORM: PetFormState = {
  name: "",
  animalType: DEFAULT_ANIMAL_TYPE,
  breedSelection: "",
  breed: "",
  age: "",
  weight: "",
};

export const INITIAL_ADDRESS_FORM: AddressFormState = {
  zipCode: "",
  street: "",
  number: "",
  district: "",
  city: "",
  state: "",
  complement: "",
};

export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
