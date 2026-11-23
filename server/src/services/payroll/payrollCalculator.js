
/**
 * Módulo de Nómina - Restaurante Orígenes SV
 * Contiene las funciones para calcular los salarios de los empleados.
 */

// Calcula el salario bruto de una quincena a partir del salario mensual.
export function calcularSalarioBrutoQuincenal(salarioMensual, numeroQuincena) {

  // Convertimos el salario a número y validamos que sea correcto.
  const salario = Number(salarioMensual);

  if (!Number.isFinite(salario) || salario <= 0) {
    throw new Error("El salario mensual debe ser mayor a cero");
  }

  // Verificamos que la quincena sea válida (1 o 2).
  if (numeroQuincena !== 1 && numeroQuincena !== 2) {
    throw new Error("La quincena debe ser 1 o 2");
  }

  // Convertimos el salario a centavos para evitar errores de redondeo.
  const centavosMensuales = Math.round(salario * 100);
  const primeraQuincena = Math.floor(centavosMensuales / 2);

  // Calculamos el monto correspondiente a la quincena seleccionada.
  const centavosQuincenales =
    numeroQuincena === 1
      ? primeraQuincena
      : centavosMensuales - primeraQuincena;

  // Devolvemos el salario quincenal en dólares.
  return centavosQuincenales / 100;
}
