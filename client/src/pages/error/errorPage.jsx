
import { useNavigate, useRouteError } from "react-router-dom";
import "./errorPage.css";

function ErrorPage() {
  const navigate = useNavigate();
  const routeError = useRouteError();
  const isConnectionError = routeError?.status === 0
    || routeError?.message?.includes('No se pudo conectar')
    || routeError?.message === 'Failed to fetch';
  const status = routeError?.status || (isConnectionError ? 503 : 500);
  const heading = isConnectionError
    ? 'No pudimos conectar con el servidor.'
    : status === 404 ? 'Parece que nos perdimos en el camino.' : 'Algo salió mal al cargar esta página.';
  const description = isConnectionError
    ? 'La aplicación no recibió respuesta del backend. Comprueba que el servidor esté iniciado en el puerto 3000 y vuelve a intentarlo.'
    : status === 404
      ? 'La página que buscas no existe o ha cambiado de ubicación. Puedes volver al inicio.'
      : 'Ocurrió un problema al cargar la información. Intenta recargar la página.';

  return (
    <main className="error-page">
      <header className="error-header">
        <div className="error-brand">
          <div className="error-brand-icon">
            <i className="bi bi-flower1"></i>
          </div>

          <div>
            <h2>ORÍGENES</h2>
            <span>SV · MANAGEMENT SYSTEM</span>
          </div>
        </div>

        <span className="error-code-label">{isConnectionError ? 'SIN CONEXIÓN' : `ERROR ${status}`}</span>
      </header>

      <section className="error-content">
        <span className="error-number">{isConnectionError ? '503' : status}</span>

        <h1>
          {heading}
        </h1>

        <p className="error-description">
          {description}
        </p>

        <div className="error-message">
          <i className="bi bi-cup-hot"></i>

            <span>{isConnectionError ? 'SERVIDOR SIN RESPUESTA' : 'UNA PAUSA EN EL CAMINO'}</span>

          <h3>
            {isConnectionError ? 'Inicia el backend y vuelve a cargar.' : 'Todo buen origen merece un nuevo comienzo.'}
          </h3>
        </div>

        <div className="error-actions">
          <button
            className="error-button"
            onClick={() => window.location.reload()}
          >
            <i className={`bi ${isConnectionError ? 'bi-arrow-clockwise' : 'bi-house'}`}></i>
            {isConnectionError ? 'Reintentar conexión' : 'Recargar página'}
          </button>

          <button
            className="error-back"
            onClick={() => navigate("/")}
          >
            Volver al inicio
          </button>
        </div>
      </section>

      <footer className="error-footer">
        <span>ORÍGENES SV © 2026</span>
        <span>HECHO CON PROPÓSITO</span>
      </footer>
    </main>
  );
}

export default ErrorPage;
