
import test from "node:test";
import assert from "node:assert/strict";

import {
  calcularRecalculoISRJunio,
  calcularRecalculoISRDiciembre
} from "./payrollRecalculo.js";

// Verifica la retención total de junio usando el historial.
test("Recalcula el ISR de junio", () => {
  // Ejemplo: empleado con salario mensual de $800
  // durante enero a junio, sin ingresos adicionales.
  const baseGravadaAcumulada = 4308;
  const isrRetenidoAnteriormente = 172.30;

  const resultado = calcularRecalculoISRJunio(
    baseGravadaAcumulada,
    isrRetenidoAnteriormente
  );

  assert.equal(resultado, 34.70);
});

 // Verifica los límites de la tabla de ISR de junio.
test("Respeta los tramos del ISR de junio", () => {
  assert.equal(calcularRecalculoISRJunio(3300, 0), 0);
  assert.equal(calcularRecalculoISRJunio(3300.01, 0), 106.20);
  assert.equal(calcularRecalculoISRJunio(5371.45, 0), 360);
  assert.equal(calcularRecalculoISRJunio(12228.61, 0), 1731.42);
});

// Verifica que no se genere una retención negativa.
test("No genera ISR negativo en junio", () => {
  assert.equal(calcularRecalculoISRJunio(4308, 250), 0);
});

// Rechaza valores negativos en los acumulados.
test("Rechaza valores negativos en el recálculo", () => {
  assert.throws(() => calcularRecalculoISRJunio(-100, 0));
  assert.throws(() => calcularRecalculoISRJunio(4308, -50));
});

 // Verifica el segundo recálculo del ISR en diciembre.
test("Recalcula el ISR de diciembre", () => {
  const baseGravadaAcumulada = 8616;
  const isrRetenidoAnteriormente = 379.30;

  const resultado = calcularRecalculoISRDiciembre(
    baseGravadaAcumulada,
    isrRetenidoAnteriormente
  );

  assert.equal(resultado, 34.42);
});

// Verifica los límites de la tabla de ISR de diciembre.
test("Respeta los tramos del ISR de diciembre", () => {
  assert.equal(calcularRecalculoISRDiciembre(6600, 0), 0);
  assert.equal(calcularRecalculoISRDiciembre(6600.01, 0), 212.12);
  assert.equal(calcularRecalculoISRDiciembre(10742.87, 0), 720);
  assert.equal(calcularRecalculoISRDiciembre(24457.15, 0), 3462.86);
});

// Evita que el recálculo produzca retenciones negativas.
test("No genera ISR negativo en diciembre", () => {
  assert.equal(calcularRecalculoISRDiciembre(8616, 500), 0);
});

// Rechaza valores inválidos en el recálculo de diciembre.
test("Rechaza valores negativos en diciembre", () => {
  assert.throws(() => calcularRecalculoISRDiciembre(-100, 0));
  assert.throws(() => calcularRecalculoISRDiciembre(8616, -50));
});

