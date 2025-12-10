# Swagger UI Documentation

## Overview

This directory contains the Swagger UI setup for interactive API documentation. The Swagger UI provides a user-friendly interface to explore and test the API endpoints.

## Features

- **Interactive API Explorer**: Test API endpoints directly from the browser
- **Environment Switching**: Toggle between Development, Staging, and Production
- **Authentication**: Built-in OAuth 2.0 and Bearer token authentication
- **Request/Response Examples**: View example requests and responses for all endpoints
- **Schema Validation**: Automatic request/response validation
- **Rate Limit Monitoring**: Visual indicators for rate limit usage

## Quick Start

### Local Development

1. **Start Local Server**:

   ```bash
   # Simple HTTP server
   cd docs/swagger-ui
   python -m http.server 8080

   # Or use Node.js
   npx http-server -p 8080
   ```

2. **Open in Browser**:

   ```
   http://localhost:8080/index.html
   ```

3. **Select Environment**:
   - Choose "Development" from the dropdown
   - Base URL will be set to `http://localhost:3000/v1`

4. **Authenticate**:
   - Click the "Authorize" button (lock icon)
   - Run `POST /auth/login` to get access token
   - Paste token in the "BearerAuth" field
   - Click "Authorize"

### Production Deployment

**Option 1: Serve from API Server**

```javascript
// Express.js example
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const app = express();
const swaggerDocument = YAML.load("./docs/api/openapi.yaml");

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Enterprise API - Documentation",
  }),
);

app.listen(3000);
```

**Option 2: Static Hosting (Vercel/Netlify)**

```bash
# Deploy to Vercel
cd docs/swagger-ui
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=docs/swagger-ui
```

**Option 3: Docker Container**

```dockerfile
# Dockerfile
FROM swaggerapi/swagger-ui:v5.10.0

COPY docs/api/openapi.yaml /usr/share/nginx/html/openapi.yaml
ENV SWAGGER_JSON=/usr/share/nginx/html/openapi.yaml
ENV PORT=8080

EXPOSE 8080
```

```bash
# Build and run
docker build -t api-docs .
docker run -p 8080:8080 api-docs
```

## Configuration

### Environment URLs

Edit `index.html` to configure environment URLs:

```javascript
const environments = {
  production: "https://api.example.com/v1",
  staging: "https://api-staging.example.com/v1",
  development: "http://localhost:3000/v1",
};
```

### Customization Options

**1. Branding**:

```html
<!-- Update title and logo -->
<title>Your Company - API Documentation</title>
<a class="link" href="/">Your Company API</a>
```

**2. Theme Colors**:

```css
.topbar {
  background-color: #your-brand-color;
}

.auth-info {
  border-left: 4px solid #your-accent-color;
}
```

**3. Default Authentication**:

```javascript
onComplete: function() {
  // Auto-populate bearer token from localStorage
  const savedToken = localStorage.getItem('swagger_auth_token');
  if (savedToken) {
    window.ui.preauthorizeApiKey('BearerAuth', savedToken);
  }
}
```

**4. Request Interceptor**:

```javascript
requestInterceptor: function(request) {
  // Add custom headers
  request.headers['X-Custom-Header'] = 'value';

  // Log all requests
  console.log('Request:', request);

  return request;
}
```

**5. Response Interceptor**:

```javascript
responseInterceptor: function(response) {
  // Monitor rate limits
  if (response.headers['x-ratelimit-remaining']) {
    console.warn(`Rate limit: ${response.headers['x-ratelimit-remaining']} remaining`);
  }

  return response;
}
```

## Usage Guide

### Authentication

**Step 1: Obtain Access Token**

1. Expand `POST /auth/login` endpoint
2. Click "Try it out"
3. Enter credentials:
   ```json
   {
     "email": "user@example.com",
     "password": "your-password"
   }
   ```
4. Click "Execute"
5. Copy `accessToken` from response

**Step 2: Authorize**

1. Click "Authorize" button at top of page
2. Enter token in format: `your-access-token-here` (without "Bearer ")
3. Click "Authorize"
4. Click "Close"

**Step 3: Test Authenticated Endpoints**

All subsequent requests will include the Bearer token automatically.

### Testing Workflows

**User Management Flow**:

```
1. POST /auth/register - Create account
2. POST /auth/login - Get access token
3. Authorize with token
4. GET /users - List users
5. GET /users/{userId} - Get specific user
6. PATCH /users/{userId} - Update user
```

**Organization Flow**:

```
1. POST /organizations - Create organization
2. GET /organizations - List organizations
3. GET /organizations/{orgId}/members - List members
4. POST /organizations/{orgId}/members - Add member
```

### Advanced Features

**1. Request Snippets**:

- Click on any endpoint
- Select "curl" tab to see curl command
- Copy and paste for CLI testing

**2. Schema Exploration**:

- Click "Schemas" at bottom of page
- View all data models and their fields
- See required fields and data types

**3. Download OpenAPI Spec**:

- Click "Download" dropdown
- Select "openapi.yaml" or "openapi.json"
- Use with code generators (openapi-generator, swagger-codegen)

**4. Filter Endpoints**:

- Use filter box at top to search endpoints
- Example: Type "auth" to see only authentication endpoints

## Code Generation

### Generate Client SDK

**JavaScript/TypeScript**:

```bash
npx @openapitools/openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g typescript-axios \
  -o ./sdk/typescript

# Install and use
cd sdk/typescript
npm install
npm run build
```

**Python**:

```bash
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g python \
  -o ./sdk/python

# Install and use
cd sdk/python
pip install -e .
```

**Java**:

```bash
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g java \
  -o ./sdk/java \
  --library okhttp-gson
```

### Generate Server Stubs

```bash
# Node.js Express server
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g nodejs-express-server \
  -o ./server-stub

# Python Flask server
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g python-flask \
  -o ./server-stub
```

## Validation

### Validate OpenAPI Spec

```bash
# Using Swagger CLI
npx swagger-cli validate docs/api/openapi.yaml

# Using Spectral (more detailed)
npx @stoplight/spectral-cli lint docs/api/openapi.yaml

# Using online validator
curl -X POST "https://validator.swagger.io/validator/debug" \
  -H "Content-Type: application/yaml" \
  --data-binary @docs/api/openapi.yaml
```

### Validate Responses

Enable response validation in Swagger UI:

```javascript
SwaggerUIBundle({
  // ... other config
  validatorUrl: "https://validator.swagger.io/validator",
  validateSpec: true,
  validateBeforeRender: true,
});
```

## Troubleshooting

### CORS Issues

If testing against local backend:

```javascript
// Add CORS headers in your API server
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});
```

### OAuth Redirect Issues

Ensure `oauth2RedirectUrl` matches your hosting:

```javascript
oauth2RedirectUrl: window.location.origin + "/oauth2-redirect.html";
```

### Spec Not Loading

Check browser console for errors:

```javascript
// Verify spec URL is correct
url: '../api/openapi.yaml',  // Relative path
// or
url: 'https://api.example.com/openapi.yaml',  // Absolute URL
```

## Security Considerations

1. **Don't Expose on Production**: Swagger UI should be behind authentication on production
2. **Rate Limiting**: Apply rate limits to documentation endpoints
3. **Token Security**: Tokens are stored in localStorage - clear on logout
4. **HTTPS Only**: Always use HTTPS in production
5. **API Keys**: Never hardcode API keys in the HTML

## Integration with CI/CD

### GitHub Actions

```yaml
name: Deploy API Docs

on:
  push:
    branches: [main]
    paths:
      - "docs/api/openapi.yaml"
      - "docs/swagger-ui/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate OpenAPI Spec
        run: npx swagger-cli validate docs/api/openapi.yaml

      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: docs/swagger-ui
```

## Additional Resources

- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Spectral Linter](https://stoplight.io/open-source/spectral)
- [API Documentation Guide](../api/)
