import Image from "next/image";
import Link from "next/link";
import logoImg from "@/assets/Logo-Home.svg";
import { User, Wrench } from "@phosphor-icons/react/dist/ssr";

export function NavBar() {
  return (
    <nav className="bg-[#1e293b] py-2 text-white">
      <div className="container mx-auto flex flex-col items-center px-4 md:flex-row md:justify-between">
        <div className="mb-4 flex items-center md:mb-0">
          <Image
            src={logoImg}
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

        <ul className="flex flex-col items-center gap-2 md:flex-row md:gap-8">
          <li>
            <Link href="/cart" className="hover:text-orange-300">
              Cart
            </Link>
          </li>
          <li>
            <Link href="/login" className="hover:text-orange-300">
              Login
            </Link>
          </li>
          <li>
            <Link href="/register" className="hover:text-orange-300">
              Register
            </Link>
          </li>
          <li>
            <Link href="/profile" className="hover:text-orange-300">
              Profile
            </Link>
          </li>
        </ul>

        <div className="mt-4 flex gap-4 md:mt-0">
          <Link
            href="/login"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500"
          >
            <User className="h-6 w-6 text-white" />
          </Link>
          <Link
            href="/app-react"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500"
          >
            <Wrench className="h-6 w-6 text-white" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
