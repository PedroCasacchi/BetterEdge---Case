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

  // Rota para criar um novo cliente
  app.post("/clientes", async (req, res) => {
    try {
      // Validando os dados de entrada
      const { nome, email } = createClienteSchema.parse(req.body);

      const cliente = await prisma.cliente.create({
        data: {
          nome,
          email,
          status: true, // Status ativo por padrão
        },
        include: {
          ativos: true,
        },
      });

      res.status(201).send(cliente);
    } catch (err) {
      res.status(400).send(err);
    }
  });

  // Rota para listar todos os clientes
  app.get("/clientes", async (req, res) => {
    const clientes = await prisma.cliente.findMany({
      include: {
        ativos: true,
      },
      orderBy: {
        id: "desc",
      },
    });
    return res.status(200).send(clientes);
  });

  // Rota para deletar um cliente
  app.delete("/clientes/:id", async (req, res) => {
    const { id } = req.params as { id: string }; // Garantindo que 'id' seja uma string

    await prisma.cliente.delete({
      where: {
        id: parseInt(id),
      },
    });

    return res.status(200).send({ success: "Cliente deletado com sucesso" });
  });

  // Rota para atualizar um cliente
  app.put("/clientes/:id", async (req, res) => {
    try {
      const { id } = req.params as { id: string }; // Garantindo que 'id' seja uma string
      const { nome, email } = updateClienteSchema.parse(req.body);

      const cliente = await prisma.cliente.update({
        where: {
          id: parseInt(id),
        },
        data: {
          nome,
          email,
        },
        include: {
          ativos: true,
        },
      });

      return res.status(200).send(cliente);
    } catch (err) {
      return res.status(400).send(err);
    }
  });

  // Rota para inativar um cliente
  app.put("/clientes/inativar/:id", async (req, res) => {
    const { id } = req.params as { id: string }; // Garantindo que 'id' seja uma string

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

  // Rota para adicionar ativo no cliente
  app.put("/clientes/:id/ativos", async (req, res) => {
    const { id } = req.params as { id: string }; // Garantindo que 'id' seja uma string
    const { ativoId } = req.body as { ativoId: string }; // Garantindo que 'ativoId' seja uma string

    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: {
        ativos: {
          connect: { id: parseInt(ativoId) },
        },
      },
      include: {
        ativos: true,
      },
    });

    return res.status(200).send(cliente);
  });

  // Rota para criar um novo ativo para o cliente
  app.post("/ativos/:id", async (req, res) => {
    try {
      const { nome, valorAtual, clienteId } = createAtivoSchema.parse(req.body);

      const ativo = await prisma.ativo.create({
        data: {
          nome,
          valor: valorAtual, // corrigido para 'valor' de acordo com o schema
          cliente: {
            connect: {
              id: clienteId,
            },
          },
        },
      });

      return res.status(201).send(ativo);
    } catch (err) {
      return res.status(400).send(err);
    }
  });

  // Rota para deletar ativos
  app.delete("/ativos/:id", async (req, res) => {
    const { id } = req.params as { id: string }; // Garantindo que 'id' seja uma string

    await prisma.ativo.delete({
      where: {
        id: parseInt(id),
      },
    });

    return res.status(200).send({ success: "Ativo deletado com sucesso" });
  });

  // Rota para listar todos os ativos
  app.get("/ativos", async (req, res) => {
    const ativos = await prisma.ativo.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).send(ativos);
  });
}
