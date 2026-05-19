# Deployment

## Local Development

Backend:

```bash
cd dms-backend
npm install
npm run start:dev
```

Frontend:

```bash
cd dms-frontend
npm install
npm run dev
```

URLs:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
Swagger:  http://localhost:5000/api-docs
Health:   http://localhost:5000/health
```

## Environment Variables

### Backend `.env`

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://...
MONGODB_SERVER_SELECTION_TIMEOUT_MS=60000
MONGODB_RETRY_ATTEMPTS=3

JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d
AUTH_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_WINDOW_MS=60000

CORS_ORIGIN=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Demo Data

Seed demo data:

```bash
cd dms-backend
npm run seed:demo
```

Demo accounts:

```text
Admin:  admin@dms.local  / Admin@123456
Seller: seller@dms.local / Seller@123456
```

## Production Build

Backend:

```bash
cd dms-backend
npm run build
npm run start:prod
```

Frontend:

```bash
cd dms-frontend
npm run build
npm run start
```

## Docker with MongoDB Atlas

Docker is optional. The compose file uses MongoDB Atlas through `MONGODB_URI`; it does not start a local MongoDB container.

From `DMS_Project`:

```bash
copy .env.docker.example .env
```

Update `.env`:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace-with-a-strong-secret
NEXT_PUBLIC_API_URL=http://localhost:5000
CORS_ORIGIN=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
AUTH_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_WINDOW_MS=60000
```

Run:

```bash
docker compose up --build
```

Seed demo:

```bash
docker compose exec backend npm run seed:demo
```

## Windows Docker Notes

Docker Desktop on Windows requires:

- CPU virtualization enabled in BIOS/UEFI.
- Windows Subsystem for Linux.
- Virtual Machine Platform.
- WSL2 default version.

Run these in PowerShell as Administrator:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
dism.exe /online /enable-feature /featurename:HypervisorPlatform /all /norestart
```

Restart Windows, then:

```powershell
wsl --install
wsl --set-default-version 2
```

## Operational Checks

Health check:

```bash
curl http://localhost:5000/health
```

Expected:

```json
{
  "status": "ok",
  "service": "dms-backend",
  "database": {
    "status": "connected"
  }
}
```

Swagger:

```text
http://localhost:5000/api-docs
```

## Production Checklist

- Use a strong `JWT_SECRET`.
- Restrict `CORS_ORIGIN` to the production frontend domain.
- Use MongoDB Atlas production cluster.
- Enable database backup.
- Configure Cloudinary production credentials.
- Run backend behind HTTPS reverse proxy.
- Monitor `/health`.
- Run tests before deployment:

```bash
cd dms-backend
npm run test
npm run test:e2e
npm run build

cd ../dms-frontend
npm run lint
npm run build
```
