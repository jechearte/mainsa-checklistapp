# Mainsa Project

Este repositorio contiene tanto el frontend como el backend de la aplicación Mainsa Check.

## Estructura del Proyecto

```
/
├── MainsaCheck-web/  # Aplicación frontend en React
└── MainsaCheck/      # API backend en FastAPI
```

## Backend (FastAPI)

El backend se encuentra en la carpeta `MainsaCheck/` y está construido con FastAPI.

### Requisitos
- Python 3.8+
- pip
- virtualenv (recomendado)

### Configuración
1. Crear y activar entorno virtual:
   ```bash
   cd MainsaCheck
   python -m venv venv
   source venv/bin/activate  # En Windows: .\venv\Scripts\activate
   ```

2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

3. Configurar variables de entorno:
   - Crear archivo `.env` en la carpeta `MainsaCheck/`
   - Añadir las variables necesarias:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     SECRET_KEY=your_secret_key
     DATABASE_URL=your_database_url
     DEBUG=True
     ```

4. Ejecutar la aplicación:
   ```bash
   uvicorn app.main:app --reload
   ```

La API estará disponible en `http://localhost:8000`
Documentación de la API: `http://localhost:8000/docs`

## Frontend (React)

El frontend se encuentra en la carpeta `MainsaCheck-web/` y está construido con React.

### Requisitos
- Node.js
- npm o yarn

### Configuración
1. Instalar dependencias:
   ```bash
   cd MainsaCheck-web
   npm install   # o yarn install
   ```

2. Configurar variables de entorno:
   - Crear archivo `.env.local` en la carpeta `MainsaCheck-web/`
   - Añadir las variables necesarias

3. Ejecutar en modo desarrollo:
   ```bash
   npm run dev   # o yarn dev
   ```

La aplicación estará disponible en `http://localhost:3000`

## Desarrollo

### Estructura de Ramas
- `main`: Rama principal de producción
- `develop`: Rama de desarrollo
- `feature/*`: Ramas para nuevas características
- `hotfix/*`: Ramas para correcciones urgentes

### Convenciones de Commits
Por favor, sigue estas convenciones para los mensajes de commit:
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato
- `refactor`: Refactorización de código
- `test`: Añadir o modificar tests
- `chore`: Cambios en el proceso de build o herramientas

Ejemplo: `feat: add user authentication` 