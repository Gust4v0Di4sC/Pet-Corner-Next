import Image from "next/image"
import about1Img from "/public/about-1.png"
import about2Img from "/public/about-2.png"
import { Check, MapPin } from "lucide-react";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";


export function About(){
    return (
      <section className="bg-[#FDF6ec] py-16">
        <div className="container px-4 mx-auto ">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="relative" data-aos="fade-up-right" data-aos-delay="300">
                    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden">
                    <Image
                        src={about1Img}
                        alt="Foto do cachorro"
                        className="object-cover hover:scale-110 duration-300"
                        fill
                        quality={100}
                        priority
                    />
                    </div>

                    <div className="absolute w-40 h-40 right-4 -bottom-8 rounded-lg border-4 overflow-hidden border-white">
                    <Image
                        src={about2Img}
                        alt="Foto do gato 2"
                        className="object-cover hover:scale-110 duration-300"
                        fill
                        quality={100}
                        priority
                    />
                    </div>
                </div>

                <div className="space-y-6 mt-10" data-aos="fade-up-left" data-aos-delay="300">
                    <h2 className="text-4xl font-bold">SOBRE</h2>

                    <p>
                        A PetShop é uma loja especializada em produtos para animais de estimação. Nossa missão é oferecer os melhores produtos para o seu pet, garantindo a saúde e o bem-estar do seu animal.
                    </p>

                    <ul className="space-y-4">
                        <li className="flex items-center gap-2">
                            <Check className="text-red-500"/>
                            <span>Produtos de qualidade</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="text-red-500"/>
                            <span>Entrega rápida</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="text-red-500"/>
                            <span>Atendimento personalizado</span>
                        </li>
                    </ul>

                    <div className="flex gap-2">
                        <a href={`https://wa.me/5567999898999?text=Olá vim pelo site e gostaria de mais informações`} target="_blank" className="bg-[#E84C3D] text-white flex items-center justify-center w-fit gap-2 px-4 py-4 rounded-md">
                            <WhatsappLogo className="w-5 h-5 text-white"/>
                            Contato via Whatsapp
                        </a>

                        <a href="#" className="flex items-center justify-center w-fit gap-2 px-4 py-4 rounded-md">
                            <MapPin className="w-5 h-5 text-black"/>
                            Endereço da loja
                        </a>
                    </div>
                    
                </div>
            </div>

          
        </div>
        
      </section>
    );
}