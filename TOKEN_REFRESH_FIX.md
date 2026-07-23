# Token Refresh Fix

## Problem
The refresh token API was not being called, causing users to be logged out after 15 minutes (access token expiry).

## Root Cause
The frontend was sending the refresh token in the **request body**, but the backend expected it in the **Authorization header**.

---

## Backend Implementation

### Refresh Token Strategy (`refreshToken.strategy.ts`)
```typescript
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
```
This extracts the JWT from the `Authorization: Bearer <token>` header.

### Refresh Endpoint (`auth.controller.ts`)
```typescript
@UseGuards(RefreshTokenGuard)
@Post('refresh')
async refresh(@Req() req) {
  const userid = req.user['sub'];
  const refreshToken = req.user['refreshToken'];
  return this.authService.refreshTokens(userid, refreshToken);
}
```
The guard validates the refresh token from the header and adds it to `req.user`.

---

## Frontend Fix

### Before (Incorrect):
```typescript
const response = await axios.post(`${API_URL}/auth/refresh`, {
  refresh_token: refreshToken, // ❌ Sent in body
});
```

### After (Correct):
```typescript
const response = await axios.post(
  `${API_URL}/auth/refresh`,
  {}, // Empty body
  {
    headers: {
      Authorization: `Bearer ${refreshToken}`, // ✅ Sent in header
    },
  }
);
```

---

## Additional Fixes

### Google OAuth Callback
Updated to return both tokens:

**Backend (`auth.service.ts`):**
```typescript
async googleLogin(user: any) {
  const access_token = this.jwtService.sign(payload);
  const refresh_token = this.jwtService.sign(payload, {
    secret: process.env.REFRESH_TOKEN,
    expiresIn: '1d',
  });

  await this.userService.updateRefreshToken(user.id, refresh_token);

  return {
    access_token,
    refresh_token, // ✅ Now returns refresh token
    user: { ... }
  };
}
```

**Backend (`auth.controller.ts`):**
```typescript
res.redirect(
  `http://localhost:5173/auth/callback?token=${result.access_token}&refresh_token=${result.refresh_token}`
);
```

---

## How Token Refresh Works Now

### Flow:
1. **User makes API request** with expired access token
2. **Backend returns 401** Unauthorized
3. **Axios interceptor catches 401**
4. **Checks for refresh token** in localStorage
5. **Calls `/auth/refresh`** with refresh token in Authorization header
6. **Backend validates** refresh token using RefreshTokenGuard
7. **Backend returns** new access_token + new refresh_token
8. **Frontend stores** new tokens in localStorage
9. **Retries original request** with new access token
10. **Success!** User stays logged in

### Token Lifecycle:
```
Login
  ↓
Store: access_token (15m) + refresh_token (1d)
  ↓
After 15 minutes...
  ↓
API call fails (401)
  ↓
Auto-refresh tokens
  ↓
Store: NEW access_token (15m) + NEW refresh_token (1d)
  ↓
Continue working...
  ↓
After 1 day (if no activity)...
  ↓
Refresh token expired → Logout
```

---

## Testing

### Test Scenario 1: Access Token Expiry
1. Login
2. Wait 15+ minutes (or manually expire token)
3. Make any API call
4. **Expected:** Token auto-refreshes, request succeeds
5. **Check console:** Should see "Attempting to refresh access token..." and "Token refreshed successfully"

### Test Scenario 2: Refresh Token Expiry
1. Login
2. Wait 1+ day (or manually expire refresh token)
3. Make any API call
4. **Expected:** User logged out and redirected to login
5. **Check console:** Should see "Token refresh failed - logging out"

### Test Scenario 3: Multiple Simultaneous Requests
1. Login
2. Wait 15+ minutes
3. Make multiple API calls at once
4. **Expected:** Only one refresh call, all requests succeed
5. **Check console:** Should see request queuing in action

---

## Verification Checklist

✅ Refresh token sent in Authorization header (not body)
✅ Google OAuth returns both tokens
✅ Frontend stores both tokens in localStorage
✅ Axios interceptor calls refresh endpoint on 401
✅ New tokens stored after successful refresh
✅ Original request retried with new token
✅ User logged out if refresh fails

---

## Console Logs to Monitor

When token refresh happens, you should see:
```
API Error: 401 {...}
Attempting to refresh access token...
Token refreshed successfully
```

When refresh fails:
```
API Error: 401 {...}
Attempting to refresh access token...
Token refresh failed - logging out
```

---

## Summary

The token refresh now works correctly! Users will stay logged in as long as they're active within the 1-day refresh token window. The access token automatically refreshes every 15 minutes without user intervention.
