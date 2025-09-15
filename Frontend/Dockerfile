# Frontend/Dockerfile
FROM node:18 as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build  # สร้างไฟล์ dist

# ไม่ต้องใช้ nginx ใน frontend container
# nginx container ตัวเดียว serve static + proxy API
