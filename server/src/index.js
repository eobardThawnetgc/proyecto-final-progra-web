import "dotenv/config";

import app from "./app.js";

const PORT = process.env.PORT || 3000;

const startServer = () => {
    try {
        app.listen(PORT, () => {
            console.log(`Servidor: http://localhost:${PORT}`);
            console.log("Estado: En ejecución");
        });

    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
};

startServer();