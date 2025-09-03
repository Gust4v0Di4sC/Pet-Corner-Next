"use client"
import product1 from "/public/Product1.png";
import product2 from "/public/Product2.png";
import product3 from "/public/Product3.png";
import product4 from "/public/Product4.png";

import Image from 'next/image';

import useEmblaCarousel from 'embla-carousel-react'
import {ChevronLeft, ChevronRight, ShoppingCart} from 'lucide-react'

const services = [
    {
        title: "Kit Shampoo e hidratantes",
        price: "R$ 18,90",
        image: product1,
        linkText: 'Olá, vi no site sobre Shampoo e hidratantes e gostaria de mais informações.'
      },
      {
        title: "Pote de ração de metal",
        price: "R$ 25,90",
        image: product2,
        linkText: 'Olá, vi no site sobre Pote de ração de metal e gostaria de mais informações.'
      },
      {
        title: "Ração para gatos filhotes",
        price: "R$ 38,90",
        image: product3,
        linkText: 'Olá, vi no site sobre Ração para gatos filhotes e gostaria de mais informações.'
      },
      {
        title: "Osso emborrachado brinquedo",
        price: "R$ 40",
        image: product4,
        linkText: 'Olá, vi no site sobre Osso emborrachado brinquedo e gostaria de mais informações.'
      },
]


export function Products(){

    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false, 
        align: 'start',
        slidesToScroll: 1, 
        breakpoints: {"(min-width: 768px)": {slidesToScroll: 3}}})

    function scrollPrev(){
        emblaApi?.scrollPrev();
    }

    function scrollNext(){
        emblaApi?.scrollNext();
    }

    return (
      <section className="bg-white py-16 mt-32 mb-32">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-gray-800">Produtos</h2>{" "}
          {/* Cor do título */}
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {services.map((item, index) => (
                  <div
                    key={index}
                    className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(100%/3)] px-3"
                  >
                    <article className="bg-[#1e293b] text-white rounded-lg overflow-hidden shadow-lg ">
                      <div className="w-full h-48 relative overflow-hidden">
                        {" "}
                        {/* Define uma altura fixa para as imagens */}
                        <Image
                          src={item.image}
                          alt={item.title}
                          layout="fill" // Permite que a imagem preencha o container
                          objectFit="cover" // Corta a imagem para cobrir o container sem distorcer
                          quality={100}
                          className="object-cover" // Assegura que a imagem cubra o espaço
                        />
                      </div>

                      {/* Conteúdo do Produto (Título, Preço e Botão de Carrinho) */}
                      <div className="p-4 flex flex-col">
                        <h3 className="font-semibold text-lg mb-2">
                          {item.title}
                        </h3>{" "}
                        {/* Título do produto */}
                        <div className="flex items-center justify-between mt-auto">
                          {" "}
                          {/* Alinhe preço e botão */}
                          <span className="font-light text-xl">
                            {item.price}
                          </span>{" "}
                          {/* Preço do produto */}
                          <button className="bg-orange-500 hover:bg-orange-600 p-3 rounded-md transition-colors duration-300">
                            <ShoppingCart className="w-6 h-6 text-white" />{" "}
                            {/* Ícone de carrinho */}
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="bg-white flex items-center justify-center rounded-full shadow-lg w-10 h-10 absolute left-3 -translate-y-1/2 -translate-x-1/2 top-1/2 z-10"
              onClick={scrollPrev}
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <button
              className="bg-white flex items-center justify-center rounded-full shadow-lg w-10 h-10 absolute -right-6 -translate-y-1/2 -translate-x-1/2 top-1/2 z-10"
              onClick={scrollNext}
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </section>
    );
}