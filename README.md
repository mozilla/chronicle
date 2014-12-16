chronicle
=========

find everything you've ever found

## installation

### large tools

Chronicle is built using node.js, ElasticSearch, MySQL, and Redis, so you'll want to install the current stable version of all of these.

If you are using mac os and have homebrew installed, this incantation should work:

```
brew install nodejs elasticsearch mysql redis
```

### code

The server-side code dependencies are managed with npm. The front-end dependencies are managed with bower; you can install it via `npm install -g bower` if you don't have it on your system.

To fetch dependencies and get cooking:

1. `npm install`
2. As part of the npm install process, the `postinstall` script will install the bower dependencies for you.
3. copy `config/local.json.example` to `config/local.json`, and put your local info in there
4. `npm start`
5. you're up and running! surf to http://localhost:8080 :surfer:

## learn more
* Tumblr: http://mozillachronicle.tumblr.com/
* IRC channel: #chronicle on mozilla IRC
* Mailing list: chronicle-dev@mozilla.org (https://mail.mozilla.org/listinfo/chronicle-dev)
