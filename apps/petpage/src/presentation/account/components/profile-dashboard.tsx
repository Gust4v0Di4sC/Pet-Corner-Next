"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Heart, LogOut, MapPin, Menu, PawPrint, Plus, RefreshCw, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomerProfileData } from "@/hooks/account/use-customer-profile-data";

type ProfileDashboardProps = {
  session: {
    customerId: string;
    name?: string;
    email: string;
    issuedAt: string;
    expiresAt: string;
  };
};

type SectionId = "orders" | "favorites" | "pets" | "address";

type SectionNavItem = {
  id: SectionId;
  label: string;
  icon: typeof Box;
};

type PetFormState = {
  name: string;
  species: string;
  breed: string;
  age: string;
};

type AddressFormState = {
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
};

const SECTION_NAV_ITEMS: SectionNavItem[] = [
  { id: "orders", label: "Pedidos", icon: Box },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "pets", label: "Meus pets", icon: PawPrint },
  { id: "address", label: "Enderecos", icon: MapPin },
];

const INITIAL_PET_FORM: PetFormState = {
  name: "",
  species: "Cao",
  breed: "",
  age: "",
};

const INITIAL_ADDRESS_FORM: AddressFormState = {
  zipCode: "",
  street: "",
  number: "",
  district: "",
  city: "",
  state: "",
  complement: "",
};

function darkInputClassName() {
  return "h-10 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-[#fb8b24] focus:ring-2 focus:ring-[#fb8b24]/25";
}

function darkLabelClassName() {
  return "text-xs font-semibold uppercase tracking-[0.06em] text-slate-300";
}

function toDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("pt-BR");
}

export function ProfileDashboard({ session }: ProfileDashboardProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionId>("pets");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showPetForm, setShowPetForm] = useState(false);
  const [petForm, setPetForm] = useState<PetFormState>(INITIAL_PET_FORM);
  const [petErrorMessage, setPetErrorMessage] = useState<string | null>(null);

  const [addressFormDraft, setAddressFormDraft] = useState<AddressFormState | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);

  const customerName = useMemo(
    () => session.name?.trim() || "Cliente Pet Corner",
    [session.name]
  );

  const {
    loading,
    errorMessage,
    pets,
    orders,
    favorites,
    address,
    isCreatingPet,
    isSavingAddress,
    createPet,
    saveAddress,
    reload,
  } = useCustomerProfileData({
    customerId: session.customerId,
    name: session.name,
    email: session.email,
  });

  const addressForm = useMemo<AddressFormState>(() => {
    if (addressFormDraft) {
      return addressFormDraft;
    }

    if (!address) {
      return INITIAL_ADDRESS_FORM;
    }

    return {
      zipCode: address.zipCode,
      street: address.street,
      number: address.number,
      district: address.district,
      city: address.city,
      state: address.state,
      complement: address.complement,
    };
  }, [address, addressFormDraft]);

  const isPetFormVisible = showPetForm || (!loading && pets.length === 0);

  useEffect(() => {
    if (!isSidebarOpen || typeof window === "undefined") {
      return;
    }

    if (window.innerWidth >= 1024) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isSidebarOpen]);

  const scrollToSection = useCallback((section: SectionId) => {
    setActiveSection(section);
    const sectionElement = document.getElementById(`profile-section-${section}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handlePetInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setPetForm((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  };

  const handleCreatePet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPetErrorMessage(null);

    const normalizedName = petForm.name.trim();
    const normalizedSpecies = petForm.species.trim();
    const normalizedBreed = petForm.breed.trim();
    const parsedAge = Number.parseInt(petForm.age, 10);

    if (!normalizedName || !normalizedSpecies || !normalizedBreed || !Number.isFinite(parsedAge)) {
      setPetErrorMessage("Preencha nome, especie, raca e idade para registrar o pet.");
      return;
    }

    if (parsedAge <= 0) {
      setPetErrorMessage("A idade precisa ser um numero maior que zero.");
      return;
    }

    try {
      await createPet({
        name: normalizedName,
        species: normalizedSpecies,
        breed: normalizedBreed,
        age: parsedAge,
      });
      setPetForm(INITIAL_PET_FORM);
      setShowPetForm(false);
    } catch {
      setPetErrorMessage("Nao foi possivel salvar o pet agora. Tente novamente.");
    }
  };

  const handleAddressInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setAddressFormDraft((currentState) => ({
      ...(currentState || addressForm),
      [name]: value,
    }));
  };

  const handleAddressSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddressMessage(null);

    try {
      await saveAddress({
        zipCode: addressForm.zipCode,
        street: addressForm.street,
        number: addressForm.number,
        district: addressForm.district,
        city: addressForm.city,
        state: addressForm.state,
        complement: addressForm.complement,
      });
      setAddressFormDraft(null);
      setAddressMessage("Endereco salvo com sucesso.");
    } catch {
      setAddressMessage("Nao foi possivel salvar o endereco agora.");
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ next: "/" }),
      });
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <div className="relative flex gap-6">
      {isSidebarOpen ? (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Fechar menu lateral"
          className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[300px] -translate-x-full transition-[width,transform] duration-300 lg:left-4 xl:left-6 lg:top-24 lg:bottom-5 lg:h-[calc(100svh-7.25rem)] lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-[-105%]"
        } ${isSidebarOpen ? "lg:w-[300px]" : "lg:w-[88px]"}`}
      >
        <Card className="h-full rounded-none border-y-0 border-l-0 border-r border-slate-700/90 bg-[#0f1722] text-slate-100 shadow-[0_24px_55px_-35px_rgba(15,23,42,0.95)] lg:rounded-[2rem] lg:border">
          <CardContent className="flex h-full flex-col gap-6 p-4">
            <div className={`flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
              <button
                type="button"
                onClick={() => setIsSidebarOpen((currentValue) => !currentValue)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-[#172236] text-slate-200 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
                aria-label={isSidebarOpen ? "Retrair menu" : "Expandir menu"}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              {isSidebarOpen ? (
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Navegacao
                </p>
              ) : null}
            </div>

            <div
              className={`flex ${
                isSidebarOpen ? "items-start gap-3 px-1" : "flex-col items-center gap-3 px-0"
              }`}
            >
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#fb8b24] text-white">
                <UserRound className="h-7 w-7" />
              </span>

              {isSidebarOpen ? (
                <div className="min-w-0 space-y-1">
                  <p className="break-words text-2xl font-semibold leading-tight text-slate-100">
                    Ola, {customerName}
                  </p>
                  <p className="max-w-full break-all text-sm text-slate-300">{session.email}</p>
                  <p className="inline-flex rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Sessao ativa
                  </p>
                </div>
              ) : (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Perfil
                </p>
              )}
            </div>

            <nav className="space-y-1.5">
              {SECTION_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    title={item.label}
                    className={`flex w-full items-center rounded-xl py-2.5 text-left text-base transition ${
                      isSidebarOpen ? "justify-start gap-3 px-3" : "justify-center px-2"
                    } ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {isSidebarOpen ? <span className="truncate">{item.label}</span> : null}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sair"
              className={`mt-auto inline-flex w-full items-center rounded-xl py-2.5 text-left text-base text-red-400 transition hover:bg-red-900/25 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                isSidebarOpen ? "justify-start gap-3 px-3" : "justify-center px-2"
              }`}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {isSidebarOpen ? (isLoggingOut ? "Saindo..." : "Sair") : null}
            </button>
          </CardContent>
        </Card>
      </aside>

      <div
        className={`min-w-0 flex-1 space-y-6 transition-[margin] duration-300 ${
          isSidebarOpen ? "lg:ml-[340px] xl:ml-[348px]" : "lg:ml-[128px] xl:ml-[136px]"
        }`}
      >
        <header className="space-y-2 px-1">
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-amber-100/35 px-3 py-1.5 text-sm font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-100/10"
            >
              <Menu className="h-4 w-4" />
              Menu
            </button>
          </div>

          <h1 className="text-balance text-5xl font-bold leading-[1.02] text-slate-100 md:text-7xl">
            Meu perfil
          </h1>
          <p className="text-lg text-amber-100/80 md:text-3xl">
            Acompanhe seus pedidos e gerencie seus pets de estimacao.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void reload()}
              className="inline-flex items-center gap-2 rounded-full border border-amber-100/35 px-3 py-1.5 text-sm font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-100/10"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar dados
            </button>
            <span className="text-xs text-amber-100/70">Sessao expira em {toDisplayDate(session.expiresAt)}</span>
          </div>
          {errorMessage ? (
            <p className="inline-flex rounded-lg bg-red-950/40 px-3 py-2 text-sm font-medium text-red-200">
              {errorMessage}
            </p>
          ) : null}
        </header>

        <section
          id="profile-section-pets"
          className="scroll-mt-24 rounded-[2rem] border border-slate-700/90 bg-[#0f1722] p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]"
        >
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-4xl font-semibold text-slate-100">Meus pets</h2>
            <button
              type="button"
              onClick={() => setShowPetForm((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-lg font-semibold text-[#fb8b24] transition hover:bg-[#fb8b24]/10"
            >
              <Plus className="h-4 w-4" />
              {isPetFormVisible ? "Fechar cadastro" : "Adicionar pet"}
            </button>
          </header>

          {loading ? (
            <p className="text-lg text-slate-300">Carregando pets...</p>
          ) : pets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-4 text-lg text-slate-300">
              Nenhum pet cadastrado nesta conta.
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {pets.map((pet) => (
                <li
                  key={pet.id}
                  className="flex items-center gap-4 rounded-[1.8rem] border border-[#6a3909] bg-[#4e2c09]/90 px-5 py-4"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#66360a] text-[#fb8b24]">
                    <PawPrint className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-3xl font-semibold text-white">{pet.name}</p>
                    <p className="text-lg text-amber-100/90">
                      {pet.breed} - {pet.age} anos
                    </p>
                    <p className="text-sm text-amber-200/80">
                      {pet.species} | Registrado em {toDisplayDate(pet.createdAtIso)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isPetFormVisible ? (
            <form
              className="mt-5 grid gap-3 rounded-2xl border border-slate-700 bg-slate-900/65 p-4 md:grid-cols-2"
              onSubmit={(event) => void handleCreatePet(event)}
            >
              <div className="space-y-1">
                <label htmlFor="pet-name" className={darkLabelClassName()}>
                  Nome
                </label>
                <input
                  id="pet-name"
                  name="name"
                  value={petForm.name}
                  onChange={handlePetInputChange}
                  className={darkInputClassName()}
                  placeholder="Ex: Luna"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="pet-species" className={darkLabelClassName()}>
                  Especie
                </label>
                <select
                  id="pet-species"
                  name="species"
                  value={petForm.species}
                  onChange={handlePetInputChange}
                  className={darkInputClassName()}
                >
                  <option value="Cao">Cao</option>
                  <option value="Gato">Gato</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="pet-breed" className={darkLabelClassName()}>
                  Raca
                </label>
                <input
                  id="pet-breed"
                  name="breed"
                  value={petForm.breed}
                  onChange={handlePetInputChange}
                  className={darkInputClassName()}
                  placeholder="Ex: Golden Retriever"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="pet-age" className={darkLabelClassName()}>
                  Idade
                </label>
                <input
                  id="pet-age"
                  name="age"
                  type="number"
                  min={1}
                  value={petForm.age}
                  onChange={handlePetInputChange}
                  className={darkInputClassName()}
                  placeholder="Ex: 3"
                />
              </div>

              {petErrorMessage ? (
                <p className="rounded-xl bg-red-950/45 px-3 py-2 text-sm font-medium text-red-200 md:col-span-2">
                  {petErrorMessage}
                </p>
              ) : null}

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={isCreatingPet}
                  className="h-10 w-full rounded-full bg-[#fb8b24] text-base font-semibold text-white hover:bg-[#ef7e14] disabled:opacity-60"
                >
                  {isCreatingPet ? "Salvando pet..." : "Cadastrar pet"}
                </Button>
              </div>
            </form>
          ) : null}
        </section>

        <section
          id="profile-section-orders"
          className="scroll-mt-24 rounded-[2rem] border border-slate-700/90 bg-[#0f1722] p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]"
        >
          <h2 className="mb-5 text-4xl font-semibold text-slate-100">Pedidos recentes</h2>

          {loading ? (
            <p className="text-lg text-slate-300">Carregando pedidos...</p>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-4 text-lg text-slate-300">
              Nenhum pedido encontrado para esta conta.
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="grid gap-3 rounded-2xl border border-slate-700 bg-[#111b2b] px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"
                >
                  <div>
                    <p className="text-4xl font-semibold text-slate-100">{order.label}</p>
                    <p className="text-lg text-slate-400">{toDisplayDate(order.dateIso)}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-emerald-500/20 px-4 py-1.5 text-lg font-semibold text-emerald-300">
                    {order.status}
                  </span>
                  <span className="text-right text-4xl font-semibold text-slate-100">
                    {order.totalLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          id="profile-section-favorites"
          className="scroll-mt-24 rounded-[2rem] border border-slate-700/90 bg-[#0f1722] p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]"
        >
          <h2 className="mb-5 text-4xl font-semibold text-slate-100">Favoritos</h2>

          {loading ? (
            <p className="text-lg text-slate-300">Carregando favoritos...</p>
          ) : favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-4 text-lg text-slate-300">
              Nenhum item favorito encontrado para esta conta.
            </div>
          ) : (
            <ul className="space-y-3">
              {favorites.map((favorite) => (
                <li
                  key={favorite.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-[#111b2b] px-4 py-3"
                >
                  <div>
                    <p className="text-2xl font-semibold text-slate-100">{favorite.name}</p>
                    <p className="text-lg text-slate-400">{favorite.category}</p>
                  </div>
                  <span className="text-2xl font-semibold text-amber-200">
                    {favorite.priceLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          id="profile-section-address"
          className="scroll-mt-24 rounded-[2rem] border border-slate-700/90 bg-[#0f1722] p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]"
        >
          <h2 className="mb-5 text-4xl font-semibold text-slate-100">Endereco de entrega</h2>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <form
              className="grid gap-3 rounded-2xl border border-slate-700 bg-[#111b2b] p-4 sm:grid-cols-2"
              onSubmit={(event) => void handleAddressSubmit(event)}
            >
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="address-zipCode" className={darkLabelClassName()}>
                  CEP
                </label>
                <input
                  id="address-zipCode"
                  name="zipCode"
                  value={addressForm.zipCode}
                  onChange={handleAddressInputChange}
                  className={darkInputClassName()}
                  placeholder="00000-000"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="address-street" className={darkLabelClassName()}>
                  Rua
                </label>
                <input
                  id="address-street"
                  name="street"
                  value={addressForm.street}
                  onChange={handleAddressInputChange}
                  className={darkInputClassName()}
                  placeholder="Rua das Patas"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="address-number" className={darkLabelClassName()}>
                  Numero
                </label>
                <input
                  id="address-number"
                  name="number"
                  value={addressForm.number}
                  onChange={handleAddressInputChange}
                  className={darkInputClassName()}
                  placeholder="42"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="address-district" className={darkLabelClassName()}>
                  Bairro
                </label>
                <input
                  id="address-district"
                  name="district"
                  value={addressForm.district}
                  onChange={handleAddressInputChange}
                  className={darkInputClassName()}
                  placeholder="Centro"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="address-city" className={darkLabelClassName()}>
                  Cidade
                </label>
                <input
                  id="address-city"
                  name="city"
                  value={addressForm.city}
                  onChange={handleAddressInputChange}
                  className={darkInputClassName()}
                  placeholder="Campo Grande"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="address-state" className={darkLabelClassName()}>
                  Estado
                </label>
                <input
                  id="address-state"
                  name="state"
                  value={addressForm.state}
                  onChange={handleAddressInputChange}
                  className={darkInputClassName()}
                  placeholder="MS"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="address-complement" className={darkLabelClassName()}>
                  Complemento
                </label>
                <input
                  id="address-complement"
                  name="complement"
                  value={addressForm.complement}
                  onChange={handleAddressInputChange}
                  className={darkInputClassName()}
                  placeholder="Apartamento, referencia, etc."
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={isSavingAddress}
                  className="h-10 w-full rounded-full bg-[#fb8b24] text-base font-semibold text-white hover:bg-[#ef7e14] disabled:opacity-60"
                >
                  {isSavingAddress ? "Salvando endereco..." : "Salvar endereco"}
                </Button>
              </div>
            </form>

            <div className="space-y-2 rounded-2xl border border-slate-700 bg-[#111b2b] p-4 text-lg text-slate-300">
              <p>
                <span className="font-semibold text-slate-100">CEP:</span> {address?.zipCode || "--"}
              </p>
              <p>
                <span className="font-semibold text-slate-100">Rua:</span> {address?.street || "--"}
              </p>
              <p>
                <span className="font-semibold text-slate-100">Numero:</span>{" "}
                {address?.number || "--"}
              </p>
              <p>
                <span className="font-semibold text-slate-100">Bairro:</span>{" "}
                {address?.district || "--"}
              </p>
              <p>
                <span className="font-semibold text-slate-100">Cidade/UF:</span>{" "}
                {[address?.city, address?.state].filter(Boolean).join(" / ") || "--"}
              </p>
              <p>
                <span className="font-semibold text-slate-100">Complemento:</span>{" "}
                {address?.complement || "--"}
              </p>
              <p>
                <span className="font-semibold text-slate-100">Atualizado em:</span>{" "}
                {address ? toDisplayDate(address.updatedAtIso) : "--"}
              </p>

              {addressMessage ? (
                <p className="mt-3 rounded-xl bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-300">
                  {addressMessage}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
