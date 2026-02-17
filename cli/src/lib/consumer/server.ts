import type {FastifyInstance} from 'fastify';
import Fastify from 'fastify';
import {logger} from '../../utils/logger.js';

export async function createServer(port: number, debug: boolean, jsonMode: boolean = false, anyPath: boolean = false): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: debug ? true : false
  });

  const routePath = anyPath ? '/*' : '/';

  fastify.post(routePath, async (request, reply) => {
    try {
      const data = request.body;
      const path = request.url;
      const result = anyPath ? {path, data} : data;

      if (jsonMode) {
        logger.json(result);
      } else {
        logger.success('Received message:', result);
      }

      const response: Record<string, unknown> = {
        status: 'success',
        received: data
      };

      if (anyPath) {
        response.path = path;
      }

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({error: message});
    }
  });

  await fastify.listen({port, host: '0.0.0.0'});
  return fastify;
}
