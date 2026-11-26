import { Fragment, useCallback, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Alert, Badge, Button, Card, CardBody, Container, Form, FormGroup,
    Input, Label, Spinner, Table,
} from 'reactstrap';
import { logout } from '../services/authService.js';
import { cashService } from '../services/cashService.js';
import AppNavbar from '../components/AppNavbar.jsx';
import './cash.css';

const paymentMethods = [
    { key: 'cash', method: 'CASH', label: 'Efectivo', icon: 'bi-cash-stack' },
    { key: 'card', method: 'CARD', label: 'Tarjeta', icon: 'bi-credit-card' },
    { key: 'digital', method: 'DIGITAL', label: 'Pago digital', icon: 'bi-phone' },
    { key: 'bitcoin', method: 'BITCOIN', label: 'Bitcoin', icon: 'bi-currency-bitcoin' },
    { key: 'chivoWallet', method: 'CHIVO_WALLET', label: 'Chivo Wallet', icon: 'bi-wallet2' },
];

const emptyCounts = { cash: '', card: '', digital: '', bitcoin: '', chivoWallet: '' };
const money = (amount) => new Intl.NumberFormat('es-SV', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
}).format(Number(amount ?? 0));
const dateTime = (value) => value
    ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '—';
const differenceTone = (amount) => Number(amount) === 0 ? 'text-success' : 'text-danger';

export default function CashPage() {
    const { employee, session: initialSession, sessions: initialSessions } = useLoaderData();
    const navigate = useNavigate();
    const [session, setSession] = useState(initialSession);
    const [sessions, setSessions] = useState(initialSessions);
    const [openingAmount, setOpeningAmount] = useState('0.00');
    const [counts, setCounts] = useState(emptyCounts);
    const [expandedSessionId, setExpandedSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageError, setPageError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setPageError('');
            const [current, history] = await Promise.all([
                cashService.current(), cashService.sessions(),
            ]);
            setSession(current.session);
            setSessions(history.sessions);
        } catch (error) {
            if (error.status === 401) navigate('/auth/login', { replace: true });
            else setPageError(error.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    async function signOut() {
        try {
            await logout();
            navigate('/auth/login', { replace: true });
        } catch (error) {
            toast.error(error.message);
        }
    }

    async function runAction(action, message) {
        try {
            setSaving(true);
            setPageError('');
            await action();
            toast.success(message);
            setCounts(emptyCounts);
            await loadData();
        } catch (error) {
            if (error.status === 401) navigate('/auth/login', { replace: true });
            else {
                setPageError(error.message);
                if (error.status === 409) await loadData();
            }
        } finally {
            setSaving(false);
        }
    }

    function handleOpen(event) {
        event.preventDefault();
        runAction(
            () => cashService.open({ openingAmount: openingAmount.trim() }),
            'Turno de caja abierto',
        );
    }

    function handleClose(event) {
        event.preventDefault();
        runAction(
            () => cashService.close(session.id, counts),
            'Turno cerrado y cuadre guardado',
        );
    }

    return (
        <main className="cash-page">
            <AppNavbar employee={employee} onSignOut={signOut} />

            <Container className="py-4 py-md-5">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                    <div>
                        <h1 className="cash-title mb-1">Caja y flujos</h1>
                        <p className="text-body-secondary mb-0">Apertura, cierre y cuadre por turno.</p>
                    </div>
                    <Button outline color="success" disabled={loading || saving} onClick={loadData}>
                        <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />Actualizar
                    </Button>
                </div>

                {pageError && <Alert color="danger" toggle={() => setPageError('')}>{pageError}</Alert>}

                {loading ? (
                    <div className="py-5 text-center"><Spinner color="success" /><span className="visually-hidden">Cargando caja</span></div>
                ) : session ? (
                    <Card className="cash-card mb-4">
                        <CardBody className="p-3 p-md-4">
                            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                                <div>
                                    <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                                        <h2 className="h4 mb-0">Turno abierto #{session.id}</h2>
                                        <Badge color="success" pill>En curso</Badge>
                                    </div>
                                    <p className="text-body-secondary mb-0">
                                        {session.branch.name} · Apertura {dateTime(session.openedAt)}
                                    </p>
                                </div>
                                <div className="cash-opening-balance">
                                    <small>Fondo inicial</small>
                                    <strong>{money(session.openingAmount)}</strong>
                                </div>
                            </div>

                            <Form onSubmit={handleClose}>
                                <h3 className="h5 mb-1">Cuadre de caja</h3>
                                <p className="text-body-secondary mb-3">
                                    Compara los pagos registrados con los montos contados o confirmados. El efectivo esperado incluye el fondo inicial.
                                </p>
                                <div className="table-responsive">
                                    <Table className="cash-table align-middle mb-3">
                                        <thead>
                                            <tr><th>Método</th><th>Esperado</th><th>Contado / confirmado</th><th>Diferencia</th></tr>
                                        </thead>
                                        <tbody>
                                            {paymentMethods.map(({ key, method, label, icon }) => {
                                                const expected = session.reconciliation[method].expected;
                                                const entered = counts[key];
                                                const difference = entered === '' ? null : (Number(entered) - Number(expected)).toFixed(2);
                                                return (
                                                    <tr key={method}>
                                                        <th scope="row"><i className={`bi ${icon} me-2 text-success`} aria-hidden="true" />{label}</th>
                                                        <td>{money(expected)}</td>
                                                        <td className="cash-count-cell">
                                                            <Label className="visually-hidden" for={`count-${key}`}>Monto contado para {label}</Label>
                                                            <Input id={`count-${key}`} type="number" min="0" step="0.01" required
                                                                value={entered} onChange={(event) => setCounts({ ...counts, [key]: event.target.value })}
                                                                aria-label={`Monto contado o confirmado para ${label}`} />
                                                        </td>
                                                        <td className={difference === null ? 'text-body-secondary' : differenceTone(difference)}>
                                                            {difference === null ? 'Por calcular' : money(difference)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="d-flex flex-wrap justify-content-end gap-2">
                                    <Button color="success" type="submit" disabled={saving}>
                                        {saving ? 'Guardando…' : 'Cerrar turno y guardar cuadre'}
                                    </Button>
                                </div>
                            </Form>
                        </CardBody>
                    </Card>
                ) : (
                    <Card className="cash-card mb-4">
                        <CardBody className="cash-empty p-4 p-md-5">
                            <div className="cash-empty-icon"><i className="bi bi-safe2" aria-hidden="true" /></div>
                            <h2 className="h4">No tienes un turno abierto</h2>
                            <p className="text-body-secondary">Registra el efectivo inicial para empezar a operar la caja.</p>
                            <Form onSubmit={handleOpen} className="cash-open-form">
                                <FormGroup>
                                    <Label for="opening-amount">Fondo inicial en efectivo</Label>
                                    <Input id="opening-amount" type="number" min="0" step="0.01" required
                                        value={openingAmount} onChange={(event) => setOpeningAmount(event.target.value)} />
                                </FormGroup>
                                <Button color="success" type="submit" disabled={saving}>
                                    {saving ? 'Abriendo…' : 'Abrir turno'}
                                </Button>
                            </Form>
                        </CardBody>
                    </Card>
                )}

                <Card className="cash-card overflow-hidden">
                    <div className="p-3 p-md-4 border-bottom">
                        <h2 className="h5 mb-1">Turnos recientes</h2>
                        <p className="text-body-secondary mb-0">Historial de tus últimos 20 turnos.</p>
                    </div>
                    <Table responsive hover className="cash-table align-middle mb-0">
                        <thead><tr><th>Turno</th><th>Abierto</th><th>Cerrado</th><th>Fondo inicial</th><th>Descuadre efectivo</th><th>Estado</th><th>Cuadre</th></tr></thead>
                        <tbody>
                            {sessions.map((item) => {
                                const cashDifference = item.reconciliation.CASH.difference;
                                const expanded = expandedSessionId === item.id;
                                return (
                                    <Fragment key={item.id}>
                                        <tr key={item.id}>
                                            <th scope="row">#{item.id}</th>
                                            <td>{dateTime(item.openedAt)}</td>
                                            <td>{dateTime(item.closedAt)}</td>
                                            <td>{money(item.openingAmount)}</td>
                                            <td className={cashDifference === null ? 'text-body-secondary' : differenceTone(cashDifference)}>
                                                {cashDifference === null ? 'Pendiente' : money(cashDifference)}
                                            </td>
                                            <td><Badge color={item.status === 'OPEN' ? 'success' : 'secondary'}>
                                                {item.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                                            </Badge></td>
                                            <td><Button color="link" size="sm" aria-expanded={expanded}
                                                onClick={() => setExpandedSessionId(expanded ? null : item.id)}>
                                                {expanded ? 'Ocultar' : 'Ver cuadre'}
                                            </Button></td>
                                        </tr>
                                        {expanded && <tr key={`${item.id}-detail`} className="cash-history-detail">
                                            <td colSpan="7">
                                                <div className="cash-history-methods">
                                                    {paymentMethods.map(({ method, label }) => {
                                                        const reconciliation = item.reconciliation[method];
                                                        return (
                                                            <div key={method}>
                                                                <strong>{label}</strong>
                                                                <span>Esperado {money(reconciliation.expected)}</span>
                                                                <span>Contado {reconciliation.counted === null ? 'Pendiente' : money(reconciliation.counted)}</span>
                                                                <span className={reconciliation.difference === null ? 'text-body-secondary' : differenceTone(reconciliation.difference)}>
                                                                    Diferencia {reconciliation.difference === null ? 'Pendiente' : money(reconciliation.difference)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>}
                                    </Fragment>
                                );
                            })}
                            {!sessions.length && <tr><td colSpan="7" className="text-center text-body-secondary py-4">Aún no hay turnos registrados.</td></tr>}
                        </tbody>
                    </Table>
                </Card>
            </Container>
        </main>
    );
}
