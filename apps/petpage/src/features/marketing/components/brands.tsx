import Image from "next/image";
import golden from "@/assets/golden.png";
import royal from "@/assets/royal.png";
import primier from "@/assets/primier.png";
import whiskas from "@/assets/whiskas.png";
import natural from "@/assets/natural.png";

const brands = [
  { name: "Royal Canin", logo: royal },
  { name: "Golden", logo: golden },
  { name: "Premier", logo: primier },
  { name: "Formula Natural", logo: natural },
  { name: "Whiskas", logo: whiskas },
  { name: "Golden", logo: golden },
];

export function Brands() {
  return (
    <section className="bg-[#f6f2e8] py-16">
      <div className="gridpet">
        <div className="gridpet-content space-y-8">
          <header className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#fb8b24]">
              Marcas
            </p>
            <h2 className="text-3xl font-bold text-slate-800 md:text-4xl">
              Marcas que trabalhamos
            </h2>
          </header>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {brands.map((brand, index) => (
              <div
                key={`${brand.name}-${index}`}
                className="flex h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4"
              >
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={100}
                  height={42}
                  className="h-10 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

