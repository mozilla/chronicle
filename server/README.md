## Working with the server code

### Code "structure"

See docs/MISC.md for discussion of patterns and conventions.

`/bell-oauth-profile.js` - A `bell` pluggable function that converts an oauth token into profile data & persists the user's data (whether new or existing)

`/config.js` - A `node-convict` schema for config files. The actual config files are found at the top-level under `/config`.

`/index.js` - Top-level `hapi` server initialization: configure middleware, setup loggers, and configure cleanup on `process.exit`

`/logger.js` - Wrapper around the `mozlog` library, chosen for its ready integration with `heka`, used for logging stuff in production.

`/README.md` - this file. wow such meta

`/db` - contains minimal objects that abstract heavy persistence tools

`/db/postgres` - a `node-postgres` wrapper, converted to return `Q` promises

`/db/elasticsearch` - an `elasticsearch` wrapper

`/models` contains ultra-primitive Data Mapper objects that hide the underlying DBs from callers. See docs/MISC for discussion.

`/models/user` - represents a user

`/models/visit` - represents a single visit to a site by a user

`/models/visits` - represents a set of visits; used to grab paginated / multi-visit views.

`/routes` - contains `hapi` route definitions, which act as controllers: they validate input; fetch data from models/DB; and return the data (or errors as HTTP errors). `hapi` automatically converts the output to JSON, which partly explains why we've gotten by without views so far.

`/routes/auth` - we use `hapi-auth-cookie` for sessions, and the `bell` library to abstract the Firefox Accounts OAuth login dance. These routes start and end a session.

`/routes/base` - the kitchen sink routes live here: top-level endpoint and static file handling route

`/routes/search` - elasticsearch-based search API endpoint (might turn into `/user_pages/search`)

`/routes/visits` - CRUD endpoints for individual `visit`s, as well as endpoints for paged multi-`visit` views

`/work-queue` - `node-resque` based work queue, and job definitions. See the README in that directory for details.

### conventions, patterns, notes, etc
 
db conventions:
- postgres field naming and default fields
  - each table should always have `id` for the id, always have `created_at`, `updated_at`
  - we use UUIDs to identify everything, not incrementing integers
  - `updated_at` NOT NULL: always set it along with `created_at` at create time
    - this gives us the option to version elasticsearch on postgres update times later
- postgres: underscores vs camelCase
  - db fields, tables, indexes are underscore-delimited
  - db code is camelCased
  - the pg DBO automatically translates results from underscores to camel before returning results
  - individual queries inside models contain underscored keys
- data types
  - char strings
    - use TEXT for text by default (it's all varlena under the hood in postgres)
    - to indicate the string specific size, use CHAR(n)
    - to indicate an upper limit but variable length, use VARCHAR(n)
  - times
    - store everything in UTC
    - to avoid weirdness when developing on laptops in non-UTC timezones, we always specify UTC as the timezone in the postgres connection parameters
    - use TIMESTAMPTZ(3), a 3-decimal place timestamp (corresponding to JS millisecond default time resolution)
- enforcing security (user only sees/searches own records)
  - every postgres visit or visits query includes a "WHERE user_id = ?" clause
  - ditto for elasticsearch: require a direct match on the user_id field for any set of search data.

code organization / patterns
- models
  - models contain DB queries for both es and pg.
  - `/models` contains ultra-primitive things which one day might be nice model code.
  - The basic abstraction is the [DataMapper](http://martinfowler.com/eaaCatalog/dataMapper.html), not [ActiveRecord](http://martinfowler.com/eaaCatalog/activeRecord.html) or [Table Data Gateway](http://martinfowler.com/eaaCatalog/tableDataGateway.html). That is, models don't directly map to tables or rows. Instead, they represent (as-yet-ill-defined) domain objects, and they hide the structure of the database from callers, and obtain data from multiple sources (multiple tables or multiple DBs), and contain queries themselves.
  - The closest approximation we have to a business logic domain model is actually the set of JSON API endpoints exposed to the front-end Backbone code.
  - The model-view connection on the server hasn't been reified yet, because we generally just return JSON, and hapi gives us that transform for free. We might soon add view helpers, though, to handle more complex transformations.
- db objects
  - the db objects are super primitive: they just hide connection params and connection err handling.
  - retry logic and query details are inside the models.
    - we do this because there's no rock-solid ORM for node.js, and we don't have
      the time to roll our own that would be good enough quality.

js code / API conventions:
- datatype validation
  - use Joi to express datatypes as schema between layers
  - we aren't doing this consistently yet, but do it a little at the API layer
- dates
  - always transmit dates in the ISO format returned by Date.toJSON()
  - this lets us ignore local timezones on developer machines
- callbacks vs promises vs pubsub
  - callbacks are the shitty yet expedient default currently sprinkled throughout the codebase
  - promises are better than callbacks for situations where one listener waits at least a turn (for IO or CPU) 
    - just always be sure to set a `timeout()` and invoke `done()` at the end of a promise chain
  - pubsub is my favorite thing but we aren't using it yet
    - TODO! figure it out
