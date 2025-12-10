# ADR 002: Authentication Mechanism

## Status

**Accepted** - 2025-01-15

## Context

The Enterprise API Platform requires a secure, scalable authentication mechanism that supports:

- Stateless authentication for horizontal scaling
- Short-lived access tokens for security
- Long-lived refresh tokens for user convenience
- Multi-factor authentication (MFA)
- Social login (OAuth providers)
- API key authentication for service accounts

## Decision

We will use **OAuth 2.0 + JWT (JSON Web Tokens)** with the following implementation:

1. **Access Tokens**:
   - JWT format with 1-hour expiration
   - Signed with RS256 (asymmetric encryption)
   - Contains user claims (id, email, role, permissions)
   - Stateless validation (no database lookup required)

2. **Refresh Tokens**:
   - Opaque tokens (32-byte random string)
   - 30-day expiration
   - Stored in Redis with user metadata
   - Single-use with rotation on refresh
   - Revocable via logout

3. **Token Flow**:

   ```
   Login → Access Token (1h) + Refresh Token (30d)
   Token Expires → Use Refresh Token → New Access Token + New Refresh Token
   Logout → Revoke Refresh Token
   ```

4. **MFA Support**:
   - TOTP (Time-based One-Time Password) using Google Authenticator
   - SMS fallback (Twilio)
   - Backup codes for account recovery

5. **OAuth 2.0 Integration**:
   - Authorization Code Flow for web apps
   - Social providers: Google, GitHub, Microsoft
   - Custom OAuth server for third-party integrations

## Alternatives Considered

### 1. Session-Based Authentication

**Pros:**

- Simple implementation
- Server has full control over sessions
- Easy to revoke individual sessions
- No token expiration handling needed

**Cons:**

- Requires session storage (database or Redis)
- Not stateless (complicates horizontal scaling)
- Database lookup on every request
- Sticky sessions needed for load balancing
- Doesn't scale well for microservices

**Decision**: Rejected due to scalability concerns for microservices architecture.

---

### 2. Opaque Access Tokens

**Pros:**

- Can be revoked immediately
- Smaller token size
- More secure (no data leakage if stolen)

**Cons:**

- Requires database lookup on every request
- Performance bottleneck
- Doesn't work offline
- Single point of failure (database)

**Example:**

```
Access Token: tok_a1b2c3d4e5f6
Database Lookup: SELECT * FROM tokens WHERE token = 'tok_a1b2c3d4e5f6'
```

**Decision**: Rejected due to performance concerns.

---

### 3. JWT with Symmetric Encryption (HS256)

**Pros:**

- Faster signing and verification
- Simpler key management

**Cons:**

- Same key used for signing and verification
- Key must be shared with all services
- Key rotation is complex
- Higher security risk if key is compromised

**Decision**: Rejected in favor of asymmetric encryption (RS256) for better security.

---

### 4. API Keys Only

**Pros:**

- Simple for machine-to-machine auth
- No expiration needed
- Easy to implement

**Cons:**

- No user context (can't identify individual users)
- No automatic expiration
- Hard to rotate
- Not suitable for user authentication
- No MFA support

**Decision**: Supported as secondary method for service accounts, not primary auth.

---

### 5. OAuth 2.0 with Opaque Tokens

**Pros:**

- Industry standard
- Revocable tokens
- Works with external providers

**Cons:**

- Requires token introspection endpoint
- Database lookup for every request
- Performance overhead
- Complex implementation

**Decision**: Rejected due to performance concerns, but OAuth 2.0 flow is supported.

## Implementation Details

### JWT Structure

**Header:**

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-2025-01"
}
```

**Payload:**

```json
{
  "sub": "usr_1a2b3c4d5e",
  "email": "user@example.com",
  "role": "admin",
  "orgId": "org_9z8y7x6w5v",
  "permissions": ["read:users", "write:users"],
  "iat": 1642416000,
  "exp": 1642419600,
  "iss": "api.example.com",
  "aud": "api.example.com"
}
```

**Signature:**

```
RS256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  privateKey
)
```

### Key Management

1. **RSA Key Pair**:
   - 2048-bit RSA keys
   - Private key: Used by authentication service to sign tokens
   - Public key: Distributed to all services for verification
   - Stored in AWS Secrets Manager / HashiCorp Vault

2. **Key Rotation**:
   - Rotate keys every 90 days
   - Maintain 2 keys during rotation (current + previous)
   - Use `kid` (key ID) in JWT header to identify key
   - Grace period: 7 days for clients to update

3. **Key Distribution**:
   - Public keys exposed via JWKS endpoint: `GET /.well-known/jwks.json`
   - Services cache public keys (TTL: 1 hour)
   - Automatic key refresh on signature validation failure

### Refresh Token Storage (Redis)

```redis
# Key: refresh:{tokenHash}
SET refresh:sha256(token) '{
  "userId": "usr_123",
  "deviceId": "dev_abc",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "createdAt": 1642416000,
  "lastUsed": 1642416000
}' EX 2592000  # 30 days
```

### Token Validation Middleware

```javascript
async function validateJWT(req, res, next) {
  // 1. Extract token from Authorization header
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // 2. Verify signature and expiration
    const publicKey = await getPublicKey(); // From cache or JWKS
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: "api.example.com",
      audience: "api.example.com",
    });

    // 3. Attach user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "TokenExpired",
        message: "Access token has expired",
      });
    }

    return res.status(401).json({
      error: "InvalidToken",
      message: "Invalid authentication token",
    });
  }
}
```

## Consequences

### Positive

1. **Scalability**:
   - Stateless authentication (no database lookup)
   - Horizontal scaling without sticky sessions
   - Works seamlessly with microservices

2. **Performance**:
   - Fast token validation (< 10ms)
   - No database roundtrip for every request
   - Can cache public keys

3. **Security**:
   - Short-lived access tokens (1 hour)
   - Refresh token rotation prevents replay attacks
   - Asymmetric encryption (private/public key)
   - Revocable refresh tokens

4. **Developer Experience**:
   - Industry standard (JWT is widely supported)
   - Self-contained tokens (no external lookups)
   - Easy to inspect and debug (base64 decode)

5. **Flexibility**:
   - Supports multiple auth flows (password, OAuth, MFA)
   - Works with web, mobile, and service accounts
   - Easy to add custom claims

### Negative

1. **Token Size**:
   - JWT tokens are larger (300-500 bytes)
   - Sent with every request (bandwidth overhead)
   - Base64 encoding increases size by ~33%

2. **Revocation Complexity**:
   - Cannot revoke access tokens immediately
   - Must wait for expiration (max 1 hour)
   - Requires blacklist for emergency revocation

3. **Key Management**:
   - Must securely store private keys
   - Key rotation adds complexity
   - JWKS endpoint required

4. **Token Refresh Logic**:
   - Clients must implement token refresh
   - Refresh token rotation can be complex
   - Race conditions possible with concurrent refreshes

### Mitigation Strategies

1. **Token Revocation**:
   - Short access token lifetime (1 hour)
   - Revoke refresh tokens immediately
   - Maintain token blacklist in Redis for emergency revocation

2. **Key Security**:
   - Store keys in secrets manager (AWS Secrets Manager)
   - Rotate keys every 90 days
   - Use hardware security modules (HSM) for production

3. **Token Size Optimization**:
   - Use short claim names (`sub` vs `subject`)
   - Compress tokens (gzip) if needed
   - Use HTTP/2 for header compression

4. **Client Libraries**:
   - Provide SDKs with automatic token refresh
   - Handle refresh logic transparently
   - Implement retry logic for expired tokens

## Security Considerations

### Token Storage (Client-Side)

**Web Apps:**

- ❌ **DON'T** store in `localStorage` (XSS vulnerable)
- ✅ **DO** store access tokens in memory only
- ✅ **DO** store refresh tokens in `httpOnly` cookies

**Mobile Apps:**

- ✅ **DO** use secure keychain (iOS) or keystore (Android)
- ✅ **DO** implement biometric authentication
- ✅ **DO** clear tokens on logout

**Server-to-Server:**

- ✅ **DO** use API keys or client credentials flow
- ✅ **DO** rotate keys regularly
- ✅ **DO** use environment variables (never hardcode)

### OWASP Recommendations

- [x] Use HTTPS/TLS for all token transmission
- [x] Implement rate limiting on auth endpoints
- [x] Use CSRF tokens for cookie-based refresh tokens
- [x] Validate `iss` (issuer) and `aud` (audience) claims
- [x] Implement account lockout after failed attempts
- [x] Log all authentication events for audit

## Implementation Plan

### Phase 1: Core Auth (Week 1-2)

- [x] Implement JWT generation and validation
- [x] Create RSA key pair and JWKS endpoint
- [x] Build login/logout endpoints
- [x] Implement refresh token flow

### Phase 2: MFA (Week 3)

- [ ] Add TOTP support (Google Authenticator)
- [ ] Implement SMS fallback (Twilio)
- [ ] Generate backup codes
- [ ] Build MFA setup and verification flows

### Phase 3: OAuth Integration (Week 4)

- [ ] Implement OAuth 2.0 authorization server
- [ ] Integrate Google OAuth
- [ ] Integrate GitHub OAuth
- [ ] Build OAuth consent screen

### Phase 4: Security Hardening (Week 5)

- [ ] Implement rate limiting (5 login attempts per 15 min)
- [ ] Add account lockout mechanism
- [ ] Create audit logging
- [ ] Security penetration testing

## Compliance

This decision aligns with:

- **OAuth 2.0 RFC 6749**: Authorization framework
- **JWT RFC 7519**: JSON Web Token standard
- **OIDC**: OpenID Connect for user authentication
- **OWASP Top 10**: Security best practices
- **GDPR**: Right to deletion (token revocation)
- **SOC 2**: Access control requirements

## References

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Authentication Guide](../api/authentication.md)

## Review Schedule

This decision should be reviewed:

- After security audit findings
- If new authentication standards emerge
- Next scheduled review: 2025-07-15
