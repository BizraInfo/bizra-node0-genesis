# Admin Dashboard - Quick Start Guide

## Overview

Production-grade React + TypeScript admin dashboard with real-time monitoring, user management, and analytics.

## Installation

```bash
# Install all dependencies
npm install

# Start development server
npm run dashboard:dev
```

Dashboard available at: `http://localhost:3000`

## Architecture

### Frontend Stack

- **React 18** - Component library
- **TypeScript 5.3** - Type safety
- **Redux Toolkit** - State management
- **React Query** - Server state
- **Ant Design 5** - UI components
- **Recharts** - Data visualization
- **Socket.io** - Real-time updates
- **Vite** - Build tool

### Key Features

1. **Authentication System**
   - JWT with refresh tokens
   - Auto token refresh
   - Protected routes
   - Role-based access control

2. **User Management**
   - CRUD operations
   - Role management (Admin, Moderator, User, Viewer)
   - Search and filtering
   - Bulk operations

3. **Real-Time Monitoring**
   - Validation events stream
   - Live logs viewer
   - System health monitoring
   - WebSocket auto-reconnect

4. **Analytics Dashboard**
   - Interactive charts
   - Time-series data
   - Success rate trends
   - Performance metrics

5. **API Metrics**
   - Endpoint monitoring
   - Response time tracking
   - Error rate analysis
   - Request per minute

6. **System Health**
   - Node status monitoring
   - CPU/Memory/Disk usage
   - Network traffic
   - Uptime tracking

## File Structure

```
src/dashboard/
├── components/          # UI components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── DashboardLayout.tsx
│   ├── ProtectedRoute.tsx
│   └── MetricsChart.tsx
├── hooks/              # Custom hooks
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   ├── useMetrics.ts
│   └── usePermissions.ts
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── UserManagement.tsx
│   ├── ValidationMonitor.tsx
│   ├── Analytics.tsx
│   ├── LogsViewer.tsx
│   ├── APIMetrics.tsx
│   └── SystemHealth.tsx
├── services/           # API services
│   ├── api.service.ts
│   ├── auth.service.ts
│   └── websocket.service.ts
├── store/              # Redux store
│   ├── store.ts
│   ├── auth.slice.ts
│   ├── user.slice.ts
│   └── validation.slice.ts
└── types/              # TypeScript types
    ├── user.types.ts
    └── validation.types.ts
```

## Environment Configuration

Create `.env` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws

# Authentication
VITE_JWT_SECRET=your-jwt-secret-key
VITE_REFRESH_TOKEN_EXPIRY=7d
VITE_ACCESS_TOKEN_EXPIRY=15m

# WebSocket
VITE_WS_RECONNECT_ATTEMPTS=5
VITE_WS_RECONNECT_INTERVAL=3000

# Environment
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

## Backend API Requirements

The dashboard expects these endpoints:

### Authentication

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/change-password
```

### User Management

```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
```

### Metrics

```
GET    /api/metrics/validation
GET    /api/metrics/dashboard
GET    /api/metrics/api
GET    /api/metrics/timeseries
```

### WebSocket Events

```
validation:update    # Validation events
metrics:update       # Metrics updates
log:entry           # Log entries
alert:new           # New alerts
node:status         # Node health
system:health       # System health
```

## Development Commands

```bash
# Start development server
npm run dashboard:dev

# Build for production
npm run dashboard:build

# Preview production build
npm run dashboard:preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Authentication Flow

1. User logs in with email/password
2. Backend returns JWT access + refresh tokens
3. Tokens stored in localStorage
4. Access token added to all requests
5. Auto refresh on 401 error
6. Redirect to login if refresh fails

## Permission System

### Roles

- **Admin** - Full access
- **Moderator** - User management + metrics
- **User** - Standard access
- **Viewer** - Read-only access

### Usage Example

```typescript
import { usePermissions } from "@/hooks/usePermissions";

const { isAdmin, canCreateUser, canViewMetrics } = usePermissions();

if (canCreateUser) {
  // Show create button
}
```

## Real-Time Features

### WebSocket Connection

```typescript
import { useWebSocket } from "@/hooks/useWebSocket";

const { subscribeToValidations, isConnected } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribeToValidations();
  return () => unsubscribe();
}, []);
```

### Auto-Reconnection

- Automatic reconnection on disconnect
- Exponential backoff
- Configurable retry attempts

## State Management

### Redux Store

```typescript
{
  auth: {
    user: User | null,
    isAuthenticated: boolean,
    isLoading: boolean
  },
  user: {
    users: User[],
    pagination: {...}
  },
  validation: {
    validations: ValidationEvent[],
    metrics: ValidationMetrics,
    logs: LogEntry[],
    alerts: Alert[]
  }
}
```

### Dispatching Actions

```typescript
import { useAppDispatch, useAppSelector } from "@/store/store";
import { fetchUsers } from "@/store/user.slice";

const dispatch = useAppDispatch();
const users = useAppSelector((state) => state.user.users);

dispatch(fetchUsers({ page: 1, limit: 10 }));
```

## Performance Optimizations

- Code splitting by route
- Lazy loading components
- React Query caching
- WebSocket debouncing
- Memoized selectors
- Virtualized lists

## Security Features

- XSS protection
- Secure token storage
- Auto token refresh
- Request signing ready
- Input sanitization
- CORS handling

## Production Build

```bash
# Build
npm run dashboard:build

# Output in /dist folder
# Optimized bundles:
#   - react-vendor.js
#   - redux-vendor.js
#   - ui-vendor.js
#   - chart-vendor.js
```

## Deployment

### Static Hosting (Netlify, Vercel)

```bash
npm run dashboard:build
# Deploy /dist folder
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run dashboard:build
CMD ["npm", "run", "dashboard:preview"]
```

### Nginx

```nginx
server {
  listen 80;
  root /var/www/dist;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://backend:8000;
  }

  location /ws {
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Troubleshooting

### WebSocket Issues

1. Check `VITE_WS_BASE_URL`
2. Verify backend WebSocket server
3. Check browser console
4. Verify CORS settings

### Authentication Issues

1. Clear localStorage
2. Check JWT token format
3. Verify backend endpoints
4. Check token expiration

### Build Issues

1. Clear node_modules: `rm -rf node_modules && npm install`
2. Check TypeScript: `npm run typecheck`
3. Verify environment variables

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

---

**Ready to start!** Run `npm run dashboard:dev` and navigate to `http://localhost:3000`
