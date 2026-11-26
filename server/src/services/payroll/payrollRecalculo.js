
/**
 * Calcula el ISR total a retener en junio
 * según el primer recálculo del Decreto Ejecutivo N.º 10.
 */
export function calcularRecalculoISRJunio(
  baseGravadaAcumulada,
  isrRetenidoAnteriormente,
  salarioAnual = null
) {
  const base = Number(baseGravadaAcumulada);
  const retenido = Number(isrRetenidoAnteriormente);

  // Validamos los valores recibidos.
  if (
    !Number.isFinite(base) ||
    !Number.isFinite(retenido) ||
    base < 0 ||
    retenido < 0
  ) {
    throw new Error("Los valores del recálculo no son válidos");
  }

  // Trabajamos en centavos para evitar errores decimales.
  let baseCentavos = Math.round(base * 100);
  const retenidoCentavos = Math.round(retenido * 100);

  // En junio corresponde la mitad de la deducción anual de $1,600.
  const ingresoAnual = Number(salarioAnual);
  if (salarioAnual !== null && Number.isFinite(ingresoAnual) && ingresoAnual <= 9100) {
    baseCentavos = Math.max(0, baseCentavos - 80000);
  }

  let impuestoCentavos = 0;

  // Aplicamos los tramos acumulados de enero a junio.
  if (baseCentavos <= 330000) {
    impuestoCentavos = 0;
  } else if (baseCentavos <= 537144) {
    impuestoCentavos = Math.round(
      (baseCentavos - 330000) * 0.10 + 10620
    );
  } else if (baseCentavos <= 1222860) {
    impuestoCentavos = Math.round(
      (baseCentavos - 537144) * 0.20 + 36000
    );
  } else {
    impuestoCentavos = Math.round(
      (baseCentavos - 1222860) * 0.30 + 173142
    );
  }

  // Restamos lo retenido y evitamos retenciones negativas.
  const pendienteCentavos = Math.max(
    0,
    impuestoCentavos - retenidoCentavos
  );

  return pendienteCentavos / 100;
}

/**
 * Calcula el ISR total a retener en diciembre
 * según el segundo recálculo del Decreto Ejecutivo N.º 10.
 */
export function calcularRecalculoISRDiciembre(
  baseGravadaAcumulada,
  isrRetenidoAnteriormente,
  salarioAnual = null
) {
  const base = Number(baseGravadaAcumulada);
  const retenido = Number(isrRetenidoAnteriormente);

  // Validamos los montos recibidos.
  if (
    !Number.isFinite(base) ||
    !Number.isFinite(retenido) ||
    base < 0 ||
    retenido < 0
  ) {
    throw new Error("Los valores del recálculo no son válidos");
  }

  // Trabajamos en centavos.
  let baseCentavos = Math.round(base * 100);
  const retenidoCentavos = Math.round(retenido * 100);

  // En diciembre se considera la deducción anual completa de $1,600.
  const ingresoAnual = Number(salarioAnual);
  if (salarioAnual !== null && Number.isFinite(ingresoAnual) && ingresoAnual <= 9100) {
    baseCentavos = Math.max(0, baseCentavos - 160000);
  }

  let impuestoCentavos = 0;

  // Aplicamos los tramos de diciembre.
  if (baseCentavos <= 660000) {
    impuestoCentavos = 0;
  } else if (baseCentavos <= 1074286) {
    impuestoCentavos = Math.round(
      (baseCentavos - 660000) * 0.10 + 21212
    );
  } else if (baseCentavos <= 2445714) {
    impuestoCentavos = Math.round(
      (baseCentavos - 1074286) * 0.20 + 72000
    );
  } else {
    impuestoCentavos = Math.round(
      (baseCentavos - 2445714) * 0.30 + 346286
    );
  }

  // Restamos lo retenido de enero a noviembre.
  const pendienteCentavos = Math.max(
    0,
    impuestoCentavos - retenidoCentavos
  );

  return pendienteCentavos / 100;
}
