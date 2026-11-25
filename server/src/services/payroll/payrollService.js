
import {
  calcularSalarioNetoQuincenal
} from "./payrollCalculator.js";

// Prepara los datos de una planilla quincenal para guardarlos en Prisma.
export function prepararPlanillaQuincenal(
  empleado,
  anio,
  mes,
  numeroQuincena
) {
  // Validamos los datos del empleado.
  if (
    !empleado ||
    !Number.isInteger(empleado.id) ||
    !Number.isInteger(empleado.branchId) ||
    empleado.id <= 0 ||
    empleado.branchId <= 0
  ) {
    throw new Error("El empleado no es válido");
  }

  // Validamos el año, mes y número de quincena.
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new Error("El año no es válido");
  }

  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new Error("El mes debe estar entre 1 y 12");
  }

  if (numeroQuincena !== 1 && numeroQuincena !== 2) {
    throw new Error("La quincena debe ser 1 o 2");
  }

  // Determinamos las fechas de inicio y fin de la quincena.
  const diaInicio = numeroQuincena === 1 ? 1 : 16;

  const diaFin = numeroQuincena === 1
    ? 15
    : new Date(Date.UTC(anio, mes, 0)).getUTCDate();

  const periodStart = new Date(Date.UTC(anio, mes - 1, diaInicio));
  const periodEnd = new Date(Date.UTC(anio, mes - 1, diaFin));

  // Reutilizamos los cálculos de Nómina que ya desarrollamos.
  const calculo = calcularSalarioNetoQuincenal(
    empleado.salary,
    numeroQuincena
  );

  // Preparamos los campos correspondientes al modelo Payroll.
  return {
    employeeId: empleado.id,
    branchId: empleado.branchId,
    periodStart,
    periodEnd,
    grossSalary: calculo.salarioBruto.toFixed(2),
    isss: calculo.isss.toFixed(2),
    afp: calculo.afp.toFixed(2),
    incomeTax: calculo.isr.toFixed(2),
    netSalary: calculo.salarioNeto.toFixed(2)
  };
}
