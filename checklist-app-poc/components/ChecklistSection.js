import React from 'react';
import ChecklistGroup from './ChecklistGroup';
import styles from './ChecklistSection.module.css'; // Crearemos este archivo CSS

const ChecklistSection = ({ section, results, onResultChange, groupStatuses }) => {
  // Quitar número inicial y espacio del título principal de la sección
  const formattedSectionTitle = section.nombre_seccion.replace(/^\d+\s+/, '');
  // Determinar si hay más de un grupo en esta sección
  const allowCollapse = section.grupos.length > 1;

  return (
    <section className={styles.sectionContainer}>
      {/* Usar título formateado y reducir tamaño de fuente en línea si es necesario, o mejor en CSS */}
      <h2 className={styles.sectionTitle}>{formattedSectionTitle}</h2>
      {section.grupos.map((grupo, index) => {
        // Obtenemos el ID único del grupo para buscar su estado
        const groupId = grupo.nombre_grupo || `grupo-${index}`;
        const status = groupStatuses ? groupStatuses[groupId] : 'GRAY'; // Estado por defecto GRAY

        return (
          <ChecklistGroup
            key={groupId} // Usar el mismo ID como key
            group={grupo}
            results={results}
            onResultChange={onResultChange}
            // El primer grupo se abre por defecto SOLO si hay más de uno
            defaultOpen={index === 0 && allowCollapse}
            // Indicar si el grupo debe tener la funcionalidad de colapsar
            isCollapsible={allowCollapse}
            // Pasar el estado calculado
            status={status}
          />
        );
      })}
    </section>
  );
};

export default ChecklistSection; 