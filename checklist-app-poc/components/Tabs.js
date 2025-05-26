import React from 'react';
import styles from './Tabs.module.css';

const SectionNavigator = ({ currentSectionIndex, totalSections, onPrevious, onNext, isFirst, isLast }) => {
  // No necesitamos formatear título aquí

  return (
    <div className={styles.navigatorContainer}>
      <button
        className={`${styles.navButton} ${styles.prevButton}`}
        onClick={onPrevious}
        disabled={isFirst}
        aria-label="Sección anterior"
      >
        {/* Icono SVG Flecha Izquierda */}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
      </button>
      {/* Mostrar solo el progreso en el centro */}
      <div className={styles.titleContainer}> 
          <span className={styles.progressIndicator}>
              {currentSectionIndex + 1}/{totalSections}
          </span>
      </div>
      <button
        className={`${styles.navButton} ${styles.nextButton}`}
        onClick={onNext}
        disabled={isLast}
        aria-label="Siguiente sección"
      >
        {/* Icono SVG Flecha Derecha */}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
             <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    </div>
  );
};

export default SectionNavigator; 