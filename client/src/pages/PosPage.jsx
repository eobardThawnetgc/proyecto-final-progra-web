import { useMemo, useState } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, Badge, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner } from 'reactstrap';
import AppNavbar from '../components/AppNavbar.jsx';
import { logout } from '../services/authService.js';
import { createPosSale } from '../services/salesService.js';
import { downloadInvoicePdf } from '../utils/invoicePdf.js';
import './pos.css';

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

export default function PosPage() {
    const { employee, products, hasOpenCashSession } = useLoaderData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [submittingSale, setSubmittingSale] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const filteredProducts = useMemo(() => {
        const query = searchTerm.trim().toLocaleLowerCase('es');
        return products.filter((product) => product.name.toLocaleLowerCase('es').includes(query));
    }, [products, searchTerm]);
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const tax = Math.round(subtotal * 0.13 * 100) / 100;
    const total = subtotal + tax;

    async function signOut() {
        try {
            await logout();
            navigate('/auth/login', { replace: true });
        } catch (error) {
            toast.error(error.message);
        }
    }

    function addToCart(product) {
        setFeedback(null);
        setCart((current) => {
            const existing = current.find((item) => item.id === product.id);
            return existing
                ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
                : [...current, { ...product, quantity: 1 }];
        });
    }

    function updateQuantity(productId, delta) {
        setCart((current) => current.map((item) => item.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item).filter((item) => item.quantity > 0));
    }

    async function handleCheckout() {
        if (!hasOpenCashSession) {
            setFeedback({ type: 'warning', message: 'Abre un turno de caja antes de registrar la venta.' });
            return;
        }
        if (!cart.length) {
            setFeedback({ type: 'warning', message: 'Agrega al menos un producto al carrito.' });
            return;
        }

        setSubmittingSale(true);
        setFeedback(null);
        try {
            const result = await createPosSale({
                documentType: 'CONSUMER',
                paymentMethod,
                items: cart.map(({ id, quantity }) => ({ productId: id, quantity })),
            });
            if (!result.sale) throw new Error('La venta se procesó sin devolver el documento emitido.');

            setCart([]);
            setFeedback({
                type: 'success',
                message: `Factura #${String(result.sale.documentNumber).padStart(6, '0')} registrada. El PDF se descargó.`,
            });
            try {
                downloadInvoicePdf(result.sale);
                toast.success('Venta registrada y factura descargada');
            } catch (downloadError) {
                toast.error(`La venta se registró, pero no se pudo descargar el PDF: ${downloadError.message}`);
            }
        } catch (error) {
            if (error.status === 401) navigate('/auth/login', { replace: true });
            else {
                setFeedback({ type: 'danger', message: error.message || 'No se pudo registrar la venta.' });
                toast.error(error.message || 'No se pudo registrar la venta.');
            }
        } finally {
            setSubmittingSale(false);
        }
    }

    return (
        <main className="pos-page">
            <AppNavbar employee={employee} onSignOut={signOut} />
            <Container className="py-4 py-md-5">
                <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                    <div>
                        <p className="pos-eyebrow mb-1">VENTAS</p>
                        <h1 className="pos-title mb-1">Punto de venta</h1>
                        <p className="text-body-secondary mb-0">Selecciona productos, arma el carrito y registra la venta.</p>
                    </div>
                    <Badge color={hasOpenCashSession ? 'success' : 'warning'} pill>
                        {hasOpenCashSession ? 'Caja abierta' : 'Caja cerrada'}
                    </Badge>
                </div>

                {!hasOpenCashSession && (
                    <Alert color="warning">
                        Para cobrar una venta abre primero un turno en <Link to="/caja">Caja</Link>.
                    </Alert>
                )}
                {feedback && <Alert color={feedback.type}>{feedback.message}</Alert>}

                <Row className="g-4 align-items-start">
                    <Col lg="8">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                            <h2 className="h5 mb-0">Menú</h2>
                            <Input className="pos-search" type="search" placeholder="Buscar producto…"
                                value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                        </div>
                        {!filteredProducts.length ? (
                            <Card className="pos-card"><CardBody className="text-center text-body-secondary py-5">
                                {products.length ? 'No hay productos que coincidan con la búsqueda.' : 'No hay productos activos en esta sucursal.'}
                            </CardBody></Card>
                        ) : (
                            <Row className="g-3">
                                {filteredProducts.map((product) => (
                                    <Col sm="6" xl="4" key={product.id}>
                                        <Card className="pos-product-card h-100">
                                            <CardBody className="d-flex flex-column">
                                                <div className="d-flex justify-content-between gap-2">
                                                    <h3 className="h6 mb-2">{product.name}</h3>
                                                    <Badge color="light" className="pos-product-type">
                                                        {product.type === 'PACKAGED' ? 'Empacado' : 'Preparado'}
                                                    </Badge>
                                                </div>
                                                {product.description && <p className="small text-body-secondary">{product.description}</p>}
                                                <strong className="pos-product-price mt-auto">{money(product.price)}</strong>
                                                <Button color="success" className="mt-3" onClick={() => addToCart(product)}>
                                                    <i className="bi bi-plus-lg me-2" aria-hidden="true" />Agregar al carrito
                                                </Button>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Col>

                    <Col lg="4">
                        <Card className="pos-card pos-cart-card">
                            <CardBody>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h2 className="h5 mb-0">Carrito</h2>
                                    <Badge color="success" pill>{cart.reduce((sum, item) => sum + item.quantity, 0)} artículos</Badge>
                                </div>
                                {!cart.length ? (
                                    <p className="text-body-secondary py-3 mb-0">Agrega productos del menú para comenzar.</p>
                                ) : (
                                    <ul className="pos-cart-list list-unstyled mb-3">
                                        {cart.map((item) => (
                                            <li key={item.id} className="pos-cart-item">
                                                <div className="flex-grow-1">
                                                    <strong>{item.name}</strong>
                                                    <small>{money(Number(item.price) * item.quantity)}</small>
                                                </div>
                                                <div className="d-flex align-items-center gap-1">
                                                    <Button size="sm" color="light" aria-label={`Quitar una unidad de ${item.name}`}
                                                        onClick={() => updateQuantity(item.id, -1)}>−</Button>
                                                    <span className="pos-cart-quantity">{item.quantity}</span>
                                                    <Button size="sm" color="light" aria-label={`Agregar una unidad de ${item.name}`}
                                                        onClick={() => updateQuantity(item.id, 1)}>+</Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <div className="pos-payment-field mb-3">
                                    <Label for="pos-payment-method">Método de pago</Label>
                                    <Input id="pos-payment-method" type="select" value={paymentMethod}
                                        onChange={(event) => setPaymentMethod(event.target.value)}>
                                        {paymentMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </Input>
                                </div>
                                <div className="pos-totals">
                                    <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                                    <div><span>IVA (13%)</span><strong>{money(tax)}</strong></div>
                                    <div className="pos-total"><span>Total</span><strong>{money(total)}</strong></div>
                                </div>
                                <Button color="success" className="w-100 mt-3" disabled={submittingSale || !cart.length || !hasOpenCashSession}
                                    onClick={handleCheckout}>
                                    {submittingSale ? <><Spinner size="sm" className="me-2" />Registrando…</> : 'Registrar venta y descargar factura'}
                                </Button>
                                <Link className="d-block text-center small mt-3" to="/facturacion">Ver historial de facturas</Link>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </main>
    );
}
