
const API_URL = import.meta.env.VITE_API_URL;

export const api = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,

        credentials: "include",

        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message || "Ocurrió un error en el servidor"
        );
    }

    return data;
};
