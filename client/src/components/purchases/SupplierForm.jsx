import { useState } from 'react';
import { Alert, Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

const fields = [
    { name: 'name', label: 'Nombre', type: 'text', maxLength: 120, required: true, minLength: 2 },
    { name: 'phone', label: 'Teléfono', type: 'tel', maxLength: 40 },
    { name: 'email', label: 'Correo electrónico', type: 'email', maxLength: 254 },
    { name: 'address', label: 'Dirección', type: 'textarea', maxLength: 250 },
];

export default function SupplierForm({ supplier, close, save, saving, error }) {
    const [values, setValues] = useState(() => Object.fromEntries(
        fields.map(({ name }) => [name, supplier?.[name] ?? '']),
    ));

    function submit(event) {
        event.preventDefault();
        const data = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim() || null]));
        save(supplier?.id, { ...data, name: values.name.trim() });
    }

    return (
        <Modal isOpen toggle={saving ? undefined : close} labelledBy="supplier-title">
            <ModalHeader id="supplier-title" toggle={saving ? undefined : close}>
                {supplier ? 'Editar proveedor' : 'Nuevo proveedor'}
            </ModalHeader>
            <Form onSubmit={submit}>
                <ModalBody>
                    {error && <Alert color="danger">{error}</Alert>}
                    <fieldset disabled={saving}>
                        {fields.map(({ name, label, ...props }) => (
                            <FormGroup key={name}>
                                <Label for={`supplier-${name}`}>{label}</Label>
                                <Input {...props} id={`supplier-${name}`} value={values[name]}
                                    onChange={(event) => setValues({ ...values, [name]: event.target.value })} />
                            </FormGroup>
                        ))}
                    </fieldset>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" type="button" onClick={close} disabled={saving}>Cancelar</Button>
                    <Button className="purchase-primary" type="submit" disabled={saving}>
                        {saving ? 'Guardando…' : 'Guardar proveedor'}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
}
