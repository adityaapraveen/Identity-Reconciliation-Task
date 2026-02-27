# Bitespeed Identity Reconciliation

A web service that identifies and tracks customer identity across multiple purchases by linking contacts with common email or phone numbers.

## Live Endpoint
```
https://identity-reconciliation-task-mba2.onrender.com/identify
```
# NOTE - Hosted on Render so it might take 1-2 mins to spin up on first request (might setup a cron job to avoid this)


## API

### POST /identify

**Request body:**
```json
{
  "email": "example@email.com",
  "phoneNumber": "1234567890"
}
```

At least one of `email` or `phoneNumber` must be provided.

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@email.com", "secondary@email.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2]
  }
}
```