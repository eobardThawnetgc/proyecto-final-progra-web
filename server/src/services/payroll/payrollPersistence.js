
import { prepararPlanillaQuincenal } from "./payrollService.js";

// Guarda una planilla quincenal en PostgreSQL utilizando Prisma.
export async function guardarPlanillaQuincenal(
  prisma,
  employeeId,
  anio,
  mes,
  numeroQuincena,
  usuario
) {
  // Validamos el empleado y los permisos del usuario.
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    throw new Error("El ID del empleado no es válido");
  }

  if (!usuario || !["ADMIN", "MANAGER"].includes(usuario.role)) {
    throw new Error("No tienes permisos para generar planillas");
  }

  // Buscamos al empleado en la base de datos.
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

  // Los gerentes solo pueden generar planillas de su sucursal.
  if (
    usuario.role === "MANAGER" &&
    usuario.branchId !== empleado.branchId
  ) {
    throw new Error("No puedes generar planillas de otra sucursal");
  }

  // Calculamos el salario y los descuentos de la quincena.
  const datosPlanilla = prepararPlanillaQuincenal(
    empleado,
    anio,
    mes,
    numeroQuincena
  );

  try {
    // Guardamos el registro en la tabla Payroll.
    return await prisma.payroll.create({
      data: datosPlanilla
    });

  } catch (error) {
    // Evitamos registrar dos planillas del mismo período.
    if (error.code === "P2002") {
      throw new Error(
        "Ya existe una planilla para este empleado y período"
      );
    }

    throw error;
  }
}
