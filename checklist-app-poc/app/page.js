'use client'; // Necesario para usar hooks como useState

import React, { useState, useMemo } from 'react';
import { checklistData } from '../data/checklistData'; // Importa los datos
import ChecklistSection from '../components/ChecklistSection';
import SectionNavigator from '../components/Tabs'; // Renombrar la importación para claridad, aunque el archivo sigue siendo Tabs.js
import styles from './page.module.css'; // Crearemos este archivo CSS

// Función para calcular el estado de un grupo
const calculateGroupStatus = (group, results) => {
  const itemIds = group.filas.map(f => f.id);
  const groupResults = itemIds.map(id => results[id] || ''); // Obtener resultados del grupo

  if (groupResults.some(res => res === 'NOK')) {
    return 'RED'; // Si hay algún NOK, es Rojo
  }
  if (groupResults.some(res => res === 'N/A' || res === 'PENDING')) {
    return 'ORANGE'; // Si hay algún N/A o PENDING (y no NOK), es Naranja
  }
  if (groupResults.every(res => res === 'OK')) {
     // Si TODOS son OK, es Verde
     // Cuidado: si no hay items, esto sería true. Podríamos añadir && itemIds.length > 0 si es necesario.
    return 'GREEN';
  }
   if (itemIds.length > 0 && groupResults.every(res => res !== '')) {
      // Si todos tienen un resultado (y no caen en los casos anteriores, implicando solo OKs), es Verde
       // Cubre el caso de solo OKs. Si hubiera otros estados, ajustar lógica
      return 'GREEN'; 
  } 

  // Si no se cumplen las condiciones anteriores (ej: faltan items por revisar)
  return 'GRAY'; 
};

export default function HomePage() {
  // Estado para almacenar los resultados de todos los ítems
  // Inicialmente vacío {}
  const [results, setResults] = useState({});
  const [activeTabIndex, setActiveTabIndex] = useState(0); // Estado para la pestaña activa
  // Nuevo estado para observaciones de items NOK
  const [nokObservations, setNokObservations] = useState({});

  const totalSecciones = checklistData.secciones.length;

  // Función para actualizar el resultado de un ítem específico
  const handleResultChange = (itemId, newResult) => {
    setResults(prevResults => ({
      ...prevResults, // Copia los resultados anteriores
      [itemId]: newResult, // Actualiza el resultado del ítem específico
    }));
    // Si un item deja de ser NOK, limpiar su observación
    if (newResult !== 'NOK') {
      setNokObservations(prevObs => {
        const newObs = { ...prevObs };
        delete newObs[itemId];
        return newObs;
      });
    }
  };

  // Handler para actualizar la observación de un item NOK
  const handleNokObservationChange = (itemId, value) => {
    setNokObservations(prevObs => ({
      ...prevObs,
      [itemId]: value,
    }));
  };

  // Funciones para navegar entre secciones
  const handlePrevious = () => {
    setActiveTabIndex(prevIndex => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setActiveTabIndex(prevIndex => Math.min(totalSecciones - 1, prevIndex + 1));
  };

  // Obtener la sección activa basada en el índice
  const activeSection = checklistData.secciones[activeTabIndex];

  // Determinar si estamos en la primera o última sección
  const isFirstSection = activeTabIndex === 0;
  const isLastSection = activeTabIndex === totalSecciones - 1;

  // Calcular los estados de los grupos de la sección activa (usando useMemo para optimizar)
  const groupStatuses = useMemo(() => {
      const statuses = {};
      if (activeSection) {
          activeSection.grupos.forEach((grupo, index) => {
              // Usamos un ID único para el grupo (nombre o índice)
              const groupId = grupo.nombre_grupo || `grupo-${index}`;
              statuses[groupId] = calculateGroupStatus(grupo, results);
          });
      }
      return statuses;
  }, [activeSection, results]); // Recalcular solo si cambia la sección activa o los resultados

  // Determinar el texto del botón principal
  const mainButtonText = isLastSection ? "Guardar" : "Continuar";

  // Lógica para el botón principal (actualmente solo navega si no es la última)
  const handleMainButtonClick = () => {
      if (!isLastSection) {
          handleNext(); // Si no es la última, avanza a la siguiente sección
      } else {
          // Incluir observaciones NOK al guardar
          console.log("Guardando revisión...", { results, nokObservations });
          // Aquí podríamos añadir validación para asegurar que todas las observaciones NOK están rellenas
          alert("Revisión guardada (simulación)");
      }
  };

  // Filtrar items NOK para la sección de resumen
  const nokItemsData = useMemo(() => Object.entries(results)
    .filter(([_, result]) => result === 'NOK')
    .map(([itemId, _]) => {
      for (const section of checklistData.secciones) {
          for (const group of section.grupos) {
              const found = group.filas.find(fila => fila.id === itemId);
              if (found) return found;
          }
      }
      return null; // Retornar null si no se encuentra (debería encontrarse)
    }).filter(Boolean), [results]); // Filtrar nulos y memoizar

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Checklist de Mantenimiento</h1>

      {/* Renderizar el navegador de secciones */}
      <SectionNavigator
        currentSectionName={activeSection?.nombre_seccion || ''}
        currentSectionIndex={activeTabIndex}
        totalSections={totalSecciones}
        onPrevious={handlePrevious}
        onNext={handleNext}
        isFirst={isFirstSection}
        isLast={isLastSection}
      />

      {/* Renderizar SOLO la sección activa */}
      {activeSection && (
        <ChecklistSection
          key={`${activeSection.nombre_seccion}-${activeTabIndex}`}
          section={activeSection}
          results={results}
          onResultChange={handleResultChange}
          groupStatuses={groupStatuses}
        />
      )}

      {/* Sección de Observaciones */}
      {nokItemsData.length > 0 && (
        <section className={styles.summarySection}>
          <h2 className={styles.summaryTitle}>Observaciones</h2>
          <ul className={styles.summaryList}>
            {nokItemsData.map(item => (
              <li key={item.id} className={styles.summaryItem}>
                <div className={styles.nokItemDetails}>
                    <strong>{item.id}:</strong> {item.nombre}
                </div>
                <textarea
                  className={styles.nokObservationTextarea} 
                  value={nokObservations[item.id] || ''} 
                  onChange={(e) => handleNokObservationChange(item.id, e.target.value)}
                  placeholder="Introduce aquí tus observaciones" 
                  rows="3" 
                  required 
                ></textarea>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Botón principal con texto dinámico y acción */}
      <button 
        className={styles.saveButton} 
        onClick={handleMainButtonClick}
      >
        {mainButtonText}
      </button>
    </main>
  );
} 