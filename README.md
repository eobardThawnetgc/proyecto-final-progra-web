# proyecto-final-progra-web

## Compras y proveedores

Configura `server/.env` a partir de `server/.env.example` con tu conexión de PostgreSQL y una clave JWT. Desde `server`, ejecuta `npm ci`, `npx prisma migrate deploy` y `npm run dev`. En otra terminal, desde `client`, ejecuta `npm ci --legacy-peer-deps` y `npm run dev`. El cliente usa `http://localhost:8000/api` por defecto. Configura `VITE_API_URL` en el cliente si el servidor usa otra URL.

Entra a `/compras` con un usuario `ADMIN` o `MANAGER`. El administrador puede elegir la sucursal y el gerente opera en la suya. El directorio de proveedores es compartido.

1. En **Proveedores**, registra el contacto.
2. En **Compras**, registra el número y la fecha de factura, el proveedor y los renglones. Una entrada de insumo suma existencias en la unidad de inventario. Un gasto se agrega al total de la factura.
3. Abre el detalle para consultar el saldo o registrar un pago. En **Nuevo total abonado**, escribe el monto acumulado, incluido el nuevo abono.

El servidor redondea cada subtotal a centavos y guarda la factura, los renglones y las entradas de insumos en una única transacción. Dentro de una sucursal, una factura del mismo proveedor solo se registra una vez. El saldo es el total de la factura menos los abonos y determina si queda pendiente, parcialmente pagada o pagada.
