# Chronicle Prerelease Deployment Checklist

Before we hand a build off to ops, we should perform the following checks (at a minimum) to make sure the app is ready to be deployed.

## General:

1. Clone the git repo locally (`$ git clone git@github.com:mozilla/chronicle.git`) and verify that the code installs in a clean directory, and all the "happy paths" work as expected:
  - Sign up
  - Sign in
  - Create/destroy visits
  - Get recent visits in sorted order
  - Search returns expected results, sorted by relevance.

  **Note:** In order to to run the project locally, you'll need to have _Node.js_ (0.10.x), _ElasticSearch_, _PostgreSQL_, and _Redis_ already installed. See https://github.com/mozilla/chronicle#large-tools for more details.

2. Download and/or compile latest version of [Chronicle Firefox add-on](https://github.com/mozilla/chronicle-addon) (and any other supported browsers).
3. Verify that browsing using different supported browsers adds all new visits into Chronicle's history.

## QA/Ops-ish tasks:
1. `npm run lint` &mdash; make sure there aren't any lint errors in the JavaScript or JSON.
2. `npm run validate-shrinkwrap` &mdash; make sure that current dependencies don't have any unexpected possible vulnerabilities.
3. `npm run outdated` &mdash; check if there are any updates to currently installed _dependencies_ or _devDependencies_.
4. Make sure the generated JavaScript and CSS are minified, production quality, and include source maps for debugging.
5. Run the functional tests using Selenium Server. For more information, see https://github.com/mozilla/chronicle#tests.

### Optional:
0. Install the [**npm-check**](https://www.npmjs.com/package/npm-check) module and check for any unused modules in the package.json file.
1. Run [**scss-lint**](https://github.com/causes/scss-lint) against the Sass files to check for any potential issues; `$ scss-lint app/styles/`. The Sass "rules" are currently located in [/app/styles/.scss-lint.yml](https://github.com/mozilla/chronicle/blob/master/app/styles/.scss-lint.yml).
2. Run [**grunt-contrib-csslint**](https://www.npmjs.com/package/grunt-contrib-csslint) against the generated CSS files to check for any potential issues in the generated CSS.
3. Run [**grunt-htmllint**](https://www.npmjs.com/package/grunt-htmllint) against the HTML templates to check for any potential HTML issues.

**Note:** Currently there are no `grunt csslint` or `grunt htmllint` tasks checked into GitHub, you may need to create these tasks locally. See https://gist.github.com/pdehaan/4584edcfacc7632e60e9 Gist for boilerplate.

## Deploying a Release to GitHub

1. Bump minor/patch version in /package.json (and /bower.json file).
2. `grunt changelog` &mdash; generate a ./CHANGELOG.md file with the latest changes.
3. `grunt contributors` &mdash; generate a ./AUTHORS file with the latest list of project contributors.
4. Create a new release/tag in GitHub with the generated CHANGELOG.md and AUTHORS files.

**Note:** See **fxa-content-server**'s [/grunttasks/bump.js](https://github.com/mozilla/fxa-content-server/blob/master/grunttasks/bump.js) and [/grunttasks/version.js](https://github.com/mozilla/fxa-content-server/blob/master/grunttasks/version.js) tasks for a possibly automated way of releasing builds using the [**grunt-bump**](https://github.com/vojtajina/grunt-bump) package.
