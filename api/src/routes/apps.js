import {
  listApps, getApp, deployApp,
  stopApp, removeApp, getAppStatus, listInstalledApps,
} from '../services/appstore.js';

export default async function appStoreRoutes(fastify) {

  // GET /api/v1/apps
  // Query: ?category=monitoring&search=grafana&sort=installs|stars|name
  fastify.get('/', async (req) => {
    const { category, search, sort } = req.query;
    return listApps({ category, search, sort });
  });

  // GET /api/v1/apps/installed
  fastify.get('/installed', async () => {
    return listInstalledApps();
  });

  // GET /api/v1/apps/:id
  fastify.get('/:id', async (req, reply) => {
    const app = await getApp(req.params.id);
    if (!app) return reply.status(404).send({ error: `App '${req.params.id}' not found` });
    return app;
  });

  // GET /api/v1/apps/:id/status
  fastify.get('/:id/status', async (req) => {
    return getAppStatus(req.params.id);
  });

  // POST /api/v1/apps/:id/deploy
  // Body: { env: { KEY: "value", ... } }
  fastify.post('/:id/deploy', {
    schema: {
      body: {
        type: 'object',
        properties: {
          env: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
    },
  }, async (req, reply) => {
    try {
      const result = await deployApp(req.params.id, req.body?.env ?? {});
      return result;
    } catch (err) {
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // POST /api/v1/apps/:id/stop
  fastify.post('/:id/stop', async (req, reply) => {
    try {
      return await stopApp(req.params.id);
    } catch (err) {
      return reply.status(400).send({ ok: false, error: err.message });
    }
  });

  // DELETE /api/v1/apps/:id
  // Query: ?volumes=true  — also remove Docker volumes
  fastify.delete('/:id', async (req, reply) => {
    try {
      const removeVolumes = req.query.volumes === 'true';
      return await removeApp(req.params.id, removeVolumes);
    } catch (err) {
      return reply.status(400).send({ ok: false, error: err.message });
    }
  });
}
