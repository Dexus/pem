'use strict';

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: ['lib/*.js', 'test/*.js', 'Gruntfile.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        nodeunit: {
            all: 'test/pem.js'
        }
    });

    // Load the plugin(s)
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // Tasks
    grunt.registerTask('default', ['jshint', 'nodeunit']);
};