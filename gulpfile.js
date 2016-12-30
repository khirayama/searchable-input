'use strict';
var browserify = require('browserify');
var gulp = require('gulp');
var gulpIf = require('gulp-if');
var sass = require('gulp-sass');
var coffee = require('gulp-coffee');
var please = require('gulp-pleeease');
var plumber = require('gulp-plumber');
var watchify = require('watchify');
var browserSync = require('browser-sync');

var SRC_ROOT = 'src';
var DIST_ROOT = 'dist';
var EXAMPLE_ROOT = 'examples';

var options = {
  styles: {
    sass: {
      errLogToConsole: true,
      indentedSyntax: false
    },
    please: {
      minifier: false,
      autoprefixer: {
        browsers: [
          'last 4 version',
          'ie 8',
          'iOS 4',
          'Android 2.3'
        ]
      }
    }
  },
  server: {
    browserSync: {
      server: {
        baseDir: './'
      },
      ui: false,
      notify: false,
      open: false
    }
  }
};

function buildStyles(isWatch) {
  function build() {
    console.log('build: styles');
    return gulp.src('src/**/*.scss')
      .pipe(gulpIf(isWatch, plumber()))
      .pipe(sass(options.styles.sass))
      .pipe(please(options.styles.please))
      .pipe(gulp.dest(DIST_ROOT))
      .pipe(browserSync.reload({ stream: true }));
  }

  if (isWatch) {
    return function() {
      build();
      gulp.watch('src/**/*.scss', build);
    };
  } else {
    return function() {
      build();
    };
  }
}

function buildScripts(isWatch) {
  function build() {
    console.log('build: scripts');
    return gulp.src('src/**/*.coffee')
      .pipe(gulpIf(isWatch, plumber()))
      .pipe(coffee())
      .pipe(gulp.dest(DIST_ROOT))
      .pipe(browserSync.reload({ stream: true }));
  }

  if (isWatch) {
    return function() {
      build();
      gulp.watch('src/**/*.coffee', build);
    };
  } else {
    return function() {
      build();
    };
  }
}

function runServer() {
  return browserSync.init(null, options.server.browserSync);
}

// tasks
gulp.task('build:styles', buildStyles(false));
gulp.task('watch:styles', buildStyles(true));
gulp.task('build:scripts', buildScripts(false));
gulp.task('watch:scripts', buildScripts(true));
gulp.task('build', ['build:styles', 'build:scripts']);
gulp.task('watch', ['watch:styles', 'watch:scripts']);
gulp.task('server', runServer);
gulp.task('develop', ['server', 'watch']);
