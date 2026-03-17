# Etapa 1: Construcción (Node.js)
FROM node:20-alpine as build

# Crea el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración de NPM
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm ci

# Copia el resto del código fuente del frontend
COPY . .

# Inyecta variables de entorno para producción
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Construye la versión optimizada de React
RUN npm run build

# Etapa 2: Servidor (Nginx)
FROM nginx:alpine

# Limpia los archivos estáticos por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia tu propia configuración de Nginx (para react router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia los archivos estáticos de React generados en la Etapa 1
COPY --from=build /app/dist /usr/share/nginx/html

# Expone el puerto 80 (HTTP)
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
