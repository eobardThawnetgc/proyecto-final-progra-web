
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
/**
 * Calcula un descuento quincenal a partir del salario mensual.
 * Divide el descuento en dos partes sin perder centavos.
 */
function calcularDescuentoQuincenal(
  salarioMensual,
  numeroQuincena,
  porcentaje,
  topeMensual = Infinity
) {
  const salario = Number(salarioMensual);

  // Reutilizamos las validaciones de salario y quincena.
  calcularSalarioBrutoQuincenal(salario, numeroQuincena);

  // Calculamos el descuento mensual respetando el tope.
  const baseCotizable = Math.min(salario, topeMensual);
  const centavosMensuales = Math.round(
    baseCotizable * porcentaje * 100
  );

  // Distribuimos los centavos entre ambas quincenas.
  const primeraQuincena = Math.floor(centavosMensuales / 2);

  const centavosQuincenales =
    numeroQuincena === 1
      ? primeraQuincena
      : centavosMensuales - primeraQuincena;

  return centavosQuincenales / 100;
}

// Calcula el ISSS del empleado (3%, con tope mensual de $1,000).
export function calcularISSSQuincenal(salarioMensual, numeroQuincena) {
  return calcularDescuentoQuincenal(
    salarioMensual,
    numeroQuincena,
    0.03,
    1000
  );
}

// Calcula el AFP del empleado (7.25% del salario cotizable).
export function calcularAFPQuincenal(salarioMensual, numeroQuincena) {
  return calcularDescuentoQuincenal(
    salarioMensual,
    numeroQuincena,
    0.0725
  );
}

