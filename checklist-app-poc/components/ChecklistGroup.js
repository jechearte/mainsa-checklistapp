import React, { useState } from 'react';
import ChecklistItem from './ChecklistItem';
import styles from './ChecklistGroup.module.css'; // Crearemos este archivo CSS

const ChecklistGroup = ({ group, results, onResultChange, defaultOpen = false, isCollapsible = true, status = 'GRAY' }) => {
  // El estado solo importa si es colapsable, si no, siempre está abierto
  const [isOpen, setIsOpen] = useState(isCollapsible ? defaultOpen : true);

  // El toggle solo funciona si es colapsable
  const toggleOpen = () => {
    if (isCollapsible) {
      setIsOpen(!isOpen);
    }
  };

  // No renderizar nada si el grupo no tiene filas (aunque no debería pasar con tus datos)
  if (!group.filas || group.filas.length === 0) {
      return null;
  }

  return (
    // Añadir clase para estilo no colapsable si es necesario
    <div className={`${styles.groupContainer} ${!isCollapsible ? styles.notCollapsible : ''}`}>
      <div 
        className={`${styles.groupHeader} ${!isCollapsible ? styles.headerNotCollapsible : ''}`}
        // Solo añadir onClick y roles si es colapsable
        onClick={isCollapsible ? toggleOpen : undefined}
        role={isCollapsible ? "button" : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        aria-expanded={isCollapsible ? isOpen : undefined}
      >
        {/* Contenedor para título y estado */}
        <div className={styles.titleStatusWrapper}>
          {group.nombre_grupo && ( // Solo muestra el título si existe
            <h3 className={styles.groupTitle}>{group.nombre_grupo}</h3>
          )}
          {/* Indicador de estado */}
          <span className={`${styles.statusIndicator} ${styles[status.toLowerCase()]}`}></span>
        </div>
        {/* Mostrar flecha solo si es colapsable */}
        {isCollapsible && (
          <span className={`${styles.arrowIcon} ${isOpen ? styles.arrowDown : styles.arrowRight}`}></span>
        )}
      </div>

      {/* Renderizado condicional de las filas */} 
      {isOpen && (
        <div className={styles.itemsContainer}> 
          {group.filas.map((fila) => (
            <ChecklistItem
              key={fila.id}
              item={fila}
              result={results[fila.id] || ''}
              onResultChange={onResultChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistGroup; 