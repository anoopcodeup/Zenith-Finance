## Auth hardening (later)

- Move refresh token to HttpOnly cookie
- Read refresh token from req.cookies
- Set SameSite=Lax or Strict
- Add CSRF protection for refresh/logout
- Keep access token in JSON response
