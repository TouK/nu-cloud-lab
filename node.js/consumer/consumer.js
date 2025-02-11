import Fastify from 'fastify'

const fastify = Fastify({
  logger: true
})

fastify.post('/webhook', async (request, reply) => {
  try {
    const data = request.body
    
    console.log(`✅ Received message:`, data)

    return {
      status: 'success',
      received: data
    }
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: 6555, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start() 