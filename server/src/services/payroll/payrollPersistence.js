
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
      hireDate: true,
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

  // Las fechas de la planilla representan días de calendario en UTC.
  const ingreso = new Date(empleado.hireDate);
  const primeraQuincena = new Date(Date.UTC(
    ingreso.getUTCFullYear(), ingreso.getUTCMonth(), ingreso.getUTCDate() < 16 ? 1 : 16
  ));
  if (datosPlanilla.periodStart < primeraQuincena) {
    throw new Error("La quincena es anterior a la contratación");
  }

  // Consultamos el historial en junio y diciembre.
  if (mes === 6 || mes === 12) {
    const historial = await prisma.payroll.findMany({
      where: {
        employeeId,
        periodStart: {
          gte: new Date(Math.max(Date.UTC(anio, 0, 1), primeraQuincena.getTime())),
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

    if (numeroQuincena === 2) {
      const fechasGuardadas = new Set(historial.map((p) => p.periodStart.toISOString().slice(0, 10)));
      for (let m = 0; m < mes; m++) {
        for (const dia of [1, 16]) {
          const fecha = new Date(Date.UTC(anio, m, dia));
          if (fecha < primeraQuincena || fecha >= datosPlanilla.periodStart) continue;
          if (!fechasGuardadas.has(fecha.toISOString().slice(0, 10))) {
            const nombreMes = mes === 6 ? "junio" : "diciembre";
            throw new Error(`No se puede recalcular ${nombreMes}: historial incompleto`);
          }
        }
      }

      const centavos = valor =>
        Math.round(Number(valor) * 100);

      // Calculamos la base gravada de cada planilla.
      const baseCentavos = planilla =>
        centavos(planilla.grossSalary) -
        centavos(planilla.isss) -
        centavos(planilla.afp);

      // Sumamos las bases gravadas hasta la quincena del recálculo.
      const baseAcumulada =
        historial.reduce(
          (total, planilla) =>
            total + baseCentavos(planilla),
          0
        ) + baseCentavos(datosPlanilla);

      const retenidoAnterior = historial
        .filter(p => p.periodStart.getUTCMonth() < mes - 1)
        .reduce((total, p) => total + centavos(p.incomeTax), 0);
      const recalcularISR = mes === 6 ? calcularRecalculoISRJunio : calcularRecalculoISRDiciembre;
      const retencionMensual = centavos(recalcularISR(
        baseAcumulada / 100, retenidoAnterior / 100, Number(empleado.salary) * 12
      ));
      const primeraDelMes = historial.find(p => p.periodStart.getUTCMonth() === mes - 1);
      const isrSegunda = Math.max(0, retencionMensual - centavos(primeraDelMes?.incomeTax ?? 0));

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
