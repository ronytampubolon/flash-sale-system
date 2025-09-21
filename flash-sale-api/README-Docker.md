# Flash Sale API - Docker Setup Guide

This guide explains how to run the Flash Sale API using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f flash-sale-app
   ```

4. **Stop all services:**
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker Run (Single Container)

If you want to run just the application container with external services:

```bash
docker build -t flash-sale-api .

docker run -d --name flash-sale-app \
  -p 3000:3000 \
  -e "FLASH_STATUS=true" \
  -e "FLASH_START=09/20/2025 00:00:00" \
  -e "FLASH_END=09/20/2025 23:59:00" \
  -e "FLASH_STOCK=1000" \
  -e "MONGO_URI=mongodb://your-mongo-host:27017/flash-sale" \
  -e "REDIS_URL=redis://your-redis-host:6379" \
  -e "RABBITMQ_URL=amqp://user:pass@your-rabbitmq-host:5672" \
  flash-sale-api
```

## Services Included

The Docker Compose setup includes:

- **flash-sale-app**: Main Express.js application (Port 3000)
- **mongodb**: MongoDB database (Port 27017)
- **redis**: Redis cache with password authentication (Port 6379)
- **rabbitmq**: RabbitMQ message broker with management UI (Ports 5672, 15672)

## Environment Variables

### Required Variables:
- `FLASH_STATUS`: Enable/disable flash sale (true/false)
- `FLASH_START`: Flash sale start time (MM/DD/YYYY HH:mm:ss)
- `FLASH_END`: Flash sale end time (MM/DD/YYYY HH:mm:ss)
- `FLASH_STOCK`: Available stock quantity

### Optional Variables:
- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `JWT_SECRET`: JWT signing secret
- `MONGO_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection URL
- `RABBITMQ_URL`: RabbitMQ connection URL

## Development Mode

To run in development mode with hot reload:

```bash
docker-compose --profile dev up -d flash-sale-app-dev
```

This will:
- Mount your source code as a volume
- Enable hot reload with `tsx watch`
- Run on port 3001 to avoid conflicts

## Health Checks

All services include health checks:
- **Application**: HTTP GET to `/health` endpoint
- **MongoDB**: Database ping command
- **Redis**: Redis ping with authentication
- **RabbitMQ**: RabbitMQ diagnostics ping

## Accessing Services

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **RabbitMQ Management**: http://localhost:15672 (sysadmin/s3cur3)
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379 (password: flashredis)

## Data Persistence

Docker volumes are used for data persistence:
- `mongodb_data`: MongoDB data
- `redis_data`: Redis data
- `rabbitmq_data`: RabbitMQ data

## Troubleshooting

### Check service logs:
```bash
docker-compose logs [service-name]
```

### Restart a specific service:
```bash
docker-compose restart [service-name]
```

### Rebuild and restart:
```bash
docker-compose up --build -d
```

### Clean up everything:
```bash
docker-compose down -v --remove-orphans
docker system prune -f
```

## Production Deployment

For production deployment:

1. Update environment variables in `docker-compose.yml`
2. Use proper secrets management
3. Configure reverse proxy (nginx/traefik)
4. Set up monitoring and logging
5. Configure backup strategies for data volumes

## API Endpoints

Once running, the API provides:
- `GET /health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/flash-sale/status` - Flash sale status
- `POST /api/orders/purchase` - Purchase endpoint
- `GET /api/orders/status/:userId` - Order status

## Testing

Run tests in the container:
```bash
docker-compose exec flash-sale-app npm test
```