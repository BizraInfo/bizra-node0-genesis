# BIZRA Node-0 Admin Dashboard

Production-grade admin dashboard built with React 18, TypeScript, Redux Toolkit, and Ant Design.

## Features

### 🔐 Authentication

- JWT-based authentication with refresh tokens
- Automatic token refresh on expiration
- Protected routes with role-based access control (RBAC)
- Remember me functionality
- Secure token storage

### 👥 User Management

- Complete CRUD operations for users
- Role-based permissions (Admin, Moderator, User, Viewer)
- User status management (Active, Inactive, Suspended, Pending)
- Advanced filtering and search
- Bulk operations support

### 📊 Real-Time Validation Monitoring

- Live validation event stream via WebSocket
- Validation type filtering (Transaction, Block, Contract, Signature, Consensus)
- Status tracking (Success, Failed, Pending, Validating, Timeout)
- Performance metrics and success rates
- Node-level validation tracking

### 📈 Analytics Dashboard

- Interactive charts with Recharts
- Time-series data visualization
- Customizable date ranges and intervals
- Validation trends and patterns
- Success rate analysis
- Response time monitoring
- Pie charts for status distribution
- Bar charts for endpoint metrics

### 📝 Real-Time Logs Viewer

- Live log streaming via WebSocket
- Log level filtering (Debug, Info, Warn, Error, Fatal)
- Search functionality
- Auto-scroll support
- Export to CSV
- Metadata inspection

### 🔌 API Metrics

- Endpoint performance tracking
- Request per minute (RPM) monitoring
- Response time analysis
- Error rate tracking
- HTTP method and status code breakdown
- Real-time updates

### ❤️ System Health Monitoring

- Node health status tracking
- CPU, Memory, and Disk usage monitoring
- Network traffic visualization
- Uptime tracking
- Overall system health score
- Real-time heartbeat monitoring

## Technology Stack

### Core

- **React 18** - UI library
- **TypeScript 5.3** - Type safety
- **Vite** - Build tool and dev server

### State Management

- **Redux Toolkit** - Global state management
- **React Redux** - React bindings for Redux

### Data Fetching

- **React Query** - Server state management
- **Axios** - HTTP client with interceptors

### UI Components

- **Ant Design 5** - Component library
- **Recharts** - Data visualization

### Real-Time

- **Socket.io Client** - WebSocket connections

### Authentication

- **jwt-decode** - JWT token parsing

### Utilities

- **Day.js** - Date/time manipulation
- **clsx** - Conditional class names

## Project Structure

```
src/dashboard/
├── components/          # React components
│   ├── Header.tsx      # Top navigation bar
│   ├── Sidebar.tsx     # Side navigation menu
│   ├── DashboardLayout.tsx  # Main layout wrapper
│   ├── ProtectedRoute.tsx   # Route protection HOC
│   └── MetricsChart.tsx     # Chart component
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication logic
│   ├── useWebSocket.ts # WebSocket management
│   ├── useMetrics.ts   # Metrics data fetching
│   └── usePermissions.ts # Permission checking
├── pages/              # Page components
│   ├── Login.tsx       # Login page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── UserManagement.tsx
│   ├── ValidationMonitor.tsx
│   ├── Analytics.tsx
│   ├── LogsViewer.tsx
│   ├── APIMetrics.tsx
│   └── SystemHealth.tsx
├── services/           # API services
│   ├── api.service.ts  # HTTP client
│   ├── auth.service.ts # Authentication service
│   └── websocket.service.ts # WebSocket service
├── store/              # Redux store
│   ├── store.ts        # Store configuration
│   ├── auth.slice.ts   # Auth state
│   ├── user.slice.ts   # User management state
│   └── validation.slice.ts # Validation state
├── types/              # TypeScript types
│   ├── user.types.ts
│   └── validation.types.ts
├── App.tsx             # Root component
├── index.tsx           # Entry point
└── index.css           # Global styles
```

## Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws
VITE_JWT_SECRET=your-jwt-secret
VITE_REFRESH_TOKEN_EXPIRY=7d
VITE_ACCESS_TOKEN_EXPIRY=15m
VITE_WS_RECONNECT_ATTEMPTS=5
VITE_WS_RECONNECT_INTERVAL=3000
```

### 3. Development Server

```bash
npm run dashboard:dev
```

Dashboard will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run dashboard:build
```

### 5. Preview Production Build

```bash
npm run dashboard:preview
```

## API Integration

### Backend Requirements

The dashboard expects the following API endpoints:

#### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

#### User Management

- `GET /api/users` - List users (with pagination/filtering)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Metrics

- `GET /api/metrics/validation` - Validation metrics
- `GET /api/metrics/dashboard` - Dashboard statistics
- `GET /api/metrics/api` - API endpoint metrics
- `GET /api/metrics/timeseries` - Time-series data

#### WebSocket Events

The dashboard subscribes to:

- `validation:update` - Validation event updates
- `metrics:update` - Metrics updates
- `log:entry` - Log entries
- `alert:new` - New alerts
- `node:status` - Node health updates
- `system:health` - System health updates

## Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST to `/api/auth/login`
3. Backend returns JWT access token and refresh token
4. Tokens stored in localStorage
5. Access token added to all API requests via Axios interceptor
6. On 401 error, refresh token used to get new access token
7. If refresh fails, user redirected to login

## Role-Based Access Control

### Roles

- **Admin** - Full access to all features
- **Moderator** - User management, metrics viewing
- **User** - Standard dashboard access
- **Viewer** - Read-only access

### Permission Checking

```typescript
import { usePermissions } from "@/hooks/usePermissions";

const { isAdmin, canCreateUser } = usePermissions();

if (canCreateUser) {
  // Show create user button
}
```

### Route Protection

```typescript
<ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MODERATOR]}>
  <UserManagement />
</ProtectedRoute>
```

## Real-Time Features

### WebSocket Connection

The dashboard automatically connects to WebSocket on mount:

```typescript
const { subscribeToValidations, isConnected } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribeToValidations();
  return () => unsubscribe();
}, []);
```

### Auto-Reconnection

WebSocket automatically reconnects on connection loss with exponential backoff.

## State Management

### Redux Store Structure

```typescript
{
  auth: {
    user: User | null,
    isAuthenticated: boolean,
    isLoading: boolean,
    error: string | null
  },
  user: {
    users: User[],
    selectedUser: User | null,
    pagination: {...}
  },
  validation: {
    validations: ValidationEvent[],
    metrics: ValidationMetrics,
    logs: LogEntry[],
    alerts: Alert[],
    nodeHealth: NodeHealth[]
  }
}
```

### Dispatching Actions

```typescript
import { useAppDispatch } from "@/store/store";
import { fetchUsers } from "@/store/user.slice";

const dispatch = useAppDispatch();
dispatch(fetchUsers({ page: 1, limit: 10 }));
```

## Performance Optimizations

- Code splitting by route
- Lazy loading of components
- React Query caching
- WebSocket event debouncing
- Memoized selectors
- Virtualized long lists
- Optimized re-renders

## Security Features

- XSS protection
- CSRF token support
- Secure token storage
- Automatic token refresh
- Request signing
- Rate limiting ready
- Input sanitization

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

### Adding New Pages

1. Create page component in `pages/`
2. Add route in `App.tsx`
3. Add navigation item in `Sidebar.tsx`
4. Implement permission checks if needed

### Adding New API Endpoints

1. Define types in `types/`
2. Add service method in `services/api.service.ts`
3. Create Redux slice if needed
4. Use React Query for data fetching

### Styling

- Use Ant Design components
- Custom styles in component or `index.css`
- Follow mobile-first responsive design
- Use Ant Design theme tokens

## Testing

```bash
# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Troubleshooting

### WebSocket Connection Issues

1. Check `VITE_WS_BASE_URL` in `.env`
2. Verify backend WebSocket server is running
3. Check browser console for errors
4. Verify CORS settings

### Authentication Issues

1. Clear localStorage
2. Check JWT token format
3. Verify backend authentication endpoint
4. Check token expiration times

### Build Issues

1. Clear node_modules and reinstall
2. Check TypeScript errors: `npm run typecheck`
3. Verify all environment variables are set

## License

MIT

## Support

For issues and questions, contact the BIZRA development team.
