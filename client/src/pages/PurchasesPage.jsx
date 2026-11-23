import { useState } from 'react';
import { useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, Badge, Button, Card, Container, Input, Label, Table } from 'reactstrap';
import PurchaseForm from '../components/purchases/PurchaseForm.jsx';
import SupplierForm from '../components/purchases/SupplierForm.jsx';
import PurchaseDetails from '../components/purchases/PurchaseDetails.jsx';
import { invoiceDate, money, paymentStatuses } from '../components/purchases/purchaseFormatting.js';
import { purchasesService } from '../services/purchasesService.js';
import { logout } from '../services/authService.js';
import './purchases.css';

export default function PurchasesPage() {
    const { employee, purchases, suppliers, branches } = useLoaderData();
    const navigate = useNavigate();
    const { revalidate, state } = useRevalidator();
    const [section, setSection] = useState('Compras');
    const [filter, setFilter] = useState('');
    const [dialog, setDialog] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const isPurchases = section === 'Compras';
    const selectedPurchase = purchases?.find((purchase) => purchase.id === dialog?.id);
    const visiblePurchases = purchases?.filter((purchase) => !filter || purchase.status === filter);

    function open(type, record) {
        setError('');
        setDialog({ type, id: record?.id, record });
    }

    async function signOut() {
        try {
            await logout();
            navigate('/auth/login', { replace: true });
        } catch (error) {
            toast.error(error.message);
        }
    }

    async function save(action, message) {
        setSaving(true);
        setError('');
        try {
            await action();
            setDialog(null);
            toast.success(message);
            await revalidate();
        } catch (error) {
            if (error.status === 401) navigate('/auth/login', { replace: true });
            else {
                setError(error.message);
                if (error.status === 409 && dialog.type === 'detail') await revalidate();
            }
        } finally {
            setSaving(false);
        }
    }

    const close = () => setDialog(null);

    return (
        <main className="purchases-page">
            <header className="purchases-header">
                <Container className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-3">
                    <span className="purchases-brand"><i className="bi bi-cup-hot" aria-hidden="true" /> Orígenes SV</span>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <span>{employee.name}</span>
                        <Button outline color="light" size="sm" onClick={signOut}>Cerrar sesión</Button>
                    </div>
                </Container>
            </header>
            <Container className="py-4 py-md-5">
                <h1 className="purchase-title mb-4">Compras y proveedores</h1>
                {!purchases ? <Alert color="warning">El módulo está disponible para administradores y gerentes.</Alert> : (
                    <>
                        <nav className="d-flex gap-3 border-bottom mb-4" aria-label="Compras y proveedores">
                            {['Compras', 'Proveedores'].map((name) => (
                                <button key={name} type="button" className="purchase-tab" aria-pressed={section === name}
                                    onClick={() => setSection(name)}>{name}</button>
                            ))}
                        </nav>
                        <Card className="purchase-card overflow-hidden" aria-busy={state === 'loading'}>
                            <div className="purchase-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3 p-3 p-md-4">
                                <h2 className="h5 mb-0">{isPurchases ? 'Facturas de compra' : 'Directorio de proveedores'}</h2>
                                <div className="d-flex flex-wrap gap-2">
                                    {isPurchases && <>
                                        <Label for="purchase-status-filter" className="visually-hidden">Estado de pago</Label>
                                        <Input id="purchase-status-filter" type="select" className="w-auto" value={filter}
                                            onChange={(event) => setFilter(event.target.value)}>
                                            <option value="">Todos los estados</option>
                                            {Object.entries(paymentStatuses).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
                                        </Input>
                                    </>}
                                    <Button className="purchase-primary" disabled={saving || (isPurchases && (!suppliers.length || !branches.length))}
                                        onClick={() => open(isPurchases ? 'purchase' : 'supplier')}>
                                        <i className="bi bi-plus-lg me-2" aria-hidden="true" />
                                        {isPurchases ? 'Registrar compra' : 'Nuevo proveedor'}
                                    </Button>
                                </div>
                            </div>
                            {isPurchases ? (
                                <Table responsive hover className="purchase-table align-middle mb-0">
                                    <thead><tr><th>Factura</th><th>Proveedor</th><th>Sucursal</th><th>Fecha</th><th>Total</th><th>Saldo</th><th>Estado</th><th>Detalle</th></tr></thead>
                                    <tbody>
                                        {visiblePurchases.map((purchase) => (
                                            <tr key={purchase.id}>
                                                <th scope="row">{purchase.invoiceNumber}</th><td>{purchase.supplier.name}</td><td>{purchase.branch.name}</td>
                                                <td>{invoiceDate(purchase.date)}</td><td>{money(purchase.total)}</td><td>{money(purchase.balance)}</td>
                                                <td><Badge color={paymentStatuses[purchase.status].color} className="text-dark bg-opacity-25">
                                                    {paymentStatuses[purchase.status].label}
                                                </Badge></td>
                                                <td><Button color="link" size="sm" aria-label={`Ver factura ${purchase.invoiceNumber}`}
                                                    onClick={() => open('detail', purchase)}>Ver</Button></td>
                                            </tr>
                                        ))}
                                        {!visiblePurchases.length && <tr><td colSpan="8" className="text-center py-5 text-body-secondary">
                                            {filter ? 'No hay facturas con este estado.' : 'Todavía no hay facturas registradas.'}
                                            {!suppliers.length && <div>Agrega un proveedor para registrar la primera compra.</div>}
                                        </td></tr>}
                                    </tbody>
                                </Table>
                            ) : (
                                <Table responsive hover className="purchase-table align-middle mb-0">
                                    <thead><tr><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Dirección</th><th>Acción</th></tr></thead>
                                    <tbody>
                                        {suppliers.map((supplier) => (
                                            <tr key={supplier.id}>
                                                <th scope="row">{supplier.name}</th><td>{supplier.phone || '—'}</td>
                                                <td>{supplier.email || '—'}</td><td>{supplier.address || '—'}</td>
                                                <td><Button color="link" size="sm" aria-label={`Editar ${supplier.name}`} onClick={() => open('supplier', supplier)}>Editar</Button></td>
                                            </tr>
                                        ))}
                                        {!suppliers.length && <tr><td colSpan="5" className="text-center py-5 text-body-secondary">Todavía no hay proveedores registrados.</td></tr>}
                                    </tbody>
                                </Table>
                            )}
                        </Card>
                    </>
                )}
            </Container>

            {dialog?.type === 'supplier' && <SupplierForm supplier={dialog.record} {...{ close, saving, error }}
                save={(id, data) => save(() => purchasesService.saveSupplier(id, data), 'Proveedor guardado')} />}
            {dialog?.type === 'purchase' && <PurchaseForm branches={branches} homeBranchId={employee.branchId} suppliers={suppliers}
                {...{ close, saving, error }} save={(data) => save(() => purchasesService.create(data), 'Compra registrada')} />}
            {dialog?.type === 'detail' && selectedPurchase && <PurchaseDetails purchase={selectedPurchase} {...{ close, saving, error }}
                save={(id, amount) => save(() => purchasesService.updatePayment(id, amount), 'Pago actualizado')} />}
        </main>
    );
}
