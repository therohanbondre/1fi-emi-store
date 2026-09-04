/**
 * openapi.js — OpenAPI 3.0 specification for the 1Fi EMI Store API.
 *
 * Written as a plain JavaScript object so it can be imported directly
 * without swagger-jsdoc or any code-generation step.
 *
 * SECURITY: This file contains NO credentials, database URLs, passwords,
 * or any environment variable values. Server URLs use only the local
 * development address and a production placeholder.
 */

const spec = {
  openapi: '3.0.3',

  info: {
    title:       '1Fi EMI Store API',
    version:     '1.0.0',
    description: [
      'REST API for the 1Fi EMI Store SDE1 assignment.',
      '',
      'All product, variant, and EMI plan data is served from a PostgreSQL database',
      'via Prisma ORM. No data is hardcoded in the API layer.',
      '',
      '**Response envelope (success):**',
      '```json',
      '{ "success": true, "data": <payload>, "meta": { "count": N } }',
      '```',
      '',
      '**Response envelope (error):**',
      '```json',
      '{ "success": false, "error": { "code": "...", "message": "..." } }',
      '```',
    ].join('\n'),
    contact: {
      name: '1Fi EMI Store',
    },
  },

  servers: [
    {
      url:         'http://localhost:5000',
      description: 'Local development server',
    },
    {
      url:         'https://your-backend.example.com',
      description: 'Production server (replace with actual URL before deploying)',
    },
  ],

  // ── Reusable components ───────────────────────────────────────────────────

  components: {
    schemas: {

      // ── Primitive building blocks ─────────────────────────────────────────

      Cuid: {
        type:    'string',
        example: 'cmtlbecgx0000v4ok1beyxl5x',
        description: 'Collision-resistant unique identifier (cuid2)',
      },

      DecimalString: {
        type:    'string',
        pattern: '^\\d+(\\.\\d{1,2})?$',
        example: '124900.00',
        description: 'Monetary value serialised as a decimal string (Prisma Decimal → JSON)',
      },

      NullableDecimalString: {
        nullable: true,
        type:    'string',
        pattern: '^\\d+(\\.\\d{1,2})?$',
        example: '7500.00',
        description: 'Optional monetary value; null when absent',
      },

      // ── Domain models ─────────────────────────────────────────────────────

      ProductVariant: {
        type: 'object',
        required: ['id', 'productId', 'storage', 'color', 'inStock', 'sortOrder', 'createdAt'],
        properties: {
          id:        { $ref: '#/components/schemas/Cuid' },
          productId: { $ref: '#/components/schemas/Cuid' },
          storage: {
            type:    'string',
            example: '256 GB',
            description: 'Storage capacity label, e.g. "256 GB" or "12 GB RAM / 256 GB"',
          },
          color: {
            type:    'string',
            example: 'Titanium Black',
          },
          imageUrl: {
            type:     'string',
            nullable: true,
            format:   'uri',
            example:  'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80',
          },
          inStock: {
            type:    'boolean',
            example: true,
          },
          sortOrder: {
            type:    'integer',
            minimum: 0,
            example: 0,
            description: 'Display order within the product (0-indexed)',
          },
          createdAt: {
            type:   'string',
            format: 'date-time',
            example: '2026-09-03T09:20:32.673Z',
          },
        },
      },

      EmiPlan: {
        type: 'object',
        required: ['id', 'productId', 'tenureMonths', 'interestRate', 'monthlyPayment', 'totalPayable', 'isNoCost', 'createdAt'],
        properties: {
          id:             { $ref: '#/components/schemas/Cuid' },
          productId:      { $ref: '#/components/schemas/Cuid' },
          tenureMonths: {
            type:    'integer',
            example: 12,
            description: 'Repayment period in months (3, 6, 9, 12, 18, or 24)',
          },
          interestRate: {
            $ref:        '#/components/schemas/DecimalString',
            description: 'Annual interest rate in %. "0" means no-cost EMI.',
          },
          monthlyPayment: {
            $ref:        '#/components/schemas/DecimalString',
            description: 'Fixed monthly instalment amount in INR',
          },
          totalPayable: {
            $ref:        '#/components/schemas/DecimalString',
            description: 'Total amount payable = tenureMonths × monthlyPayment',
          },
          cashback: {
            $ref:        '#/components/schemas/NullableDecimalString',
            description: 'Optional instant cashback in INR; null if not applicable',
          },
          fundName: {
            type:     'string',
            nullable: true,
            example:  'Mirae Asset Large Cap Fund',
            description: 'Mutual fund backing this EMI plan',
          },
          fundCategory: {
            type:     'string',
            nullable: true,
            example:  'Large Cap',
          },
          isNoCost: {
            type:    'boolean',
            example: false,
            description: 'true when interestRate is 0',
          },
          createdAt: {
            type:   'string',
            format: 'date-time',
          },
        },
      },

      Product: {
        type: 'object',
        required: ['id', 'name', 'slug', 'mrp', 'price', 'createdAt', 'updatedAt', 'variants'],
        properties: {
          id:          { $ref: '#/components/schemas/Cuid' },
          name: {
            type:    'string',
            example: 'iPhone 17 Pro',
          },
          slug: {
            type:    'string',
            pattern: '^[a-z0-9-]+$',
            example: 'iphone-17-pro',
            description: 'URL-safe unique identifier, lowercase letters / digits / hyphens',
          },
          description: {
            type:     'string',
            nullable: true,
            example:  'The most powerful iPhone ever.',
          },
          brand: {
            type:     'string',
            nullable: true,
            example:  'Apple',
          },
          category: {
            type:     'string',
            nullable: true,
            example:  'Smartphones',
          },
          mrp: {
            $ref:        '#/components/schemas/DecimalString',
            description: 'Maximum Retail Price (strike-through price) in INR',
          },
          price: {
            $ref:        '#/components/schemas/DecimalString',
            description: 'Selling / offer price in INR',
          },
          createdAt: {
            type:   'string',
            format: 'date-time',
          },
          updatedAt: {
            type:   'string',
            format: 'date-time',
          },
          variants: {
            type:  'array',
            items: { $ref: '#/components/schemas/ProductVariant' },
          },
        },
      },

      ProductDetail: {
        allOf: [
          { $ref: '#/components/schemas/Product' },
          {
            type: 'object',
            required: ['emiPlans'],
            properties: {
              emiPlans: {
                type:  'array',
                items: { $ref: '#/components/schemas/EmiPlan' },
                description: 'All EMI plans for this product, ordered by tenureMonths asc',
              },
            },
          },
        ],
      },

      // ── Response envelopes ────────────────────────────────────────────────

      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              status:    { type: 'string', example: 'ok' },
              timestamp: { type: 'string', format: 'date-time' },
              env:       { type: 'string', example: 'development' },
            },
          },
        },
      },

      ProductListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type:  'array',
            items: { $ref: '#/components/schemas/Product' },
          },
          meta: {
            type: 'object',
            properties: {
              count: {
                type:    'integer',
                example: 3,
                description: 'Number of products in this response (or on this page)',
              },
              pagination: {
                nullable: true,
                type: 'object',
                description: 'Only present when ?page or ?limit is supplied',
                properties: {
                  total:       { type: 'integer', example: 12 },
                  totalPages:  { type: 'integer', example: 2 },
                  page:        { type: 'integer', example: 1 },
                  limit:       { type: 'integer', example: 10 },
                  hasNextPage: { type: 'boolean', example: true },
                  hasPrevPage: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
      },

      ProductDetailResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data:    { $ref: '#/components/schemas/ProductDetail' },
        },
      },

      VariantListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type:  'array',
            items: { $ref: '#/components/schemas/ProductVariant' },
          },
          meta: {
            type: 'object',
            properties: {
              count: { type: 'integer', example: 3 },
            },
          },
        },
      },

      EmiPlanListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type:  'array',
            items: { $ref: '#/components/schemas/EmiPlan' },
          },
          meta: {
            type: 'object',
            properties: {
              count: { type: 'integer', example: 6 },
            },
          },
        },
      },

      // ── Error envelopes ───────────────────────────────────────────────────

      Error400: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code:    { type: 'string', example: 'INVALID_QUERY_PARAMS' },
              message: { type: 'string', example: 'page must be a positive integer' },
              details: {
                type:     'array',
                nullable: true,
                items:    { type: 'string' },
                example:  ['page must be a positive integer'],
              },
            },
          },
        },
      },

      Error404: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code:    { type: 'string', example: 'PRODUCT_NOT_FOUND' },
              message: { type: 'string', example: 'No product found with slug "xyz"' },
            },
          },
        },
      },

      Error500: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code:    { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
              message: { type: 'string', example: 'An unexpected error occurred. Please try again later.' },
            },
          },
        },
      },
    },

    // ── Reusable parameters ───────────────────────────────────────────────────

    parameters: {
      SlugPath: {
        name:        'slug',
        in:          'path',
        required:    true,
        description: 'Product URL slug — lowercase letters, digits, and hyphens only (e.g. `iphone-17-pro`)',
        schema: {
          type:    'string',
          pattern: '^[a-z0-9-]+$',
          example: 'iphone-17-pro',
        },
      },

      SearchQuery: {
        name:        'search',
        in:          'query',
        required:    false,
        description: 'Case-insensitive substring search on product name **or** brand. Max 100 characters.',
        schema: {
          type:      'string',
          maxLength: 100,
          example:   'iphone',
        },
      },

      BrandQuery: {
        name:        'brand',
        in:          'query',
        required:    false,
        description: 'Exact brand filter (case-insensitive). Max 100 characters.',
        schema: {
          type:      'string',
          maxLength: 100,
          example:   'Apple',
        },
      },

      MinPriceQuery: {
        name:        'minPrice',
        in:          'query',
        required:    false,
        description: 'Minimum selling price in INR (inclusive). Must be ≥ 0.',
        schema: {
          type:    'number',
          minimum: 0,
          example: 50000,
        },
      },

      MaxPriceQuery: {
        name:        'maxPrice',
        in:          'query',
        required:    false,
        description: 'Maximum selling price in INR (inclusive). Must be ≥ 0 and ≥ minPrice.',
        schema: {
          type:    'number',
          minimum: 0,
          example: 150000,
        },
      },

      HasNoCostEmiQuery: {
        name:        'hasNoCostEmi',
        in:          'query',
        required:    false,
        description: 'When `true`, returns only products that have at least one 0% interest EMI plan.',
        schema: {
          type:    'string',
          enum:    ['true', 'false'],
          example: 'true',
        },
      },

      SortQuery: {
        name:        'sort',
        in:          'query',
        required:    false,
        description: [
          'Sort order for the product list.',
          '',
          '| Value | Description |',
          '|---|---|',
          '| `price_asc` | Price: lowest first |',
          '| `price_desc` | Price: highest first |',
          '| `lowest_emi` | Lowest available monthly EMI first |',
          '| `highest_cashback` | Highest available cashback first |',
          '| `name_asc` | Alphabetical (default) |',
        ].join('\n'),
        schema: {
          type: 'string',
          enum: ['price_asc', 'price_desc', 'lowest_emi', 'highest_cashback', 'name_asc'],
        },
      },

      PageQuery: {
        name:     'page',
        in:       'query',
        required: false,
        description: [
          'Page number for paginated results. Must be a positive integer.',
          'Providing this parameter (or `limit`) enables pagination mode.',
          'Default: `1`.',
        ].join(' '),
        schema: {
          type:    'integer',
          minimum: 1,
          example: 1,
        },
      },

      LimitQuery: {
        name:     'limit',
        in:       'query',
        required: false,
        description: [
          'Items per page. Must be a positive integer between 1 and 100.',
          'Providing this parameter (or `page`) enables pagination mode.',
          'Default: `10`.',
        ].join(' '),
        schema: {
          type:    'integer',
          minimum: 1,
          maximum: 100,
          example: 10,
        },
      },
    },
  },

  // ── Tag definitions ───────────────────────────────────────────────────────

  tags: [
    {
      name:        'Health',
      description: 'Server health check',
    },
    {
      name:        'Products',
      description: 'Product listing and detail',
    },
    {
      name:        'Variants',
      description: 'Product variant selection (colour, storage)',
    },
    {
      name:        'EMI Plans',
      description: 'Mutual-fund-backed EMI plan options for a product',
    },
  ],

  // ── Paths ─────────────────────────────────────────────────────────────────

  paths: {

    '/api/health': {
      get: {
        tags:        ['Health'],
        summary:     'Server health check',
        description: 'Returns the server status, current timestamp, and `NODE_ENV`. No authentication required.',
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'Server is up and running',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
                example: {
                  success: true,
                  data: {
                    status:    'ok',
                    timestamp: '2026-09-03T10:00:00.000Z',
                    env:       'development',
                  },
                },
              },
            },
          },
          500: {
            description: 'Unexpected server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error500' },
              },
            },
          },
        },
      },
    },

    '/api/products': {
      get: {
        tags:        ['Products'],
        summary:     'List products',
        description: [
          'Returns all products with their variants.',
          '',
          '**Pagination:** Passing `page` or `limit` enables paginated mode and adds',
          '`meta.pagination` to the response. Omitting both returns all matching products',
          '(backwards-compatible behaviour).',
          '',
          '**Filtering:** `search`, `brand`, `minPrice`, `maxPrice`, and `hasNoCostEmi`',
          'are applied at the database level via Prisma.',
          '',
          '**Sorting:** `price_asc`/`price_desc` use Prisma `orderBy`. `lowest_emi` and',
          '`highest_cashback` sort in the service layer after DB fetch.',
        ].join('\n'),
        operationId: 'listProducts',
        parameters: [
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/BrandQuery' },
          { $ref: '#/components/parameters/MinPriceQuery' },
          { $ref: '#/components/parameters/MaxPriceQuery' },
          { $ref: '#/components/parameters/HasNoCostEmiQuery' },
          { $ref: '#/components/parameters/SortQuery' },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
        ],
        responses: {
          200: {
            description: 'Product list (or page of products)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductListResponse' },
                examples: {
                  all_products: {
                    summary: 'All products (no pagination)',
                    value: {
                      success: true,
                      data: [
                        {
                          id:          'cmtlbecgx0000v4ok1beyxl5x',
                          name:        'iPhone 17 Pro',
                          slug:        'iphone-17-pro',
                          brand:       'Apple',
                          category:    'Smartphones',
                          mrp:         '134900',
                          price:       '124900',
                          createdAt:   '2026-09-03T09:20:32.673Z',
                          updatedAt:   '2026-09-03T09:20:32.673Z',
                          variants: [
                            {
                              id: 'cmtlre8u1000v4gs',
                              productId: 'cmtlbecgx0000v4ok1beyxl5x',
                              storage: '256 GB', color: 'Silver',
                              imageUrl: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80',
                              inStock: true, sortOrder: 0,
                              createdAt: '2026-09-03T16:48:21.818Z',
                            },
                          ],
                        },
                      ],
                      meta: { count: 3 },
                    },
                  },
                  paginated: {
                    summary: 'Paginated response (?page=1&limit=2)',
                    value: {
                      success: true,
                      data: [],
                      meta: {
                        count: 2,
                        pagination: {
                          total: 3, totalPages: 2,
                          page: 1, limit: 2,
                          hasNextPage: true, hasPrevPage: false,
                        },
                      },
                    },
                  },
                  empty: {
                    summary: 'No products match the filters',
                    value: { success: true, data: [], meta: { count: 0 } },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid query parameter(s)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error400' },
                examples: {
                  invalid_price: {
                    summary: 'Non-numeric price',
                    value: {
                      success: false,
                      error: {
                        code:    'INVALID_QUERY_PARAMS',
                        message: 'minPrice must be a non-negative number',
                        details: ['minPrice must be a non-negative number'],
                      },
                    },
                  },
                  min_gt_max: {
                    summary: 'minPrice > maxPrice',
                    value: {
                      success: false,
                      error: {
                        code:    'INVALID_QUERY_PARAMS',
                        message: 'minPrice must not be greater than maxPrice',
                        details: ['minPrice must not be greater than maxPrice'],
                      },
                    },
                  },
                  invalid_page: {
                    summary: 'Non-integer page',
                    value: {
                      success: false,
                      error: {
                        code:    'INVALID_QUERY_PARAMS',
                        message: 'page must be a positive integer',
                        details: ['page must be a positive integer'],
                      },
                    },
                  },
                  limit_exceeded: {
                    summary: 'limit > 100',
                    value: {
                      success: false,
                      error: {
                        code:    'INVALID_QUERY_PARAMS',
                        message: 'limit must not exceed 100',
                        details: ['limit must not exceed 100'],
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Database or unexpected server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error500' },
              },
            },
          },
        },
      },
    },

    '/api/products/{slug}': {
      get: {
        tags:        ['Products'],
        summary:     'Get product by slug',
        description: 'Returns a single product with all its variants **and** all its EMI plans.',
        operationId: 'getProductBySlug',
        parameters: [
          { $ref: '#/components/parameters/SlugPath' },
        ],
        responses: {
          200: {
            description: 'Product found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductDetailResponse' },
                example: {
                  success: true,
                  data: {
                    id: 'cmtlbecgx0000v4ok1beyxl5x',
                    name: 'iPhone 17 Pro',
                    slug: 'iphone-17-pro',
                    brand: 'Apple',
                    category: 'Smartphones',
                    description: 'The most powerful iPhone ever.',
                    mrp: '134900', price: '124900',
                    createdAt: '2026-09-03T09:20:32.673Z',
                    updatedAt: '2026-09-03T09:20:32.673Z',
                    variants: [
                      { id: 'v1', productId: 'cmtlbecgx0000v4ok1beyxl5x', storage: '256 GB', color: 'Silver', imageUrl: null, inStock: true, sortOrder: 0, createdAt: '2026-09-03T16:48:21.818Z' },
                    ],
                    emiPlans: [
                      { id: 'e1', productId: 'cmtlbecgx0000v4ok1beyxl5x', tenureMonths: 3, interestRate: '0', monthlyPayment: '41634', totalPayable: '124902', cashback: '500', fundName: 'Mirae Asset Large Cap Fund', fundCategory: 'Large Cap', isNoCost: true, createdAt: '2026-09-03T16:48:21.825Z' },
                      { id: 'e2', productId: 'cmtlbecgx0000v4ok1beyxl5x', tenureMonths: 12, interestRate: '10.5', monthlyPayment: '11010', totalPayable: '132120', cashback: '7500', fundName: 'SBI Magnum Midcap Fund', fundCategory: 'Mid Cap', isNoCost: false, createdAt: '2026-09-03T16:48:21.831Z' },
                    ],
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid slug format (contains characters other than a-z, 0-9, hyphen)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error400' },
                example: {
                  success: false,
                  error: {
                    code:    'INVALID_SLUG',
                    message: 'Invalid product slug: "iPhone!!"',
                  },
                },
              },
            },
          },
          404: {
            description: 'No product exists with the given slug',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error404' },
                example: {
                  success: false,
                  error: {
                    code:    'PRODUCT_NOT_FOUND',
                    message: 'No product found with slug "no-such-phone"',
                  },
                },
              },
            },
          },
          500: {
            description: 'Database or unexpected server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error500' },
              },
            },
          },
        },
      },
    },

    '/api/products/{slug}/variants': {
      get: {
        tags:        ['Variants'],
        summary:     'Get variants for a product',
        description: 'Returns all variants (colour + storage configurations) for a product, ordered by `sortOrder` ascending.',
        operationId: 'listVariants',
        parameters: [
          { $ref: '#/components/parameters/SlugPath' },
        ],
        responses: {
          200: {
            description: 'Variants for the product',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VariantListResponse' },
                example: {
                  success: true,
                  data: [
                    { id: 'v1', productId: 'cmtlbecgx0000v4ok1beyxl5x', storage: '256 GB', color: 'Silver',  imageUrl: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80', inStock: true,  sortOrder: 0, createdAt: '2026-09-03T16:48:21.818Z' },
                    { id: 'v2', productId: 'cmtlbecgx0000v4ok1beyxl5x', storage: '256 GB', color: 'Orange', imageUrl: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80', inStock: true,  sortOrder: 1, createdAt: '2026-09-03T16:48:21.820Z' },
                    { id: 'v3', productId: 'cmtlbecgx0000v4ok1beyxl5x', storage: '512 GB', color: 'Silver', imageUrl: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80', inStock: true,  sortOrder: 2, createdAt: '2026-09-03T16:48:21.822Z' },
                  ],
                  meta: { count: 3 },
                },
              },
            },
          },
          400: {
            description: 'Invalid slug format',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error400' } },
            },
          },
          404: {
            description: 'Product not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error404' } },
            },
          },
          500: {
            description: 'Database or unexpected server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error500' } },
            },
          },
        },
      },
    },

    '/api/products/{slug}/emi-plans': {
      get: {
        tags:        ['EMI Plans'],
        summary:     'Get EMI plans for a product',
        description: [
          'Returns all EMI plans for a product, ordered by `tenureMonths` ascending.',
          '',
          'Each plan includes:',
          '- `tenureMonths` — repayment period (3, 6, 9, 12, 18, or 24)',
          '- `monthlyPayment` — fixed monthly instalment in INR',
          '- `interestRate` — annual rate; `"0"` = no-cost EMI',
          '- `cashback` — optional instant cashback; `null` if not applicable',
          '- `fundName` / `fundCategory` — mutual fund backing the plan',
          '- `isNoCost` — convenience boolean; `true` when `interestRate = 0`',
        ].join('\n'),
        operationId: 'listEmiPlans',
        parameters: [
          { $ref: '#/components/parameters/SlugPath' },
        ],
        responses: {
          200: {
            description: 'EMI plans for the product',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EmiPlanListResponse' },
                example: {
                  success: true,
                  data: [
                    { id: 'e1', productId: 'p1', tenureMonths: 3,  interestRate: '0',    monthlyPayment: '23333', totalPayable: '69999',  cashback: '300',  fundName: 'UTI Nifty 50 Index Fund',        fundCategory: 'Index Fund', isNoCost: true,  createdAt: '2026-09-03T16:48:21.860Z' },
                    { id: 'e2', productId: 'p1', tenureMonths: 6,  interestRate: '0',    monthlyPayment: '11667', totalPayable: '70002',  cashback: null,   fundName: 'ICICI Prudential Bluechip Fund', fundCategory: 'Large Cap',  isNoCost: true,  createdAt: '2026-09-03T16:48:21.862Z' },
                    { id: 'e3', productId: 'p1', tenureMonths: 12, interestRate: '10.5', monthlyPayment: '6171',  totalPayable: '74052',  cashback: '7500', fundName: 'Motilal Oswal Midcap Fund',      fundCategory: 'Mid Cap',    isNoCost: false, createdAt: '2026-09-03T16:48:21.866Z' },
                  ],
                  meta: { count: 6 },
                },
              },
            },
          },
          400: {
            description: 'Invalid slug format',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error400' } },
            },
          },
          404: {
            description: 'Product not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error404' } },
            },
          },
          500: {
            description: 'Database or unexpected server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error500' } },
            },
          },
        },
      },
    },

  },
}

export default spec
