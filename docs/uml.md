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

Shows the states of a class session.

```plantuml
@startuml
[*] --> Created : Lecturer initializes session

Created --> Active : Started with unit selection
Active --> Active : QR Token Refreshed
Active --> Ended : Manual End / Timeout

Ended --> [*]
@enduml
```
