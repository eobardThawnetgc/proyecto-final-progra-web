
import { api } from "./api";

export const login = async (credentials) => {
    return await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials)
    });
};

export const logout = async () => {
    return await api("/auth/logout", {
        method: "POST"
    });
};

export const getCurrentUser = async () => {
    return await api("/auth/me", {
        method: "GET"
    });
};
