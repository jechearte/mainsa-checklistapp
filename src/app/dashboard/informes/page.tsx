'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerInformes, getTiposMaquinas, FiltrosInforme, InformesResponse } from '@/app/lib/api';
import { InformeListItem, TipoMaquina } from '@/app/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function InformesPage() {
  const [informesData, setInformesData] = useState<InformesResponse | null>(null);
  const [tiposMaquina, setTiposMaquina] = useState<TipoMaquina[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para los valores del formulario (lo que se muestra en la UI)
  const [formValues, setFormValues] = useState({
    tipo_maquina_id: '',
    numero_bastidor: '',
    fecha_desde: '',
    fecha_hasta: '',
  });
  
  // Estado para los filtros que se usan en la petición
  const [filtros, setFiltros] = useState<FiltrosInforme>({
    tipo_maquina_id: '',
    numero_bastidor: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 20 // 20 filas por página
  });
  
  const router = useRouter();
  
  const fetchInformes = useCallback(async (pageOverride?: number) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Usar pageOverride si se proporciona, de lo contrario usar el valor actual de filtros.page
      const currentFilters = {
        ...filtros,
        page: pageOverride !== undefined ? pageOverride : filtros.page
      };
      
      // Obtener informes con los filtros actuales
      const data = await obtenerInformes(currentFilters);
      setInformesData(data);
    } catch (err) {
      console.error('Error al cargar informes:', err);
      setError('Error al cargar los informes. Por favor, inténtalo más tarde.');
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);
  
  useEffect(() => {
    // Cargar tipos de máquina para el selector de filtro al iniciar
    const loadTiposMaquina = async () => {
      try {
        const tiposMaquinaData = await getTiposMaquinas();
        // Ordenar los tipos de máquina alfabéticamente por nombre
        const tiposMaquinaOrdenados = [...tiposMaquinaData].sort((a, b) => 
          a.nombre.localeCompare(b.nombre, 'es')
        );
        setTiposMaquina(tiposMaquinaOrdenados);
      } catch (err) {
        console.error('Error al cargar tipos de máquina:', err);
      }
    };
    
    loadTiposMaquina();
    // Ya no llamamos a fetchInformes aquí, el otro useEffect se encargará
  }, []);
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleResetFiltros = () => {
    // Limpiar valores del formulario
    setFormValues({
      tipo_maquina_id: '',
      numero_bastidor: '',
      fecha_desde: '',
      fecha_hasta: '',
    });
    
    // Limpiar filtros y volver a la página 1
    setFiltros({
      tipo_maquina_id: '',
      numero_bastidor: '',
      fecha_desde: '',
      fecha_hasta: '',
      page: 1,
      page_size: 20
    });
    
    // Ya no es necesario llamar aquí a fetchInformes
    // porque el useEffect se encargará de ello
  };

  const handleFiltrar = () => {
    // Aplicar valores del formulario a los filtros usando una función
    // para garantizar que tengamos el estado más actualizado
    setFiltros(prev => ({
      ...prev,
      ...formValues,
      page: 1 // Resetear a la primera página al filtrar
    }));
    
    // Ya no llamamos a fetchInformes aquí, sino que lo haremos mediante useEffect
  };
  
  // Efecto para realizar búsqueda cuando cambian los filtros
  useEffect(() => {
    fetchInformes();
  }, [filtros, fetchInformes]);
  
  const handlePageChange = (newPage: number) => {
    setFiltros(prev => ({
      ...prev,
      page: newPage
    }));
    
    // Ya no es necesario llamar a fetchInformes aquí, el useEffect se encargará
  };
  
  const handleVerInforme = (informeId: string) => {
    router.push(`/dashboard/informes/${informeId}`);
  };
  
  const formatDate = (dateString: string) => {
    try {
      // Si la fecha viene en formato ISO (YYYY-MM-DDTHH:MM:SSZ)
      if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
        // Extraer directamente los componentes de la fecha del string sin conversiones de timezone
        const parts = dateString.split('T');
        const datePart = parts[0]; // YYYY-MM-DD
        const timePart = parts[1].split(/[Z+]/)[0]; // HH:MM:SS (quitando Z o +timezone)
        
        // Convertir YYYY-MM-DD a DD/MM/YYYY
        const [year, month, day] = datePart.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        
        // Extraer HH:MM del tiempo
        const time = timePart.substring(0, 5); // Solo queremos HH:MM
        
        return `${formattedDate} ${time}`;
      }
      
      // Fallback al método anterior si el formato no es el esperado
      const isoDate = new Date(dateString);
      return format(isoDate, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (e) {
      console.error('Error formateando fecha:', e);
      return dateString;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-gray-50 py-4 px-6 rounded-xl shadow-lg mb-6 border-l-4 border-[#001A3D] border border-[#001A3D]/100">
        <h1 className="text-xl font-bold text-[#001A3D] flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-7 w-7 mr-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          Informes generados
        </h1>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded"
          >
            Reintentar
          </button>
        </div>
      )}
      
      {/* Sección de filtros */}
      <div className="bg-white p-6 rounded-xl mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por tipo de máquina */}
          <div>
            <label htmlFor="tipo_maquina_id" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de máquina
            </label>
            <select
              id="tipo_maquina_id"
              name="tipo_maquina_id"
              value={formValues.tipo_maquina_id}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los tipos</option>
              {tiposMaquina.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro por número de bastidor */}
          <div>
            <label htmlFor="numero_bastidor" className="block text-sm font-medium text-gray-700 mb-1">
              Número de bastidor
            </label>
            <input
              type="text"
              id="numero_bastidor"
              name="numero_bastidor"
              value={formValues.numero_bastidor}
              onChange={handleFormChange}
              placeholder="Ej: SN12345"
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filtro por fecha desde */}
          <div>
            <label htmlFor="fecha_desde" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              id="fecha_desde"
              name="fecha_desde"
              value={formValues.fecha_desde}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filtro por fecha hasta */}
          <div>
            <label htmlFor="fecha_hasta" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              id="fecha_hasta"
              name="fecha_hasta"
              value={formValues.fecha_hasta}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleResetFiltros}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md mr-2"
          >
            Limpiar filtros
          </button>
          <button
            onClick={handleFiltrar}
            className="bg-[#001A3D] hover:bg-[#002A5D] text-white font-semibold py-2 px-4 rounded-md"
          >
            Filtrar
          </button>
        </div>
      </div>
      
      {/* Tabla de informes */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#001A3D] mx-auto"></div>
            <h2 className="mt-4 text-xl font-semibold">Cargando informes...</h2>
          </div>
        ) : informesData?.data.length === 0 ? (
          <div className="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold">No se encontraron informes</h2>
            <p className="mt-2 text-gray-500">
              No hay informes que coincidan con los filtros especificados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#001A3D] text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Tipo de máquina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Nº bastidor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Informe
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {informesData?.data.map(informe => (
                  <tr key={informe.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(informe.fecha_creacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {informe.tipo_maquina}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {informe.numero_bastidor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleVerInforme(informe.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Ver informe
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Paginación */}
            {informesData && informesData.total_pages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(1, filtros.page || 1 - 1))}
                    disabled={(filtros.page || 1) <= 1}
                    className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${(filtros.page || 1) <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(informesData.total_pages, (filtros.page || 1) + 1))}
                    disabled={(filtros.page || 1) >= informesData.total_pages}
                    className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${(filtros.page || 1) >= informesData.total_pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{((filtros.page || 1) - 1) * (filtros.page_size || 20) + 1}</span> a <span className="font-medium">{Math.min((filtros.page || 1) * (filtros.page_size || 20), informesData.total)}</span> de <span className="font-medium">{informesData.total}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(Math.max(1, (filtros.page || 1) - 1))}
                        disabled={(filtros.page || 1) <= 1}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${(filtros.page || 1) <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">Anterior</span>
                        &larr;
                      </button>
                      
                      {/* Botones de páginas */}
                      {Array.from({ length: Math.min(5, informesData.total_pages) }, (_, i) => {
                        // Lógica para mostrar las páginas alrededor de la página actual
                        let pageToShow;
                        const currentPage = filtros.page || 1;
                        
                        if (informesData.total_pages <= 5) {
                          // Si hay 5 o menos páginas, mostrar todas
                          pageToShow = i + 1;
                        } else if (currentPage <= 3) {
                          // Si estamos en las primeras páginas
                          pageToShow = i + 1;
                        } else if (currentPage >= informesData.total_pages - 2) {
                          // Si estamos en las últimas páginas
                          pageToShow = informesData.total_pages - 4 + i;
                        } else {
                          // Si estamos en el medio
                          pageToShow = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageToShow}
                            onClick={() => handlePageChange(pageToShow)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${currentPage === pageToShow ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                          >
                            {pageToShow}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(Math.min(informesData.total_pages, (filtros.page || 1) + 1))}
                        disabled={(filtros.page || 1) >= informesData.total_pages}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${(filtros.page || 1) >= informesData.total_pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">Siguiente</span>
                        &rarr;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 