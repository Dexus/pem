'use strict'

module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    standard: {
      options: {
        fix: true
      },
      app: {
        src: [
          '{,lib/,test/}*.js'
        ]
      }
    },
    nodeunit: {
      all: 'test/pem.js'
    }
  })

  // Load the plugin(s)
  grunt.loadNpmTasks('grunt-standard')
  grunt.loadNpmTasks('grunt-contrib-nodeunit')

  // Tasks
  grunt.registerTask('default', ['standard', 'nodeunit'])
}
