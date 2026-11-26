
import { api } from "./api";
import { toast } from "sonner";

let warningTimer;
function scheduleSessionWarning(sessionExpiresAt) {
    window.clearTimeout(warningTimer);
    const expiration = Number(sessionExpiresAt);
    if (!Number.isFinite(expiration)) return;
    const warningDelay = expiration - Date.now() - 2 * 60 * 1000;
    warningTimer = window.setTimeout(() => {
        toast.warning('Tu sesión vencerá en 2 minutos. Guarda tu trabajo; después tendrás que iniciar sesión de nuevo.', { duration: 120000 });
    }, Math.max(0, warningDelay));
}

export const login = async (credentials) => {
    const result = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials)
    });
    scheduleSessionWarning(result.sessionExpiresAt);
    return result;
};

export const logout = async () => {
    window.clearTimeout(warningTimer);
    const result = await api("/auth/logout", {
        method: "POST"
    });
    toast.success('Sesión cerrada correctamente');
    return result;
};

export const getCurrentUser = async () => {
    const result = await api("/auth/me", {
        method: "GET"
    });
    scheduleSessionWarning(result.sessionExpiresAt);
    return result;
};
