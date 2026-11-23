
import { useNavigate } from "react-router-dom";
import "./errorPage.css";

function ErrorPage() {
  const navigate = useNavigate();

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

        <span className="error-code-label">
          ERROR 404
        </span>
      </header>

      <section className="error-content">
        <span className="error-number">404</span>

        <h1>
          Parece que nos perdimos
          <br />
          en el camino.
        </h1>

        <p className="error-description">
          La página que buscas no existe o ha cambiado
          de ubicación. Pero tranquilo, podemos encontrar
          el camino de regreso.
        </p>

        <div className="error-message">
          <i className="bi bi-cup-hot"></i>

          <span>UNA PAUSA EN EL CAMINO</span>

          <h3>
            Todo buen origen merece
            un nuevo comienzo.
          </h3>
        </div>

        <div className="error-actions">
          <button
            className="error-button"
            onClick={() => navigate("/")}
          >
            <i className="bi bi-house"></i>
            Volver al inicio
          </button>

          <button
            className="error-back"
            onClick={() => navigate(-1)}
          >
            Regresar
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
