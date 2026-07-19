# Contract: Customer Account Status Management

Base path: `/api/v1`

## GET `/customers`

Admin-only paginated customer list.

### Query

- `search`: optional normalized name/phone/email search
- `status`: optional `ACTIVE | INVITED | SUSPENDED`
- `page`: positive integer, default 1
- `limit`: 1–100, default 20

### Response

```json
{
  "items": [
    {
      "id": "uuid",
      "fullName": "string",
      "phone": "+966...",
      "email": "string|null",
      "status": "ACTIVE",
      "createdAt": "ISO-8601",
      "lastLoginAt": "ISO-8601|null",
      "bookingsCount": 0
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1
}
```

Secrets such as password hashes, refresh tokens, reset tokens, and internal credential fields must never be returned.

## POST `/customers/:id/suspend`

Admin-only.

### Body

```json
{ "reason": "Required, 3–500 characters" }
```

### Behavior

- Target must exist and have role `CUSTOMER`.
- Current status must not already be `SUSPENDED`.
- Update status to `SUSPENDED`.
- Revoke all refresh tokens.
- Write an audit record transactionally.
- Preserve all customer business history.

### Responses

- `200`: sanitized customer summary
- `400/422`: invalid reason/body
- `403`: caller is not Admin
- `404`: customer not found
- `409`: current status is already `SUSPENDED` — body `{ "error": { "code": "CUSTOMER_ALREADY_SUSPENDED" } }`. No AuditLog row is written.

## POST `/customers/:id/reactivate`

Admin-only.

### Body

```json
{ "reason": "Optional, maximum 500 characters" }
```

### Behavior

- Target must be a `CUSTOMER` in `SUSPENDED` status.
- Update status to `ACTIVE`.
- Write an audit record transactionally.
- Do not restore old refresh tokens; Customer must log in again.

### Responses

- `200`: sanitized customer summary
- `403`: caller is not Admin
- `404`: customer not found
- `409`: current status is not `SUSPENDED` — body `{ "error": { "code": "CUSTOMER_NOT_SUSPENDED" } }`. No AuditLog row is written.

## Authentication behavior

A suspended Customer attempting login, refresh, or a protected Customer request receives:

```json
{
  "error": {
    "code": "ACCOUNT_SUSPENDED",
    "message": "تم إيقاف الحساب. يرجى التواصل مع الإدارة."
  }
}
```

Production responses must not reveal the suspension reason.
