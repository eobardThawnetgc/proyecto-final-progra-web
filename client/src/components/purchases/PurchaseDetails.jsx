import { Alert, Badge, Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Table } from 'reactstrap';
import { invoiceDate, money, paymentStatuses } from './purchaseFormatting.js';

export default function PurchaseDetails({ purchase, close, save, saving, error }) {
    const status = paymentStatuses[purchase.status];

    function submit(event) {
        event.preventDefault();
        save(purchase.id, new FormData(event.currentTarget).get('paidAmount'));
    }

    return (
        <Modal isOpen size="lg" scrollable toggle={saving ? undefined : close} labelledBy="purchase-detail-title" contentClassName="purchase-modal">
            <ModalHeader id="purchase-detail-title" toggle={saving ? undefined : close}>Factura {purchase.invoiceNumber}</ModalHeader>
            <Form onSubmit={submit}>
                <ModalBody>
                    {error && <Alert color="danger">{error}</Alert>}
                    <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start mb-4">
                        <div>
                            <strong className="d-block">{purchase.supplier.name}</strong>
                            <span className="text-body-secondary">{purchase.branch.name} · {invoiceDate(purchase.date)}</span>
                        </div>
                        <Badge color={status.color} className="text-dark bg-opacity-25">{status.label}</Badge>
                    </div>
                    <Table responsive size="sm" className="align-middle">
                        <thead><tr><th>Descripción</th><th>Cantidad</th><th>Costo unitario</th><th>Subtotal</th></tr></thead>
                        <tbody>
                            {purchase.details.map((line) => (
                                <tr key={line.id}>
                                    <td>{line.description}</td><td>{line.quantity}</td>
                                    <td>{money(line.unitCost)}</td><td>{money(line.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <dl className="purchase-totals bg-body-tertiary rounded-3 p-3">
                        <div><dt>Total factura</dt><dd>{money(purchase.total)}</dd></div>
                        <div><dt>Total abonado</dt><dd>{money(purchase.paidAmount)}</dd></div>
                        <div><dt>Saldo pendiente</dt><dd>{money(purchase.balance)}</dd></div>
                    </dl>
                    {purchase.status !== 'PAID' && (
                        <FormGroup className="mb-0">
                            <Label for="payment-total">Nuevo total abonado</Label>
                            <Input id="payment-total" name="paidAmount" type="number" step="0.01" required
                                min={(Number(purchase.paidAmount) + 0.01).toFixed(2)} max={purchase.total}
                                disabled={saving} aria-describedby="payment-help" />
                            <small id="payment-help" className="text-body-secondary">Suma el nuevo abono al monto ya pagado.</small>
                        </FormGroup>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" type="button" onClick={close} disabled={saving}>Cerrar</Button>
                    {purchase.status !== 'PAID' && <Button className="purchase-primary" type="submit" disabled={saving}>
                        {saving ? 'Guardando…' : 'Guardar pago'}
                    </Button>}
                </ModalFooter>
            </Form>
        </Modal>
    );
}
