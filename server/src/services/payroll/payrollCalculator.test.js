
/**
 * Pruebas del módulo de Nómina.
 * Verifica el cálculo del salario bruto quincenal.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  calcularSalarioBrutoQuincenal
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

// Verifica que ambas quincenas sumen el salario mensual completo.
test("Conserva los centavos del salario mensual", () => {
  const primera = calcularSalarioBrutoQuincenal(1000.01, 1);
  const segunda = calcularSalarioBrutoQuincenal(1000.01, 2);

  assert.equal(primera + segunda, 1000.01);
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
