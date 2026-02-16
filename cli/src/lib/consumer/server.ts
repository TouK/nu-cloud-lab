import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { logger } from '../../utils/logger.js';

export async function createServer(port: number, debug: boolean): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: debug ? true : false
  });

  fastify.post('/', async (request, reply) => {
    try {
      const data = request.body;
      logger.success('Received message:', data);

      return {
        status: 'success',
        received: data
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ error: message });
    }
  });

  await fastify.listen({ port, host: '0.0.0.0' });
  return fastify;
}
