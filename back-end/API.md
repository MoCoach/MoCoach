# MoCoach API Documentation

Base URL: `http://localhost:5678`

## Authentication

Most endpoints require a JWT access token obtained via `POST /login`.  
Include it as an `Authorization: Bearer <token>` header.

---

## Availability Checks (Public)

### `GET /check-username/<username>`

Check if a username is available for registration.

**Response `200`:** `{"available": true | false}`

### `GET /check-email/<email>`

Check if an email is available for registration.

**Response `200`:** `{"available": true | false}`

---

## Authentication (Public)

### `POST /register`

Create a new user account.

**Request body:**

| Field        | Type    | Required | Notes                                      |
|--------------|---------|----------|--------------------------------------------|
| `username`   | string  | yes      | Letters, digits, underscores only          |
| `email`      | string  | yes      | Valid email format                         |
| `password`   | string  | yes      | Minimum 8 characters                       |
| `first_name` | string  | no       | Required when `is_coach` is true           |
| `last_name`  | string  | no       | Required when `is_coach` is true           |
| `is_coach`   | boolean | no       | Default `false`                            |
| `description`| string  | no       | Required when `is_coach` is true           |
| `tags`       | array   | no       | List of `{"name": string, "description": string}` (coach only, max 5) |
| `phone`      | string  | no       |                                            |
| `city_id`    | integer | no       | Required when `is_coach` is true           |
| `price`      | integer | no       | Coach price per hour                       |

**Response `201`:** User object (see user schema below) with `profile_pic`.

**Errors:** `400` (validation), `409` (duplicate username/email).

### `POST /login`

Authenticate and receive a JWT access token.

**Request body:**

| Field      | Type   | Required | Notes                         |
|------------|--------|----------|-------------------------------|
| `login`    | string | yes      | Username or email             |
| `password` | string | yes      |                               |

**Response `200`:** `{"access_token": "<jwt-token>"}`

**Errors:** `400` (missing fields), `401` (bad credentials).

---

## Profile (Authenticated)

### `PUT /profile`

Update the authenticated user's profile.

**Request body** (all fields optional, only provided fields are updated):

| Field          | Type    | Notes                                      |
|----------------|---------|--------------------------------------------|
| `first_name`   | string  |                                            |
| `last_name`    | string  |                                            |
| `email`        | string  |                                            |
| `phone`        | string  |                                            |
| `username`     | string  |                                            |
| `description`  | string  | Coach only                                 |
| `tags`         | array   | Coach only. List of `{"name", "description"}`. Replaces all tags |
| `city_id`      | integer | Coach only                                 |
| `price`        | integer | Coach only                                 |

**Response `200`:** Updated user object.

**Errors:** `400` (validation), `404` (user not found), `409` (duplicate email/username).

### `PUT /password`

Change the authenticated user's password.

**Request body:**

| Field          | Type   | Required | Notes             |
|----------------|--------|----------|-------------------|
| `old_password` | string | yes      |                   |
| `new_password` | string | yes      | Minimum 8 chars   |

**Response `200`:** `{"msg": "Password updated"}`

**Errors:** `400` (missing fields), `401` (wrong old password).

### `GET /profile/<int:profile_id>`

View a user's profile. Visibility rules apply:
- Admins are invisible to non-admins.
- Admins can see any non-admin profile.
- Users can always see their own profile.
- Coaches can see customers they have a chat with.

**Response `200`:** User object.

**Errors:** `404` (not found), `403` (access denied).

### `DELETE /profile`

Delete the authenticated user's own account.

**Request body:**

| Field      | Type   | Required | Notes |
|------------|--------|----------|-------|
| `password` | string | yes      |       |

**Response `200`:** `{"msg": "Profile deleted"}`

**Errors:** `400` (missing password), `401` (wrong password), `403` (last admin).

---

## Profile Picture

### `GET /profile/picture/<int:user_id>`

Serve a user's profile picture (JPEG). Falls back to a default image if none was uploaded. Returns `204` if no default is available either.

### `POST /profile/picture`

Upload or replace the authenticated user's profile picture.

**Request:** Multipart form-data with a `file` field.

**Allowed extensions:** `png`, `jpg`, `jpeg`, `gif`, `webp`.

**Response `200`:** `{"profile_pic": "<relative-path>"}`

**Errors:** `400` (no file, bad extension, invalid image), `401` (unauthorized).

---

## Coach Picture

### `GET /coach/picture/<int:user_id>/<int:numero>`

Serve one of a coach's pictures (`numero` 1–7). Returns `204` if absent.

### `POST /coach/picture/<int:numero>`

Upload or replace one of a coach's up-to-7 pictures (`numero` 1–7).

**Request:** Multipart form-data with a `file` field.

**Allowed extensions:** `png`, `jpg`, `jpeg`, `gif`, `webp`.

**Response `200`:** `{"picture": "<relative-path>"}`

**Errors:** `400` (invalid numero, no file, bad extension, invalid image).

---

## Coach Queries (Public)

### `GET /coach`

Return all coaches.

**Response `200`:** Array of coach objects (see Coach schema below).

### `GET /coach/<int:coach_id>`

Return public details for a specific coach.

**Response `200`:** Coach object.

**Errors:** `404` (not found).

### `GET /coach/tag/<tag_name>`

Return coaches filtered by exact tag name match.

**Response `200`:** Array of coach objects.

### `GET /coach/search?q=<string>`

Search coaches by one or more space-separated terms. Only coaches matching **all** terms are returned. Each term is matched case-insensitively against the coach's:
- `description`
- `first_name`
- `last_name`
- `username`
- tag names

**Response `200`:** Array of coach objects (empty if no match or no query).

**Example:** `GET /coach/search?q=Bob fitness`

---

## Ratings (Authenticated)

### `POST /coach/<int:coach_id>/rate`

Set or remove a thumbs-up/thumbs-down rating. Only customers may rate.

**Request body:**

| Field    | Type    | Required | Notes                            |
|----------|---------|----------|----------------------------------|
| `rating` | boolean | yes      | `true` (up), `false` (down), or `null` (remove) |

**Response `200`:** `{"msg": "Rating updated"}`

**Errors:** `400` (invalid rating), `401` (unauthorized), `403` (coach cannot rate), `404` (coach not found).

---

## Chat / Messages (Authenticated)

### `GET /chat`

List the authenticated user's chats.

**Response `200`:** Array of chat objects, each with `id`, `coach` and `customer` objects containing `id`, `username`, `first_name`, `last_name`.

### `GET /chat/<int:chat_id>`

Return messages for a chat. Admins see all messages including hidden ones. Non-admin users only see non-hidden messages they have access to.

**Response `200`:** Array of message objects with `sender`, `timestamp`, `text` (and `hidden` for admins).

**Errors:** `404` (chat not found), `403` (access denied).

### `POST /message`

Send a message to another user. Only a customer can start a new chat.

**Request body:**

| Field          | Type    | Required | Notes                 |
|----------------|---------|----------|-----------------------|
| `recipient_id` | integer | yes      |                       |
| `text`         | string  | yes      | Max 250 characters    |

**Response `201`:** Message object with `id`, `sender`, `timestamp`, `text`.

**Errors:** `400` (missing fields), `403` (coach cannot start chat), `404` (user not found).

### `PUT /message/<message_id>/hide`

Hide (soft-delete) one of your own messages. Only available to non-admin users.

**Response `200`:** `{"msg": "Message hidden"}`

**Errors:** `400` (already hidden), `401` (unauthorized), `403` (admin or not own message), `404` (not found).

### `DELETE /message/<message_id>`

Permanently delete any message (admin-only).

**Response `200`:** `{"msg": "Message deleted"}`

**Errors:** `403` (not admin), `404` (not found).

---

## Tags (Public + Admin)

### `GET /tag`

List all tags (public).

**Response `200`:** Array of tag objects: `{"id", "name", "description"}`

### `POST /tag`

Create a new tag (admin-only).

**Request body:**

| Field         | Type   | Required | Notes            |
|---------------|--------|----------|------------------|
| `name`        | string | yes      | Max 25 chars     |
| `description` | string | yes      | Max 100 chars    |

**Response `201`:** Tag object.

**Errors:** `400` (validation), `403` (not admin), `409` (duplicate name).

### `PUT /tag/<int:tag_id>`

Update a tag (admin-only).

**Request body:** `name` and/or `description`.

**Response `200`:** Updated tag object.

**Errors:** `403` (not admin), `404` (not found), `409` (duplicate name).

### `DELETE /tag/<int:tag_id>`

Delete a tag (admin-only).

**Response `200`:** `{"msg": "Tag deleted"}`

**Errors:** `403` (not admin), `404` (not found).

---

## Cities (Public + Admin)

### `GET /city`

List all cities (public).

### `GET /city/<int:city_id>`

Get a city by id (public).

**Response `200`:** `{"id", "name"}`

**Errors:** `404` (not found).

### `POST /city`

Create a new city (admin-only).

**Request body:**

| Field  | Type   | Required | Notes         |
|--------|--------|----------|---------------|
| `name` | string | yes      | Max 25 chars  |

**Response `201`:** `{"id", "name"}`

**Errors:** `400` (validation), `403` (not admin), `409` (duplicate name).

### `PUT /city/<int:city_id>`

Update a city's name (admin-only).

**Response `200`:** Updated city object.

**Errors:** `403` (not admin), `404` (not found), `409` (duplicate name).

---

## Badges

### `GET /badge/all`

List all available badges (public).

**Response `200`:** Array of badge objects: `{"id", "name", "description", "for_coach"}`

### `GET /badge/for/<role>`

List badges by role (public). `role` must be `"coach"` or `"customer"`.

### `GET /badge`

Return the authenticated user's received badges, grouped by badge ID (authenticated).

**Response `200`:** `{badge_id: [{"giver_id": int, "name": string}, ...], ...}`

### `POST /badge`

Create a new badge (admin-only).

**Request body:**

| Field         | Type    | Required | Notes            |
|---------------|---------|----------|------------------|
| `name`        | string  | yes      | Max 25 chars     |
| `description` | string  | yes      | Max 100 chars    |
| `for_coach`   | boolean | yes      |                  |

**Response `201`:** Badge object.

**Errors:** `400`, `403`, `409` (duplicate name).

### `POST /badge/give`

Give a badge to another user (authenticated). Giver and recipient must have different roles (coach ↔ customer).

**Request body:**

| Field      | Type    | Required | Notes     |
|------------|---------|----------|-----------|
| `user_id`  | integer | yes      | Recipient |
| `badge_id` | integer | yes      |           |

**Response `201`:** `{"msg": "Badge given"}`

**Errors:** `400` (self-gift, same role, admin), `404`, `409` (duplicate).

### `PUT /badge/<int:badge_id>`

Update a badge (admin-only). `for_coach` is immutable after creation.

**Response `200`:** Updated badge object.

**Errors:** `403`, `404`, `409`.

### `DELETE /badge/<int:badge_id>`

Delete a badge (admin-only).

**Response `200`:** `{"msg": "Badge deleted"}`

**Errors:** `403`, `404`.

---

## Admin User Management

### `GET /users`

List all non-admin users (admin-only).

**Response `200`:** Array of user objects (without `password`).

**Errors:** `403` (not admin).

### `DELETE /user/<int:user_id>`

Delete a non-admin user (admin-only).

**Response `200`:** `{"msg": "User deleted"}`

**Errors:** `403` (not admin or target is admin), `404`.

### `PUT /user/<int:user_id>/promote`

Promote a user to admin (admin-only, irreversible).

**Response `200`:** Updated user object.

**Errors:** `400` (already admin), `403`, `404`.

### `GET /user/<int:user_id>/chats`

Return a specific user's chats (admin-only consultation).

**Response `200`:** Array of chat objects.

**Errors:** `403`, `404`.

---

## Data Schemas

### User Object (to_dict)

```json
{
  "id": 1,
  "username": "alice",
  "first_name": "Alice",
  "last_name": null,
  "email": "alice@x.com",
  "is_coach": false,
  "is_admin": false,
  "phone": "111",
  "profile_pic": "static/uploads/profile_pics/1/profile.jpg"
}
```

When `is_coach` is true, a nested `coach` object is included (see Coach schema below).

### Coach Object (_coach_to_dict)

```json
{
  "id": 2,
  "username": "bob",
  "first_name": "Bob",
  "last_name": "Builder",
  "description": "I am Bob",
  "price": null,
  "city": "Paris",
  "phone": null,
  "tags": [
    {"name": "fitness", "description": "Fitness coaching"}
  ],
  "profile_pic": "back-end/static/uploads/profile_pics/default/profile.jpg",
  "pictures": [
    "static/uploads/coach_pics/2/1.jpg",
    "static/uploads/coach_pics/2/3.jpg"
  ],
  "thumbs_up": 5,
  "thumbs_down": 1
}
```
