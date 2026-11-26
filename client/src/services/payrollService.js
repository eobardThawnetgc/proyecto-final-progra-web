
import { api } from "./api.js";

// Centraliza las peticiones del módulo de Nómina.
export const payrollService = {

  // Obtiene los empleados disponibles para generar planillas.
  employees: () => api("/payroll/employees"),

  // Consulta el historial de planillas registradas.
  list: () => api("/payroll"),

  // Genera y guarda una planilla quincenal.
  create: (data) => api("/payroll", {
    method: "POST",
    body: JSON.stringify(data)
  })

};
