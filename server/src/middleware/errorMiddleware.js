export const errorMiddleware = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'El cuerpo debe ser JSON válido' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'La solicitud supera el tamaño permitido' });
    console.error(error);

    return res.status(500).json({
        message: 'Error interno del servidor'
    });
};
