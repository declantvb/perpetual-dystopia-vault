var gulp = require('gulp');
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var nodemon = require('gulp-nodemon');
var del = require('del');

var paths = {
    scripts: [
        'js/game.js',
        'js/utilities.js',
        'js/geometry.js',
        'js/builder.js',
        'js/map.js',
        'js/enums.js',
        'js/screens/*.js',
        'js/screens/**/*.js',
        'js/glyphs/glyph.js',
        'js/glyphs/dynamicglyph.js',
        'js/glyphs/tile.js',
        'js/glyphs/entity.js',
        'js/glyphs/item.js',
        'js/mixins/entity/*.js',
        'js/mixins/actor/*.js',
        'js/mixins/item/*.js',
        'js/repositories/repository.js',
        'js/repositories/entities.js',
        'js/repositories/items.js',
        'js/maps/cave.js',
        'js/maps/bosscavern.js',
    ]
};

gulp.task('clean', function () {
    return del(['dist']);
});

gulp.task('scripts', ['clean'], function () {
    return gulp.src(paths.scripts)
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
    nodemon({
        script: 'server.js',
        ext: 'js html',
        ignore: ['dist'],
        tasks: ['scripts']
    })
})

// The default task (called when you run `gulp` from cli) 
gulp.task('default', ['scripts', 'watch']);