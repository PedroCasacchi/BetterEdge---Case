import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import errorHandler from "../middlewares/errorHandler";

const prisma = new PrismaClient();

// Esquemas de validação com Zod
const createClienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
});

const updateClienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
});

const createAtivoSchema = z.object({
  nome: z.string().min(1, "Nome do ativo é obrigatório"),
  valorAtual: z.number().min(0, "Valor atual deve ser maior que 0"),
  clienteId: z.number().min(1, "ID do cliente é obrigatório"),
});

export default function routes(app: FastifyInstance): void {
  app.setErrorHandler(errorHandler);

  // Rota de teste
  app.get("/", (req, res) => {
    res.send("API está funcionando!");
  });

  // Rota pra criar novo cliente
  app.post("/clientes", async (req, res) => {
    try {
      const { nome, email } = createClienteSchema.parse(req.body);

      const existingCliente = await prisma.cliente.findUnique({
        where: { email },
      });
      if (existingCliente) {
        return res.status(400).send({ error: "Email já está em uso" });
      }

      const cliente = await prisma.cliente.create({
        data: { nome, email, status: true },
        include: { ativos: true },
      });

      res.status(201).send(cliente);
    } catch (err: any) {
      if (err.code === "P2002") {
        return res.status(400).send({ error: "Email já está em uso" });
      }
      res
        .status(500)
        .send({ error: "Erro interno do servidor", details: err.message });
    }
  });

  // Rota pra listar os clientes
  app.get("/clientes", async (req, res) => {
    const clientes = await prisma.cliente.findMany({
      include: { ativos: true },
      orderBy: { id: "desc" },
    });
    return res.status(200).send(clientes);
  });

  // Rota para deletar um cliente
  app.delete("/clientes/:id", async (req, res) => {
    const { id } = req.params as { id: string };
    await prisma.cliente.delete({ where: { id: parseInt(id) } });
    return res.status(200).send({ success: "Cliente deletado com sucesso" });
  });

  // Rota pra atualizar um cliente
  app.put("/clientes/:id", async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const { nome, email } = updateClienteSchema.parse(req.body);

      if (email) {
        const existingCliente = await prisma.cliente.findUnique({
          where: { email },
        });
        if (existingCliente && existingCliente.id !== parseInt(id)) {
          return res.status(400).send({ error: "Email já está em uso" });
        }
      }

      const cliente = await prisma.cliente.update({
        where: { id: parseInt(id) },
        data: { nome, email },
        include: { ativos: true },
      });

      return res.status(200).send(cliente);
    } catch (err: any) {
      if (err.code === "P2002") {
        return res.status(400).send({ error: "Email já está em uso" });
      }
      return res
        .status(500)
        .send({ error: "Erro interno do servidor", details: err.message });
    }
  });

  // Rota pra inativar um cliente
  app.put("/clientes/inativar/:id", async (req, res) => {
    const { id } = req.params as { id: string };

    const cliente = await prisma.cliente.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status: false, // Status inativo
      },
      include: {
        ativos: true,
      },
    });

    return res.status(200).send(cliente);
  });

  // Rota pra ativar um cliente
  app.put("/clientes/ativar/:id", async (req, res) => {
    const { id } = req.params as { id: string };

    const cliente = await prisma.cliente.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status: true, // Ativar o cliente
      },
      include: {
        ativos: true,
      },
    });

    return res.status(200).send(cliente);
  });

  // Rota pra adicionar ativo no cliente
  app.put("/clientes/:id/ativos", async (req, res) => {
    const { id } = req.params as { id: string };
    const { ativoId } = req.body as { ativoId: string };
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: { ativos: { connect: { id: parseInt(ativoId) } } },
      include: { ativos: true },
    });
    return res.status(200).send(cliente);
  });

  // Rota pra criar novo ativo pro cliente
  app.post("/ativos/:id", async (req, res) => {
    try {
      const { nome, valorAtual, clienteId } = createAtivoSchema.parse(req.body);
      const ativo = await prisma.ativo.create({
        data: {
          nome,
          valor: valorAtual,
          cliente: { connect: { id: clienteId } },
        },
      });
      return res.status(201).send(ativo);
    } catch (err) {
      return res.status(400).send(err);
    }
  });

  // Rota pra deletar ativos
  app.delete("/ativos/:id", async (req, res) => {
    const { id } = req.params as { id: string };
    await prisma.ativo.delete({ where: { id: parseInt(id) } });
    return res.status(200).send({ success: "Ativo deletado com sucesso" });
  });

  // Rota pra listar os ativos com o cliente associado
  app.get("/ativos", async (req, res) => {
    const ativos = await prisma.ativo.findMany({
      select: {
        id: true,
        nome: true,
        valor: true,
        clienteId: true, // Id do cliente
      },
      orderBy: { id: "desc" },
    });

    return res.status(200).send(ativos);
  });
}
