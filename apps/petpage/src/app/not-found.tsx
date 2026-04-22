import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Pagina nao encontrada</h1>
      <p className="text-sm text-slate-600">O recurso solicitado nao existe ou foi movido.</p>
      <Link
        href="/"
        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Voltar para a home
      </Link>
    </main>
  );
}
