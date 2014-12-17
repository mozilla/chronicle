var gulp = require('gulp');
var rjs = require('gulp-requirejs');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');

// default behavior is to build
gulp.task('default', ['build']);

// runs build-ish subtasks
gulp.task('build', ['styles', 'html', 'scripts']);

// runs build and then watches for specific changes
gulp.task('watch', ['build'], function () {
  gulp.watch('app/styles/*.scss', ['styles']);
  gulp.watch('app/*.html', ['html']);
  gulp.watch('app/scripts/**/*.js', ['scripts']);
});

// transforms scss to css
gulp.task('styles', function () {
  gulp.src('app/styles/main.scss')
  .pipe(sass())
  .pipe(gulp.dest('dist/styles'));
});

// copies html from the root
gulp.task('html', function () {
  gulp.src('app/*.html').pipe(gulp.dest('dist'));
});

// uses r.js to compile scripts into one file
gulp.task('scripts', function () {
  rjs({
    almond: true,
    baseUrl: 'app/scripts',
    out: 'compiled.js',
    name: '../bower_components/almond/almond',
    include: ['main'],
    mainConfigFile: 'app/scripts/main.js',
    stubModules: ['text', 'stache']
  })
  .pipe(uglify())
  .pipe(gulp.dest('dist/scripts'));
});
