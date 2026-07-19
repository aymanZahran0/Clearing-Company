# Contract: Public Statistics

Base path: `/api/v1`

## GET `/public/stats`

Unauthenticated. Used by the home page trust/quality section.

### Response

```json
{
  "completedBookingsCount": 1240,
  "averageRating": 4.8
}
```

### Behavior

- `completedBookingsCount`: `COUNT(*)` of `Booking` rows with `status = COMPLETED`. Omitted from the response entirely when `0` — never sent as a zero/placeholder value (FR-007a).
- `averageRating`: `AVG(rating)` over all `Review` rows, rounded to 1 decimal place. Omitted when there are zero reviews.
- Both fields are independently optional; the response may be `{}` if neither is yet meaningful.
- No authentication required.

### Responses

- `200`: stats object (fields present only where meaningful)
