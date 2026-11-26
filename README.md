# proyecto-final-progra-web

## Facturación

El módulo `/facturacion` permite emitir facturas de consumidor final y CCF para la sucursal del empleado. Los precios registrados en los productos se consideran antes de IVA; se agrega el 13% al subtotal. Para emitir un documento se requiere un turno de caja abierto. Los CCF guardan nombre o razón social, NIT y NRC del cliente.

Al instalar el módulo en una base existente, aplica las migraciones desde `server` con `npx prisma migrate deploy`; el cliente Prisma se genera con `npx prisma generate`.

