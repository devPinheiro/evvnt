/** OpenAPI `paths` object for Evvnt API v1 */
export const openApiPaths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Liveness probe',
      security: [],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OkEnvelope' },
              example: { ok: true, data: { status: 'ok' } },
            },
          },
        },
      },
    },
  },

  '/api/v1/auth/signup': {
    post: {
      tags: ['Auth'],
      summary: 'Register organisation + first user',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['orgName', 'email', 'password'],
              properties: {
                orgName: { type: 'string', minLength: 2 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8 },
                name: { type: 'string', minLength: 1 },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Created' },
        '400': { description: 'Validation / business error' },
      },
    },
  },

  '/api/v1/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login with org + email + password',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['orgId', 'email', 'password'],
              properties: {
                orgId: { type: 'string', minLength: 1 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8 },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' }, '401': { description: 'Invalid credentials' } },
    },
  },

  '/api/v1/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Rotate tokens',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: { refreshToken: { type: 'string', minLength: 1 } },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' }, '401': { description: 'Invalid refresh token' } },
    },
  },

  '/api/v1/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Revoke refresh token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: { refreshToken: { type: 'string', minLength: 1 } },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Current user profile',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' }, '401': { description: 'Unauthenticated' } },
    },
    patch: {
      tags: ['Auth'],
      summary: 'Update profile (name; email change sends confirmation to new address)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', nullable: true },
                email: { type: 'string', format: 'email' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' }, '401': { description: 'Unauthenticated' } },
    },
  },

  '/api/v1/auth/otp/request': {
    post: {
      tags: ['Auth'],
      summary: 'Send passwordless login OTP (email must already be verified)',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['orgId', 'email'],
              properties: { orgId: { type: 'string' }, email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: { '200': { description: 'OK (always; does not reveal if account exists)' } },
    },
  },

  '/api/v1/auth/otp/verify': {
    post: {
      tags: ['Auth'],
      summary: 'Complete passwordless login with OTP',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['orgId', 'email', 'code'],
              properties: {
                orgId: { type: 'string' },
                email: { type: 'string', format: 'email' },
                code: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' }, '401': { description: 'Invalid code' } },
    },
  },

  '/api/v1/auth/verify-email': {
    get: {
      tags: ['Auth'],
      summary: 'Verify email via link (query token)',
      security: [],
      parameters: [
        {
          name: 'token',
          in: 'query',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: { '200': { description: 'OK' }, '400': { description: 'Invalid token' } },
    },
    post: {
      tags: ['Auth'],
      summary: 'Verify email via token in body',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } },
          },
        },
      },
      responses: { '200': { description: 'OK' }, '400': { description: 'Invalid token' } },
    },
  },

  '/api/v1/auth/verify-email/otp': {
    post: {
      tags: ['Auth'],
      summary: 'Verify email with 6-digit code',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['orgId', 'email', 'code'],
              properties: {
                orgId: { type: 'string' },
                email: { type: 'string', format: 'email' },
                code: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' }, '400': { description: 'Invalid code' } },
    },
  },

  '/api/v1/auth/verification/resend': {
    post: {
      tags: ['Auth'],
      summary: 'Resend verification email + OTP',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['orgId', 'email'],
              properties: { orgId: { type: 'string' }, email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/auth/password/forgot': {
    post: {
      tags: ['Auth'],
      summary: 'Request password reset email',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['orgId', 'email'],
              properties: { orgId: { type: 'string' }, email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: { '200': { description: 'OK (always)' } },
    },
  },

  '/api/v1/auth/password/reset': {
    post: {
      tags: ['Auth'],
      summary: 'Set new password with reset token from email',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'newPassword'],
              properties: { token: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' }, '400': { description: 'Invalid token' } },
    },
  },

  '/api/v1/auth/password/change': {
    post: {
      tags: ['Auth'],
      summary: 'Change password (invalidates refresh tokens)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string' },
                newPassword: { type: 'string', minLength: 8 },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' }, '401': { description: 'Wrong current password' } },
    },
  },

  '/api/v1/events': {
    get: {
      tags: ['Events'],
      summary: 'List events in organisation',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' }, '401': { description: 'Unauthenticated' } },
    },
    post: {
      tags: ['Events'],
      summary: 'Create draft event',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 2 },
                slug: { type: 'string', minLength: 1 },
                description: { type: 'string' },
                coverImageUrl: { type: 'string', format: 'uri' },
                startsAt: { type: 'string', format: 'date-time' },
                endsAt: { type: 'string', format: 'date-time' },
                timezone: { type: 'string' },
                location: { type: 'string' },
                isOnline: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' }, '401': { description: 'Unauthenticated' } },
    },
  },

  '/api/v1/events/{eventId}': {
    get: {
      tags: ['Events'],
      summary: 'Get event',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: {
        '200': { description: 'OK' },
        '401': { description: 'Unauthenticated' },
        '404': { description: 'Not found' },
      },
    },
    put: {
      tags: ['Events'],
      summary: 'Update event (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 2 },
                description: { type: 'string' },
                coverImageUrl: { type: 'string', format: 'uri' },
                startsAt: { type: 'string', format: 'date-time' },
                endsAt: { type: 'string', format: 'date-time' },
                timezone: { type: 'string' },
                location: { type: 'string' },
                isOnline: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'OK' },
        '401': { description: 'Unauthenticated' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Not found' },
      },
    },
  },

  '/api/v1/events/{eventId}/publish': {
    post: {
      tags: ['Events'],
      summary: 'Publish event (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: {
        '200': { description: 'OK' },
        '401': { description: 'Unauthenticated' },
        '403': { description: 'Forbidden' },
      },
    },
  },

  '/api/v1/events/{eventId}/cancel': {
    post: {
      tags: ['Events'],
      summary: 'Cancel event (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: {
        '200': { description: 'OK' },
        '401': { description: 'Unauthenticated' },
        '403': { description: 'Forbidden' },
      },
    },
  },

  '/api/v1/events/{eventId}/clone': {
    post: {
      tags: ['Events'],
      summary: 'Clone event (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 2 },
                slug: { type: 'string', minLength: 1 },
                startsAt: { type: 'string', format: 'date-time' },
                endsAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' }, '401': { description: 'Unauthenticated' } },
    },
  },

  '/api/v1/events/{eventId}/guests': {
    get: {
      tags: ['Guests'],
      summary: 'List guests (OWNER / CO_HOST / STAFF)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: { '200': { description: 'OK' }, '401': { description: 'Unauthenticated' } },
    },
    post: {
      tags: ['Guests'],
      summary: 'Add guest (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 1 },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', minLength: 6 },
                groups: { type: 'array', items: { type: 'string', minLength: 1 } },
                plusOnes: { type: 'integer', minimum: 0, maximum: 20 },
                tableNo: { type: 'string', minLength: 1 },
                notes: { type: 'string', maxLength: 500 },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' }, '401': { description: 'Unauthenticated' } },
    },
  },

  '/api/v1/events/{eventId}/guests/dedupe-preview': {
    post: {
      tags: ['Guests'],
      summary: 'Preview duplicate guests by email/phone (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['candidates'],
              properties: {
                candidates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      email: { type: 'string', format: 'email' },
                      phone: { type: 'string', minLength: 6 },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/events/{eventId}/guests/{guestId}/invite': {
    post: {
      tags: ['Guests'],
      summary: 'Create invite for guest (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/eventId' },
        { $ref: '#/components/parameters/guestId' },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { channel: { type: 'string' } },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/guests/invite-link': {
    post: {
      tags: ['Guests'],
      summary: 'General invite link (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { channel: { type: 'string', default: 'share' } },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/rsvp/{token}': {
    post: {
      tags: ['RSVP'],
      summary: 'Public RSVP by invite token',
      security: [],
      parameters: [{ $ref: '#/components/parameters/rsvpToken' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['RSVP_YES', 'RSVP_NO', 'RSVP_MAYBE'],
                },
                guestName: { type: 'string', minLength: 1 },
                guestEmail: { type: 'string', format: 'email' },
                guestPhone: { type: 'string', minLength: 6 },
                message: { type: 'string', maxLength: 280 },
                plusOnes: { type: 'integer', minimum: 0, maximum: 20 },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' }, '404': { description: 'Invalid token' } },
    },
  },

  '/api/v1/payments/paystack/webhook': {
    post: {
      tags: ['Payments'],
      summary: 'Paystack webhook (signed)',
      description:
        'Send header `x-paystack-signature` (HMAC). Raw JSON body bytes must match what Paystack signed. Idempotent ticket issuance on `charge.success`.',
      security: [],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                event: { type: 'string' },
                data: { type: 'object', properties: { id: { type: 'number' } } },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Acknowledged' }, '400': { description: 'Bad signature' } },
    },
  },

  '/api/v1/events/{eventId}/ticketing/checkout': {
    post: {
      tags: ['Ticketing'],
      summary: 'Public ticket checkout (Paystack reference)',
      security: [],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['ticketTierId', 'quantity'],
              properties: {
                ticketTierId: { type: 'string', minLength: 1 },
                quantity: { type: 'integer', minimum: 1, maximum: 50 },
                buyerEmail: { type: 'string', format: 'email' },
                buyerPhone: { type: 'string', minLength: 6 },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/ticketing/tiers': {
    get: {
      tags: ['Ticketing'],
      summary: 'List ticket tiers (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Ticketing'],
      summary: 'Create tier (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'priceNgn', 'quantityTotal'],
              properties: {
                name: { type: 'string', minLength: 2 },
                description: { type: 'string' },
                priceNgn: { type: 'integer', minimum: 0, maximum: 100000000 },
                quantityTotal: { type: 'integer', minimum: 1, maximum: 1000000 },
                saleStartsAt: { type: 'string', format: 'date-time' },
                saleEndsAt: { type: 'string', format: 'date-time' },
                perOrderLimit: { type: 'integer', minimum: 1, maximum: 50 },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/ticketing/scan': {
    post: {
      tags: ['Ticketing'],
      summary: 'Scan QR (OWNER / CO_HOST / STAFF)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['qrToken'],
              properties: { qrToken: { type: 'string', minLength: 8 } },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/events/{eventId}/ticketing/offline-bundle': {
    get: {
      tags: ['Ticketing'],
      summary: 'Offline scan bundle (OWNER / CO_HOST / STAFF)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/events/{eventId}/vendors': {
    get: {
      tags: ['Vendors'],
      summary: 'List vendors (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Vendors'],
      summary: 'Add vendor (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'type', 'agreedFeeNgn'],
              properties: {
                name: { type: 'string', minLength: 1 },
                type: {
                  type: 'string',
                  enum: [
                    'CATERING',
                    'DECORATION',
                    'PHOTOGRAPHY',
                    'VIDEOGRAPHY',
                    'DJ_MUSIC',
                    'MC',
                    'SECURITY',
                    'TRANSPORT',
                    'VENUE',
                    'PRINT',
                    'OTHER',
                  ],
                },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', minLength: 6 },
                agreedFeeNgn: { type: 'integer', minimum: 0, maximum: 1000000000 },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/vendors/{vendorId}/tasks': {
    post: {
      tags: ['Vendors'],
      summary: 'Add vendor task (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/eventId' },
        { $ref: '#/components/parameters/vendorId' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string', minLength: 1 },
                description: { type: 'string' },
                dueAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/vendors/{vendorId}/milestones': {
    post: {
      tags: ['Vendors'],
      summary: 'Add milestone (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/eventId' },
        { $ref: '#/components/parameters/vendorId' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'amountNgn'],
              properties: {
                title: { type: 'string', minLength: 1 },
                amountNgn: { type: 'integer', minimum: 0, maximum: 1000000000 },
                dueAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/vendors/{vendorId}/invoices': {
    post: {
      tags: ['Vendors'],
      summary: 'Submit vendor invoice (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/eventId' },
        { $ref: '#/components/parameters/vendorId' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amountNgn'],
              properties: {
                amountNgn: { type: 'integer', minimum: 0, maximum: 1000000000 },
                note: { type: 'string', maxLength: 1000 },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/finance/ledger': {
    get: {
      tags: ['Finance'],
      summary: 'Finance ledger (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/events/{eventId}/finance/expense': {
    post: {
      tags: ['Finance'],
      summary: 'Log expense (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amountNgn'],
              properties: {
                category: { type: 'string', minLength: 1 },
                amountNgn: { type: 'integer', minimum: 0, maximum: 1000000000 },
                description: { type: 'string', maxLength: 1000 },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/planner': {
    get: {
      tags: ['Event Planner'],
      summary: 'Get planner state + computed hall & cost (Module 09)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: { '200': { description: 'Hall/cost state and KPIs' } },
    },
    put: {
      tags: ['Event Planner'],
      summary: 'Save hall & cost planner state (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['hallState', 'costState'],
              properties: {
                hallState: { type: 'object', description: 'Hall calculator inputs' },
                costState: { type: 'object', description: 'Cost estimator inputs' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Saved + recomputed snapshot' } },
    },
  },

  '/api/v1/events/{eventId}/planner/push-budget': {
    post: {
      tags: ['Event Planner'],
      summary: 'Push cost estimate to Finance ledger (OWNER / CO_HOST)',
      description:
        '`replace` removes all prior planner budget lines; `merge` replaces planner lines only for categories being written (and contingency).',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { mode: { type: 'string', enum: ['merge', 'replace'], default: 'merge' } },
            },
          },
        },
      },
      responses: { '201': { description: 'Created finance entries' } },
    },
  },

  '/api/v1/events/{eventId}/gifts/checkout': {
    post: {
      tags: ['Gifts'],
      summary: 'Public gift checkout (Paystack reference)',
      security: [],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amountNgn'],
              properties: {
                amountNgn: { type: 'integer', minimum: 500, maximum: 500000 },
                senderName: { type: 'string', minLength: 1 },
                senderEmail: { type: 'string', format: 'email' },
                senderPhone: { type: 'string', minLength: 6 },
                isAnonymous: { type: 'boolean' },
                message: { type: 'string', maxLength: 280 },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/gifts/settings': {
    put: {
      tags: ['Gifts'],
      summary: 'Upsert gift page settings (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['isEnabled'],
              properties: {
                isEnabled: { type: 'boolean' },
                hostDisplayName: { type: 'string' },
                hostPhotoUrl: { type: 'string', format: 'uri' },
                pageMessage: { type: 'string', maxLength: 1000 },
                suggestedAmounts: {
                  type: 'array',
                  maxItems: 10,
                  items: { type: 'integer', minimum: 0, maximum: 500000 },
                },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/events/{eventId}/gifts/ledger': {
    get: {
      tags: ['Gifts'],
      summary: 'List gifts (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/events/{eventId}/gifts/payouts': {
    post: {
      tags: ['Gifts'],
      summary: 'Request payout stub (OWNER only)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amountNgn'],
              properties: {
                amountNgn: { type: 'integer', minimum: 1000, maximum: 1000000000 },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },

  '/api/v1/events/{eventId}/gallery/settings': {
    put: {
      tags: ['Gallery'],
      summary: 'Upsert gallery settings (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                guestUploadEnabled: { type: 'boolean' },
                approvalRequired: { type: 'boolean' },
                watermarkEnabled: { type: 'boolean' },
                visibility: { type: 'string', enum: ['PUBLIC', 'GUEST_ONLY', 'PASSWORD'] },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/events/{eventId}/gallery/assets': {
    post: {
      tags: ['Gallery'],
      summary: 'Add gallery asset (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sourceUrl'],
              properties: {
                sourceUrl: { type: 'string', format: 'uri' },
                thumbnailUrl: { type: 'string', format: 'uri' },
                metadata: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
    get: {
      tags: ['Gallery'],
      summary: 'List assets (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/eventId' }],
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/events/{eventId}/gallery/assets/{assetId}/approve': {
    post: {
      tags: ['Gallery'],
      summary: 'Approve asset (OWNER / CO_HOST)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/eventId' },
        { $ref: '#/components/parameters/assetId' },
      ],
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'List in-app notifications (last 50)',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
  },

  '/api/v1/notifications/mark-read': {
    post: {
      tags: ['Notifications'],
      summary: 'Mark notifications read',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['notificationIds'],
              properties: {
                notificationIds: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 100,
                  items: { type: 'string', minLength: 1 },
                },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OK' } },
    },
  },
};
