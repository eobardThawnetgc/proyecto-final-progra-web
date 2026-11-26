
import { prepararPlanillaQuincenal } from "./payrollService.js";

import {
  calcularRecalculoISRJunio,
  calcularRecalculoISRDiciembre
} from "./payrollRecalculo.js";

// Guarda una planilla quincenal en PostgreSQL utilizando Prisma.
export async function guardarPlanillaQuincenal(
  prisma,
  employeeId,
  anio,
  mes,
  numeroQuincena,
  usuario
) {
  // Validamos el ID del empleado.
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    throw new Error("El ID del empleado no es válido");
  }

  // Verificamos que el usuario tenga permisos.
  if (!usuario || !["ADMIN", "MANAGER"].includes(usuario.role)) {
    throw new Error("No tienes permisos para generar planillas");
  }

  // Buscamos al empleado en PostgreSQL.
  const empleado = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      branchId: true,
      salary: true,
      active: true
    }
  });

  if (!empleado || !empleado.active) {
    throw new Error("El empleado no existe o está inactivo");
  }

  // Los gerentes solo pueden gestionar su sucursal.
  if (
    usuario.role === "MANAGER" &&
    usuario.branchId !== empleado.branchId
  ) {
    throw new Error("No puedes generar planillas de otra sucursal");
  }

  // Preparamos el salario y los descuentos de la quincena.
  const datosPlanilla = prepararPlanillaQuincenal(
    empleado,
    anio,
    mes,
    numeroQuincena
  );

  // Consultamos el historial en junio y diciembre.
  if (mes === 6 || mes === 12) {
    const historial = await prisma.payroll.findMany({
      where: {
        employeeId,
        periodStart: {
          gte: new Date(Date.UTC(anio, 0, 1)),
          lt: datosPlanilla.periodStart
        }
      },
      select: {
        periodStart: true,
        grossSalary: true,
        isss: true,
        afp: true,
        incomeTax: true
      },
      orderBy: {
        periodStart: "asc"
      }
    });

    // Ajustamos el ISR en la segunda quincena de junio.
    if (mes === 6 && numeroQuincena === 2) {
      const fechasEsperadas = [];

      // Verificamos las quincenas de enero a mayo.
      for (let m = 0; m < 5; m++) {
        for (const dia of [1, 16]) {
          fechasEsperadas.push(
            new Date(Date.UTC(anio, m, dia))
              .toISOString()
              .slice(0, 10)
          );
        }
      }

      // Incluimos la primera quincena de junio.
      fechasEsperadas.push(`${anio}-06-01`);

      const fechasGuardadas = new Set(
        historial.map(p =>
          new Date(p.periodStart)
            .toISOString()
            .slice(0, 10)
        )
      );

      // Evitamos recalcular con períodos faltantes.
      if (
        historial.length !== fechasEsperadas.length ||
        fechasGuardadas.size !== fechasEsperadas.length ||
        fechasEsperadas.some(
          fecha => !fechasGuardadas.has(fecha)
        )
      ) {
        throw new Error(
          "No se puede recalcular junio: historial incompleto"
        );
      }

      const centavos = valor =>
        Math.round(Number(valor) * 100);

      // Calculamos la base gravada de cada planilla.
      const baseCentavos = planilla =>
        centavos(planilla.grossSalary) -
        centavos(planilla.isss) -
        centavos(planilla.afp);

      // Sumamos las bases gravadas hasta junio.
      const baseAcumulada =
        historial.reduce(
          (total, planilla) =>
            total + baseCentavos(planilla),
          0
        ) + baseCentavos(datosPlanilla);

      // ISR retenido de enero a mayo.
      const retenidoAnterior = historial
        .filter(
          p => new Date(p.periodStart).getUTCMonth() < 5
        )
        .reduce(
          (total, p) =>
            total + centavos(p.incomeTax),
          0
        );

      // Calculamos el recálculo correspondiente a junio.
      const totalJunio = centavos(
        calcularRecalculoISRJunio(
          baseAcumulada / 100,
          retenidoAnterior / 100,
          Number(empleado.salary) * 12
        )
      );

      // Obtenemos la retención de la primera quincena.
      const primeraJunio = historial.find(
        p => new Date(p.periodStart).getUTCMonth() === 5
      );

      const isrSegunda = Math.max(
        0,
        totalJunio - centavos(primeraJunio.incomeTax)
      );

      // Actualizamos el salario neto.
      const netoCentavos =
        baseCentavos(datosPlanilla) - isrSegunda;

      if (netoCentavos < 0) {
        throw new Error("El ISR supera el salario disponible");
      }

      datosPlanilla.incomeTax =
        (isrSegunda / 100).toFixed(2);

      datosPlanilla.netSalary =
        (netoCentavos / 100).toFixed(2);
    }

    // Ajustamos el ISR en la segunda quincena de diciembre.
    if (mes === 12 && numeroQuincena === 2) {
      const fechasEsperadas = [];

      // Enero a noviembre y primera quincena de diciembre.
      for (let m = 0; m < 12; m++) {
        const dias = m === 11 ? [1] : [1, 16];

        for (const dia of dias) {
          fechasEsperadas.push(
            new Date(Date.UTC(anio, m, dia))
              .toISOString()
              .slice(0, 10)
          );
        }
      }

      const fechasGuardadas = new Set(
        historial.map(p =>
          new Date(p.periodStart)
            .toISOString()
            .slice(0, 10)
        )
      );

      // Verificamos las 23 quincenas anteriores.
      if (
        historial.length !== fechasEsperadas.length ||
        fechasGuardadas.size !== fechasEsperadas.length ||
        fechasEsperadas.some(
          fecha => !fechasGuardadas.has(fecha)
        )
      ) {
        throw new Error(
          "No se puede recalcular diciembre: historial incompleto"
        );
      }

      const centavos = valor =>
        Math.round(Number(valor) * 100);

      // Calculamos la base gravada de cada planilla.
      const baseCentavos = planilla =>
        centavos(planilla.grossSalary) -
        centavos(planilla.isss) -
        centavos(planilla.afp);

      // Acumulamos la base gravada de todo el año.
      const baseAcumulada =
        historial.reduce(
          (total, planilla) =>
            total + baseCentavos(planilla),
          0
        ) + baseCentavos(datosPlanilla);

      // Sumamos el ISR retenido de enero a noviembre.
      const retenidoAnterior = historial
        .filter(
          p => new Date(p.periodStart).getUTCMonth() < 11
        )
        .reduce(
          (total, p) =>
            total + centavos(p.incomeTax),
          0
        );

      // Calculamos el recálculo correspondiente a diciembre.
      const totalDiciembre = centavos(
        calcularRecalculoISRDiciembre(
          baseAcumulada / 100,
          retenidoAnterior / 100,
          Number(empleado.salary) * 12
        )
      );

      // Obtenemos el ISR de la primera quincena de diciembre.
      const primeraDiciembre = historial.find(
        p => new Date(p.periodStart).getUTCMonth() === 11
      );

      const isrSegunda = Math.max(
        0,
        totalDiciembre - centavos(primeraDiciembre.incomeTax)
      );

      // Actualizamos el salario neto.
      const netoCentavos =
        baseCentavos(datosPlanilla) - isrSegunda;

      if (netoCentavos < 0) {
        throw new Error("El ISR supera el salario disponible");
      }

      datosPlanilla.incomeTax =
        (isrSegunda / 100).toFixed(2);

      datosPlanilla.netSalary =
        (netoCentavos / 100).toFixed(2);
    }
  }

  try {
    // Guardamos la planilla en PostgreSQL.
    return await prisma.payroll.create({
      data: datosPlanilla
    });

  } catch (error) {
    // Evitamos registrar planillas duplicadas.
    if (error.code === "P2002") {
      throw new Error(
        "Ya existe una planilla para este empleado y período"
      );
    }

    throw error;
  }
}
