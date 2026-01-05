# ABBY - Real API Integration (Living Document)

**Last Updated:** 2025-12-31
**Status:** 🔴 NOT FULLY INTEGRATED
**Backend:** `https://dev.api.myaimatchmaker.ai`
**API Docs:** https://dev.api.myaimatchmaker.ai/docs#/

---

## Critical: What We're ACTUALLY Using

| Feature | Original MVP | Real Backend |
|---------|-------------|--------------|
| Auth | Phone verification (mocked) | **AWS Cognito** (email/password) |
| Voice AI | ElevenLabs SDK | **OpenAI Realtime API** (WebRTC) |
| Questions | Local JSON | **`/v1/questions/*`** endpoints |
| Matching | Not implemented | **`/v1/matches/*`** endpoints |

---

## AWS Cognito Configuration

```
User Pool ID: us-east-1_l3JxaWpl5
Client ID:    2ljj7mif1k7jjc2ajiq676fhm1
Region:       us-east-1
```

### Sign-Up Flow
1. `SignUp` with email, password, given_name, family_name
2. Receive 6-digit verification code via email
3. `ConfirmSignUp` with email and code
4. Post-confirmation Lambda creates user in PostgreSQL
5. `InitiateAuth` with email and password to get tokens

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Info
- ID tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Header: `Authorization: Bearer <ID_TOKEN>`

---

## Voice Integration: OpenAI Realtime API

**NOT ElevenLabs!** The backend provides:

### Session Flow
```
1. POST /v1/abby/realtime/session     → Get client_secret
2. Connect to OpenAI Realtime via WebRTC/WebSocket
3. POST /v1/abby/tools/execute        → Handle tool calls
4. POST /v1/abby/session/{id}/end     → End session
```

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/abby/realtime/session` | POST | Create voice session |
| `/v1/abby/session/{id}/end` | POST | End voice session |
| `/v1/abby/memory/context` | GET | Get conversation memory |
| `/v1/abby/realtime/{id}/message` | POST | Inject text message |
| `/v1/abby/tools/execute` | POST | Execute tool call |
| `/v1/abby/tts` | POST | Text-to-speech |
| `/v1/abby/realtime/available` | GET | Check API availability |
| `/v1/chat` | POST | Fallback text chat |

### WebRTC Connection Example
```javascript
// 1. Create session
const session = await fetch('/v1/abby/realtime/session', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
const { client_secret } = await session.json();

// 2. Connect via WebRTC
const pc = new RTCPeerConnection();
// ... WebRTC setup with client_secret
```

---

## Questions API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/questions/categories` | GET | List categories |
| `/v1/questions/category/{slug}` | GET | Questions by category |
| `/v1/questions/next` | GET | Next questions to ask |
| `/v1/questions/gaps` | GET | Profile gaps |
| `/v1/questions/{id}` | GET | Single question |
| `/v1/answers` | GET | User's answers |
| `/v1/answers` | POST | Submit answer |
| `/v1/answers/parse` | POST | Parse natural language |

---

## Profile API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/me` | GET | Current user profile |
| `/v1/profile/public` | PUT | Update public profile |
| `/v1/profile/private` | PUT | Update private settings |

---

## Matching API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/matches/candidates` | GET | Get match candidates |
| `/v1/matches/{user_id}/like` | POST | Like a user |
| `/v1/matches/{user_id}/pass` | POST | Pass on a user |

---

## Photos API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/photos/presign` | POST | Get S3 upload URL |
| `/v1/photos` | POST | Register uploaded photo |

---

## Current App State

### Working (Expo Go with mocks)
- ✅ Login screen
- ✅ Phone number screen
- ✅ Verification code screen
- ✅ Email screen
- ✅ Email verification screen
- ✅ Loading screen
- ✅ Coach intro screen (with mocked voice)

### Not Integrated Yet
- ❌ Real AWS Cognito auth
- ❌ OpenAI Realtime voice
- ❌ Questions from backend
- ❌ Matching flow
- ❌ Profile management
- ❌ Photos upload

---

## Next Steps

1. **Remove ElevenLabs code** - Replace with OpenAI Realtime integration
2. **Implement AWS Cognito** - Use Amplify SDK for auth
3. **Connect Questions API** - Replace local JSON with `/v1/questions/*`
4. **Add matching flow** - Integrate `/v1/matches/*`

---

## Code Debt

| File | Issue | Action |
|------|-------|--------|
| `App.tsx` | Uses `ElevenLabsProvider` | Remove, not needed |
| `AbbyAgent.ts` | Full ElevenLabs implementation | Rewrite for OpenAI Realtime |
| `src/mocks/` | Workaround for Expo Go | Keep for dev, remove for prod |

---

*This is a living document. Update as integration progresses.*
