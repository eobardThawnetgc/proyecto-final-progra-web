
import test from "node:test";
import assert from "node:assert/strict";

import {
  prepararPlanillaQuincenal
} from "./payrollService.js";

// Empleado de prueba para verificar la generación de planillas.
const empleado = {
  id: 1,
  branchId: 1,
  name: "Empleado de prueba",
  salary: 800
};

// Comprueba los datos de la primera quincena.
test("Prepara la primera planilla quincenal", () => {
  const resultado = prepararPlanillaQuincenal(
    empleado, 2026, 11, 1
  );

  assert.equal(resultado.employeeId, 1);
  assert.equal(resultado.branchId, 1);
  assert.equal(resultado.grossSalary, "400.00");
  assert.equal(resultado.isss, "12.00");
  assert.equal(resultado.afp, "29.00");
  assert.equal(resultado.incomeTax, "17.23");
  assert.equal(resultado.netSalary, "341.77");

  assert.equal(
    resultado.periodStart.toISOString(),
    "2026-11-01T00:00:00.000Z"
  );

  assert.equal(
    resultado.periodEnd.toISOString(),
    "2026-11-15T00:00:00.000Z"
  );
});

// Comprueba las fechas de la segunda quincena.
test("Prepara la segunda planilla quincenal", () => {
  const resultado = prepararPlanillaQuincenal(
    empleado, 2026, 11, 2
  );

  assert.equal(
    resultado.periodStart.toISOString(),
    "2026-11-16T00:00:00.000Z"
  );

  assert.equal(
    resultado.periodEnd.toISOString(),
    "2026-11-30T00:00:00.000Z"
  );
});

// Verifica el último día de febrero en un año bisiesto.
test("Calcula correctamente febrero bisiesto", () => {
  const resultado = prepararPlanillaQuincenal(
    empleado, 2028, 2, 2
  );

  assert.equal(
    resultado.periodEnd.toISOString(),
    "2028-02-29T00:00:00.000Z"
  );
});

// Rechaza una quincena inválida.
test("Rechaza quincenas incorrectas", () => {
  assert.throws(() => {
    prepararPlanillaQuincenal(empleado, 2026, 11, 3);
  });
});

// Rechaza empleados sin identificadores válidos.
test("Rechaza empleados inválidos", () => {
  assert.throws(() => {
    prepararPlanillaQuincenal(null, 2026, 11, 1);
  });
});
