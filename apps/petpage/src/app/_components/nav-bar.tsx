import Image from "next/image";
import { User, Wrench } from "@phosphor-icons/react/dist/ssr";


export function NavBar(){
    return (
      <nav className="bg-[#1e293b] py-2 text-white">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Image
              src={"@/assets/Logo-Home.svg"}
              alt={"Logo do petshop"}
              width={100}
              height={40}
              quality={100}
              style={{
                width: "auto",
                height: "auto",
              }}
              className="object-contain"
              unoptimized
            />
          </div>

          

          {/* Links de navegação */}
          <ul className="flex flex-col items-center gap-2 md:flex-row md:gap-8">
            <li>Testimonials</li>
            <li>Products</li>
            <li>About</li>
            <li>Contact</li>
          </ul>

          {/* Ícones de usuário e chave */}
          <div className="flex gap-4 mt-4 md:mt-0">
            {" "}
            {/* Usei gap para espaçamento entre os ícones */}
            <a
              href="#"
              target="_self"
              className="bg-orange-500 rounded-full p-2 flex items-center justify-center w-10 h-10"
            >
              {" "}
              {/* Estilo para o círculo e ícone */}
              <User className="w-6 h-6 text-white" />{" "}
              {/* Ajustei o tamanho do ícone e a cor */}
            </a>
            <a
              href="/app-react"
              target="_self"
              className="bg-orange-500 rounded-full p-2 flex items-center justify-center w-10 h-10"
            >
              {" "}
              {/* Estilo para o círculo e ícone */}
              <Wrench className="w-6 h-6 text-white" />{" "}
              {/* Ajustei o tamanho do ícone e a cor */}
            </a>
          </div>
        </div>
      </nav>
    );
}