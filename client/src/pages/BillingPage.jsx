import { Fragment, useState } from 'react';
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { Alert, Badge, Button, Card, CardBody, Container, Form, FormGroup, Input, Label, Spinner, Table } from 'reactstrap';
import { toast } from 'sonner';
import { logout } from '../services/authService.js';
import { billingService } from '../services/billingService.js';
import './billing.css';

const paymentMethods = [
    ['CASH', 'Efectivo'],
    ['CARD', 'Tarjeta'],
    ['DIGITAL', 'Pago digital'],
    ['BITCOIN', 'Bitcoin'],
    ['CHIVO_WALLET', 'Chivo Wallet'],
];
const money = (amount) => new Intl.NumberFormat('es-SV', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
}).format(Number(amount ?? 0));
const dateTime = (value) => new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value));
const documentLabel = (sale) => `${sale.documentType === 'CCF' ? 'CCF' : 'Factura'} #${String(sale.documentNumber).padStart(6, '0')}`;
const emptyBuyer = { customerName: '', customerNit: '', customerNrc: '' };
const emptyLine = () => ({ productId: '', quantity: '1' });

export default function BillingPage() {
    const { employee, products, sales, nextNumbers, hasOpenCashSession } = useLoaderData();
    const navigate = useNavigate();
    const { revalidate, state } = useRevalidator();
    const [documentType, setDocumentType] = useState('CONSUMER');
    const [buyer, setBuyer] = useState(emptyBuyer);
    const [lines, setLines] = useState([emptyLine()]);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [expandedSaleId, setExpandedSaleId] = useState(null);

    const productById = new Map(products.map((product) => [String(product.id), product]));
    const lineTotals = lines.map((line) => {
        const product = productById.get(line.productId);
        const quantity = Number(line.quantity);
        return product && Number.isFinite(quantity) && quantity > 0
            ? Math.round(Number(product.price) * quantity * 100) / 100
            : 0;
    });
    const subtotal = lineTotals.reduce((sum, amount) => sum + amount, 0);
    const tax = Math.round(subtotal * 0.13 * 100) / 100;
    const total = subtotal + tax;

    async function signOut() {
        try {
            await logout();
            navigate('/auth/login', { replace: true });
        } catch (signOutError) {
            setError(signOutError.message);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                documentType,
                ...buyer,
                paymentMethod,
                details: lines.map((line) => ({
                    productId: Number(line.productId),
                    quantity: line.quantity.trim(),
                })),
            };
            const { sale } = await billingService.create(payload);
            toast.success(`${documentLabel(sale)} emitido correctamente`);
            setBuyer(emptyBuyer);
            setLines([emptyLine()]);
            setDocumentType('CONSUMER');
            await revalidate();
        } catch (submitError) {
            if (submitError.status === 401) navigate('/auth/login', { replace: true });
            else {
                setError(submitError.message);
                if (submitError.status === 409) await revalidate();
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="billing-page">
            <header className="billing-header">
                <Container className="d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
                    <span className="billing-brand"><i className="bi bi-cup-hot" aria-hidden="true" /> Orígenes SV</span>
                    <div className="d-flex flex-wrap align-items-center gap-3">
                        <Link className="billing-header-link" to="/caja">Caja</Link>
                        {employee.role !== 'CASHIER' && <Link className="billing-header-link" to="/compras">Compras</Link>}
                        <span>{employee.name}</span>
                        <Button outline color="light" size="sm" onClick={signOut}>Cerrar sesión</Button>
                    </div>
                </Container>
            </header>

            <Container className="py-4 py-md-5">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                    <div>
                        <h1 className="billing-title mb-1">Facturación</h1>
                        <p className="text-body-secondary mb-0">Emite facturas y CCF con IVA y correlativo por sucursal.</p>
                    </div>
                    <div className="billing-next-numbers">
                        <span>Próxima factura <strong>#{String(nextNumbers.CONSUMER).padStart(6, '0')}</strong></span>
                        <span>Próximo CCF <strong>#{String(nextNumbers.CCF).padStart(6, '0')}</strong></span>
                    </div>
                </div>

                {error && <Alert color="danger" toggle={() => setError('')}>{error}</Alert>}
                {!hasOpenCashSession && (
                    <Alert color="warning">
                        Para emitir documentos, primero debes <Link to="/caja">abrir un turno de caja</Link>.
                    </Alert>
                )}

                <Card className="billing-card mb-4">
                    <CardBody className="p-3 p-md-4">
                        <h2 className="h5 mb-3">Nuevo documento</h2>
                        {!products.length ? (
                            <Alert color="info" className="mb-0">No hay productos activos registrados en esta sucursal.</Alert>
                        ) : (
                            <Form onSubmit={handleSubmit}>
                                <div className="row g-3 mb-3">
                                    <FormGroup className="col-md-5 mb-0">
                                        <Label for="document-type">Tipo de documento</Label>
                                        <Input id="document-type" type="select" value={documentType}
                                            onChange={(event) => setDocumentType(event.target.value)}>
                                            <option value="CONSUMER">Factura consumidor final</option>
                                            <option value="CCF">Comprobante de crédito fiscal (CCF)</option>
                                        </Input>
                                    </FormGroup>
                                    <FormGroup className="col-md-4 mb-0">
                                        <Label for="payment-method">Método de pago</Label>
                                        <Input id="payment-method" type="select" value={paymentMethod}
                                            onChange={(event) => setPaymentMethod(event.target.value)}>
                                            {paymentMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </Input>
                                    </FormGroup>
                                </div>

                                {documentType === 'CCF' && (
                                    <div className="row g-3 mb-4">
                                        <FormGroup className="col-md-4 mb-0">
                                            <Label for="customer-name">Nombre o razón social</Label>
                                            <Input id="customer-name" required maxLength="160" value={buyer.customerName}
                                                onChange={(event) => setBuyer({ ...buyer, customerName: event.target.value })} />
                                        </FormGroup>
                                        <FormGroup className="col-md-4 mb-0">
                                            <Label for="customer-nit">NIT</Label>
                                            <Input id="customer-nit" required maxLength="30" value={buyer.customerNit}
                                                onChange={(event) => setBuyer({ ...buyer, customerNit: event.target.value })} />
                                        </FormGroup>
                                        <FormGroup className="col-md-4 mb-0">
                                            <Label for="customer-nrc">NRC</Label>
                                            <Input id="customer-nrc" required maxLength="30" value={buyer.customerNrc}
                                                onChange={(event) => setBuyer({ ...buyer, customerNrc: event.target.value })} />
                                        </FormGroup>
                                    </div>
                                )}

                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                                    <h3 className="h6 mb-0">Productos</h3>
                                    <Button type="button" color="success" outline size="sm"
                                        onClick={() => setLines([...lines, emptyLine()])} disabled={lines.length >= 100}>
                                        <i className="bi bi-plus-lg me-1" aria-hidden="true" />Agregar producto
                                    </Button>
                                </div>
                                <div className="table-responsive">
                                    <Table className="billing-table align-middle mb-3">
                                        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Importe</th><th><span className="visually-hidden">Acciones</span></th></tr></thead>
                                        <tbody>
                                            {lines.map((line, index) => {
                                                const product = productById.get(line.productId);
                                                return (
                                                    <tr key={index}>
                                                        <td className="billing-product-cell">
                                                            <Label for={`product-${index}`} className="visually-hidden">Producto {index + 1}</Label>
                                                            <Input id={`product-${index}`} type="select" required value={line.productId}
                                                                onChange={(event) => setLines(lines.map((item, row) => row === index ? { ...item, productId: event.target.value } : item))}>
                                                                <option value="">Selecciona un producto</option>
                                                                {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                                            </Input>
                                                        </td>
                                                        <td className="billing-quantity-cell">
                                                            <Label for={`quantity-${index}`} className="visually-hidden">Cantidad</Label>
                                                            <Input id={`quantity-${index}`} type="number" min="0.001" step="0.001" required
                                                                value={line.quantity}
                                                                onChange={(event) => setLines(lines.map((item, row) => row === index ? { ...item, quantity: event.target.value } : item))} />
                                                        </td>
                                                        <td>{product ? money(product.price) : '—'}</td>
                                                        <td>{money(lineTotals[index])}</td>
                                                        <td>
                                                            <Button type="button" color="link" className="text-danger p-1"
                                                                aria-label={`Quitar producto ${index + 1}`} disabled={lines.length === 1}
                                                                onClick={() => setLines(lines.filter((_, row) => row !== index))}>
                                                                <i className="bi bi-trash" aria-hidden="true" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>

                                <div className="billing-total-panel ms-auto mb-3">
                                    <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                                    <div><span>IVA (13%)</span><strong>{money(tax)}</strong></div>
                                    <div className="billing-grand-total"><span>Total</span><strong>{money(total)}</strong></div>
                                </div>
                                <div className="d-flex justify-content-end">
                                    <Button className="billing-primary" type="submit"
                                        disabled={saving || !hasOpenCashSession || !products.length || total <= 0}>
                                        {saving ? <><Spinner size="sm" className="me-2" />Emitiendo…</> : 'Emitir documento'}
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </CardBody>
                </Card>

                <Card className="billing-card overflow-hidden">
                    <div className="p-3 p-md-4 border-bottom d-flex justify-content-between align-items-center gap-3">
                        <div>
                            <h2 className="h5 mb-1">Documentos emitidos</h2>
                            <p className="text-body-secondary mb-0">Últimos 100 documentos de esta sucursal.</p>
                        </div>
                        {state === 'loading' && <Spinner size="sm" color="success" aria-label="Actualizando documentos" />}
                    </div>
                    <Table responsive hover className="billing-table align-middle mb-0">
                        <thead><tr><th>Documento</th><th>Cliente</th><th>Fecha</th><th>Empleado</th><th>Subtotal</th><th>IVA</th><th>Total</th><th>Detalle</th></tr></thead>
                        <tbody>
                            {sales.map((sale) => {
                                const expanded = expandedSaleId === sale.id;
                                return (
                                    <Fragment key={sale.id}>
                                        <tr key={sale.id}>
                                            <th scope="row"><Badge color={sale.documentType === 'CCF' ? 'primary' : 'success'}>{documentLabel(sale)}</Badge></th>
                                            <td>{sale.customerName || 'Consumidor final'}</td>
                                            <td>{dateTime(sale.date)}</td>
                                            <td>{sale.employee.name}</td>
                                            <td>{money(sale.subtotal)}</td>
                                            <td>{money(sale.tax)}</td>
                                            <td><strong>{money(sale.total)}</strong></td>
                                            <td><Button color="link" size="sm" aria-expanded={expanded}
                                                onClick={() => setExpandedSaleId(expanded ? null : sale.id)}>
                                                {expanded ? 'Ocultar' : 'Ver'}
                                            </Button></td>
                                        </tr>
                                        {expanded && <tr key={`${sale.id}-detail`} className="billing-detail-row">
                                            <td colSpan="8">
                                                <div className="billing-detail-grid">
                                                    <div>
                                                        <h3 className="h6">Datos del cliente</h3>
                                                        <span>{sale.customerName || 'Consumidor final'}</span>
                                                        {sale.customerNit && <span>NIT: {sale.customerNit}</span>}
                                                        {sale.customerNrc && <span>NRC: {sale.customerNrc}</span>}
                                                    </div>
                                                    <div>
                                                        <h3 className="h6">Productos</h3>
                                                        {sale.details.map((detail) => (
                                                            <span key={detail.id}>
                                                                {detail.product.name} · {detail.quantity} × {money(detail.unitPrice)} = {money(detail.subtotal)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        <h3 className="h6">Pago</h3>
                                                        {sale.payments.map((payment) => (
                                                            <span key={payment.id}>{payment.method.replaceAll('_', ' ')} · {money(payment.amount)}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>}
                                    </Fragment>
                                );
                            })}
                            {!sales.length && <tr><td colSpan="8" className="text-center text-body-secondary py-5">Aún no se han emitido documentos.</td></tr>}
                        </tbody>
                    </Table>
                </Card>
            </Container>
        </main>
    );
}
