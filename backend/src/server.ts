import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import routes from "./routes/routes";
import errorHandler from "./middlewares/errorHandler";

const prisma = new PrismaClient();
const app = Fastify();

const start = async () => {
  try {
    console.log("🚀 Iniciando servidor...");

    console.log("🔗 Tentando conectar ao Prisma...");
    await prisma.$connect();
    console.log("✅ Conexão com Prisma estabelecida com sucesso!");

    console.log("🌍 Registrando CORS...");
    await app.register(cors, {
      origin: "*", // Em produção, substitua pelo domínio correto
      methods: ["GET", "POST", "PUT", "DELETE"],
    });
    console.log("✅ CORS registrado com sucesso!");

    console.log("⚠️ Configurando manipulador de erros...");
    app.setErrorHandler(errorHandler);
    console.log("✅ Manipulador de erros configurado com sucesso!");

    console.log("📌 Registrando rotas...");
    routes(app);
    console.log("✅ Rotas registradas com sucesso!");

    console.log("🚀 Tentando iniciar o servidor na porta 3000...");
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("✅ Servidor rodando em http://localhost:3000");
  } catch (err) {
    console.error("❌ ERRO CRÍTICO AO INICIAR SERVIDOR:");
    console.error(err);

    if (err instanceof Error) {
      console.error("🔍 Nome do erro:", err.name);
      console.error("📌 Mensagem de erro:", err.message);
      console.error("📝 Stack trace:", err.stack);
      console.error("🔎 Propriedades adicionais do erro:", Object.keys(err));
    }

    try {
      console.log("🔌 Tentando desconectar Prisma de forma segura...");
      await prisma.$disconnect();
      console.log("✅ Prisma desconectado com sucesso.");
    } catch (disconnectError) {
      console.error("❌ Erro ao desconectar Prisma:", disconnectError);
    }

    app.log.error(err);
    process.exit(1);
  }
};

start();
