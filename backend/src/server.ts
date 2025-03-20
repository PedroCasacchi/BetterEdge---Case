import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import routes from "./routes/routes"; // Importa as rotas
import errorHandler from "./middlewares/errorHandler"; // (Opcional) Lidar com erros de forma centralizada
import fastifyCors from "fastify-cors";

const prisma = new PrismaClient(); // Instancia o cliente Prisma
const app = Fastify(); // Instância correta do Fastify

// Middleware para lidar com erros
app.setErrorHandler(errorHandler);

// Registrando o CORS corretamente na instância "app"
app.register(fastifyCors, {
  // Configurações do CORS (opcional)
  origin: "*", // Permite qualquer origem, você pode personalizar isso
  methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
});

// Registra as rotas
routes(app);

// Inicia o servidor
const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server is running at http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
