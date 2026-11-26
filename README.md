# Restaurante Orígenes SV

Sistema web local de ERP y POS para administrar facturación, productos, recetas, inventario, compras, caja, empleados y nómina en varias sucursales.

## Requisitos

- Git
- Node.js `24.21.0` (versión probada por el equipo) y npm
- Docker Desktop
- Visual Studio Code es opcional

Los paquetes del proyecto también admiten Node.js `20.19+`, `22.12+` y `24+`.

## Clonar el proyecto

```powershell
git clone https://github.com/eobardThawnetgc/proyecto-final-progra-web.git
cd proyecto-final-progra-web
```

## Preparar el entorno local

### 1. Instalar dependencias del backend

Abre una terminal en la raíz del repositorio y ejecuta:

```powershell
cd server
npm install
```

Los comandos de npm y Prisma se ejecutan desde `server`, donde están `package.json` y `prisma.config.ts`.

### 2. Crear e iniciar PostgreSQL con Docker

Abre Docker Desktop. Crea el volumen para conservar la base de datos entre reinicios (solo la primera vez):

```powershell
docker volume create origenes_data
```

Crea el contenedor PostgreSQL 17:

```powershell
docker run -d --name origenes_db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=admin123 `
  -p 5437:5432 `
  -v origenes_data:/var/lib/postgresql/data `
  postgres:17
```

En PowerShell, la comilla invertida debe ser el último carácter de cada línea intermedia. Si el contenedor `origenes_db` ya existe, no ejecutes `docker run` de nuevo: usa `docker start origenes_db`. Confirma que esté activo:

```powershell
docker ps
```

Debe aparecer `origenes_db` como `Up` con el mapeo `5437->5432`.

### 3. Crear la base de datos

Solo la primera vez, crea `origenes_sv` dentro del contenedor:

```powershell
docker exec -it origenes_db createdb -U postgres origenes_sv
```

Comprueba que existe:

```powershell
docker exec -it origenes_db psql -U postgres -l
```

Si `origenes_sv` ya aparece en la lista, no la crees otra vez.

### 4. Configurar `server/.env`

Desde la carpeta `server`, crea tu archivo local a partir de la plantilla:

```powershell
Copy-Item .env.example .env
```

Abre `server/.env` y cambia `CAMBIAR_PASSWORD` por `admin123`, que es la contraseña usada en el comando Docker anterior. El archivo debe quedar así:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:admin123@localhost:5437/origenes_sv"
JWT_SECRET=clave-local-de-desarrollo
JWT_EXPIRES_IN=24h
```

No subas `server/.env` a Git. Cada integrante crea el suyo; el repositorio solo incluye `.env.example`.

### 5. Validar Prisma y aplicar las migraciones

Desde `server`, ejecuta:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate dev
npm run seed
```

Las migraciones existentes preparan el esquema. No uses `prisma db push` como flujo habitual ni crees otra migración inicial. `npm run seed` prepara el administrador de demostración, dos sucursales, insumos, doce productos preparados con recetas y un producto empacado para reventa.

Opcionalmente, puedes inspeccionar la base con Prisma Studio:

```powershell
npx prisma studio
```

Se abrirá normalmente en `http://localhost:5555`.

### 6. Iniciar el backend

Todavía desde `server`:

```powershell
npm run dev
```

Comprueba el servicio en `http://localhost:3000/api/health`; debe responder correctamente.

### 7. Instalar e iniciar el frontend

Deja el backend ejecutándose. Abre otra terminal en la raíz del repositorio y ejecuta:

```powershell
cd client
npm install
npm run dev
```

Abre la dirección que indique Vite, normalmente `http://localhost:5173`. El proxy del frontend envía las solicitudes `/api` al backend en el puerto `3000`; si cambias `PORT`, actualiza también el destino en `client/vite.config.js`.

Inicia sesión con:

- Correo: `admin@origenes.sv`
- Contraseña: `Admin1234!`

Para emitir una factura, primero abre un turno en Caja.

## Detener o volver a iniciar PostgreSQL

```powershell
docker stop origenes_db
docker start origenes_db
```

`docker volume create origenes_data` conserva los datos aunque detengas el contenedor. No elimines ese volumen si quieres conservar la base de datos.

## Problemas frecuentes

- **Connection refused:** comprueba que Docker Desktop esté activo, que `origenes_db` aparezca como `Up` en `docker ps` y que `DATABASE_URL` use `localhost:5437`.
- **Prisma no encuentra `DATABASE_URL`:** confirma que `server/.env` y `server/prisma.config.ts` estén en la raíz de `server`, y ejecuta Prisma desde esa carpeta.
- **El contenedor ya existe:** ejecuta `docker start origenes_db`; no repitas `docker run`.
- **No conecta el frontend con el backend:** deja activo `npm run dev` en `server` y confirma que el puerto sea `3000`.
- **Error de esquema:** desde `server`, ejecuta `npx prisma validate`, `npx prisma generate` y `npx prisma migrate dev`.

## Módulos

- **Facturación/POS:** facturas de consumidor final y CCF, correlativos por sucursal e IVA del 13%.
- **Productos e inventario:** recetas, existencias de insumos y productos empacados, ajustes y alertas de stock mínimo.
- **Compras:** proveedores, facturas, entradas de inventario y saldos pendientes.
- **Caja:** turnos y conciliación de efectivo, tarjeta, pagos digitales, Bitcoin y Chivo Wallet.
- **Recursos humanos y nómina:** empleados y planillas quincenales.
