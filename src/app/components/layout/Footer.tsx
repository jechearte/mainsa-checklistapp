export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 p-4 mt-auto">
      <div className="container mx-auto text-center">
        <p>© {new Date().getFullYear()} Mainsa - Aplicación de Checklist de Mantenimiento</p>
      </div>
    </footer>
  );
} 