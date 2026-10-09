# Attendance Management System

A REST API built with the same technology stack as the supplied Student Management repository:
- Java 21
- Maven
- Spring Boot
- Spring Data JPA / Hibernate
- PostgreSQL (manage the database with pgAdmin 4)
- Spring Web MVC

## Configure PostgreSQL
Edit `src/main/resources/application.properties` and set your PostgreSQL username, password, and database name. The supplied defaults point to the `postgres` database and use `postgres` as username. `spring.jpa.hibernate.ddl-auto=update` creates/updates the `attendance` table automatically when the app starts.

## Run
From the project root:
- Windows: `mvnw.cmd spring-boot:run`
- Linux/macOS: `./mvnw spring-boot:run`

App base URL: `http://localhost:8080`

## Postman endpoints
Use `http://localhost:8080/attendance`.

### Create record
`POST /attendance` — Body → raw → JSON:
```json
{
  "employeeName": "Arun Kumar",
  "department": "IT",
  "attendanceDate": "2026-10-09",
  "status": "Present",
  "checkInTime": "09:00:00",
  "checkOutTime": "17:30:00"
}
```

### Read all
`GET /attendance`

### Read one
`GET /attendance/1`

### Update
`PUT /attendance/1` — Body → raw → JSON:
```json
{
  "employeeName": "Arun Kumar",
  "department": "IT",
  "attendanceDate": "2026-10-09",
  "status": "Late",
  "checkInTime": "09:20:00",
  "checkOutTime": "17:30:00"
}
```

### Delete
`DELETE /attendance/1`

The `status` field can be `Present`, `Absent`, `Late`, or `Leave`. Dates use `YYYY-MM-DD`; times use `HH:MM:SS`.
# Attendance_management_system
