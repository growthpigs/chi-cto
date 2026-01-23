# API Contracts: AudienceOS Marketing Page

## Overview
Static page - no API required for MVP.

## Future Endpoints

### POST /api/waitlist
Add email to waitlist.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Added to waitlist"
}
```

## Notes
MVP uses static mailto: or external form service.
