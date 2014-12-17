chronicle
=========

find everything you've ever found

## installation

### large tools

Chronicle is built using [Node.js](https://nodejs.org/), [ElasticSearch](https://www.elasticsearch.org/), [MySQL](https://www.mysql.com/), and [Redis](http://redis.io/), so you'll want to install the current stable version of all of these.

If you are using Mac OS and have [Homebrew](http://brew.sh/) installed, this incantation should work:

```sh
$ brew install nodejs elasticsearch mysql redis
```

### code

The server-side code dependencies are managed with [npm](https://www.npmjs.com/). The front-end dependencies are managed with [Bower](https://bower.io/); you can install it via `npm install -g bower` if you don't have it on your system.

To fetch dependencies and get cooking:

1. `npm install`
2. As part of the npm install process, the `postinstall` script will install the bower dependencies for you.
3. Copy `config/local.json.example` to `config/local.json`, and put your local info in there.
4. `npm start`
5. You're up and running! surf to http://localhost:8080 :surfer:


### Available Grunt tasks

| Name | Description |
|------|-------------|
| `autoprefixer` | Adds vendor prefixes to CSS files based on <http://caniuse.com> statistics.
| `changelog` | Generate a changelog from git metadata.
| `clean` | Deletes files and folders.
| `contributors` | Generates a list of contributors from your project's git history.
| `copy` | Copies files and folders.
| `copyright` | Checks for MPL copyright headers in source files.
| `css` | Alias for "sass", "autoprefixer" tasks.
| `dist` | Alias for "clean:dist", "copy:dist" tasks.
| `jscs` | JavaScript Code Style checker.
| `jshint` | Validates files with JSHint.
| `jsonlint` | Validates JSON files.
| `lint` | Alias for "jshint", "jscs", "jsonlint", "copyright" tasks.
| `sass` | Compiles Sass files to vanilla CSS.
| `validate-shrinkwrap` | Submits your _npm-shrinkwrap.json_ file to <https://nodesecurity.io> for validation.
| `watch` | Runs predefined tasks whenever watched files change.

## learn more
* Tumblr: http://mozillachronicle.tumblr.com/
* IRC channel: #chronicle on mozilla IRC
* Mailing list: chronicle-dev@mozilla.org (https://mail.mozilla.org/listinfo/chronicle-dev)
