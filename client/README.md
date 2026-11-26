# Frontend

El cliente está construido con React, Vite y Reactstrap. Para instrucciones completas de instalación local, configuración de PostgreSQL, migraciones, seed y arranque de ambos servicios, consulta el [README de la raíz](../README.md).

Desde esta carpeta puedes instalar dependencias y arrancar Vite:

```powershell
npm ci
npm run dev
```

Durante el desarrollo, Vite reenvía las solicitudes `/api` al backend local en `http://127.0.0.1:3000`.
