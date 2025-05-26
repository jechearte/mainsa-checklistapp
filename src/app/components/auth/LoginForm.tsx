import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError("Credenciales incorrectas. Por favor, inténtalo de nuevo.");
      } else if (result?.ok) {
        // Obtener la sesión para acceder al token
        const session = await getSession();
        
        // Guardar el token en localStorage si está disponible
        if (session?.accessToken) {
          localStorage.setItem('token', session.accessToken);
          console.log('Token guardado en localStorage');
        }
        
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error en inicio de sesión:", error);
      setError("Ocurrió un error al iniciar sesión. Por favor, inténtalo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          {...register("email", { 
            required: "El correo electrónico es obligatorio",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Dirección de correo inválida"
            }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001A3D]"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="password" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          {...register("password", { 
            required: "La contraseña es obligatoria",
            minLength: {
              value: 4,
              message: "La contraseña debe tener al menos 4 caracteres"
            }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001A3D]"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#001A3D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#001A3D] focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
} 