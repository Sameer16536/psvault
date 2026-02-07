# PSVault Backend Architecture Diagrams

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Client[Web/Mobile Client]
    end
    
    subgraph "API Gateway"
        Router[Echo Router]
        MW[Middleware Stack]
    end
    
    subgraph "Application Layer"
        VH[Vault Handler]
        SH[Secret Handler]
        DH[Device Handler]
    end
    
    subgraph "Business Logic Layer"
        VS[Vault Service]
        SS[Secret Service]
        DS[Device Service]
    end
    
    subgraph "Data Access Layer"
        VR[Vault Repository]
        SR[Secret Repository]
        DR[Device Repository]
        AR[Audit Repository]
    end
    
    subgraph "External Services"
        Clerk[Clerk Auth]
        NR[New Relic]
    end
    
    subgraph "Data Storage"
        PG[(PostgreSQL)]
        Redis[(Redis Cache)]
    end
    
    Client -->|HTTP Request| Router
    Router --> MW
    MW -->|Auth Check| Clerk
    MW --> VH & SH & DH
    
    VH --> VS
    SH --> SS
    DH --> DS
    
    VS --> VR & AR
    SS --> SR & AR
    DS --> DR & AR
    
    VR & SR & DR & AR --> PG
    VS & SS & DS -.->|Cache| Redis
    
    MW -.->|Monitoring| NR
    
    style Client fill:#e1f5ff
    style Router fill:#fff4e1
    style MW fill:#fff4e1
    style VH fill:#ffe1f5
    style SH fill:#ffe1f5
    style DH fill:#ffe1f5
    style VS fill:#e1ffe1
    style SS fill:#e1ffe1
    style DS fill:#e1ffe1
    style VR fill:#f5e1ff
    style SR fill:#f5e1ff
    style DR fill:#f5e1ff
    style AR fill:#f5e1ff
    style PG fill:#ffe1e1
    style Redis fill:#ffe1e1
```

## Request Flow - Create Vault

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Router
    participant A as Auth Middleware
    participant H as Vault Handler
    participant S as Vault Service
    participant Repo as Vault Repository
    participant DB as PostgreSQL
    participant Audit as Audit Repository
    
    C->>R: POST /api/vaults
    Note over C,R: Authorization: Bearer token
    
    R->>A: Validate Token
    A->>A: Extract user_id from Clerk
    A->>H: Forward Request (user_id in context)
    
    H->>H: Parse & Validate Request
    H->>S: Create(userID, request)
    
    S->>S: Build Vault Model
    S->>Repo: Create(vault)
    
    Repo->>DB: INSERT INTO vaults...
    DB-->>Repo: Return ID, timestamps
    Repo-->>S: Vault with ID
    
    S->>Audit: Log(CREATE action)
    Audit->>DB: INSERT INTO audit_logs...
    
    S->>S: Convert to DTO
    S-->>H: VaultResponse
    
    H-->>C: 201 Created + JSON
```

## Database Schema

```mermaid
erDiagram
    users ||--o{ vaults : owns
    users ||--o{ devices : has
    users ||--o{ audit_logs : generates
    
    vaults ||--|| vault_keys : has
    vaults ||--o{ secrets : contains
    vaults ||--o{ audit_logs : tracks
    
    secrets ||--|| secret_metadata : has
    secrets ||--o{ audit_logs : tracks
    
    users {
        uuid id PK
        text email
        text external_auth_id UK
        timestamptz created_at
    }
    
    vaults {
        uuid id PK
        text user_id FK
        text name
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    
    vault_keys {
        uuid id PK
        uuid vault_id FK,UK
        bytea encrypted_master_key
        bytea key_derivation_salt
        int kdf_iterations
    }
    
    secrets {
        uuid id PK
        uuid vault_id FK
        secret_type type
        bytea encrypted_payload
        int encryption_version
        timestamptz last_accessed_at
    }
    
    secret_metadata {
        uuid id PK
        uuid secret_id FK,UK
        text title
        text domain
        text[] tags
    }
    
    devices {
        uuid id PK
        text user_id FK
        text device_fingerprint
        timestamptz last_seen_at
    }
    
    audit_logs {
        uuid id PK
        text user_id FK
        uuid vault_id FK
        uuid secret_id FK
        audit_action action
        inet ip_address
        timestamptz created_at
    }
```

## Component Dependencies

```mermaid
graph LR
    subgraph "Handler Layer"
        VH[Vault Handler]
        SH[Secret Handler]
        DH[Device Handler]
    end
    
    subgraph "Service Layer"
        VS[Vault Service]
        SS[Secret Service]
        DS[Device Service]
    end
    
    subgraph "Repository Layer"
        VR[Vault Repo]
        SR[Secret Repo]
        DR[Device Repo]
        AR[Audit Repo]
    end
    
    subgraph "Shared"
        Server[Server Instance]
        Logger[Logger]
        DB[Database Pool]
    end
    
    VH --> VS
    SH --> SS
    DH --> DS
    
    VS --> VR
    VS --> AR
    SS --> SR
    SS --> VR
    SS --> AR
    DS --> DR
    
    VR --> Server
    SR --> Server
    DR --> Server
    AR --> Server
    
    Server --> Logger
    Server --> DB
    
    style VH fill:#ffe1f5
    style SH fill:#ffe1f5
    style DH fill:#ffe1f5
    style VS fill:#e1ffe1
    style SS fill:#e1ffe1
    style DS fill:#e1ffe1
    style VR fill:#f5e1ff
    style SR fill:#f5e1ff
    style DR fill:#f5e1ff
    style AR fill:#f5e1ff
```

## Middleware Chain

```mermaid
graph LR
    Request[HTTP Request] --> RL[Rate Limiter]
    RL --> CORS[CORS Handler]
    CORS --> RID[Request ID]
    RID --> NR[New Relic Tracer]
    NR --> CE[Context Enhancer]
    CE --> Log[Request Logger]
    Log --> Auth[Auth Middleware]
    Auth --> Recover[Panic Recovery]
    Recover --> Handler[Route Handler]
    
    style Request fill:#e1f5ff
    style Auth fill:#ffe1e1
    style Handler fill:#e1ffe1
```

## Secret Creation Flow (with Metadata)

```mermaid
sequenceDiagram
    participant H as Secret Handler
    participant S as Secret Service
    participant VR as Vault Repo
    participant SR as Secret Repo
    participant DB as PostgreSQL
    
    H->>S: Create(userID, request)
    
    S->>VR: GetByID(vaultID)
    VR->>DB: SELECT * FROM vaults WHERE id=?
    DB-->>VR: Vault data
    VR-->>S: Vault
    
    S->>S: Check vault.user_id == userID
    
    S->>SR: Create(secret, metadata)
    
    Note over SR,DB: Transaction begins
    SR->>DB: BEGIN
    
    SR->>DB: INSERT INTO secrets...
    DB-->>SR: secret.id
    
    SR->>DB: INSERT INTO secret_metadata...
    DB-->>SR: metadata.id
    
    SR->>DB: COMMIT
    Note over SR,DB: Transaction committed
    
    SR-->>S: Secret with metadata
    S-->>H: SecretResponse
```

## Authorization Flow

```mermaid
graph TD
    Start[Request Arrives] --> Auth{Auth Middleware}
    Auth -->|Invalid Token| Reject[401 Unauthorized]
    Auth -->|Valid Token| Extract[Extract user_id]
    
    Extract --> Handler[Handler Receives Request]
    Handler --> Service[Service Method Called]
    
    Service --> Check{Resource Ownership Check}
    Check -->|resource.user_id != user_id| Deny[403 Forbidden]
    Check -->|resource.user_id == user_id| Allow[Process Request]
    
    Allow --> Repo[Repository Operation]
    Repo --> Audit[Log Audit Trail]
    Audit --> Response[Return Response]
    
    style Reject fill:#ffe1e1
    style Deny fill:#ffe1e1
    style Allow fill:#e1ffe1
    style Response fill:#e1f5ff
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/ALB]
    end
    
    subgraph "Application Servers"
        App1[Go Server 1]
        App2[Go Server 2]
        App3[Go Server 3]
    end
    
    subgraph "Data Layer"
        PG_Primary[(PostgreSQL Primary)]
        PG_Replica[(PostgreSQL Replica)]
        Redis[(Redis Cluster)]
    end
    
    subgraph "External Services"
        Clerk[Clerk Auth]
        NR[New Relic APM]
    end
    
    LB --> App1 & App2 & App3
    
    App1 & App2 & App3 --> PG_Primary
    App1 & App2 & App3 -.->|Read| PG_Replica
    App1 & App2 & App3 --> Redis
    App1 & App2 & App3 --> Clerk
    App1 & App2 & App3 -.->|Metrics| NR
    
    PG_Primary -.->|Replication| PG_Replica
    
    style LB fill:#e1f5ff
    style App1 fill:#ffe1f5
    style App2 fill:#ffe1f5
    style App3 fill:#ffe1f5
    style PG_Primary fill:#ffe1e1
    style PG_Replica fill:#ffe1e1
    style Redis fill:#ffe1e1
```
