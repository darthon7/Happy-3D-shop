# Plan de Revisión de Seguridad para Tienda Web
## React + Spring Boot

---

## 1. SEGURIDAD DEL FRONTEND (React)

### 1.1 Cross-Site Scripting (XSS)
**Vulnerabilidad:** Inyección de código JavaScript malicioso en la aplicación.

**Puntos a revisar:**
- Uso de `dangerouslySetInnerHTML` sin sanitización
- Renderizado de contenido HTML desde APIs sin validación
- Manipulación directa del DOM sin escape

**Soluciones:**
- Usar DOMPurify para sanitizar contenido HTML antes de renderizar
- Evitar `dangerouslySetInnerHTML` o usarlo solo con contenido sanitizado
- Implementar Content Security Policy (CSP) headers
- Validar y escapar datos del usuario antes de mostrarlos

### 1.2 Dependencias Vulnerables
**Vulnerabilidad:** Librerías de NPM con vulnerabilidades conocidas.

**Puntos a revisar:**
- Ejecutar `npm audit` para identificar vulnerabilidades
- Revisar dependencias desactualizadas

**Soluciones:**
- Actualizar dependencias regularmente: `npm update`
- Usar `npm audit fix` para reparaciones automáticas
- Implementar Dependabot o Snyk para monitoreo continuo
- Revisar manualmente actualizaciones críticas

### 1.3 Exposición de Información Sensible
**Vulnerabilidad:** Claves API, tokens y secretos en el código frontend.

**Puntos a revisar:**
- Variables de entorno expuestas en el bundle
- Claves API hardcodeadas
- Tokens de acceso en localStorage sin cifrado

**Soluciones:**
- Nunca almacenar secretos en el código frontend
- Usar variables de entorno solo para configuración pública
- Implementar Backend-for-Frontend (BFF) para manejo de secretos
- Rotar claves API periódicamente

### 1.4 Almacenamiento Inseguro
**Vulnerabilidad:** Datos sensibles en localStorage/sessionStorage sin protección.

**Puntos a revisar:**
- Tokens JWT en localStorage (vulnerable a XSS)
- Información personal sin cifrar
- Datos de sesión expuestos

**Soluciones:**
- Usar httpOnly cookies para tokens de autenticación
- Implementar cookies con flags Secure y SameSite
- Cifrar datos sensibles antes de almacenar localmente
- Limpiar storage al cerrar sesión

### 1.5 Inyección de Dependencias Maliciosas
**Vulnerabilidad:** Supply chain attacks a través de paquetes NPM.

**Puntos a revisar:**
- Paquetes con pocos mantenedores o desactualizados
- Typosquatting en nombres de paquetes

**Soluciones:**
- Verificar integridad con `package-lock.json`
- Revisar manualmente paquetes críticos
- Usar herramientas como Socket.dev
- Implementar checksum verification

---

## 2. SEGURIDAD DEL BACKEND (Spring Boot)

### 2.1 SQL Injection
**Vulnerabilidad:** Inyección de código SQL malicioso en queries.

**Puntos a revisar:**
- Uso de consultas SQL concatenadas manualmente
- Falta de prepared statements
- Queries dinámicas sin validación

**Soluciones:**
- Usar JPA/Hibernate con named parameters
- Implementar PreparedStatement para SQL nativo
- Validar y sanitizar todos los inputs
- Usar @Query con SpEL de forma segura

```java
@Query("SELECT u FROM User u WHERE u.email = :email")
User findByEmail(@Param("email") String email);
```

### 2.2 Broken Authentication
**Vulnerabilidad:** Gestión inadecuada de autenticación y sesiones.

**Puntos a revisar:**
- Contraseñas sin hash o con algoritmos débiles
- Tokens sin expiración
- Ausencia de rate limiting en login
- Falta de autenticación multifactor (MFA)

**Soluciones:**
- Usar BCrypt o Argon2 para hashear contraseñas
- Implementar JWT con expiración corta (15-30 min)
- Usar refresh tokens seguros
- Configurar Spring Security correctamente
- Implementar bloqueo de cuenta tras intentos fallidos
- Añadir MFA con TOTP (Google Authenticator)

```java
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
```

### 2.3 Broken Access Control
**Vulnerabilidad:** Usuarios accediendo a recursos sin autorización.

**Puntos a revisar:**
- Falta de validación de permisos a nivel de método
- IDOR (Insecure Direct Object Reference)
- Exposición de endpoints administrativos
- Falta de segregación de roles

**Soluciones:**
- Implementar Spring Security con roles y permisos
- Validar ownership de recursos antes de retornarlos
- Usar DTOs para evitar exposición de datos internos
- Implementar filtros de autorización a nivel de datos

```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("@securityService.canAccessOrder(#orderId)")
```

### 2.4 Security Misconfiguration
**Vulnerabilidad:** Configuraciones inseguras por defecto.

**Puntos a revisar:**
- CORS configurado con `allowedOrigins("*")`
- Actuator endpoints expuestos sin autenticación
- Stack traces en producción
- Información de versión expuesta
- Debug mode activado

**Soluciones:**
- Configurar CORS restrictivamente:

```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins("https://tudominio.com")
        .allowedMethods("GET", "POST", "PUT", "DELETE")
        .allowCredentials(true);
}
```

- Proteger Actuator endpoints:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when-authorized
```

- Configurar manejo de errores personalizado sin stack traces
- Deshabilitar banner de Spring Boot en producción

### 2.5 XML External Entities (XXE)
**Vulnerabilidad:** Procesamiento inseguro de XML.

**Puntos a revisar:**
- Parsers XML sin deshabilitar entidades externas
- Procesamiento de XML de fuentes no confiables

**Soluciones:**
- Deshabilitar DTD y entidades externas:

```java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
```

- Usar librerías seguras de procesamiento XML
- Validar estructura XML con schemas

### 2.6 Deserialization Vulnerabilities
**Vulnerabilidad:** Ejecución de código mediante deserialización de objetos maliciosos.

**Puntos a revisar:**
- Deserialización de objetos Java sin validación
- Uso de librerías vulnerables (Jackson, XStream)

**Soluciones:**
- Configurar Jackson de forma segura:

```java
objectMapper.enableDefaultTyping(ObjectMapper.DefaultTyping.NON_FINAL, 
    JsonTypeInfo.As.PROPERTY);
```

- Validar tipos esperados antes de deserializar
- Usar whitelisting de clases permitidas
- Actualizar Jackson a versiones recientes

### 2.7 Mass Assignment
**Vulnerabilidad:** Modificación de campos no autorizados vía binding automático.

**Puntos a revisar:**
- Binding directo de request a entidades JPA
- Falta de DTOs para inputs
- Campos sensibles expuestos en APIs

**Soluciones:**
- Usar DTOs separados para requests:

```java
public class UserCreateDTO {
    private String username;
    private String email;
    // NO incluir campos como 'role', 'isAdmin', etc.
}
```

- Implementar MapStruct o ModelMapper con configuración estricta
- Usar `@JsonIgnore` en campos sensibles

### 2.8 Server-Side Request Forgery (SSRF)
**Vulnerabilidad:** Servidor hace requests a URLs controladas por atacante.

**Puntos a revisar:**
- Descarga de imágenes desde URLs de usuario
- Webhooks sin validación
- Importación de datos desde URLs externas

**Soluciones:**
- Validar y sanitizar todas las URLs
- Implementar whitelist de dominios permitidos
- Usar DNS rebinding protection
- Bloquear IPs privadas (127.0.0.1, 192.168.x.x, etc.)

### 2.9 Logging Inseguro
**Vulnerabilidad:** Exposición de información sensible en logs.

**Puntos a revisar:**
- Contraseñas, tokens en logs
- Información personal (PII) sin redactar
- Logs accesibles sin autenticación

**Soluciones:**
- Sanitizar datos sensibles antes de loggear
- Usar máscaras para PII

```java
log.info("User login attempt: {}", email.replaceAll("(?<=.{2}).(?=.*@)", "*"));
```

- Implementar log rotation y retention policies
- Centralizar logs con ELK o similar

---

## 3. SEGURIDAD DE COMUNICACIONES

### 3.1 Man-in-the-Middle (MITM)
**Vulnerabilidad:** Interceptación de comunicaciones.

**Puntos a revisar:**
- Falta de HTTPS en producción
- Certificados SSL auto-firmados o vencidos
- Mixed content (HTTP en página HTTPS)

**Soluciones:**
- Forzar HTTPS con HSTS headers:

```java
response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
```

- Usar certificados válidos (Let's Encrypt)
- Configurar redirect automático HTTP → HTTPS
- Implementar certificate pinning en apps móviles

### 3.2 API Security
**Vulnerabilidad:** Endpoints API sin protección adecuada.

**Puntos a revisar:**
- Rate limiting ausente
- Falta de API versioning
- Exposición de datos sensibles en responses
- Validación insuficiente de inputs

**Soluciones:**
- Implementar rate limiting con Bucket4j:

```java
@RateLimiter(name = "api")
public Response getResource() { }
```

- Validar todos los inputs con Bean Validation:

```java
@Valid @RequestBody UserDTO user
```

- Usar DTOs con campos específicos para responses
- Implementar API Gateway (Spring Cloud Gateway)

---

## 4. SEGURIDAD DE DATOS

### 4.1 Sensitive Data Exposure
**Vulnerabilidad:** Exposición de datos sensibles sin cifrado.

**Puntos a revisar:**
- Contraseñas en base de datos sin hash
- Números de tarjeta sin cifrar
- Datos personales sin protección
- Backups sin cifrado

**Soluciones:**
- Cifrar datos sensibles en reposo con AES-256
- Usar Spring Cloud Vault para secretos
- Implementar cifrado a nivel de columna en DB

```java
@Convert(converter = CreditCardAttributeConverter.class)
private String creditCard;
```

- Cifrar backups automáticamente

### 4.2 SQL Injection en JPA
**Vulnerabilidad:** Queries JPQL/HQL dinámicas inseguras.

**Puntos a revisar:**
- Concatenación de strings en JPQL
- Native queries con parámetros concatenados

**Soluciones:**
- Usar named parameters siempre
- Evitar construcción dinámica de queries
- Usar Criteria API para queries complejas

---

## 5. SEGURIDAD DE PAGOS

### 5.1 PCI DSS Compliance
**Vulnerabilidad:** Manejo inadecuado de datos de tarjetas.

**Puntos a revisar:**
- Almacenamiento de números de tarjeta completos
- CVV almacenado en base de datos
- Procesamiento de pagos sin tokenización

**Soluciones:**
- Usar servicios de pago (Stripe, PayPal) con tokenización
- Nunca almacenar CVV
- Implementar 3D Secure
- Usar PCI-compliant payment gateway
- Tokenizar datos de tarjetas inmediatamente

### 5.2 Transaction Security
**Vulnerabilidad:** Modificación de montos o datos de transacciones.

**Puntos a revisar:**
- Cálculo de totales en frontend
- Falta de validación de integridad
- Ausencia de firma digital

**Soluciones:**
- Calcular totales siempre en backend
- Validar cada paso de la transacción
- Implementar HMAC para verificar integridad
- Usar idempotency keys para prevenir duplicados

---

## 6. SEGURIDAD DE SESIONES

### 6.1 Session Hijacking
**Vulnerabilidad:** Robo de sesiones activas.

**Puntos a revisar:**
- Session IDs predecibles
- Falta de regeneración tras login
- Cookies sin HttpOnly y Secure flags

**Soluciones:**
- Configurar Spring Security con:

```java
http.sessionManagement()
    .sessionFixation().migrateSession()
    .maximumSessions(1)
    .expiredUrl("/login?expired");
```

- Usar cookies con flags apropiados
- Implementar logout en todos los dispositivos

### 6.2 CSRF (Cross-Site Request Forgery)
**Vulnerabilidad:** Ejecución de acciones no autorizadas en nombre del usuario.

**Puntos a revisar:**
- Falta de tokens CSRF
- Endpoints críticos sin protección CSRF
- SameSite cookies no configuradas

**Soluciones:**
- Habilitar CSRF protection en Spring Security (por defecto)
- Incluir CSRF token en formularios y headers

```java
http.csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
```

- Configurar cookies SameSite=Strict o Lax

---

## 7. SEGURIDAD DE INFRAESTRUCTURA

### 7.1 Container Security
**Vulnerabilidad:** Contenedores Docker con vulnerabilidades.

**Puntos a revisar:**
- Imágenes base desactualizadas
- Contenedores corriendo como root
- Secretos en Dockerfiles

**Soluciones:**
- Usar imágenes oficiales y actualizadas
- Crear usuario no-root en Dockerfile:

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

- Usar Docker secrets o variables de entorno
- Escanear imágenes con Trivy o Snyk

### 7.2 Database Security
**Vulnerabilidad:** Acceso no autorizado a la base de datos.

**Puntos a revisar:**
- Credenciales por defecto
- Base de datos expuesta públicamente
- Falta de cifrado en conexiones

**Soluciones:**
- Usar contraseñas robustas y rotarlas
- Restringir acceso por IP/VPC
- Habilitar SSL/TLS para conexiones:

```yaml
spring.datasource.url=jdbc:postgresql://host:5432/db?sslmode=require
```

- Implementar least privilege para usuarios de DB

---

## 8. MONITOREO Y RESPUESTA

### 8.1 Logging y Auditoría
**Puntos a implementar:**
- Loggear todos los accesos a recursos sensibles
- Implementar audit trail para cambios críticos
- Monitorear intentos de acceso fallidos
- Alertas en tiempo real para actividades sospechosas

**Soluciones:**
- Usar Spring AOP para audit logging
- Implementar Spring Data Envers para auditoría de entidades
- Integrar con SIEM (Security Information and Event Management)

### 8.2 Security Headers
**Vulnerabilidad:** Falta de headers de seguridad.

**Soluciones implementar:**

```java
http.headers()
    .contentSecurityPolicy("default-src 'self'")
    .and()
    .referrerPolicy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
    .and()
    .permissionsPolicy(permissions -> permissions.policy("geolocation=()"))
    .and()
    .frameOptions().deny()
    .and()
    .xssProtection().block(true);
```

---

## 9. CHECKLIST DE VERIFICACIÓN

### Pre-Deployment:
- [ ] Ejecutar OWASP ZAP o Burp Suite para penetration testing
- [ ] Revisar código con SonarQube
- [ ] Escanear dependencias (npm audit, OWASP Dependency Check)
- [ ] Verificar configuraciones de producción
- [ ] Revisar secrets y variables de entorno
- [ ] Testear rate limiting y throttling
- [ ] Validar certificados SSL
- [ ] Backup y disaster recovery plan

### Post-Deployment:
- [ ] Monitoreo de logs activo
- [ ] Alertas configuradas
- [ ] WAF (Web Application Firewall) activo
- [ ] DDoS protection habilitado
- [ ] Plan de respuesta a incidentes documentado

---

## 10. HERRAMIENTAS RECOMENDADAS

### Análisis Estático (SAST)
- SonarQube
- Checkmarx
- Semgrep

### Análisis Dinámico (DAST)
- OWASP ZAP
- Burp Suite Professional
- Acunetix

### Escaneo de Dependencias
- Snyk
- Dependabot
- OWASP Dependency-Check
- npm audit / yarn audit

### Escaneo de Contenedores
- Trivy
- Clair
- Aqua Security

### Detección de Secretos
- GitGuardian
- TruffleHog
- git-secrets

### Monitoreo y Logs
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog
- Graylog

### WAF (Web Application Firewall)
- Cloudflare
- AWS WAF
- ModSecurity

---

## 11. PROCESO DE IMPLEMENTACIÓN

### Fase 1: Evaluación Inicial (Semana 1-2)
1. Auditoría completa del código existente
2. Identificación de vulnerabilidades críticas
3. Priorización según impacto y probabilidad
4. Creación de plan de remediación

### Fase 2: Remediación Crítica (Semana 3-4)
1. Corregir vulnerabilidades de severidad crítica y alta
2. Implementar autenticación y autorización robusta
3. Configurar HTTPS y security headers
4. Proteger endpoints sensibles

### Fase 3: Mejoras de Seguridad (Semana 5-6)
1. Implementar rate limiting
2. Añadir logging y monitoreo
3. Configurar CORS apropiadamente
4. Implementar validación de inputs

### Fase 4: Automatización (Semana 7-8)
1. Integrar escaneo de seguridad en CI/CD
2. Configurar alertas automáticas
3. Establecer política de actualizaciones
4. Documentar procedimientos de seguridad

### Fase 5: Mantenimiento Continuo
1. Auditorías trimestrales
2. Actualización de dependencias mensual
3. Revisión de logs semanal
4. Capacitación del equipo

---

## 12. MATRIZ DE PRIORIDADES

### Crítico (Implementar inmediatamente)
- SQL Injection
- Broken Authentication
- Sensitive Data Exposure
- XXE
- Broken Access Control
- Security Misconfiguration con datos expuestos

### Alto (Implementar en 2 semanas)
- XSS
- CSRF
- Insecure Deserialization
- Dependencias vulnerables críticas
- Falta de HTTPS
- Logging de información sensible

### Medio (Implementar en 1 mes)
- Rate Limiting
- SSRF
- Mass Assignment
- Dependencias vulnerables no críticas
- Security Headers faltantes
- Falta de MFA

### Bajo (Implementar en 2-3 meses)
- Mejoras en logging
- Optimización de configuraciones
- Documentación de seguridad
- Capacitación adicional

---

## 13. CONTACTOS Y RECURSOS

### Recursos de Aprendizaje
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Spring Security Docs: https://spring.io/projects/spring-security
- React Security Best Practices: https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml

### Comunidades
- OWASP Slack
- Spring Security Gitter
- r/netsec
- Stack Overflow Security Tag

### Reportar Vulnerabilidades
- Establecer un proceso de responsible disclosure
- Email de contacto para reportes de seguridad
- Programa de bug bounty (opcional)

---

**Nota Final:** Este plan debe ejecutarse de forma iterativa, priorizando vulnerabilidades críticas primero. Se recomienda establecer un proceso de security review continuo con auditorías trimestrales y actualizaciones constantes según nuevas amenazas identificadas.

**Versión:** 1.0  
**Última actualización:** Febrero 2026  
**Autor:** Equipo de Seguridad