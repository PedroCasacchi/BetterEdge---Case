import { FastifyRequest, FastifyReply } from "fastify";

export default function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  console.error(error); // Log para o desenvolvedor

  reply.status(500).send({
    message: "Internal Server Error",
    error: error.message,
  });
}
