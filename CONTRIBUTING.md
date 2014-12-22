# Contribution Guidelines for Chronicle

Anyone is welcome to help with Chronicle. Feel free to get in touch with other community members on IRC, the
mailing list or through issues here on GitHub.

- IRC: `#chronicle` on `irc.mozilla.org`
- Mailing list: <https://mail.mozilla.org/listinfo/chronicle-dev>
- and of course, [the issues list](https://github.com/mozilla/chronicle/issues)

## Bug Reports ##

You can file issues here on GitHub. Please try to include as much information as you can and under what conditions
you saw the issue.

## Sending Pull Requests ##

Coming Soon

## Code Review ##

Coming Soon

## Git Commit Guidelines

We loosely follow the [Angular commit guidelines](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#type) of `<type>(<scope>): <subject>` where `type` must be one of:

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing
  semi-colons, etc)
* **refactor**: A code change that neither fixes a bug or adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing tests
* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation
  generation

### Scope
The scope could be anything specifying place of the commit change. For example `oauth`,
`fxa-client`, `signup`, `l10n` etc...

### Subject
The subject contains succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize first letter
* no dot (.) at the end

###Body (optional)
Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes"
The body should include the motivation for the change and contrast this with previous behavior.

###Footer
The footer should contain any information about **Breaking Changes** and is also the place to
reference GitHub issues that this commit **Closes**.

## Working With Styles

Chronicle's Styles are written in Sass and organized following conventions derived from [SMACSS](https://smacss.com/)

### Sass Files

Files are located in `app/styles/`.

| Name | Description |
|------|-------------|
| `modules/*.scss` | Partials for individual modules. All modules should be a single partial.
| `_base.scss` | Partial for editing global element styles.
| `_layout.scss` | Partial for laying out id selected elements and classed layout modifiers. Modifiers should be.classes prefixed with `l-`.
| `_modules.scss` | Partial for combining individual module partials.
| `_state.scss` | Partial for state modification classes.
| `_variables.scss` | Partial where Sass variables live.
| `main.scss` | Where all the partials go to mix and mingle.

### Compiling Sass

Use `grunt css` to compile.


## Test Options

Coming Soon

## Intern Runner custom arguments

Coming Soon

## Servers

Coming Soon 

## Dependencies and Tools

Coming Soon

## License

MPL 2.0
