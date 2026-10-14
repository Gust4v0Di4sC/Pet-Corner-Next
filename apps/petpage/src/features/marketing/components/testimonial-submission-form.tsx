"use client";

import { useState, type FormEvent } from "react";
import { Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitCustomerTestimonial } from "@/features/marketing/services/customer-testimonial.service";

export function TestimonialSubmissionForm() {
  const [role, setRole] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await submitCustomerTestimonial({ role, content, rating });
      setHasError(false);
      setMessage("Obrigado! Seu depoimento ja foi enviado para a Pet Corner.");
      setRole("");
      setContent("");
      setRating(5);
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : "Nao foi possivel enviar o depoimento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-[#273446] p-6 shadow-xl md:p-8">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fb8b24]">
          Compartilhe sua experiencia
        </p>
        <h3 className="mt-2 text-2xl font-bold text-white">Deixe seu depoimento</h3>
        <p className="mt-2 text-sm text-slate-300">
          Entre na sua conta de cliente e conte como foi sua experiencia com a Pet Corner.
        </p>
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-slate-200">
          Como voce quer ser identificado
          <input
            type="text"
            value={role}
            maxLength={80}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Ex.: Tutora da Luna"
            className="min-h-12 rounded-2xl border border-slate-600 bg-[#1f2937] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-[#fb8b24] focus:ring-2 focus:ring-[#fb8b24]/20"
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold text-slate-200">Sua avaliacao</legend>
          <div className="flex gap-2" aria-label={`${rating} de 5 estrelas`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-full p-1 text-[#fb8b24] transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fb8b24]"
                aria-label={`${value} estrela${value === 1 ? "" : "s"}`}
              >
                <Star className={`h-6 w-6 ${value <= rating ? "fill-[#fb8b24]" : ""}`} />
              </button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-2 text-sm font-semibold text-slate-200">
          Seu depoimento
          <textarea
            required
            minLength={20}
            maxLength={600}
            rows={5}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Conte o que mais gostou no atendimento, nos produtos ou nos servicos."
            className="resize-y rounded-2xl border border-slate-600 bg-[#1f2937] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[#fb8b24] focus:ring-2 focus:ring-[#fb8b24]/20"
          />
          <span className="text-right text-xs font-normal text-slate-400">
            {content.length}/600 caracteres
          </span>
        </label>

        {message ? (
          <p
            role={hasError ? "alert" : "status"}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              hasError ? "bg-red-950/60 text-red-200" : "bg-emerald-950/60 text-emerald-200"
            }`}
          >
            {message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting || content.trim().length < 20}
          className="min-h-12 justify-center gap-2 rounded-full bg-[#fb8b24] font-bold text-white hover:bg-[#e97b18] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Enviando..." : "Enviar depoimento"}
        </Button>
      </form>
    </div>
  );
}
