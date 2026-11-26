import { useEffect, useState } from 'react';
import {
    Alert, Button, Col, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row,
} from 'reactstrap';
import { purchasesService } from '../../services/purchasesService.js';
import { lineCents, money } from './purchaseFormatting.js';

const newLine = (key) => ({ key, type: 'stock', inventoryItemId: '', description: '', quantity: '1', unitCost: '' });
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/El_Salvador' }).format(new Date());

export default function PurchaseForm({ branches, homeBranchId, suppliers, close, save, saving, error }) {
    const [branchId, setBranchId] = useState(homeBranchId);
    const [lines, setLines] = useState(() => [newLine(1)]);
    const [inventory, setInventory] = useState(null);
    const items = inventory?.branchId === branchId ? inventory.items : [];
    const total = lines.reduce((sum, line) => sum + lineCents(line), 0n);
    const inventoryPending = inventory?.branchId !== branchId;
    const inventoryError = !inventoryPending && inventory.error;
    const hasStockLines = lines.some((line) => line.type === 'stock');

    useEffect(() => {
        const controller = new AbortController();
        purchasesService.inventory(branchId, controller.signal).then(({ items }) => {
            setInventory({ branchId, items });
        }).catch((error) => {
            if (!controller.signal.aborted) setInventory({ branchId, items: [], error: error.message });
        });
        return () => controller.abort();
    }, [branchId]);

    function updateLine(key, fields) {
        setLines((current) => current.map((line) => line.key === key ? { ...line, ...fields } : line));
    }

    function changeBranch(event) {
        setBranchId(Number(event.target.value));
        setLines((current) => current.map((line) => ({ ...line, inventoryItemId: '' })));
    }

    function submit(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        save({
            branchId,
            supplierId: Number(form.get('supplierId')),
            invoiceNumber: form.get('invoiceNumber'),
            date: form.get('date'),
            paidAmount: form.get('paidAmount') || '0',
            details: lines.map(({ type, inventoryItemId, description, quantity, unitCost }) => ({
                quantity: String(Number(quantity)), unitCost: Number(unitCost).toFixed(6),
                ...(type === 'stock' ? {
                    inventoryItemId: Number(inventoryItemId),
                    expectedUnit: items.find((item) => item.id === Number(inventoryItemId)).unit,
                } : { description }),
            })),
        });
    }

    return (
        <Modal isOpen size="lg" scrollable toggle={saving ? undefined : close} labelledBy="purchase-form-title" contentClassName="purchase-modal">
            <ModalHeader id="purchase-form-title" toggle={saving ? undefined : close}>Registrar factura de compra</ModalHeader>
            <Form onSubmit={submit}>
                <ModalBody>
                    {error && <Alert color="danger">{error}</Alert>}
                    <fieldset disabled={saving}>
                        <Row>
                            <Col sm="6"><FormGroup>
                                <Label for="purchase-branch">Sucursal</Label>
                                <Input id="purchase-branch" type="select" value={branchId} onChange={changeBranch}>
                                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                                </Input>
                            </FormGroup></Col>
                            <Col sm="6"><FormGroup>
                                <Label for="purchase-supplier">Proveedor</Label>
                                <Input id="purchase-supplier" name="supplierId" type="select" defaultValue="" required>
                                    <option value="" disabled>Selecciona un proveedor</option>
                                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                                </Input>
                            </FormGroup></Col>
                            <Col sm="6"><FormGroup>
                                <Label for="invoice-number">Número de factura</Label>
                                <Input id="invoice-number" name="invoiceNumber" maxLength={100} required />
                            </FormGroup></Col>
                            <Col sm="6"><FormGroup>
                                <Label for="invoice-date">Fecha de factura</Label>
                                <Input id="invoice-date" name="date" type="date" defaultValue={today()} required />
                            </FormGroup></Col>
                        </Row>

                        <h2 className="h6 mb-3">Renglones de la factura</h2>
                        {hasStockLines && inventoryError && <Alert color="danger">{inventoryError}</Alert>}
                        {lines.map((line, index) => (
                            <fieldset key={line.key} className="purchase-line border rounded-3 p-3 mb-3">
                                <legend className="float-none w-auto px-2 fs-6 mb-0">Renglón {index + 1}</legend>
                                <Row>
                                    <Col md="4"><FormGroup>
                                        <Label for={`${line.key}-type`}>Tipo</Label>
                                        <Input id={`${line.key}-type`} type="select" value={line.type}
                                            onChange={(event) => updateLine(line.key, { type: event.target.value })}>
                                            <option value="stock">Entrada de insumo</option>
                                            <option value="expense">Gasto</option>
                                        </Input>
                                    </FormGroup></Col>
                                    <Col md="8"><FormGroup>
                                        <Label for={`${line.key}-item`}>{line.type === 'stock' ? 'Insumo y unidad' : 'Descripción del gasto'}</Label>
                                        {line.type === 'stock' ? (
                                            <Input id={`${line.key}-item`} type="select" value={line.inventoryItemId} required
                                                disabled={inventoryPending || Boolean(inventoryError)}
                                                onChange={(event) => updateLine(line.key, { inventoryItemId: event.target.value })}>
                                                <option value="" disabled>{inventoryPending ? 'Cargando insumos…' : items.length ? 'Selecciona un insumo' : 'Sin insumos disponibles'}</option>
                                                {items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                                            </Input>
                                        ) : (
                                            <Input id={`${line.key}-item`} value={line.description} maxLength={200} required
                                                onChange={(event) => updateLine(line.key, { description: event.target.value })} />
                                        )}
                                    </FormGroup></Col>
                                    <Col xs="6" md="4"><FormGroup>
                                        <Label for={`${line.key}-quantity`}>Cantidad</Label>
                                        <Input id={`${line.key}-quantity`} type="number" min="1" max="999999999" step="1"
                                            value={line.quantity} required onChange={(event) => updateLine(line.key, { quantity: event.target.value })} />
                                    </FormGroup></Col>
                                    <Col xs="6" md="4"><FormGroup>
                                        <Label for={`${line.key}-cost`}>Costo unitario</Label>
                                        <Input id={`${line.key}-cost`} type="number" min="0" max="99999999.999999" step="0.000001"
                                            value={line.unitCost} required onChange={(event) => updateLine(line.key, { unitCost: event.target.value })} />
                                    </FormGroup></Col>
                                    <Col md="4" className="d-flex justify-content-between align-items-center gap-2 pb-2">
                                        <span className="fw-semibold" aria-label="Subtotal">{money(Number(lineCents(line)) / 100)}</span>
                                        <Button size="sm" color="outline-danger" type="button" disabled={lines.length === 1}
                                            aria-label={`Quitar renglón ${index + 1}`}
                                            onClick={() => setLines(lines.filter(({ key }) => key !== line.key))}>
                                            <i className="bi bi-trash" aria-hidden="true" />
                                        </Button>
                                    </Col>
                                </Row>
                            </fieldset>
                        ))}
                        <Button color="outline-secondary" size="sm" type="button" disabled={lines.length >= 100}
                            onClick={() => setLines([...lines, newLine(lines.at(-1).key + 1)])}>Agregar renglón</Button>

                        <Row className="align-items-end mt-3">
                            <Col sm="6"><FormGroup className="mb-0">
                                <Label for="invoice-paid">Abono inicial</Label>
                                <Input id="invoice-paid" name="paidAmount" type="number" defaultValue="0" min="0" step="0.01" />
                            </FormGroup></Col>
                            <Col sm="6" className="text-sm-end mt-3 mt-sm-0">
                                <span>Total de la factura</span>
                                <strong className="d-block fs-4" aria-live="polite">{money(Number(total) / 100)}</strong>
                            </Col>
                        </Row>
                    </fieldset>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" type="button" onClick={close} disabled={saving}>Cancelar</Button>
                    <Button className="purchase-primary" type="submit"
                        disabled={saving || (hasStockLines && (inventoryPending || Boolean(inventoryError)))}>
                        {saving ? 'Registrando…' : 'Registrar compra'}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
}
