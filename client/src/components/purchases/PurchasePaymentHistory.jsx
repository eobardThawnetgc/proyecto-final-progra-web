import { useState } from 'react';
import { Button, Form, FormGroup, Input, Label, Table } from 'reactstrap';
import { money, paymentDate } from './purchaseFormatting.js';

export default function PurchasePaymentHistory({ payments, reverse, saving }) {
    const [reversingId, setReversingId] = useState(null);
    const reversedIds = new Set(payments.map(({ reversesId }) => reversesId));
    const selected = payments.find(({ id, reversesId }) => id === reversingId && !reversesId && !reversedIds.has(id));

    function submit(event) {
        event.preventDefault();
        reverse(selected.id, new FormData(event.currentTarget).get('reason'));
    }

    return (
        <section className="mb-4" aria-labelledby="purchase-payments-title">
            <h2 className="h6" id="purchase-payments-title">Historial de abonos</h2>
            {payments.length ? (
                <Table responsive size="sm" className="align-middle">
                    <thead><tr><th>Movimiento</th><th>Fecha y responsable</th><th>Monto</th><th>Acción</th></tr></thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id}>
                                <td>
                                    {payment.reversesId ? `Reversión del abono #${payment.reversesId}` : payment.imported ? 'Abonos anteriores (acumulado)' : `Abono #${payment.id}`}
                                    {reversedIds.has(payment.id) && <small className="d-block text-body-secondary">Revertido</small>}
                                    {payment.reason && <small className="d-block text-body-secondary text-break">{payment.reason}</small>}
                                </td>
                                <td>
                                    {payment.imported ? '—' : paymentDate(payment.createdAt)}
                                    {payment.employee && <small className="d-block text-body-secondary">{payment.employee.name}</small>}
                                </td>
                                <td>{money(payment.amount)}</td>
                                <td>{!payment.reversesId && !reversedIds.has(payment.id) && (
                                    <Button type="button" color="outline-danger" size="sm" disabled={saving}
                                        aria-label={`Revertir abono #${payment.id}`} onClick={() => setReversingId(payment.id)}>Revertir</Button>
                                )}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : <p className="text-body-secondary mb-0">Todavía no hay abonos registrados.</p>}
            {selected && (
                <Form key={selected.id} onSubmit={submit} className="border rounded p-3">
                    <FormGroup>
                        <Label for="purchase-reversal-reason">Motivo para revertir {money(selected.amount)}</Label>
                        <Input id="purchase-reversal-reason" name="reason" type="text" required maxLength={250} disabled={saving} />
                    </FormGroup>
                    <div className="d-flex gap-2">
                        <Button type="button" color="secondary" size="sm" disabled={saving} onClick={() => setReversingId(null)}>Cancelar</Button>
                        <Button type="submit" color="danger" size="sm" disabled={saving}>Confirmar reversión</Button>
                    </div>
                </Form>
            )}
        </section>
    );
}
