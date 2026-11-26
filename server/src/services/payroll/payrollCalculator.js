
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

/**
 * Calcula el ISR quincenal según la tabla de retención
 * del Decreto Ejecutivo N.º 10 de El Salvador.
 * Recibe el salario gravado después de ISSS y AFP.
 */
export function calcularISRQuincenal(baseGravada) {
  const base = Number(baseGravada);

  // Validamos que el monto recibido sea correcto.
  if (!Number.isFinite(base) || base < 0) {
    throw new Error("La base gravada debe ser un número válido");
  }

  // Convertimos a centavos para evitar errores decimales.
  const centavos = Math.round(base * 100);

  // Primer tramo: sin retención de renta.
  if (centavos <= 27500) {
    return 0;
  }

  let porcentaje;
  let excesoCentavos;
  let cuotaFijaCentavos;

  // Identificamos el tramo correspondiente.
  if (centavos <= 44762) {
    porcentaje = 0.10;
    excesoCentavos = 27500;
    cuotaFijaCentavos = 883;
  } else if (centavos <= 101905) {
    porcentaje = 0.20;
    excesoCentavos = 44762;
    cuotaFijaCentavos = 3000;
  } else {
    porcentaje = 0.30;
    excesoCentavos = 101905;
    cuotaFijaCentavos = 14428;
  }

  // Aplicamos el porcentaje sobre el exceso y sumamos la cuota fija.
  const impuestoCentavos = Math.round(
    (centavos - excesoCentavos) * porcentaje +
    cuotaFijaCentavos
  );

  return impuestoCentavos / 100;
}

// Calcula el salario neto quincenal aplicando ISSS, AFP e ISR.
export function calcularSalarioNetoQuincenal(salarioMensual, numeroQuincena) {

  // Obtenemos el salario bruto y los descuentos legales.
  const salarioBruto = calcularSalarioBrutoQuincenal(
    salarioMensual, numeroQuincena
  );

  const isss = calcularISSSQuincenal(salarioMensual, numeroQuincena);
  const afp = calcularAFPQuincenal(salarioMensual, numeroQuincena);

  // Calculamos la base gravada después de ISSS y AFP.
  const brutoCentavos = Math.round(salarioBruto * 100);
  const isssCentavos = Math.round(isss * 100);
  const afpCentavos = Math.round(afp * 100);

  const baseGravadaCentavos = Math.max(
    0, brutoCentavos - isssCentavos - afpCentavos
  );

  const baseGravada = baseGravadaCentavos / 100;
  const isr = calcularISRQuincenal(baseGravada);

  // Calculamos el salario neto evitando errores con decimales.
  const salarioNeto =
    (baseGravadaCentavos - Math.round(isr * 100)) / 100;

  // Devolvemos el detalle que se mostrará en la planilla.
  return {
    salarioBruto,
    isss,
    afp,
    baseGravada,
    isr,
    salarioNeto
  };
}



