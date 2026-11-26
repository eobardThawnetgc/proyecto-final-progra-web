
import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import {
  Alert, Button, Card, CardBody,
  Container, FormGroup, Input, Label, Table
} from "reactstrap";
import { toast } from "sonner";

import { payrollService } from "../services/payrollService.js";
import { logout } from "../services/authService.js";
import AppNavbar from "../components/AppNavbar.jsx";
import { downloadPayrollPdf } from "../utils/payrollPdf.js";

// Formatea los valores monetarios en dólares.
const money = (value) =>
  new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD"
  }).format(Number(value));

// Muestra las fechas de los períodos sin cambiar el día.
const formatDate = (value) =>
  new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(value));

export default function PayrollPage() {
  const {
    employee: currentUser,
    employees = [],
    payrolls: initialPayrolls = []
  } = useLoaderData();

  const navigate = useNavigate();

  const [payrolls, setPayrolls] = useState(initialPayrolls);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    employeeId: String(employees[0]?.id ?? ""),
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    numeroQuincena: 1
  });

  // Actualiza los campos del formulario.
  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  // Genera una planilla y actualiza el historial.
  const handleCreate = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const { planilla } = await payrollService.create({
        employeeId: Number(form.employeeId),
        anio: Number(form.anio),
        mes: Number(form.mes),
        numeroQuincena: Number(form.numeroQuincena)
      });

      const result = await payrollService.list();
      setPayrolls(result.payrolls);

      const employee = employees.find((item) => item.id === planilla.employeeId);
      if (employee) downloadPayrollPdf({ ...planilla, employee });

      toast.success("Planilla generada correctamente");
    } catch (err) {
      if (err.status === 401) {
        navigate("/auth/login", { replace: true });
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Cierra la sesión del usuario.
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login", { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <main className="min-vh-100" style={{ background: "#f3efe6" }}>
      <AppNavbar employee={currentUser} onSignOut={handleLogout} />

      <Container className="py-4">
        <h1 className="mb-2">Gestión de Nómina</h1>
        <p className="text-secondary mb-4">
          Genera y consulta las planillas quincenales de los empleados.
        </p>

        {error && (
          <Alert color="danger">
            {error}
          </Alert>
        )}

        {/* Formulario para generar una planilla. */}
        <Card className="mb-4">
          <CardBody>
            <h4 className="mb-4">Generar planilla</h4>

            <form onSubmit={handleCreate}>
              <div className="row g-3">
                <div className="col-md-6">
                  <FormGroup>
                    <Label for="payrollEmployee">Empleado</Label>
                    <Input
                      id="payrollEmployee"
                      type="select"
                      required
                      value={form.employeeId}
                      onChange={(e) =>
                        updateForm("employeeId", e.target.value)
                      }
                    >
                      {employees.length === 0 && (
                        <option value="">Sin empleados disponibles</option>
                      )}
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} — {money(employee.salary)}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </div>

                <div className="col-md-2">
                  <FormGroup>
                    <Label for="payrollYear">Año</Label>
                    <Input
                      id="payrollYear"
                      type="number"
                      min="2000"
                      max="2100"
                      required
                      value={form.anio}
                      onChange={(e) =>
                        updateForm("anio", e.target.value)
                      }
                    />
                  </FormGroup>
                </div>

                <div className="col-md-2">
                  <FormGroup>
                    <Label for="payrollMonth">Mes</Label>
                    <Input
                      id="payrollMonth"
                      type="select"
                      value={form.mes}
                      onChange={(e) =>
                        updateForm("mes", e.target.value)
                      }
                    >
                      {Array.from({ length: 12 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {new Intl.DateTimeFormat("es-SV", {
                            month: "long"
                          }).format(new Date(2026, index, 1))}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </div>

                <div className="col-md-2">
                  <FormGroup>
                    <Label for="payrollPeriod">Quincena</Label>
                    <Input
                      id="payrollPeriod"
                      type="select"
                      value={form.numeroQuincena}
                      onChange={(e) =>
                        updateForm("numeroQuincena", e.target.value)
                      }
                    >
                      <option value="1">Primera</option>
                      <option value="2">Segunda</option>
                    </Input>
                  </FormGroup>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-3"
                style={{ background: "#344c3b" }}
                disabled={saving || employees.length === 0}
              >
                {saving ? "Generando..." : "Generar planilla"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Muestra las planillas registradas. */}
        <Card>
          <CardBody>
            <h4 className="mb-3">Historial de planillas</h4>

            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Período</th>
                    <th>Bruto</th>
                    <th>ISSS</th>
                    <th>AFP</th>
                    <th>ISR</th>
                    <th>Neto</th>
                    <th>Comprobante</th>
                  </tr>
                </thead>

                <tbody>
                  {payrolls.map((payroll) => (
                    <tr key={payroll.id}>
                      <td>{payroll.employee?.name}</td>
                      <td>
                        {formatDate(payroll.periodStart)}
                        {" - "}
                        {formatDate(payroll.periodEnd)}
                      </td>
                      <td>{money(payroll.grossSalary)}</td>
                      <td>{money(payroll.isss)}</td>
                      <td>{money(payroll.afp)}</td>
                      <td>{money(payroll.incomeTax)}</td>
                      <td className="fw-bold">
                        {money(payroll.netSalary)}
                      </td>
                      <td><Button color="link" size="sm" onClick={() => downloadPayrollPdf(payroll)}>
                        <i className="bi bi-download me-1" aria-hidden="true" />Descargar PDF
                      </Button></td>
                    </tr>
                  ))}

                  {payrolls.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No hay planillas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </Container>
    </main>
  );
}
