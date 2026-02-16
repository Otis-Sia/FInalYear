# System UML Diagrams


This document contains UML diagrams for the Attendance Management System, represented in [PlantUML](https://plantuml.com/) format.

## 1. System Architecture Diagram

Shows the high-level components and their interactions.

```plantuml
@startuml
!theme toy
skinparam componentStyle rectangle

actor "Student" as Student
actor "Lecturer" as Lecturer
actor "Admin" as Admin

package "Frontend (Vanilla JS/HTML/CSS)" {
    component "Attendance Web App" as WebApp
}

package "Backend (Express.js)" {
    component "REST API Server" as API
    component "SSE Handler" as SSE
}

database "MySQL Database" as DB

Student --> WebApp : Uses
Lecturer --> WebApp : Uses
Admin --> WebApp : Uses

WebApp <--> API : HTTPS / JSON
WebApp <-- SSE : Real-time Events
API <--> DB : SQL Queries

@enduml
```

## 2. Entity Relationship Diagram (ERD)

Visualizes the database schema and table relationships.

```plantuml
@startuml
!theme plain
hide circle
skinparam linetype ortho

entity "users" {
    * id : INT <<PK>>
    --
    * user_id : VARCHAR(50) <<UNIQUE>>
    * full_name : VARCHAR(100)
    university_id : VARCHAR(50)
    email : VARCHAR(100)
    * password : VARCHAR(255)
    * role : ENUM('student', 'lecturer', 'admin')
    created_at : TIMESTAMP
}

entity "units" {
    * id : INT <<PK>>
    --
    * unit_code : VARCHAR(50)
    * unit_name : VARCHAR(100)
    lecturer_id : INT <<FK>>
}

entity "sessions" {
    * id : INT <<PK>>
    --
    * unit_code : VARCHAR(50)
    lecturer_id : INT <<FK>>
    qr_token : VARCHAR(255)
    * is_active : TINYINT(1)
    * require_gps : TINYINT(1)
    latitude : DECIMAL(10,8)
    longitude : DECIMAL(11,8)
    created_at : TIMESTAMP
    ended_at : TIMESTAMP
}

entity "attendance" {
    * id : INT <<PK>>
    --
    session_id : INT <<FK>>
    student_id : INT <<FK>>
    * status : ENUM('Present', 'Late', 'Absent')
    device_id : VARCHAR(255)
    timestamp : TIMESTAMP
}

entity "activity_logs" {
    * id : INT <<PK>>
    --
    user_id : INT <<FK>>
    * action : VARCHAR(50)
    details : TEXT
    timestamp : TIMESTAMP
}

users "1" -- "0..*" units : "assigned to"
users "1" -- "0..*" sessions : "conducts"
users "1" -- "0..*" attendance : "marks"
users "1" -- "0..*" activity_logs : "performed by"
sessions "1" -- "0..*" attendance : "recorded in"
@enduml
```

## 3. Use Case Diagram

Describes system functionality from the perspective of different users.

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor Student
actor Lecturer
actor Admin

rectangle "Attendance Management System" {
    usecase "Login" as UC1
    usecase "Mark Attendance (QR + GPS)" as UC2
    usecase "View Personal Attendance History" as UC3
    
    usecase "Manage Units" as UC4
    usecase "Start/End Class Session" as UC5
    usecase "Generate/Refresh QR Code" as UC6
    usecase "View Unit Attendance History" as UC7
    
    usecase "Manage Users" as UC8
    usecase "System Auditing" as UC9
}

Student -- UC1
Student -- UC2
Student -- UC3

Lecturer -- UC1
Lecturer -- UC4
Lecturer -- UC5
Lecturer -- UC6
Lecturer -- UC7

Admin -- UC1
Admin -- UC8
Admin -- UC9
Admin -- UC4

@enduml
```

## 4. Sequence Diagram: Marking Attendance

Illustrates the step-by-step process of a student marking attendance.

```plantuml
@startuml
actor Student
participant "Frontend App" as FE
participant "Express Server" as BE
database "MySQL DB" as DB

Student -> FE : Scans QR Code
FE -> FE : Get GPS Location (if required)
FE -> FE : Capture Device ID

FE -> BE : POST /api/attendance (student_id, session_id, qr_token, coords, device_id)
activate BE

BE -> DB : SELECT session details (is_active, qr_token, gps_req)
activate DB
DB --> BE : Session Data
deactivate DB

BE -> BE : Validate session is active
BE -> BE : Verify QR token match
BE -> BE : Validate GPS proximity (if req)
BE -> DB : Check if student already marked
activate DB
DB --> BE : Status
deactivate DB

BE -> DB : Check if device already used by others
activate DB
DB --> BE : Status
deactivate DB

alt Valid Data
    BE -> DB : INSERT INTO attendance
    activate DB
    DB --> BE : Success
    deactivate DB
    
    BE -> BE : Notify Lecturer via SSE
    BE --> FE : 200 OK (Success)
else Invalid/Duplicate
    BE --> FE : 4xx/5xx Error (Reason)
end

deactivate BE
FE --> Student : Show Status Message
@enduml
```

## 5. State Machine Diagram: Session Lifecycle

Shows the states of a class session based on the `is_active` flag.

```plantuml
@startuml
!theme toy
hide empty description

[*] --> Created : Lecturer initializes session

state "Active Session" as Active {
    Active : is_active = 1
    Active : has valid qr_token
}

state "Ended Session" as Ended {
    Ended : is_active = 0
    Ended : ended_at = CURRENT_TIMESTAMP
}

Created --> Active : Started with unit selection
Active --> Active : QR Token Refreshed
Active --> Ended : Manual End / Timeout

Ended --> [*]
@enduml
```

## 6. Class Diagram

While the backend is functional/procedural Node.js, this diagram represents the logical modules and data structures.

```plantuml
@startuml
!theme plain
skinparam classAttributeIconSize 0

package "Backend Modules" {
    class "AuthService" {
        + login(university_id, password)
        + requireAdmin(req, res, next)
    }

    class "SessionService" {
        + startSession(unit_code, lecturer_id, coords)
        + refreshQR(session_id, token)
        + endSession(session_id)
        + getAttendance(session_id)
    }

    class "AttendanceService" {
        + markAttendance(student_id, session_id, token, gps, device_id)
        + validateGPS(session_coords, student_coords)
    }

    class "AdminService" {
        + manageUsers()
        + manageUnits()
        + getAuditLogs()
    }
}

package "Models" {
    class User {
        + id: INT
        + full_name: String
        + role: Enum
    }
    class Session {
        + id: INT
        + qr_token: String
        + is_active: Boolean
    }
    class AttendanceRecord {
        + session_id: INT
        + student_id: INT
        + status: String
    }
}

AuthService ..> User : "authenticates"
SessionService ..> Session : "manages"
AttendanceService ..> AttendanceRecord : "creates"
AttendanceService --> SessionService : "checks session"
AdminService ..> User : "modifies"
@enduml
```

## 7. Activity Diagram: User Login Flow

Describes the logic for user authentication and role-based redirection.

```plantuml
@startuml
!theme toy
start
:User enters ID and Password;
if (Validation) then (Incomplete)
  :Show Error "Missing Fields";
  stop
else (Complete)
  :Fetch user from DB by ID;
  if (User exists?) then (No)
    :Show Error "Invalid ID";
    stop
  else (Yes)
    :Compare password with Bcrypt hash;
    if (Password match?) then (No)
      :Show Error "Invalid Password";
      stop
    else (Yes)
      :Log Activity: LOGIN;
      :Send User Object to Frontend;
      if (Role?) then (Admin)
        :Redirect to Admin Dashboard;
      else if (Role?) then (Lecturer)
        :Redirect to Lecturer Portal;
      else (Student)
        :Redirect to Student Scanner;
      endif
      stop
    endif
  endif
endif
@enduml
```

## 8. Deployment Diagram

Shows the physical deployment of the system over a Local Area Network (LAN).

```plantuml
@startuml
!theme plain
skinparam componentStyle rectangle

node "Server Machine (Ubuntu/Linux)" {
    component "NGINX Reverse Proxy" as Nginx
    component "Node.js Express Server" as Express
    database "MySQL Server" as MySQL
}

node "Client Device (Student Phone)" {
    component "Mobile Browser / PWA" as StudentApp
}

node "Client Device (Lecturer Laptop)" {
    component "Web Browser" as LecturerApp
}

StudentApp -- Nginx : "HTTPS (Port 443)"
LecturerApp -- Nginx : "HTTPS (Port 443)"
Nginx -- Express : "Internal HTTP (Port 3000)"
Express -- MySQL : "SQL Connection (Port 3306)"

@enduml
```

## 9. Component Diagram

Modular view of the system's software components.

```plantuml
@startuml
!theme plain
[Frontend Assets] <<Component>> as FE
[REST API] <<Component>> as API
[Database] <<Component>> as DB
[SSE Notification Service] <<Component>> as SSE

HTTP -down-> FE : "Main Access"
FE -right-> API : "JSON / AJAX"
API -down-> DB : "Query/Update"
API -left-> SSE : "Broadcast Updates"
SSE -up-> FE : "Real-time Refresh"

note right of API : Handles Auth, Attendance,\nSessions, and Admin tasks.
note left of FE : HTML, CSS, Vanilla JS,\nPWA Service Workers.
@enduml
```

```
