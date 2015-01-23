## Working with the server code - a 5 minute overview

### Code "structure"

`/db` - contains minimal objects that abstract heavy persistence tools

`/db/postgres` - a `node-postgres` wrapper, converted to return `Q` promises

`/db/elasticsearch` - an `elasticsearch` wrapper

`/models` contains ultra-primitive things which one day might be nice model code

`/models/user` - user abstraction

`/models/visit` - visit abstraction

`/models/visits` - visits abstraction, used to grab paginated / multi-visit views. really more of a view helper. le sigh

`/routes` - contains `hapi` route definitions

`/routes/auth` - we use `hapi-auth-cookie` for sessions, and the `bell` library to abstract the Firefox Accounts OAuth login dance. These routes start and end a session.

`/routes/base` - top-level endpoint and static file handling route

`/routes/search` - elasticsearch-based search API endpoint

`/routes/visits` - CRUD endpoints for individual `visit`s, as well as endpoints for paged multi-`visit` views

