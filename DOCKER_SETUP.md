# Docker Setup

DMS dùng Docker Desktop để chạy frontend và backend trong container. Database dùng MongoDB Atlas qua `MONGODB_URI`, không chạy MongoDB local container.

## Cài Docker Desktop trên Windows

Nếu chưa có Docker:

```powershell
winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
```

Docker Desktop cần WSL2. Mở PowerShell bằng quyền Administrator và chạy:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

Restart Windows, sau đó chạy:

```powershell
wsl --install
wsl --set-default-version 2
```

Mở Docker Desktop một lần để engine khởi động.

## Chạy DMS bằng Docker Compose

Từ thư mục gốc `DMS_Project`:

```powershell
copy .env.docker.example .env
```

Cập nhật `.env` bằng MongoDB Atlas URI và JWT secret thật:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace-with-a-strong-secret
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Chạy:

```powershell
docker compose up --build
```

Kiểm tra:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
Swagger:  http://localhost:5000/api-docs
Health:   http://localhost:5000/health
```

Seed dữ liệu demo:

```powershell
docker compose exec backend npm run seed:demo
```
