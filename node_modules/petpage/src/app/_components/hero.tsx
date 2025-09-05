import {WhatsappLogo} from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';

export function Hero() {
    return (
        <section className="bg-[#E36414] text-white relative overflow-hidden">

            <div>
                <Image src={"/hero-dog.webp"} alt="Foto do cachorro" fill sizes="100vw" priority className='object-contain opacity-60 lg:hidden' />
                <div className='absolute inset-0 bg-black opacity-60
                md:hidden'></div>
            </div>

            <div className='container mx-auto pt-16 pb-16 md:pb-0 px-4 relative'>
                <article className='grid grid-cols-1 lg:grid-cols-2 gap-8 relative '>
                    <div className='space-y-6'>
                        <h1  className="text-3xl md:text-4xl lg:text-5xl font-bold leading-10" data-aos="fade-down">
                            Seu pet merece o melhor
                        </h1>
                        <p className="lg:text-lg" data-aos="fade-right">
                            Cada rabo abanando é um sorriso para nós. Cuidamos com amor do seu fiel amigo, oferecendo o melhor em produtos e atendimento.
                        </p>
                        
                            <a href={`https://wa.me/5567999898999?text=Olá vim pelo site e gostaria de mais informações`} className="bg-green-500 px-5 py-2 rounded-md font-semibold flex items-center justify-center w-fit gap-2" target='_blank' data-aos="fade-up" data-aos-delay="500"> <WhatsappLogo className="w-5 h-5" /> Contato via whatsapp </a>
                        

                        <div className="mt-8">
                            <p className="text-sm mb-4">
                                <b className="bg-red-700 text-white px-2 py-1 rounded-md">5%</b> de desconto na primeira compra
                            </p>

                           
                        </div>
                    </div>

                    <div className='hidden md:block h-full relative'>
                        <Image src={"/hero-dog.webp"} alt="Foto Cachorro" className='object-contain' fill sizes='(max-width: 768px) 0vw, 50vw' quality={100} priority />
                    </div>
                </article>
            </div>
        </section>
    );
}