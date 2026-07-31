# Backend Integration Guide (ZK -> REST) for Orion v3 Nemesis

This project is a single Maven module: Spring Boot 2.7.18 (`javax.persistence`
/`javax.servlet`, NOT Jakarta) + ZK7 + MS SQL Server via Flyway. Read this
fully before writing any Java for a screen migration.

## Project layout recap

Every module (`core`, `credit`, `collateral`, `crm`, `workflow`, `risk`,
`cash`, `meta`, `report`, ...) follows the same 4-layer package convention:

```
com.orion.<module>.domain      JPA entities
com.orion.<module>.repository  Spring Data repositories (JOIN FETCH queries live here)
com.orion.<module>.service     @Service classes - framework-agnostic business logic
com.orion.<module>.vm          ZK ViewModels - thin glue, SpringContextHolder.getBean()
```

When you add REST support, add two new sibling packages per module:

```
com.orion.<module>.dto         Flat DTOs for JSON responses/requests
com.orion.<module>.controller  @RestController classes
```

Do not put DTOs inside `domain/` and do not put controllers inside `vm/` -
keep the existing convention's spirit (one clear layer per concern).

## The two Flyway migration folders - do not forget either one

This is the single most common mistake when adding a new migration in this
project. There are **two copies** of every migration file:

- `db/V{n}__description.sql` - a documentation/reference copy at the repo
  root, referenced by `db/README.md`.
- `src/main/resources/db/migration/V{n}__description.sql` - the **actual**
  classpath location Flyway reads at boot
  (`spring.flyway.locations: classpath:db/migration` in
  `application.yml`).

When you need a schema change:

1. Find the latest applied version first:
   ```bash
   docker exec orion-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
     -P 'Orion_2026_Str0ng!' -d orion -C \
     -Q "SELECT TOP 5 version, description FROM flyway_schema_history ORDER BY installed_rank DESC"
   ```
2. Write `db/V{next}__description.sql`.
3. Copy the exact same file to
   `src/main/resources/db/migration/V{next}__description.sql`.
4. Update `db/README.md` with a short description of the new table/columns
   under the relevant module section.
5. Restart the backend and confirm the log shows
   `Migrating schema [dbo] to version "N - description"` followed by
   `Successfully applied 1 migration...`. If the log instead says
   `Schema [dbo] is up to date`, the file did not make it into the real
   Flyway classpath folder - check step 3 again.

## ViewModel wiring quirk (context only, don't replicate it in REST code)

ZK ViewModels are instantiated by ZK itself, not Spring, so they can't use
`@Autowired`. They instead do:

```java
private final CreditOptimizationService creditOptimizationService =
        SpringContextHolder.getBean(CreditOptimizationService.class);
```

**Do not use this pattern in new REST controllers.** Controllers ARE real
Spring beans (`@RestController` is auto-detected by component scanning), so
use normal constructor injection:

```java
@RestController
@RequestMapping("/api/v1/collateral")
public class CollateralController {

    private final CollateralService collateralService;
    private final CollateralMapper collateralMapper;

    public CollateralController(CollateralService collateralService,
                                 CollateralMapper collateralMapper) {
        this.collateralService = collateralService;
        this.collateralMapper = collateralMapper;
    }

    @GetMapping("/holdings")
    public List<CollateralDto> getHoldings(@RequestParam(required = false) String q) {
        List<Collateral> items = (q == null || q.isBlank())
                ? collateralService.getAllCollaterals()
                : collateralService.searchCollaterals(q);
        return collateralMapper.toDtoList(items);
    }
}
```

## DTO + MapStruct setup

If MapStruct is not yet in `pom.xml`, add it the first time a screen
migration needs a mapper:

```xml
<properties>
    <org.mapstruct.version>1.5.5.Final</org.mapstruct.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct</artifactId>
        <version>${org.mapstruct.version}</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.mapstruct</groupId>
                        <artifactId>mapstruct-processor</artifactId>
                        <version>${org.mapstruct.version}</version>
                    </path>
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>${lombok.version}</version>
                    </path>
                    <!-- lombok-mapstruct-binding may be required if both
                         Lombok and MapStruct process the same class -->
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

Example DTO + mapper (flattening lazy relations - this is the important
part, never let a lazy entity reference leak into the DTO):

```java
// dto/CollateralDto.java
public class CollateralDto {
    private Long id;
    private String hesapNo;
    private String customerName;
    private String depoTipi;
    private String varlikTipi;
    private String instrumentSymbol; // null if no instrument (cash lines)
    private String paraBirimi;
    private BigDecimal miktar;
}

// mapper/CollateralMapper.java
@Mapper(componentModel = "spring")
public interface CollateralMapper {

    @Mapping(target = "hesapNo", source = "account.hesapNo")
    @Mapping(target = "customerName", source = "account.customer.adSoyadUnvan")
    @Mapping(target = "instrumentSymbol", source = "instrument.sembol")
    CollateralDto toDto(Collateral entity);

    List<CollateralDto> toDtoList(List<Collateral> entities);
}
```

This only works cleanly because the underlying repository method already
uses `JOIN FETCH` (e.g. `CollateralRepository.findAllFetched()` already
does `join fetch c.account a join fetch a.customer left join fetch
c.instrument`) - so by the time the entity reaches the mapper, the lazy
fields are already initialized. **Always check the repository method
being reused already has the necessary JOIN FETCH before wiring it to a
DTO mapper** - if it doesn't, either add a new JOIN FETCH query or you will
hit `LazyInitializationException` outside the open Hibernate session.

## Exception handling -> HTTP status mapping

Reuse one shared advice class across all modules:

```java
// com.orion.core.web.ApiExceptionHandler
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
    }
}
```

This mirrors the existing ZK pattern where services throw
`IllegalArgumentException`/`IllegalStateException` and the ViewModel
catches them to show a `Messagebox.ERROR`. The React side should show the
same `message` string as an inline/toast error - do not paraphrase or
translate it, these are the actual domain validation rules (many already
in Turkish, keep them as-is).

## Command -> REST verb mapping convention

Use this table as the default naming convention when a ViewModel's
`@Command` doesn't obviously suggest an HTTP verb:

| ViewModel `@Command` pattern         | REST endpoint                                  |
|---------------------------------------|-------------------------------------------------|
| `getAll...()` / list load on `@Init`  | `GET /api/v1/<module>/<resource>`               |
| `search(q)`                           | `GET /api/v1/<module>/<resource>?q=...`          |
| `...Olustur()` (create)               | `POST /api/v1/<module>/<resource>`               |
| `onayla(id)` / `onaylaVeTamamla(id)`  | `POST /api/v1/<module>/<resource>/{id}/approve` |
| `reddet(id)`                          | `POST /api/v1/<module>/<resource>/{id}/reject`  |
| `iptalEt(id)`                         | `POST /api/v1/<module>/<resource>/{id}/cancel`  |
| `revizyonaGonder(id)`                 | `POST /api/v1/<module>/<resource>/{id}/revise`  |
| `...Guncelle(id, ...)` (update)       | `PUT /api/v1/<module>/<resource>/{id}`           |
| `...Sil(id)` (delete)                 | `DELETE /api/v1/<module>/<resource>/{id}`        |
| bulk apply-to-selected commands       | `POST /api/v1/<module>/<resource>/bulk-apply` with an `ids: number[]` body |

## One-time platform setup (do only once, first REST migration)

These are prerequisites the first screen migration must set up; every
later screen migration just reuses them.

### CORS

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173") // Vite dev server
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowCredentials(true);
    }
}
```
Adjust/remove once `nemesis-frontend` is served from the same origin in
production (e.g. built and copied into `src/main/resources/static` behind
a reverse proxy, or served separately with a fixed prod origin added
here).

### Spring Security + JWT skeleton

There is currently **no security at all** in this codebase (`User` entity
has no password field, no `SecurityConfig` exists). The first REST
migration should add:

1. `pom.xml`: `spring-boot-starter-security` + a JWT library (`io.jsonwebtoken:jjwt-api`/`jjwt-impl`/`jjwt-jackson` is a simple, well-known choice).
2. Migration `V{next}__user_password.sql` adding a `sifre_hash` column to
   `users` (both migration folders, see above).
3. `SecurityConfig` (`@EnableWebSecurity`) that:
   - Permits `/*.zul`, `/zkau/**`, `/` unauthenticated (existing ZK
     screens keep working exactly as before, unauthenticated, unchanged).
   - Requires a valid JWT bearer token on everything under `/api/**`
     except `/api/v1/auth/login`.
   - Uses stateless sessions (`SessionCreationPolicy.STATELESS`) for the
     API - this does not touch ZK's own `HttpSession` usage at all, they
     are independent.
4. `AuthController` with `POST /api/v1/auth/login` (username/password ->
   signed JWT) and `GET /api/v1/auth/me`.
5. Do not touch or wrap the existing ZK login-less flow. The old screens
   must keep working exactly as they do today.

If this setup already exists by the time you read this (check first with
`grep -r "SecurityConfig\|@RestController" src/main/java`), skip this
section and just add your controller under the existing security rules.

## Local dev / verification commands (reference)

```bash
# environment (every session, before any mvn command)
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.0.19.10-hotspot"
export MAVEN_HOME="/c/tools/maven/apache-maven-3.9.16"
export PATH="$JAVA_HOME/bin:$MAVEN_HOME/bin:$PATH"

# compile
mvn -q compile

# restart backend (Windows java process)
powershell.exe -NoProfile -Command "Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force"
nohup mvn -q spring-boot:run > /tmp/orion-runN.log 2>&1 &
sleep 30 && tail -60 /tmp/orion-runN.log   # confirm "Started OrionApplication", no ERROR

# smoke-test a new endpoint
curl -s http://localhost:8080/api/v1/collateral/holdings | head -c 500
```

Increment the `N` in `orion-runN.log` each restart, matching the existing
project convention so old logs aren't overwritten.
