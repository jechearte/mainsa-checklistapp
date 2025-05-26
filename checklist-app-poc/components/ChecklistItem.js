import React from 'react';
import styles from './ChecklistItem.module.css'; // Crearemos este archivo CSS

const ChecklistItem = ({ item, result, onResultChange }) => {
  const handleButtonClick = (newResult) => {
    // Comportamiento estándar: si se pulsa el mismo botón, se deselecciona.
    const finalResult = (result === newResult) ? '' : newResult;
    onResultChange(item.id, finalResult);
  };

  return (
    <div className={styles.itemRow}>
      <div className={styles.itemDetails}>
        <span className={styles.itemId}>{item.id}</span>
        <span className={styles.itemName}>{item.nombre}</span>
      </div>
      <div className={styles.buttonGroup}>
        {/* Botón OK con emoji */}
        <button
          className={`${styles.button} ${styles.okButton} ${result === 'OK' ? styles.selected : ''}`}
          onClick={() => handleButtonClick('OK')}
          aria-pressed={result === 'OK'}
          aria-label="OK"
        >
          👍🏻
        </button>
        {/* Botón NOK con emoji */}
        <button
          className={`${styles.button} ${styles.nokButton} ${result === 'NOK' ? styles.selected : ''}`}
          onClick={() => handleButtonClick('NOK')}
          aria-pressed={result === 'NOK'}
          aria-label="No OK"
        >
          👎🏻
        </button>
        {/* Botón NA con emoji */}
        <button
          className={`${styles.button} ${styles.naButton} ${result === 'N/A' ? styles.selected : ''}`}
          onClick={() => handleButtonClick('N/A')}
          aria-pressed={result === 'N/A'}
          aria-label="No aplica"
        >
          🛠️
        </button>
        {/* Botón para el cuarto estado (antes Reset) */}
        <button
          // Aplicar clase .selected si result es 'PENDING' (o el estado que definamos)
          className={`${styles.button} ${styles.resetButton} ${result === 'PENDING' ? styles.selected : ''}`}
          onClick={() => handleButtonClick('PENDING')} // Establece el estado 'PENDING'
          aria-pressed={result === 'PENDING'}
          aria-label="Pendiente"
          title="Marcar como pendiente/resetear" 
        >
          🔄
        </button>
      </div>
    </div>
  );
};

export default ChecklistItem; 