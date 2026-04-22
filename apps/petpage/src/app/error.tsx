"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Algo deu errado</h1>
      <p className="text-sm text-slate-600">
        Nao foi possivel renderizar esta pagina agora. Tente novamente.
      </p>
      <p className="text-xs text-slate-500">{error.digest ? `Ref: ${error.digest}` : error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Tentar novamente
      </button>
    </main>
  );
}
