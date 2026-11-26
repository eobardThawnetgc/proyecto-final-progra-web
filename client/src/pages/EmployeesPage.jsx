import { useCallback, useMemo, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, CardBody, Container, Input, Table } from 'reactstrap';
import { toast } from 'sonner';
import EmployeeForm from '../components/employees/EmployeeForm.jsx';
import { employeesService } from '../services/employeesService.js';
import { logout } from '../services/authService.js';
import AppNavbar from '../components/AppNavbar.jsx';
import './employees.css';

const roleLabels = { ADMIN: 'Administrador', MANAGER: 'Gerente', CASHIER: 'Cajero', EMPLOYEE: 'Empleado' };
const money = (amount) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(Number(amount));
const date = (value) => new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));

export default function EmployeesPage() {
    const { employee: currentUser, initialEmployees, branches } = useLoaderData();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState(initialEmployees);
    const [filter, setFilter] = useState('active');
    const [search, setSearch] = useState('');
    const [formEmployee, setFormEmployee] = useState(undefined);
    const [saving, setSaving] = useState(false);
    const [pageError, setPageError] = useState('');
    const isAdmin = currentUser.role === 'ADMIN';

    const loadEmployees = useCallback(async () => {
        try {
            setPageError('');
            const { employees: records } = await employeesService.list();
            setEmployees(records);
        } catch (error) {
            if (error.status === 401) navigate('/auth/login', { replace: true });
            else setPageError(error.message);
        }
    }, [navigate]);

    const visible = useMemo(() => employees.filter((item) => {
        const matchesStatus = filter === 'all' || (filter === 'active' ? item.active : !item.active);
        const text = `${item.name} ${item.email} ${item.position} ${item.branch.name}`.toLocaleLowerCase('es');
        return matchesStatus && text.includes(search.trim().toLocaleLowerCase('es'));
    }), [employees, filter, search]);

    const counts = useMemo(() => ({
        total: employees.length,
        active: employees.filter((item) => item.active).length,
        inactive: employees.filter((item) => !item.active).length,
    }), [employees]);

    async function saveEmployee(payload) {
        setSaving(true);
        try {
            if (formEmployee) await employeesService.update(formEmployee.id, payload);
            else await employeesService.create(payload);
            setFormEmployee(undefined);
            toast.success(formEmployee ? 'Empleado actualizado' : 'Empleado registrado');
            await loadEmployees();
        } catch (error) {
            if (error.status === 401) navigate('/auth/login', { replace: true });
            else setPageError(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(item) {
        const action = item.active ? 'desactivar' : 'reactivar';
        if (!window.confirm(`¿Quieres ${action} a ${item.name}?`)) return;
        try {
            await employeesService.update(item.id, { active: !item.active });
            toast.success(item.active ? 'Empleado desactivado' : 'Empleado reactivado');
            await loadEmployees();
        } catch (error) {
            if (error.status === 401) navigate('/auth/login', { replace: true });
            else setPageError(error.message);
        }
    }

    async function signOut() {
        try {
            await logout();
            navigate('/auth/login', { replace: true });
        } catch (error) {
            toast.error(error.message);
        }
    }

    return (
        <main className="employees-page">
            <AppNavbar employee={currentUser} onSignOut={signOut} />
            <Container className="py-4 py-md-5">
                <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                    <div>
                        <p className="employees-eyebrow mb-1">PERSONAL</p>
                        <h1 className="employees-title mb-1">Empleados</h1>
                        <p className="text-body-secondary mb-0">Administra el personal y su acceso por sucursal.</p>
                    </div>
                    <Button className="employees-primary" onClick={() => setFormEmployee(null)}>
                        <i className="bi bi-person-plus me-2" aria-hidden="true" />Registrar empleado
                    </Button>
                </div>

                <div className="row g-3 mb-4">
                    {[
                        ['Personal', counts.total, 'bi-people'],
                        ['Activos', counts.active, 'bi-person-check'],
                        ['Inactivos', counts.inactive, 'bi-person-dash'],
                    ].map(([label, value, icon]) => (
                        <div className="col-12 col-sm-4" key={label}>
                            <Card className="employees-stat h-100"><CardBody className="d-flex justify-content-between align-items-center">
                                <div><span className="text-body-secondary small">{label}</span><div className="h3 fw-bold mb-0">{value}</div></div>
                                <i className={`bi ${icon} employees-stat-icon`} aria-hidden="true" />
                            </CardBody></Card>
                        </div>
                    ))}
                </div>

                {pageError && <Alert color="danger" toggle={() => setPageError('')}>{pageError}</Alert>}
                <Card className="employees-card overflow-hidden">
                    <div className="d-flex flex-wrap gap-2 justify-content-between p-3 p-md-4">
                        <Input aria-label="Buscar empleados" className="employees-search" placeholder="Buscar por nombre, correo o cargo…"
                            value={search} onChange={(event) => setSearch(event.target.value)} />
                        <Input aria-label="Filtrar estado" type="select" className="employees-filter" value={filter}
                            onChange={(event) => setFilter(event.target.value)}>
                            <option value="active">Empleados activos</option><option value="inactive">Empleados inactivos</option><option value="all">Todos</option>
                        </Input>
                    </div>
                    <Table responsive hover className="employees-table align-middle mb-0">
                        <thead><tr><th>Empleado</th><th>Cargo y acceso</th><th>Sucursal</th><th>Ingreso</th><th>Salario mensual</th><th>Estado</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {visible.map((item) => (
                                <tr key={item.id}>
                                    <th scope="row"><span className="d-block">{item.name}</span><small className="text-body-secondary fw-normal">{item.email}</small></th>
                                    <td>{item.position}<small className="d-block text-body-secondary">{roleLabels[item.role]}</small></td>
                                    <td>{item.branch.name}</td><td>{date(item.hireDate)}</td><td>{money(item.salary)}</td>
                                    <td><Badge color={item.active ? 'success' : 'secondary'} pill>{item.active ? 'Activo' : 'Inactivo'}</Badge></td>
                                    <td><div className="d-flex gap-1">
                                        {item.role !== 'ADMIN' && <Button color="link" size="sm" onClick={() => setFormEmployee(item)} aria-label={`Editar a ${item.name}`}>Editar</Button>}
                                        {item.id !== currentUser.id && item.role !== 'ADMIN' && <Button color="link" size="sm" className={item.active ? 'text-danger' : 'text-success'}
                                            onClick={() => toggleActive(item)}>{item.active ? 'Desactivar' : 'Reactivar'}</Button>}
                                    </div></td>
                                </tr>
                            ))}
                            {!visible.length && <tr><td colSpan="7" className="text-center py-5 text-body-secondary">No hay empleados que coincidan con estos filtros.</td></tr>}
                        </tbody>
                    </Table>
                </Card>
            </Container>
            {formEmployee !== undefined && <EmployeeForm employee={formEmployee} branches={branches}
                canAssignManager={isAdmin} saving={saving} error={pageError} onClose={() => setFormEmployee(undefined)} onSubmit={saveEmployee} />}
        </main>
    );
}
