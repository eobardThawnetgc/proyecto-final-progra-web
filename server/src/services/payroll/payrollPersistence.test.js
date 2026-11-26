
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

 // Verifica que junio consulte el historial para recalcular ISR.
test("Consulta el historial para el ISR de junio", async () => {
  let historialConsultado = false;

  const prismaFalso = {
    employee: {
      findUnique: async () => empleado
    },
    payroll: {
      findMany: async () => {
        historialConsultado = true;
        return [];
      },
      create: async ({ data }) => ({
        id: 11,
        ...data
      })
    }
  };

  await guardarPlanillaQuincenal(
    prismaFalso, 1, 2026, 6, 1, gerente
  );

  assert.equal(historialConsultado, true);
});

// Verifica el ajuste de ISR en la segunda quincena de junio.
test("Aplica el recálculo de ISR en la segunda quincena de junio", async () => {
  // Simulamos las diez quincenas de enero a mayo.
  const historial = Array.from({ length: 5 }, (_, mes) =>
    [1, 16].map((dia) => ({
      periodStart: new Date(Date.UTC(2026, mes, dia)),
      grossSalary: "400.00",
      isss: "12.00",
      afp: "29.00",
      incomeTax: "17.23"
    }))
  ).flat();

  // Agregamos la primera quincena de junio.
  historial.push({
    periodStart: new Date(Date.UTC(2026, 5, 1)),
    grossSalary: "400.00",
    isss: "12.00",
    afp: "29.00",
    incomeTax: "17.23"
  });

  const prismaFalso = {
    employee: {
      findUnique: async () => empleado
    },
    payroll: {
      findMany: async () => historial,
      create: async ({ data }) => ({ id: 12, ...data })
    }
  };

  const resultado = await guardarPlanillaQuincenal(
    prismaFalso, 1, 2026, 6, 2, gerente
  );

  // ISR mensual recalculado: $34.70.
  // Primera quincena: $17.23.
  // Segunda quincena: $17.47.
  assert.equal(resultado.incomeTax, "17.47");
});


// Evita recalcular junio cuando faltan planillas anteriores.
test("Rechaza el recálculo de junio con historial incompleto", async () => {
  let intentoGuardar = false;

  const prismaFalso = {
    employee: {
      findUnique: async () => empleado
    },
    payroll: {
      // Simulamos un historial sin planillas anteriores.
      findMany: async () => [],
      create: async () => {
        intentoGuardar = true;
        return { id: 13 };
      }
    }
  };

  await assert.rejects(
    guardarPlanillaQuincenal(
      prismaFalso, 1, 2026, 6, 2, gerente
    ),
    /historial incompleto/
  );

  // Confirmamos que no se guardó una planilla incorrecta.
  assert.equal(intentoGuardar, false);
});

// Verifica el ISR ajustado en la segunda quincena de diciembre.
test("Aplica el recálculo de ISR en diciembre", async () => {
  const historial = [];

  // Simulamos las quincenas de enero a noviembre.
  for (let mes = 0; mes < 11; mes++) {
    for (const dia of [1, 16]) {
      historial.push({
        periodStart: new Date(Date.UTC(2026, mes, dia)),
        grossSalary: "400.00",
        isss: "12.00",
        afp: "29.00",
        incomeTax: mes === 5 && dia === 16
          ? "17.47"
          : "17.23"
      });
    }
  }

  // Incluimos la primera quincena de diciembre.
  historial.push({
    periodStart: new Date(Date.UTC(2026, 11, 1)),
    grossSalary: "400.00",
    isss: "12.00",
    afp: "29.00",
    incomeTax: "17.23"
  });

  const prismaFalso = {
    employee: {
      findUnique: async () => empleado
    },
    payroll: {
      findMany: async () => historial,
      create: async ({ data }) => ({
        id: 14,
        ...data
      })
    }
  };

  const resultado = await guardarPlanillaQuincenal(
    prismaFalso, 1, 2026, 12, 2, gerente
  );

  // ISR de diciembre: $34.42.
  // Primera quincena: $17.23.
  // Segunda quincena: $17.19.
  assert.equal(resultado.incomeTax, "17.19");
  assert.equal(resultado.netSalary, "341.81");
});

// Evita recalcular diciembre cuando faltan planillas anteriores.
test("Rechaza el recálculo de diciembre con historial incompleto", async () => {
  let intentoGuardar = false;

  const prismaFalso = {
    employee: {
      findUnique: async () => empleado
    },
    payroll: {
      // Simulamos un historial incompleto.
      findMany: async () => [],
      create: async () => {
        intentoGuardar = true;
        return { id: 15 };
      }
    }
  };

  await assert.rejects(
    guardarPlanillaQuincenal(
      prismaFalso, 1, 2026, 12, 2, gerente
    ),
    /historial incompleto/
  );

  // Verificamos que no se guardó la planilla.
  assert.equal(intentoGuardar, false);
});
