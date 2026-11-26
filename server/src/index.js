import "dotenv/config";

import app from "./app.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const startServer = () => {
    try {
        app.listen(PORT, HOST, () => {
            console.log(`Servidor: http://${HOST}:${PORT}`);
            console.log("Estado: En ejecución");
        });

    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
};

startServer();
