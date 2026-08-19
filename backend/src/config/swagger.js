import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stock Management System API',
      version: '1.0.0',
      description: 'REST API for the Stock Management System. Every subsequent API task adds to this living contract.',
      contact: {
        name: 'ASTU ICT Stock Mgt Team A'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API server'
      }
    ],
    components: {
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string'
                },
                message: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/index.js']
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
