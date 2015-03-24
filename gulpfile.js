var gulp = require('gulp');
var to5 = require('gulp-babel');

gulp.task('build', function() {
  gulp.src('src/**/*.js')
    .pipe(to5({playground: true}))
    .pipe(gulp.dest('dist'))
});
