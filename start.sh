#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Invoice Management App - Full Startup${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if Docker is running
echo -e "${YELLOW}[1/5] Checking Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker not available${NC}"
    exit 1
fi

# Start Database
echo -e "${YELLOW}[2/5] Starting PostgreSQL Database...${NC}"
docker-compose -f /workspaces/test/docker-compose.yml up -d > /dev/null 2>&1
sleep 3
echo -e "${GREEN}✓ Database started${NC}"

# Seed Database
echo -e "${YELLOW}[3/5] Seeding Database...${NC}"
cd /workspaces/test/server
npm install > /dev/null 2>&1
npx prisma migrate deploy > /dev/null 2>&1
node prisma/seed.js > /dev/null 2>&1
echo -e "${GREEN}✓ Database seeded${NC}"

# Install backend dependencies
echo -e "${YELLOW}[4/5] Starting Backend Server...${NC}"
cd /workspaces/test/server
npm install > /dev/null 2>&1

# Start backend in a new terminal
nohup npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3
echo -e "${GREEN}✓ Backend running on http://localhost:5000${NC}"

# Install frontend dependencies and start
echo -e "${YELLOW}[5/5] Starting Frontend Server...${NC}"
cd /workspaces/test/client
npm install > /dev/null 2>&1

# Start frontend in a new terminal
nohup npm run dev -- --port 3001 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3
echo -e "${GREEN}✓ Frontend running on http://localhost:3001${NC}"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All Services Started Successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}Access the Application:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:3001${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:5000${NC}"
echo ""
echo -e "${BLUE}Demo Credentials:${NC}"
echo -e "  Email:    ${GREEN}demo@example.com${NC}"
echo -e "  Password: ${GREEN}password123${NC}"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend:  tail -f /tmp/backend.log"
echo -e "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo -e "${YELLOW}To stop services: pkill -f 'npm run dev'${NC}"
node prisma/seed.js
echo -e "${GREEN}✓ Database seeded${NC}"

# Install dependencies and start Backend
echo -e "${YELLOW}[4/5] Starting Backend Server (port 5000)...${NC}"
cd /workspaces/test/server
npm run dev &
BACKEND_PID=$!
sleep 3
echo -e "${GREEN}✓ Backend running (PID: $BACKEND_PID)${NC}"

# Install dependencies and start Frontend
echo -e "${YELLOW}[5/5] Starting Frontend Server (port 3001)...${NC}"
cd /workspaces/test/client
npm install > /dev/null 2>&1
npm run dev -- --port 3001 &
FRONTEND_PID=$!
sleep 3
echo -e "${GREEN}✓ Frontend running (PID: $FRONTEND_PID)${NC}"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All Services Started Successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}Access the Application:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:3001${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:5000${NC}"
echo -e "  Database:  ${GREEN}postgresql://invoiceuser:invoicepass@localhost:5432/invoice_db${NC}"
echo ""
echo -e "${BLUE}Demo Credentials:${NC}"
echo -e "  Email:    ${GREEN}demo@example.com${NC}"
echo -e "  Password: ${GREEN}password123${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
