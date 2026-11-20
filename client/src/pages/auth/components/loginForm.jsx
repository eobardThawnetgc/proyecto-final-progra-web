
import { useState } from "react";

import {
    Form,
    FormGroup,
    Label,
    Input,
    Button
} from "reactstrap";

const LoginForm = ({ onSubmit }) => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            email,
            password
        });
    };

    return (
        <Form onSubmit={handleSubmit} className="login-form">

            <FormGroup className="login-form-group">
                <Label for="email">
                    Correo electrónico
                </Label>

                <div className="login-input-wrapper">
                    <i className="bi bi-envelope"></i>

                    <Input
                        id="email"
                        type="email"
                        placeholder="nombre@origenes.com"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        autoComplete="username"
                        required
                    />
                </div>
            </FormGroup>

            <FormGroup className="login-form-group">
                <Label for="password">
                    Contraseña
                </Label>

                <div className="login-input-wrapper password-input-wrapper">
                    <i className="bi bi-lock"></i>

                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        autoComplete="current-password"
                        required
                    />

                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                            showPassword
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                        }
                    >
                        <i className={
                            showPassword
                                ? "bi bi-eye-slash"
                                : "bi bi-eye"
                        }></i>
                    </button>
                </div>
            </FormGroup>

            <Button
                type="submit"
                className="login-submit"
                block
            >
                Iniciar sesión
                <i className="bi bi-arrow-right"></i>
            </Button>

        </Form>
    );
}

export default LoginForm;
