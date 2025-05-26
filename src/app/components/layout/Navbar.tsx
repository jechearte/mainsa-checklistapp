import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-[#001A3D] text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          <Image 
            src="/logo_mainsa_header.png" 
            alt="Mainsa Logo" 
            width={150} 
            height={40} 
            priority
          />
        </Link>
        
        {session && (
          <div className="flex items-center">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="bg-white text-[#001A3D] px-4 py-2 rounded-md hover:bg-blue-100 transition"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
} 