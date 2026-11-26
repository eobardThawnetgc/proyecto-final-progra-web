import { Button, Container } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import './app-navbar.css';

export default function AppNavbar({ employee, onSignOut }) {
    const { pathname } = useLocation();
    const canManage = ['ADMIN', 'MANAGER'].includes(employee?.role);
    const links = [
        { to: '/productos', label: 'Productos' },
        { to: '/facturacion', label: 'Facturación' },
        { to: '/caja', label: 'Caja' },
        ...(canManage ? [{ to: '/compras', label: 'Compras' }] : []),
    ];

    return (
        <header className="app-navbar">
            <Container className="app-navbar-inner">
                <Link className="app-navbar-brand" to="/productos">
                    <i className="bi bi-cup-hot" aria-hidden="true" />
                    <span>Orígenes SV</span>
                </Link>
                <nav className="app-navbar-navigation" aria-label="Navegación principal">
                    {links.map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className={pathname === to ? 'app-navbar-link active' : 'app-navbar-link'}
                            aria-current={pathname === to ? 'page' : undefined}
                        >
                            {label}
                        </Link>
                    ))}
                    <span className="app-navbar-user" title={`Sesión de ${employee?.name}`}>
                        <i className="bi bi-person-circle" aria-hidden="true" />
                        <span>{employee?.name}</span>
                    </span>
                    <Button outline color="light" size="sm" className="app-navbar-signout" onClick={onSignOut}>
                        Cerrar sesión
                    </Button>
                </nav>
            </Container>
        </header>
    );
}
