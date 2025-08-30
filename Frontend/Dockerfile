FROM node:18 as builder

WORKDIR /app

COPY Frontend/package.json Frontend/package-lock.json ./

RUN npm install

COPY Frontend/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]