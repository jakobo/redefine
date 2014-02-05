/*
Redefine
Copyright 2013 LinkedIn

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied.   See the License for the specific language
governing permissions and limitations under the License.
*/

// gruntfile.js
var path = require('path');

module.exports = function (grunt) {

  grunt.initConfig({
    output_files: {
      main:         './dist/redefine-__REDEFINE__VERSION__/redefine.js',
      main_min:     './dist/redefine-__REDEFINE__VERSION__/redefine.min.js',
      license:      './dist/redefine-__REDEFINE__VERSION__/LICENSE',
      readme:       './dist/redefine-__REDEFINE__VERSION__/README.md'
    },
    last_output_files: {
      main:         './dist/recent/redefine.js',
      main_min:     './dist/recent/redefine.min.js',
      license:      './dist/recent/LICENSE',
      readme:       './dist/recent/README.md'
    },
    zip_locations: {
      archive:      'redefine-__REDEFINE__VERSION__.tgz',
      path:         'redefine-__REDEFINE__VERSION__'
    },
    redefine_version: null,
    pkg: grunt.file.readJSON('package.json'),

    /**
     * clean: clean up temp and artifact directories
     */
    clean: {
      tmp: ['./tmp'],
      dist: ['./dist']
    },

    /**
     * shell: run shell commands. We use this for git ops
     */
    shell: {
      tag: {
        command: 'git describe HEAD',
        options: {
          callback: function(err, stdout, stderr, next) {
            var foot = grunt.config.get('anonymous_footer');
            var output_files = grunt.config.get('output_files');
            var zip_locations = grunt.config.get('zip_locations');
            var version = stdout.replace(/[\s]/g, '');
            var file;
            var type;

            function addVersion(str) {
              return str.replace(/__REDEFINE__VERSION__/g, version);
            }

            // set the redefine version everywhere we need to
            grunt.config.set('redefine_version', version);
            for (type in output_files) {
              file = grunt.config.get('output_files.'+type);
              grunt.config.set('output_files.'+type, addVersion(file));
            }
            for (type in zip_locations) {
              file = grunt.config.get('zip_locations.'+type);
              grunt.config.set('zip_locations.'+type, addVersion(file));
            }

            // set the version in the source
            grunt.file.write('./tmp/redefine.js', addVersion(grunt.file.read('./redefine.js')));

            next();
          }
        }
      },
      venus: {
        command: 'node ./node_modules/venus/bin/venus "tests/" -e ghost',
        options: {
          stdout: true
        }

      },
      venus_browser: {
        command: 'node ./node_modules/venus/bin/venus run -t "tests/"',
        options: {
          stdout: true
        }
      }
    },

    /**
     * copy: copy files that need no modification
     */
    copy: {
      redefine: {
        files: [
          {src: './tmp/redefine.js', dest: '<%=output_files.main %>', filter: 'isFile'},
          {src: './tmp/redefine.min.js', dest: '<%=output_files.main_min %>', filter: 'isFile'},
          {src: './tmp/redefine.js', dest: '<%=last_output_files.main %>', filter: 'isFile'},
          {src: './tmp/redefine.min.js', dest: '<%=last_output_files.main_min %>', filter: 'isFile'}
        ]
      },
      text: {
        files: [
          {src: ['./LICENSE'], dest: '<%= output_files.license %>', filter: 'isFile'},
          {src: ['./README.md'], dest: '<%= output_files.readme %>', filter: 'isFile'},
          {src: ['./LICENSE'], dest: '<%= last_output_files.license %>', filter: 'isFile'},
          {src: ['./README.md'], dest: '<%= last_output_files.readme %>', filter: 'isFile'}
        ]
      }
    },

    /**
     * jshint: perform jshint operations on the code base
     */
    jshint: {
      all: {
        files: {
          src: [
            './gruntfile.js',
            './examples/**/*.js',
            './redefine.js',
            './tests/**/*.js',
            './server.js'
          ]
        },
        jshintrc: './.jshintrc'
      }
    },

    /**
     * uglify: compress code while preserving key identifiers
     */
    uglify: {
      options: {
        // banner: '<%= redefine_header %>\n',
        mangle: {
          except: ['require', 'define', 'redefine', 'undefined']
        }
      },
      redefine: {
        files: {
          './tmp/redefine.min.js': [ './tmp/redefine.js' ]
        }
      }
    },

    /**
     * express: runs our server for examples
     */
    express: {
      server: {
        options: {
          port: 4000,
          debug: true,
          server: path.resolve('./server.js')
        }
      }
    },

    compress: {
      release: {
        options: {
          archive: './dist/<%= zip_locations.archive %>',
          pretty: true
        },
        files: [
          {
            src: '**',
            dest: '/',
            expand: true,
            filter: 'isFile',
            cwd: 'dist/<%= zip_locations.path %>/'
          }
        ]
      }
    }
  });

  // load NPM tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-express');

  grunt.registerTask('build', [
    'jshint',
    'shell:tag',
    'uglify:redefine',
    'copy:redefine',
    'copy:text',
    'clean:tmp'
  ]);

  // Venus is commented out for now until it has
  // access to hot reload and cleanly scans files
  grunt.registerTask('test', [
    'build',
    'shell:venus'
  ]);

  grunt.registerTask('itest', [
    'build',
    'shell:venus_browser'
  ]);

  grunt.registerTask('server', [
    'express:server',
    'express-keepalive'
  ]);

  grunt.registerTask('release', [
    'build',
    'compress:release'
  ]);

  grunt.registerTask('default', ['build']);
};
