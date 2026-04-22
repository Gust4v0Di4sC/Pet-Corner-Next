"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type TestimonialItem = {
  content: string;
  author: string;
  role: string;
};

interface TestimonialsProps {
  items?: TestimonialItem[];
}

const AUTOPLAY_MS = 5000;

const defaultTestimonials: TestimonialItem[] = [
  {
    content:
      "Desde que comecei a levar a Luna para banho e tosa aqui, ela nunca esteve tao feliz. Atendimento impecavel e profissionais super cuidadosos.",
    author: "Mariana Souza",
    role: "Tutora da Luna (Golden Retriever)",
  },
  {
    content:
      "Compro toda a racao do Tom no Pet Corner. Entrega rapida, preco justo e produtos sempre frescos. Recomendo de olhos fechados.",
    author: "Rafael Lima",
    role: "Tutor do Tom (Gato Persa)",
  },
  {
    content:
      "O taxi pet salvou minha vida. Levam e buscam o Thor com todo carinho. Equipe nota mil, virou referencia aqui em casa.",
    author: "Ana Beatriz",
    role: "Tutora do Thor (Bulldog)",
  },
];

export function Testimonials({ items }: TestimonialsProps) {
  const testimonialItems = items?.length ? items : defaultTestimonials;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(testimonialItems.length > 1);

  const syncCarouselState = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const handleSelect = () => syncCarouselState();

    emblaApi.on("select", handleSelect);
    emblaApi.on("reInit", handleSelect);
    emblaApi.emit("select");

    return () => {
      emblaApi.off("select", handleSelect);
      emblaApi.off("reInit", handleSelect);
    };
  }, [emblaApi, syncCarouselState]);

  useEffect(() => {
    if (!emblaApi || testimonialItems.length < 2) {
      return;
    }

    const autoplay = window.setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(autoplay);
    };
  }, [emblaApi, testimonialItems.length]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  return (
    <section className="bg-[#1f2937] py-20 text-white">
      <div className="container mx-auto space-y-10 px-4">
        <header className="space-y-6">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#fb8b24]">
              Depoimentos
            </p>
            <h2 className="text-balance text-4xl font-bold md:text-5xl">
              Quem confia, recomenda
            </h2>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-[#273446] text-slate-100 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Depoimento anterior"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-[#273446] text-slate-100 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Proximo depoimento"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="-ml-5 flex">
            {testimonialItems.map((item) => (
              <div
                key={item.author}
                className="min-w-0 flex-[0_0_100%] pl-5 md:flex-[0_0_50%] xl:flex-[0_0_33.3333%]"
              >
                <Card className="h-full rounded-3xl border border-white/10 bg-[#273446] text-slate-200">
                  <CardContent className="flex h-full flex-col gap-5 p-6">
                    <div className="flex items-center gap-1 text-[#fb8b24]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-[#fb8b24]" />
                      ))}
                    </div>

                    <p className="flex-1 text-sm leading-relaxed">&quot;{item.content}&quot;</p>

                    <div className="border-t border-white/10 pt-4">
                      <p className="font-semibold text-white">{item.author}</p>
                      <p className="text-xs text-slate-400">{item.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir para depoimento ${index + 1}`}
              onClick={() => scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                selectedIndex === index ? "w-7 bg-[#fb8b24]" : "w-2.5 bg-slate-500"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
