import Fastify, { type FastifyInstance } from 'fastify';
import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { getEnv } from './config/env.js';
import { attachAuthUser } from './plugins/auth.js';
import { registerPublicRoutes } from './modules/public.js';
import { registerAuthRoutes } from './modules/auth-routes.js';
import { registerApplicationRoutes } from './modules/applications.js';
import { registerAdminRoutes } from './modules/admin.js';

export async function buildApp(): Promise<FastifyInstance> {
  const env = getEnv();
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
    },
    bodyLimit: 1024 * 1024,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(compress);
  await app.register(cookie, { secret: env.SESSION_SECRET });
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = [env.APP_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
      if (allowed.includes(origin) || origin.endsWith('.onrender.com')) {
        return cb(null, true);
      }
      return cb(null, true);
    },
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'NP-NU API',
        description: 'National University Fast Admission & Academic Platform REST API',
        version: '1.0.0',
      },
    },
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Attach authenticated user on every request
  app.addHook('onRequest', async (request) => {
    await attachAuthUser(request);
  });

  // Basic CSRF / Origin validation for cookie-authenticated mutations
  app.addHook('preValidation', async (request, reply) => {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
      const origin = request.headers.origin;
      const hasSessionCookie = Boolean(request.cookies['npnu_session']);
      if (hasSessionCookie && origin) {
        const expectedHost = new URL(env.APP_URL).host;
        try {
          const originHost = new URL(origin).host;
          if (
            originHost !== expectedHost &&
            !originHost.startsWith('localhost') &&
            !originHost.startsWith('127.0.0.1') &&
            !originHost.endsWith('.onrender.com')
          ) {
            return reply.code(403).send({ error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' });
          }
        } catch {
          return reply.code(403).send({ error: 'CSRF_ORIGIN_INVALID', message: 'Malformed origin header.' });
        }
      }
    }
  });

  await app.register(
    async (api) => {
      await api.register(registerPublicRoutes);
      await api.register(registerAuthRoutes);
      await api.register(registerApplicationRoutes);
      await api.register(registerAdminRoutes);
    },
    { prefix: '/api/v1' }
  );

  app.setErrorHandler((err, request, reply) => {
    request.log.error(err);
    const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
    if (statusCode >= 500) {
      return reply.code(500).send({ error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' });
    }
    const message = err instanceof Error ? err.message : 'Request error';
    return reply.code(statusCode).send({
      error: (err as { code?: string }).code ?? 'REQUEST_ERROR',
      message,
    });
  });

  return app;
}
