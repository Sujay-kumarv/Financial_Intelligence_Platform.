# Financial Intelligence Platform -# Docker Deployment Guide | Sujay Kumar AI Studio

This guide explains how to deploy the Sujay AI Studio workspace using Docker for production-grade reliability.

## 📦 Container Overview
The platform 🚨 consists of two primary services:
1. **Backend**: FastAPI server handling LLM, financial engines, and database.
2. **Frontend**: Next.js analytical workspace with premium glassmorphism.

---

## 🚀 Quick Launch (Recommended)

1. **Environment Setup**: Ensure `GEMINI_API_KEY` is set in your system or the root `.env` file.
2. **Launch Orchestration**:
```powershell
docker-compose up -d --build
```
3. **Verify Status**:
```powershell
docker-compose ps
```

---

## 🛠️ Individual Service Build

### Backend
```powershell
cd backend
docker build -t sujay-ai-backend .
docker run -p 8000:8000 --env-file .env sujay-ai-backend
```

### Frontend
```powershell
cd frontend-next
docker build -t sujay-ai-frontend .
docker run -p 3000:3000 sujay-ai-frontend
```

---

## ⚙️ Configuration Notes
- **Persistence**: Database data is persisted in `./backend/data` (mapped in `docker-compose.yml`).
- **Uploads**: Document uploads are stored in `./backend/uploads`.
- **API URL**: The frontend is pre-configured to communicate with `http://localhost:8000/api/v1`.

---

**Production Tip**: For public deployment, ensure you wrap containers with an Nginx reverse proxy and SSL (Certbot).
docker-compose down -v

### Rebuild
```powershell
# Rebuild after code changes
docker-compose build

# Force rebuild (no cache)
docker-compose build --no-cache
```

### View Status
```powershell
# Check running containers
docker-compose ps

# View logs
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend
```

---

## What Docker Does

When you run `docker-compose up --build`:

1. ✅ Creates a Python 3.11 environment
2. ✅ Installs all dependencies automatically
3. ✅ Initializes the database
4. ✅ Starts the API server on port 8000
5. ✅ Sets up health checks
6. ✅ Enables hot-reload for development

**No manual setup required!**

---

## Advantages of Docker

### ✅ No Dependency Hell
- No need to install Python packages
- No conflicts with other projects
- Works the same on any machine

### ✅ One Command Setup
- `docker-compose up --build` - That's it!
- No pip, no virtual environments
- Fresh environment every time

### ✅ Production-Ready
- Same container works in development and production
- Easy to deploy to cloud (AWS, Azure, GCP)
- Scalable and portable

### ✅ Easy Cleanup
- `docker-compose down` removes everything
- No leftover files or packages
- Start fresh anytime

---

## Troubleshooting

### "Docker is not running"
**Solution:** Start Docker Desktop from Windows Start Menu

### "Port 8000 is already in use"
**Solution:** Stop other services or change port in `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Use port 8001 instead
```

### "Cannot connect to Docker daemon"
**Solution:** Make sure Docker Desktop is running and you have permissions

### View Container Logs
```powershell
docker-compose logs backend
```

---

## Development Workflow

### Make Code Changes
1. Edit files in `backend/` folder
2. Changes auto-reload (no restart needed)
3. Refresh browser to see updates

### Add New Dependencies
1. Add to `requirements.txt`
2. Rebuild: `docker-compose up --build`

### Fresh Start
```powershell
# Remove everything and start fresh
docker-compose down -v
docker-compose up --build
```

---

## Production Deployment

### Build Production Image
```powershell
docker build -t financial-intelligence-api:latest ./backend
```

### Run Production Container
```powershell
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL=your_production_db \
  -e GEMINI_API_KEY=your_api_key \
  --name financial-api \
  financial-intelligence-api:latest
```

### Push to Registry
```powershell
# Tag for Docker Hub
docker tag financial-intelligence-api:latest yourusername/financial-api:latest

# Push
docker push yourusername/financial-api:latest
```

---

## Comparison: Docker vs Manual Setup

| Task | Manual Setup | Docker |
|------|-------------|---------|
| Install Python | Required | Not needed |
| Install dependencies | `pip install -r requirements.txt` | Automatic |
| Initialize database | `python init_db.py` | Automatic |
| Start server | `python -m app.main` | `docker-compose up` |
| Fix dependency conflicts | Manual troubleshooting | Never happens |
| Deploy to production | Complex setup | Same container |
| Clean uninstall | Manual cleanup | `docker-compose down` |

---

## Next Steps

1. **Start Docker Desktop**
2. **Run**: `docker-compose up --build`
3. **Visit**: http://localhost:8000/api/docs
4. **Test the API!**

That's it! The entire platform runs in Docker with zero manual configuration.

---

**Need help?** Check the main [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md)
