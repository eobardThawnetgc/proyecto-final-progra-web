
/**
 * Pruebas del módulo de Nómina.
 * Verifica el cálculo del salario bruto quincenal.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  calcularSalarioBrutoQuincenal,
  calcularISSSQuincenal,
  calcularAFPQuincenal
} from "./payrollCalculator.js";

// Comprueba el cálculo de la primera quincena.
test("Calcula la primera quincena", () => {
  const resultado = calcularSalarioBrutoQuincenal(800, 1);

  assert.equal(resultado, 400);
});

// Comprueba el cálculo de la segunda quincena.
test("Calcula la segunda quincena", () => {
  const resultado = calcularSalarioBrutoQuincenal(800, 2);

  assert.equal(resultado, 400);
});

// Verifica que no se acepten salarios negativos.
test("Rechaza salarios negativos", () => {
  assert.throws(() => {
    calcularSalarioBrutoQuincenal(-500, 1);
  });
});

// Verifica que solamente se acepten las quincenas 1 y 2.
test("Rechaza quincenas incorrectas", () => {
  assert.throws(() => {
    calcularSalarioBrutoQuincenal(800, 3);
  });
});


// Verifica el descuento de ISSS para un salario de $800.
test("Calcula ISSS quincenal correctamente", () => {
  const resultado = calcularISSSQuincenal(800, 1);

  assert.equal(resultado, 12);
});

// Verifica que ISSS respete su tope mensual.
test("Aplica el tope de ISSS", () => {
  const resultado = calcularISSSQuincenal(1800, 1);

  assert.equal(resultado, 15);
});

// Verifica el descuento de AFP para un salario de $800.
test("Calcula AFP quincenal correctamente", () => {
  const resultado = calcularAFPQuincenal(800, 1);

  assert.equal(resultado, 29);
});

// Verifica que AFP se calcule sobre el salario completo.
test("Calcula AFP sin el tope de ISSS", () => {
  const resultado = calcularAFPQuincenal(1800, 1);

  assert.equal(resultado, 65.25);
});

// Verifica que ambas quincenas sumen correctamente el AFP mensual.
test("Conserva los centavos del AFP mensual", () => {
  const primera = calcularAFPQuincenal(1000.10, 1);
  const segunda = calcularAFPQuincenal(1000.10, 2);

  // Comparamos en centavos para evitar errores de precisión.
  assert.equal(Math.round((primera + segunda) * 100), 7251);
});

// Verifica que ambas quincenas sumen el salario mensual completo.
test("Conserva los centavos del salario mensual", () => {
  const primera = calcularSalarioBrutoQuincenal(1000.01, 1);
  const segunda = calcularSalarioBrutoQuincenal(1000.01, 2);

  // Comparamos en centavos para evitar errores de precisión.
  assert.equal(Math.round((primera + segunda) * 100), 100001);
});

// Verifica que ambas quincenas sumen el ISSS mensual completo.
test("Conserva los centavos del ISSS mensual", () => {
  const primera = calcularISSSQuincenal(801, 1);
  const segunda = calcularISSSQuincenal(801, 2);

  // Comparamos en centavos para evitar errores de precisión.
  assert.equal(Math.round((primera + segunda) * 100), 2403);
});
