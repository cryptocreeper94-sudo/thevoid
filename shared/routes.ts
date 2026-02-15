import { z } from 'zod';
import { insertVentSchema, vents, createVentRequestSchema } from './schema';

export const api = {
  vents: {
    create: {
      method: 'POST' as const,
      path: '/api/vents' as const,
      input: createVentRequestSchema,
      responses: {
        200: z.object({
          transcript: z.string(),
          response: z.string(),
          audioResponse: z.string().optional(), // Base64 audio response if we do TTS
        }),
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/vents' as const,
      responses: {
        200: z.array(insertVentSchema.extend({ id: z.number(), createdAt: z.date() })),
      },
    },
  },
};
