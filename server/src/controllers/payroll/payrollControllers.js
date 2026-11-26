
import prisma from "../../../config/prisma.js";

import {
  guardarPlanillaQuincenal
} from "../../services/payroll/payrollPersistence.js";


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

// Genera y guarda la planilla quincenal de un empleado.
export const createPayroll = async (req, res, next) => {
  try {
    const { employeeId, anio, mes, numeroQuincena } = req.body ?? {};

    // Validamos los datos del período y del empleado.
    if (
      !Number.isInteger(employeeId) || employeeId <= 0 ||
      !Number.isInteger(anio) || anio < 2000 || anio > 2100 ||
      !Number.isInteger(mes) || mes < 1 || mes > 12 ||
      (numeroQuincena !== 1 && numeroQuincena !== 2)
    ) {
      return res.status(400).json({
        message: "Los datos de la planilla no son válidos"
      });
    }

    // Guardamos la planilla usando el servicio de Nómina.
    const planilla = await guardarPlanillaQuincenal(
      prisma,
      employeeId,
      anio,
      mes,
      numeroQuincena,
      req.employee
    );

    return res.status(201).json({
      message: "Planilla registrada correctamente",
      planilla
    });

  } catch (error) {
    // Respondemos según el tipo de error conocido.
    const estados = {
      "No tienes permisos para generar planillas": 403,
      "No puedes generar planillas de otra sucursal": 403,
      "El empleado no existe o está inactivo": 404,
      "Ya existe una planilla para este empleado y período": 409,
      "El salario mensual debe ser mayor a cero": 400
    };

    const estado = estados[error.message];

    if (estado) {
      return res.status(estado).json({
        message: error.message
      });
    }

    next(error);
  }
};

