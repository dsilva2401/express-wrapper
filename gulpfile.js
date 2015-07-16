var gulp = require('gulp');
var ts = require('gulp-typescript');

gulp.task('build', function () {
	var tsResult = gulp
		.src('src/**/*.ts')
		.pipe(ts({
			noImplicitAny: true,
			module: 'commonjs',
		}));
	return tsResult.js.pipe(gulp.dest('built'));
});
