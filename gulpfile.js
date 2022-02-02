'use strict';

const gulp = require('gulp');
const size = require('gulp-size');
const useref = require('gulp-useref');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const postcss = require('gulp-postcss');
const csso = require('gulp-csso');
const minifyHTML = require('gulp-minify-html');
const jshint = require('gulp-jshint');
const connect = require('gulp-connect');
var browserSync = require('browser-sync');
var del = require('del');
var child_process = require('child_process');

gulp.task('lint', function() {
  return gulp.src("app/**/*.js")
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('media', function() {
  return gulp.src("app/*.wav")
    .pipe(gulp.dest("dist"))
    .pipe(size({title: "media"}));
});

gulp.task('html', function() {
  return gulp.src("app/**/*.html")
    .pipe(useref({searchPath: "{app,assets}"}))
    // minifiy JavaScript.
    .pipe(gulpif("*.js", uglify()))
    //.pipe(gulpif("*.css", postcss({
    //  html: ['app/**/*.html'],
    //  ignore: [/.label.*/]
    //})))
    .pipe(gulpif("*.css", csso()))
    .pipe(gulpif("*.html", minifyHTML()))
    .pipe(gulp.dest("dist"))
    .pipe(size({title: "html"}));
});

gulp.task('clean', del.bind(null, ['dist/*', '!dist/.git'], {dot: true}));

gulp.task('default', gulp.series('clean', gulp.parallel('lint', 'html', 'media')));

gulp.task('serve', function() {
  browserSync({
    server: ['assets', 'app']
  });
});

gulp.task('serve:dist', gulp.series('default', function() {
  browserSync({
    server: ['dist']
  });
}));

gulp.task('serve:user', gulp.series('default', function() {
  connect.server({
    port: 3000,
    host: '0.0.0.0',
    root: 'dist'
  });
}));

gulp.task('mwm', function() {
  child_process.spawn('python3', ['server/max_weight_matching.py'],
                      {stdio: 'inherit'})
    .on('error', function(error) {
      console.log(error);
    });
});

function f() {
gulp.task('lint', function() {
  return gulp.src("app/**/*.js")
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('copy', function() {
  return gulp.src("assets/**")
    .pipe(gulp.dest("dist"))
    .pipe(size({title: "copy"}));
});




gulp.task('default', ['clean', 'lint', 'html', 'media']);
}
