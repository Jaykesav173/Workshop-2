# Environment Setup Guide

## Backend Environment Variables

1. Copy `example.env` to `backend/app/.env`
2. Fill in the following required variables:

### Required Variables

- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_KEY**: Your Supabase anon/public key
- **SECRET_KEY**: A strong random secret key for JWT token signing (generate using: `openssl rand -hex 32`)

### Optional Variables

- **ALGORITHM**: JWT algorithm (default: HS256)
- **ACCESS_TOKEN_EXPIRE_MINUTES**: Token expiration time (default: 30)
- **SMTP_*****: Email configuration for notifications

## Frontend Environment Variables

1. Create `frontend/.env` file
2. Add the following:

```
VITE_API_URL=http://localhost:8000
```

## Security Notes

- Never commit `.env` files to version control
- Use strong, random values for SECRET_KEY
- Keep your Supabase keys secure
- In production, use environment-specific configuration

