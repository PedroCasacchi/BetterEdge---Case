import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import routes from "./routes/routes"; // Importa as rotas
import errorHandler from "./middlewares/errorHandler"; // (Opcional) Lidar com erros de forma centralizada

const prisma = new PrismaClient(); // Instancia o cliente Prisma
const app = Fastify();

// Middleware para lidar com erros
app.setErrorHandler(errorHandler);

// Registra as rotas
routes(app);

// Inicia o servidor
const start = async () => {
  try {
    await app.listen(3000);
    console.log("Server is running at http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
