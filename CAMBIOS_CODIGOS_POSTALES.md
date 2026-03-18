# Corrección: Carga de Códigos Postales en Producción

## Problema

`PostalCodeLoader` buscaba el archivo `Codigo Postal.txt` en rutas del filesystem local hardcodeadas:

```java
String[] possiblePaths = {
    "../Codigo Postal.txt",
    "Codigo Postal.txt",
    "c:\\Users\\Visio\\OneDrive\\Desktop\\DazeHaze\\Codigo Postal.txt"
};
```

En producción (OCI, Vercel, Render) esas rutas no existen, por lo que la importación de 157,561 códigos postales nunca se ejecutaba.

## Solución

El archivo se copió dentro del classpath del proyecto y el loader fue actualizado para priorizar la carga desde el JAR.

## Cambios realizados

| Archivo | Cambio |
|---|---|
| `src/main/resources/data/codigos-postales-mexico.txt` | Nuevo archivo (15MB) — incluido dentro del JAR |
| `src/main/java/com/dazehaze/service/PostalCodeService.java` | Refactorizado: 3 métodos (`importData`, `importData(path, fromClasspath)`, `doImport`) — soporta carga via `InputStream` desde classpath |
| `src/main/java/com/dazehaze/loader/PostalCodeLoader.java` | Reescrito: intenta classpath primero, fallback a filesystem |

## Flujo de ejecución

```
1. count() > 100000?  → Skip (ya importado)
2. Busca data/codigos-postales-mexico.txt en classpath
3. Si existe → copia a archivo temporal → importa → elimina temp
4. Si no existe → fallback a rutas filesystem locales (desarrollo)
```

## Resultado esperado

| Entorno | Comportamiento |
|---|---|
| **Desarrollo local** | Funciona igual — usa filesystem o classpath |
| **Producción (OCI, Render, Vercel)** | Archivo dentro del JAR → se importa automáticamente en primera ejecución |
| **Ejecuciones siguientes** | Detecta 157,561 registros → salta importación |

## Deployment checklist

- [x] El archivo `codigos-postales-mexico.txt` viaja dentro del JAR
- [ ] Regenerar JAR y subir a producción
- [ ] En primera ejecución en producción, la importación se ejecutará automáticamente
