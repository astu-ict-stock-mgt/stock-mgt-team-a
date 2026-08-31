# Notification System Implementation

**SRS Traceability:** Section 12.2 (Notifications), FR-43, UC-38  
**Task:** BE-150  
**Branch:** `feature/notification-system`

---

## Overview

The ASTU Stock Management System includes an in-system notification engine that:
- Automatically notifies relevant role holders when business events occur
- Deduplicates alert-type notifications to prevent spam
- Uses role-based recipient resolution — **the frontend never determines recipients**
- Supports priority levels (HIGH, MEDIUM, LOW) with visual indicators
- Provides a polling-based unread count refresh (30-second interval)

---

## Architecture

```
Business Module (e.g. requisition.service.js)
        │
        │ fire-and-forget call (.catch(() => {}))
        ▼
notification-events.service.js       ← Domain event hub
        │
        │ resolves users by role code via getUserIdsByRoles()
        ▼
notifications.service.js             ← CRUD & bulk insert
        │
        ▼
  Notification table (PostgreSQL)    ← persisted
        │
        ▼
GET /api/notifications               ← REST API
GET /api/notifications/unread-count  ← polling endpoint
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
        │
        ▼
AppContext.tsx                       ← React state + polling
        │
        ▼
Bell dropdown panel + Notifications.tsx screen
```

---

## Database Schema

```prisma
model Notification {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  title         String
  message       String
  type          String    @default("INFO")
  priority      String    @default("MEDIUM")   // LOW | MEDIUM | HIGH
  referenceId   String?   @map("reference_id")
  referenceType String?   @map("reference_type")
  isRead        Boolean   @default(false)
  readAt        DateTime?
  createdAt     DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, isRead])           // unread count queries
  @@index([userId, isRead, createdAt])// paginated unread list
  @@index([type])
  @@index([createdAt])
  @@map("notifications")
}
```

---

## Notification Types

| Type | Priority | Recipients | Trigger |
|---|---|---|---|
| `APPROVAL_REQUIRED` | HIGH | DEPARTMENT_HEAD, PAO (Requisition); PAO (Transfer); TEC, PAO, STOREKEEPER (Return); PAO, TEC (Disposal) | On submission |
| `APPROVED` | MEDIUM | Requester (original submitter) | On approval decision |
| `REJECTED` | HIGH | Requester | On rejection decision |
| `STATUS_UPDATE` | LOW/MEDIUM | Requester | On status transition |
| `RECEIPT_EVALUATION` | HIGH | TEC | On GRN creation where receipt requires evaluation |
| `GRN_READY` | MEDIUM | STOREKEEPER, ACCOUNTANT | On GRN creation / finalization |
| `LOW_STOCK` | MEDIUM | STOREKEEPER, PAO | Auto-generated; deduplicated per item |
| `EXPIRY_WARNING` | MEDIUM/HIGH | STOREKEEPER, PAO | Auto-generated; deduplicated per item |
| `DISPOSAL_CANDIDATE` | HIGH | PAO, TEC | Auto-generated; deduplicated per item |
| `PROPERTY_REGISTRATION_REQUIRED` | HIGH | PROPERTY_REGISTRATION_OFFICER | On material acceptance |
| `SECURITY_EVENT` | HIGH | SECURITY_OFFICER, ADMIN | On security-sensitive events |

---

## API Endpoints

All endpoints require `Authorization: Bearer <JWT>`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | List own notifications (paginated). Params: `unreadOnly`, `page`, `limit`. |
| `GET` | `/api/notifications/unread-count` | Fast unread count (for polling). Returns `{ unreadCount: number }`. |
| `GET` | `/api/notifications/:id` | Single notification (ownership verified). |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read. |
| `PATCH` | `/api/notifications/read-all` | Mark all own notifications as read. |
| `DELETE` | `/api/notifications/:id` | Delete own notification. |
| `POST` | `/api/notifications/trigger-expiry-check` | Manual trigger (admin). |
| `POST` | `/api/notifications/trigger-low-stock-check` | Manual trigger (admin). |
| `POST` | `/api/notifications/trigger-disposal-check` | Manual trigger (admin). |

---

## Security Rules

1. **Backend determines recipients.** `notifyApprovalPending()` and all event functions look up users by RBAC role code. The frontend never provides a target user list.
2. **Ownership enforced at service level.** `markAsRead()` and `deleteNotification()` both verify `notification.userId === userId` before mutation — returning 404 (not 403) to avoid ID enumeration.
3. **Fire-and-forget.** All notification calls in business services are wrapped with `.catch(() => {})`. A notification failure can never cause a primary transaction to fail.
4. **JWT-only user resolution.** The controller always reads `req.user?.userId` from the JWT payload — never from `req.body` or `req.query`.

---

## Deduplication

Alert-type notifications (LOW_STOCK, EXPIRY_WARNING, DISPOSAL_CANDIDATE) are deduplicated:
- Before creating a new notification for a user+type+referenceId combination, the system checks if an unread notification for the same combination already exists.
- If found, the new notification is skipped for that user.
- Once the user reads the existing notification, the next polling cycle can generate a fresh one.

---

## Frontend Integration

### AppContext

```tsx
const {
  notifications,      // Notification[] — full list
  unreadCount,        // number — backed by polling
  markNotificationRead,     // (id: string) => Promise<void>
  markAllNotificationsRead, // () => Promise<void>
  refreshNotifications,     // () => Promise<void>
} = useApp()
```

### Polling

The `AppContext` polls `GET /api/notifications/unread-count` every 30 seconds when authenticated and connected. If the count increases, it automatically refetches the full notification list.

### Bell Dropdown

The header bell button opens a floating panel showing the 8 most recent notifications, priority indicators (colored dot), mark-all-read button, and a "View all →" link to the Notifications screen.

---

## Testing

```bash
# Run notification integration tests
cd backend
npx vitest run tests/modules/notifications-integration.test.js

# Run all backend tests
npx vitest run
```

### Manual Test Scenarios

1. **Requisition approval flow**
   - Login as requester → create requisition
   - Login as PAO → check for `APPROVAL_REQUIRED` notification
   - PAO approves → login as requester → check for `APPROVED` notification
   - PAO rejects → login as requester → check for `REJECTED` notification

2. **Transfer flow**
   - Login as storekeeper → create transfer
   - Login as PAO → check for `APPROVAL_REQUIRED` notification
   - PAO approves → login as storekeeper → check for `APPROVED` notification

3. **GRN flow**
   - Login as storekeeper → create goods receipt → create GRN
   - Login as STOREKEEPER/ACCOUNTANT → check for `GRN_READY` notification

4. **Bell dropdown**
   - Verify bell shows badge with unread count
   - Click bell → dropdown opens with recent notifications
   - Click notification → marks as read, closes panel
   - "Mark all read" → all notifications marked read, badge disappears

5. **Polling**
   - Wait 30s → verify unread count refreshes from backend without page reload

---

## Files Modified

### Backend
| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `priority` field + compound indexes to `Notification` model |
| `modules/notifications/notifications.service.js` | Complete rewrite: fixed field bugs, added `priority`, `getUnreadCount`, deduplication |
| `modules/notifications/notification-events.service.js` | Complete rewrite: `priority` on all events, new event functions, deduplication |
| `modules/notifications/notifications.controller.js` | Added `getUnreadCount`, `getById` handlers, `PATCH` variants |
| `modules/notifications/notifications.routes.js` | Added `GET /unread-count`, `GET /:id`, `PATCH /read-all`, `PATCH /:id/read` |
| `modules/requisitions/requisition.service.js` | Fire-and-forget notification hooks on create/approve/reject |
| `modules/transfers/transfer.service.js` | Fire-and-forget notification hooks on create/approve/dispatch |
| `modules/returns/return.service.js` | Fire-and-forget notification hooks on create/evaluate/approve |
| `modules/goods-receipt/grn.service.js` | Fire-and-forget GRN notification hooks on create/finalize |

### Frontend
| File | Change |
|---|---|
| `types/index.ts` | Expanded `Notification.type` union + added `priority` field |
| `services/api.ts` | Added `getUnreadCount`, `getById`, `delete` to `notificationsApi`; PATCH methods |
| `context/AppContext.tsx` | Added `unreadCount`, polling, API-connected `markNotificationRead`, `markAllNotificationsRead`, `refreshNotifications` |
| `screens/Notifications.tsx` | Wired API calls, loading states, priority indicators, relative time |
| `App.tsx` | Bell dropdown panel with recent notifications, priority dots, "mark all read", "view all" |
