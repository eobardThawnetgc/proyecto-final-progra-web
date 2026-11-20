// Restringe una ruta a los roles indicados. Debe ir después de authenticate.
export const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.employee || !allowedRoles.includes(req.employee.role)) {
        return res.status(403).json({
            message: 'No tienes permisos para realizar esta acción'
        });
    }
    next();
};