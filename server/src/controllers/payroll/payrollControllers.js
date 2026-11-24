
import prisma from "../../../config/prisma.js";

// Obtiene los empleados activos para generar sus planillas.
export const getPayrollEmployees = async (req, res, next) => {
  try {

    // Los administradores ven todas las sucursales.
    // Los gerentes solo consultan empleados de su sucursal.
    const where = {
      active: true,
      ...(req.employee.role !== "ADMIN" && {
        branchId: req.employee.branchId
      })
    };

    // Consultamos los empleados mediante Prisma.
    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        name: true,
        position: true,
        salary: true,
        branchId: true
      },
      orderBy: {
        name: "asc"
      }
    });

    // Convertimos el salario Decimal a número para la respuesta.
    const result = employees.map((employee) => ({
      ...employee,
      salary: Number(employee.salary)
    }));

    return res.status(200).json({
      total: result.length,
      employees: result
    });

  } catch (error) {
    next(error);
  }
};
