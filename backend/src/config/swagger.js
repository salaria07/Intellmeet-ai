import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'IntellMeet AI — Enterprise API',
    version: '1.0.0',
    description:
      'Complete REST API and real-time signaling documentation for IntellMeet AI — enterprise video meetings, automatic transcription, OpenAI GPT-4o-mini summarization, team collaboration, and task management.',
    contact: {
      name: 'IntellMeet AI Engineering Team',
      email: 'support@intellmeet.ai',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.intellmeet.ai',
      description: 'Production Cloud Cluster',
    },
  ],
  tags: [
    { name: 'Health', description: 'System health check and diagnostic telemetry' },
    { name: 'Auth', description: 'User registration, login, logout, password recovery, and profile management' },
    { name: 'Meetings', description: 'WebRTC video rooms, instant creation, scheduling, joining, transcripts, and AI summaries' },
    { name: 'Teams', description: 'Collaborative workspaces, member directory, role-based access, and invitations' },
    { name: 'Tasks', description: 'Kanban action-item management and AI extraction conversions' },
    { name: 'Analytics', description: 'Productivity metrics, meeting frequencies, and participation telemetry' },
    { name: 'Notifications', description: 'User in-app alerts and notifications' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token or rely on the HTTP-only auth cookie.',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'HTTP-only secure JWT session cookie.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65a000000000000000000001' },
          name: { type: 'string', example: 'Alex Morgan' },
          email: { type: 'string', example: 'alex@intellmeet.ai' },
          role: { type: 'string', enum: ['Admin', 'Manager', 'Member'], example: 'Admin' },
          jobTitle: { type: 'string', example: 'VP of Product' },
          department: { type: 'string', example: 'Engineering & AI' },
          status: { type: 'string', enum: ['Online', 'Away', 'In Meeting', 'Offline'], example: 'Online' },
          avatar: { type: 'string', example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
          settings: {
            type: 'object',
            properties: {
              theme: { type: 'string', example: 'dark' },
              cameraDefault: { type: 'boolean', example: true },
              micDefault: { type: 'boolean', example: true },
              emailNotifications: { type: 'boolean', example: true },
              meetingReminders: { type: 'boolean', example: true },
            },
          },
        },
      },
      Meeting: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65c000000000000000000001' },
          title: { type: 'string', example: 'Q4 AI Architecture Sync' },
          description: { type: 'string', example: 'Sprint review and STUN/TURN failover benchmark audit.' },
          meetingCode: { type: 'string', example: 'mtg-q4-deploy' },
          host: { $ref: '#/components/schemas/User' },
          status: { type: 'string', enum: ['scheduled', 'live', 'ended', 'cancelled'], example: 'live' },
          scheduledStartTime: { type: 'string', format: 'date-time' },
          scheduledEndTime: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'integer', example: 45 },
          isInstant: { type: 'boolean', example: false },
          hasSummary: { type: 'boolean', example: true },
          participants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                user: { type: 'string' },
                name: { type: 'string', example: 'Alex Morgan' },
                avatar: { type: 'string' },
                role: { type: 'string', example: 'host' },
                joinedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      MeetingSummary: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65e000000000000000000001' },
          meetingCode: { type: 'string', example: 'mtg-eng-sync' },
          overview: { type: 'string', example: 'The team aligned on Q4 architecture milestones and WebRTC low-latency pipelines.' },
          discussionPoints: { type: 'array', items: { type: 'string' } },
          decisions: { type: 'array', items: { type: 'string' } },
          takeaways: { type: 'array', items: { type: 'string' } },
          unresolvedQuestions: { type: 'array', items: { type: 'string' } },
          nextSteps: { type: 'array', items: { type: 'string' } },
          actionItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                title: { type: 'string', example: 'Benchmark multi-stream video mesh on mobile Safari' },
                description: { type: 'string' },
                assigneeName: { type: 'string', example: 'Sarah Jenkins' },
                priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'], example: 'High' },
                dueDate: { type: 'string', format: 'date-time' },
                convertedToTask: { type: 'boolean', example: false },
              },
            },
          },
          isAIGenerated: { type: 'boolean', example: true },
          isDemoMode: { type: 'boolean', example: false },
          modelUsed: { type: 'string', example: 'gpt-4o-mini' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65f000000000000000000001' },
          title: { type: 'string', example: 'Benchmark multi-stream video mesh' },
          description: { type: 'string', example: 'Test WebRTC packet loss and frame rates.' },
          assigneeName: { type: 'string', example: 'Sarah Jenkins' },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'], example: 'High' },
          status: { type: 'string', enum: ['To Do', 'In Progress', 'Completed'], example: 'In Progress' },
          sourceMeetingTitle: { type: 'string', example: 'Weekly Engineering All-Hands' },
          sourceMeetingCode: { type: 'string', example: 'mtg-eng-sync' },
          dueDate: { type: 'string', format: 'date-time' },
        },
      },
      Team: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65b000000000000000000001' },
          name: { type: 'string', example: 'Core Platform & AI Systems' },
          description: { type: 'string', example: 'Intelligent collaboration workspace.' },
          department: { type: 'string', example: 'Engineering & AI' },
          memberCount: { type: 'integer', example: 4 },
          members: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string', example: 'Alex Morgan' },
                email: { type: 'string', example: 'alex@intellmeet.ai' },
                teamRole: { type: 'string', example: 'Admin' },
                status: { type: 'string', example: 'Online' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API and system health',
        responses: {
          200: {
            description: 'API is healthy and operational',
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new enterprise user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Elena Rostova' },
                  email: { type: 'string', example: 'elena@company.com' },
                  password: { type: 'string', example: 'Password123!' },
                  role: { type: 'string', enum: ['Admin', 'Manager', 'Member'], example: 'Member' },
                  jobTitle: { type: 'string', example: 'Staff Software Engineer' },
                  department: { type: 'string', example: 'Engineering & AI' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User account created and JWT cookie set' },
          400: { description: 'Validation error or duplicate email' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate user credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'alex@intellmeet.ai' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Successful login with JWT cookie set' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Sign out and clear session cookie',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Signed out successfully' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user profile',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Current user object returned' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/auth/profile': {
      put: {
        tags: ['Auth'],
        summary: 'Update user profile details and settings',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  jobTitle: { type: 'string' },
                  department: { type: 'string' },
                  avatar: { type: 'string' },
                  settings: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
        },
      },
    },
    '/api/meetings': {
      get: {
        tags: ['Meetings'],
        summary: 'List user meetings',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'upcoming', 'live', 'past'] } },
        ],
        responses: {
          200: { description: 'List of meetings' },
        },
      },
    },
    '/api/meetings/instant': {
      post: {
        tags: ['Meetings'],
        summary: 'Create instant WebRTC video collaboration room',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Instant Architecture Sync' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Instant meeting provisioned with unique code' },
        },
      },
    },
    '/api/meetings/schedule': {
      post: {
        tags: ['Meetings'],
        summary: 'Schedule a future meeting',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'scheduledStartTime'],
                properties: {
                  title: { type: 'string', example: 'Sprint Planning Sync' },
                  description: { type: 'string' },
                  scheduledStartTime: { type: 'string', format: 'date-time' },
                  durationMinutes: { type: 'integer', example: 45 },
                  invitedEmails: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Meeting scheduled successfully' },
        },
      },
    },
    '/api/meetings/{code}': {
      get: {
        tags: ['Meetings'],
        summary: 'Get meeting details, transcript, and AI summary by meeting code',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string', example: 'mtg-q4-deploy' } },
        ],
        responses: {
          200: { description: 'Meeting details, participants, and intelligence summary' },
          404: { description: 'Meeting not found' },
        },
      },
    },
    '/api/meetings/{code}/join': {
      post: {
        tags: ['Meetings'],
        summary: 'Join a meeting room',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Joined room successfully' },
        },
      },
    },
    '/api/meetings/{code}/summary': {
      post: {
        tags: ['Meetings'],
        summary: 'Generate OpenAI GPT-4o-mini structured summary and action items',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'AI Summary generated or demo mode synthesis returned' },
        },
      },
    },
    '/api/teams': {
      get: {
        tags: ['Teams'],
        summary: 'Get workspace team directory and members',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Team workspace and members returned' },
        },
      },
    },
    '/api/teams/invite': {
      post: {
        tags: ['Teams'],
        summary: 'Invite a new team member (Admin/Manager only)',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', example: 'newmember@company.com' },
                  role: { type: 'string', enum: ['Admin', 'Manager', 'Member'], default: 'Member' },
                  jobTitle: { type: 'string' },
                  department: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Invitation sent' },
          403: { description: 'Permission denied' },
        },
      },
    },
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Get all workspace tasks and action items',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'To Do', 'In Progress', 'Completed'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['all', 'low', 'medium', 'high', 'critical'] } },
        ],
        responses: {
          200: { description: 'List of tasks' },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Audit WebRTC STUN/TURN failover' },
                  description: { type: 'string' },
                  assigneeName: { type: 'string', example: 'Marcus Vance' },
                  priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
                  dueDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Task created' },
        },
      },
    },
    '/api/tasks/convert-action-item': {
      post: {
        tags: ['Tasks'],
        summary: 'Convert an AI summary action item into a persistent workspace task',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  summaryId: { type: 'string' },
                  actionItemId: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  assigneeName: { type: 'string' },
                  priority: { type: 'string' },
                  sourceMeetingCode: { type: 'string' },
                  sourceMeetingTitle: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Action item converted to formal task' },
        },
      },
    },
    '/api/tasks/stats': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task KPI summary statistics',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Task stats returned' },
        },
      },
    },
    '/api/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get aggregated meeting hours, frequencies, and participation metrics',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Aggregated analytics metrics and chart data' },
        },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get user notifications',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Notifications list' },
        },
      },
    },
  },
};

/**
 * Configure Swagger UI middleware and raw JSON endpoint
 */
export const setupSwagger = (app) => {
  // Custom CSS for dark-mode Swagger UI matching IntellMeet AI aesthetics
  const customCss = `
    .swagger-ui { background-color: #060913; color: #e2e8f0; font-family: 'Plus Jakarta Sans', sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #38bdf8; font-weight: 800; font-size: 32px; }
    .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8; }
    .swagger-ui .scheme-container { background: #0a0f24; border-bottom: 1px solid #1e293b; box-shadow: none; }
    .swagger-ui .opblock.opblock-post { border-color: #2563eb; background: rgba(37,99,235,0.06); }
    .swagger-ui .opblock.opblock-get { border-color: #10b981; background: rgba(16,185,129,0.06); }
    .swagger-ui .opblock.opblock-put { border-color: #f59e0b; background: rgba(245,158,11,0.06); }
    .swagger-ui .opblock.opblock-delete { border-color: #ef4444; background: rgba(239,68,68,0.06); }
    .swagger-ui .opblock .opblock-summary-method { border-radius: 8px; font-weight: 700; }
    .swagger-ui .opblock-tag { color: #f8fafc; border-bottom: 1px solid #1e293b; }
    .swagger-ui .opblock .opblock-summary-path { color: #f1f5f9; font-weight: 600; }
    .swagger-ui .opblock .opblock-summary-description { color: #94a3b8; }
    .swagger-ui section.models { border-color: #1e293b; background: #0a0f24; border-radius: 16px; }
    .swagger-ui section.models h4 { color: #e2e8f0; }
    .swagger-ui .model-box { background: transparent; }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #cbd5e1; border-bottom: 1px solid #334155; }
    .swagger-ui .btn.authorize { color: #38bdf8; border-color: #38bdf8; border-radius: 8px; }
    .swagger-ui .btn.authorize svg { fill: #38bdf8; }
  `;

  const swaggerOptions = {
    customCss,
    customSiteTitle: 'IntellMeet AI — API Documentation',
    customfavIcon: 'https://api.dicebear.com/7.x/initials/svg?seed=IM&backgroundColor=2563eb',
  };

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

  // Serve raw OpenAPI JSON specification
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📑 Swagger Documentation available at: http://localhost:5000/api/docs`);
};
