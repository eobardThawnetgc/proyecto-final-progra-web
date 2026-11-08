
import jwt from 'jsonwebtoken';

export const generateToken = (employeeId) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET no está configurado');
    }

    return jwt.sign(
        {},
        secret,
        {
            subject: String(employeeId),
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        }
    );
};

export const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET no está configurado");
    }

    return jwt.verify(token, secret);
};