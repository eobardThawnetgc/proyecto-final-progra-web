import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import LoginBrand from "./components/loginBrand";
import LoginForm from "./components/loginForm";
import LoginDecoration from "./components/loginDecoration";
import { login } from "../../services/authService";
import { loginSchema } from "./validators/loginValidator";

import "./components/login.css";

const LoginPage = () => {

    const navigate = useNavigate();

    const handleLogin = async (credentials) => {
        try {
            const result = loginSchema.safeParse(credentials);

            if (!result.success) {
                const firstError = result.error.issues[0];

                toast.error(firstError.message);
                return;
            }

            const response = await login(result.data);

            toast.success(response.message);

            navigate(response.employee?.role === 'CASHIER' ? '/caja' : '/productos', {
                replace: true
            });

        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <main className="login-page">

            <section className="login-container">

                <div className="login-left">

                    <LoginBrand />

                    <div className="login-content">

                        <div className="login-heading">
                            <span>BIENVENIDO A ORÍGENES</span>

                            <h1>
                                Nos alegra
                                <br />
                                tenerte aquí.
                            </h1>

                            <p>
                                Ingresa tus credenciales para acceder
                                al sistema de gestión empresarial.
                            </p>
                        </div>

                        <LoginForm onSubmit={handleLogin} />

                        <div className="login-security">
                            <i className="bi bi-shield-check"></i>

                            <span>
                                Acceso seguro para personal autorizado
                            </span>
                        </div>

                    </div>

                    <footer className="login-footer">
                        © 2026 Orígenes SV. Todos los derechos reservados.
                    </footer>

                </div>

                <LoginDecoration />

            </section>

        </main>
    );
}

export default LoginPage;
