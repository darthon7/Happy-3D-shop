# Plan de Implementación - Solución Errores CSP OCI

## Problemas Identificados

### 1. Imágenes bloqueadas (thenounproject.com)
- **Causa**: La CSP solo permite `res.cloudinary.com` y `*.stripe.com`
- **Solución**: Agregar `https://static.thenounproject.com` a `img-src`

### 2. Script de Google bloqueado (accounts.google.com)
- **Causa**: La CSP solo permite `js.stripe.com` en `script-src`
- **Solución**: Agregar `https://accounts.google.com` a `script-src`

### 3. Conexión a localhost bloqueada
- **Causa**: El frontend usa `localhost:8080` como fallback cuando no existe `VITE_API_URL`
- **Solución**: Establecer `VITE_API_URL=http://40.233.15.187:8080` en el build

---

## Archivos a Modificar

### 1. `frontend/nginx.conf` (línea 14)
Actualizar CSP para permitir:
- `img-src`: agregar `https://static.thenounproject.com`
- `script-src`: agregar `https://accounts.google.com`

### 2. Build del frontend
Ejecutar build con variable de entorno:
```bash
VITE_API_URL=http://40.233.15.187:8080 npm run build
```

---

## Pasos de Implementación

1. Modificar `nginx.conf` actualizando la línea de CSP
2. Rebuild del frontend con `VITE_API_URL` correcta
3. Redploy del contenedor en OCI

---

## Resultado Esperado

- Imágenes de iconos cargando correctamente
- Login con Google funcionando
- API comunicándose con el backend de producción
