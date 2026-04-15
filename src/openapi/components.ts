/** Shared OpenAPI 3.0 components (schemas, parameters, security) */
export const openApiComponents = {
  parameters: {
    eventId: {
      name: 'eventId',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, minLength: 1 },
    },
    guestId: {
      name: 'guestId',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, minLength: 1 },
    },
    vendorId: {
      name: 'vendorId',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, minLength: 1 },
    },
    assetId: {
      name: 'assetId',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, minLength: 1 },
    },
    rsvpToken: {
      name: 'token',
      in: 'path' as const,
      required: true,
      schema: { type: 'string' as const, minLength: 1 },
    },
  },
  securitySchemes: {
    bearerAuth: {
      type: 'http' as const,
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Access token from `POST /api/v1/auth/login` or `POST /api/v1/auth/signup` (`tokens.accessToken`).',
    },
  },
  schemas: {
    OkEnvelope: {
      type: 'object',
      required: ['ok', 'data'],
      properties: {
        ok: { type: 'boolean', enum: [true] },
        data: {},
      },
    },
    ErrorEnvelope: {
      type: 'object',
      required: ['ok', 'error'],
      properties: {
        ok: { type: 'boolean', enum: [false] },
        error: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: {},
          },
        },
      },
    },
    AuthTokens: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        accessExpiresAt: { type: 'string', format: 'date-time' },
        refreshExpiresAt: { type: 'string', format: 'date-time' },
      },
    },
  },
};
