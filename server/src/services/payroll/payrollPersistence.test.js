
import test from "node:test";
import assert from "node:assert/strict";

import {
  guardarPlanillaQuincenal
} from "./payrollPersistence.js";

// Datos de prueba de un empleado y un gerente.
const empleado = {
  id: 1,
  branchId: 1,
  salary: 800,
  active: true
};

const gerente = {
  role: "MANAGER",
  branchId: 1
};

// Comprueba que una planilla se prepare y guarde correctamente.
test("Guarda una planilla quincenal", async () => {
  const prismaFalso = {
    employee: {
      findUnique: async () => empleado
    },
    payroll: {
      create: async ({ data }) => ({
        id: 10,
        ...data
      })
    }
  };

  const resultado = await guardarPlanillaQuincenal(
    prismaFalso, 1, 2026, 11, 1, gerente
  );

  assert.equal(resultado.employeeId, 1);
  assert.equal(resultado.grossSalary, "400.00");
  assert.equal(resultado.isss, "12.00");
  assert.equal(resultado.afp, "29.00");
  assert.equal(resultado.incomeTax, "17.23");
  assert.equal(resultado.netSalary, "341.77");
});

// Verifica que un gerente no genere planillas de otra sucursal.
test("Rechaza planillas de otras sucursales", async () => {
  const prismaFalso = {
    employee: {
      findUnique: async () => ({
        ...empleado,
        branchId: 2
      })
    }
  };

  await assert.rejects(
    guardarPlanillaQuincenal(
      prismaFalso, 1, 2026, 11, 1, gerente
    ),
    /otra sucursal/
  );
});

// Comprueba que no se permitan planillas duplicadas.
test("Rechaza planillas duplicadas", async () => {
  const prismaFalso = {
    employee: {
      findUnique: async () => empleado
    },
    payroll: {
      create: async () => {
        throw { code: "P2002" };
      }
    }
  };

  await assert.rejects(
    guardarPlanillaQuincenal(
      prismaFalso, 1, 2026, 11, 1, gerente
    ),
    /Ya existe una planilla/
  );
});

// Verifica que un empleado normal no pueda generar planillas.
test("Rechaza usuarios sin permisos", async () => {
  await assert.rejects(
    guardarPlanillaQuincenal(
      {}, 1, 2026, 11, 1,
      { role: "EMPLOYEE", branchId: 1 }
    ),
    /No tienes permisos/
  );
});
