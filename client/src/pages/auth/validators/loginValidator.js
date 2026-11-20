
import { z } from "zod";

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Ingresa un correo electrónico válido")
        .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(1, "La contraseña es obligatoria")
        .max(72, "La contraseña no puede superar los 72 caracteres")
}).strict();
