
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';
let sessionClosedNotified = false;

export const api = async (endpoint, options = {}) => {
    let response;
    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });
    } catch (cause) {
        const error = new Error('No se pudo conectar con el servidor. Verifica que el backend esté iniciado e inténtalo de nuevo.');
        error.status = 0;
        error.cause = cause;
        throw error;
    }

    const data = await response.json().catch(() => null);

    if (response.ok && endpoint === '/auth/login') sessionClosedNotified = false;
    if (response.status === 401 && endpoint !== '/auth/login' && !sessionClosedNotified) {
        sessionClosedNotified = true;
        toast.warning('La sesión se cerró o venció. Inicia sesión de nuevo para continuar.');
    }

    if (!response.ok) {
        const error = new Error(
            data?.message || "Ocurrió un error en el servidor"
        );
        error.status = response.status;
        error.details = data?.errors;
        throw error;
    }

    return data;
};
