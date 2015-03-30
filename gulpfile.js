'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var del = require('del');
var child_process = require('child_process');
    
gulp.task('lint', function() {
  return gulp.src("app/**/*.js")
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('copy', function() {
  return gulp.src("assets/**")
    .pipe(gulp.dest("dist"))
    .pipe($.size({title: "copy"}));
});

gulp.task('html', function() {
  var assets = $.useref.assets({searchPath: "{app,assets}"});
  
  return gulp.src("app/**/*.html")
    .pipe(assets)
    // minifiy JavaScript.
    .pipe($.if("*.js", $.uglify()))
    .pipe($.if("*.css", $.uncss({
      html: ['app/**/*.html'],
      ignore: [/.label.*/]
    })))
    .pipe($.if("*.css", $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if("*.html", $.minifyHtml()))
    .pipe(gulp.dest("dist"))
    .pipe($.size({title: "html"}));
});

gulp.task('clean', del.bind(null, ['dist/*', '!dist/.git'], {dot: true}));

gulp.task('serve', function() {
  browserSync({
    server: ['assets', 'app']
  });
});

gulp.task('serve:dist', ['default'], function() {
  browserSync({
    server: ['dist']
  });
});

gulp.task('serve:user', ['default'], function() {
  $.connect.server({
    port: 3000,
    root: 'dist'
  });
});

gulp.task('mwm', function() {
  child_process.spawn('python', ['server/max_weight_matching.py'],
                      {stdio: 'inherit'})
    .on('error', function(error) {
      console.log(error);
    });
});

gulp.task('default', ['clean', 'lint', 'html']);
