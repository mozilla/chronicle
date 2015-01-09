## Chronicle Server API

TODO: formally document supported HTTP status codes, format of error and success responses, HTTPS cookie requirements, and which requirements are relaxed when developing locally.

### Auth API

Chronicle uses Firefox Accounts to log users in, but manages its own session duration.

The session cookie is encrypted server-side, so it is not accessible to the client-side code.

The Firefox Accounts OAuth flow is handled by the server; the front-end just needs to redirect logged-out users to the `/auth/login` endpoint.

Note, if the `testUser` config option is set, the cookie will be created directly by visiting `/auth/login`, ignoring the OAuth step.

### Auth API Methods

- Start the login flow: `GET /auth/login`
- Logout: `GET /auth/logout`

### Visits API

A `Visit` is a representation of a user's visit to a website at a particular time. Endpoints that return multiple `Visits` return them as simple lists (arrays) of `Visit` objects.

Example `Visit`:
```js 
{
  id: '6134da4b-cc3e-4c62-802b-7da40c5fae44',
  url: 'http://awyeah.co',
  title: 'aw yesh',
  visitedAt: '2015-01-06T19:59:31.808Z'
}
```

#### Visits don't explicitly contain FxA IDs
Note that the `Visit` object returned to a given user never contains that user's Firefox Accounts ID. The client currently consuming this API only makes requests on behalf of a single user per session, and only accesses visits belonging to that user, so the user's Firefox Account ID is never explicitly passed as a property of the `Visit`; it's a property of the session. This may change in the future.

### Visit Properties:
- `id`: a visit identifier.
  - format: UUIDv4, formatted as a string.
  - example: `6134da4b-cc3e-4c62-802b-7da40c5fae44`
  - Clients may optionally generate this; if not, it will be provided in the POST response. See notes section below for a discussion of our use of UUIDs.
- `url`: the visited website URL.
  - format: string, no max length.
  - URLs are not currently canonicalized or normalized by the server.
- `title`: the visited page title.
  - format: string, max length is 128 chars.
- `visitedAt`: time of visit.
  - format: string in ISO 8601 UTC format with fractional seconds.
  - example: `2015-01-06T19:59:31.808Z`
  - This is the format returned by `Date.toJSON()` in modern browsers.
  - See notes section below for a discussion of our choice of timestamp format.

### Visits API Methods

Note: Partial updates via `PATCH` are not currently supported, but we can add support later to optimize network traffic.

#### Visit
- Create a new visit: `POST /v1/visits`
  - required fields: `url`, `title`, `visitedAt`
  - optional fields: `id` (see also [#78](https://github.com/mozilla/chronicle/issues/78))
- Read a visit: `GET /v1/visits/:visitId`
- Update a visit: `PUT /v1/visits/:visitId`
  - required fields: `url`, `title`, `visitedAt`
- Delete a visit: `DELETE /v1/visits/:visitId`

#### Visits
- Retrieve the 25 newest visits: `GET /v1/visits`
- Retrieve `count` visits older than `visitId`: `GET /v1/visits?count=:count&visitId=:visitId`
  - `count` is optional, defaults to 25, max is 100
  - currently we only sort from newest to oldest, so there's not (yet) a way to insert newer visits at the top of a view. we can easily add this when we need it.
