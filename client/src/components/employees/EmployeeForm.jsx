import { useState } from 'react';
import { Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

const roles = [
    ['EMPLOYEE', 'Empleado'],
    ['CASHIER', 'Cajero'],
    ['MANAGER', 'Gerente'],
];

const dateValue = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';

export default function EmployeeForm({ employee, branches, canAssignManager, saving, error, onClose, onSubmit }) {
    const [form, setForm] = useState({
        name: employee?.name ?? '',
        email: employee?.email ?? '',
        position: employee?.position ?? '',
        salary: employee?.salary?.toString() ?? '',
        role: employee?.role ?? 'EMPLOYEE',
        branchId: employee?.branchId ?? branches[0]?.id ?? '',
        hireDate: dateValue(employee?.hireDate),
        password: '',
    });
    const [validationError, setValidationError] = useState('');
    const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

    function submit(event) {
        event.preventDefault();
        setValidationError('');
        if (!form.name.trim() || !form.email.trim() || !form.position.trim() || !form.salary) {
            setValidationError('Completa los campos obligatorios.');
            return;
        }
        if (!employee && form.password.length < 8) {
            setValidationError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (form.password && form.password.length < 8) {
            setValidationError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        const payload = {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            position: form.position.trim(),
            salary: Number(form.salary),
            role: form.role,
            hireDate: form.hireDate || undefined,
            ...(branches.length > 1 ? { branchId: Number(form.branchId) } : {}),
            ...(form.password ? { password: form.password } : {}),
        };
        onSubmit(payload);
    }

    return (
        <Modal isOpen toggle={onClose} centered scrollable className="employee-form-modal">
            <Form onSubmit={submit}>
                <ModalHeader toggle={onClose}>{employee ? 'Editar empleado' : 'Registrar empleado'}</ModalHeader>
                <ModalBody>
                    {(error || validationError) && <div className="alert alert-danger" role="alert">{error || validationError}</div>}
                    <FormGroup>
                        <Label for="employee-name">Nombre completo</Label>
                        <Input id="employee-name" value={form.name} onChange={set('name')} maxLength="100" required />
                    </FormGroup>
                    <FormGroup>
                        <Label for="employee-email">Correo electrónico</Label>
                        <Input id="employee-email" type="email" value={form.email} onChange={set('email')} maxLength="254" required />
                    </FormGroup>
                    <FormGroup>
                        <Label for="employee-position">Cargo</Label>
                        <Input id="employee-position" value={form.position} onChange={set('position')} maxLength="100" required />
                    </FormGroup>
                    <div className="row">
                        <FormGroup className="col-md-6">
                            <Label for="employee-salary">Salario mensual (USD)</Label>
                            <Input id="employee-salary" type="number" min="0.01" max="99999999.99" step="0.01" value={form.salary} onChange={set('salary')} required />
                        </FormGroup>
                        <FormGroup className="col-md-6">
                            <Label for="employee-hire-date">Fecha de contratación</Label>
                            <Input id="employee-hire-date" type="date" value={form.hireDate} onChange={set('hireDate')} />
                        </FormGroup>
                    </div>
                    <FormGroup>
                        <Label for="employee-role">Rol del sistema</Label>
                        <Input id="employee-role" type="select" value={form.role} onChange={set('role')}>
                            {roles.filter(([role]) => canAssignManager || role !== 'MANAGER' || employee?.role === 'MANAGER').map(([role, label]) => (
                                <option key={role} value={role}>{label}</option>
                            ))}
                        </Input>
                    </FormGroup>
                    {branches.length > 1 && (
                        <FormGroup>
                            <Label for="employee-branch">Sucursal</Label>
                            <Input id="employee-branch" type="select" value={form.branchId} onChange={set('branchId')}>
                                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                            </Input>
                        </FormGroup>
                    )}
                    <FormGroup>
                        <Label for="employee-password">{employee ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}</Label>
                        <Input id="employee-password" type="password" autoComplete="new-password" minLength="8" maxLength="72"
                            value={form.password} onChange={set('password')} required={!employee} />
                        {employee && <small className="text-body-secondary">Déjalo vacío para conservar la contraseña actual.</small>}
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button color="success" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar empleado'}</Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
}
