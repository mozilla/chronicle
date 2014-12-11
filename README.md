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

1. `npm install`
2. copy `config/local.json.example` to `config/local.json`, and put your local info in there
3. `npm start`
4. you're up and running! surf to http://localhost:8080

## learn more
* Tumblr: http://mozillachronicle.tumblr.com/
* IRC channel: #chronicle on mozilla IRC
* Mailing list: chronicle-dev@mozilla.org (https://mail.mozilla.org/listinfo/chronicle-dev)
