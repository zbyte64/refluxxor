var gulp = require('gulp');
var to5 = require('gulp-babel');
var mocha = require('gulp-mocha');

gulp.task('build', function() {
  gulp.src('src/**/*.js')
    .pipe(to5())
    .pipe(gulp.dest('dist'))
});

gulp.task('test', function() {
  require("babel/register")();

  gulp.src('tests/**/*test.js')
    .pipe(mocha({reporter: 'nyan'}));
});
