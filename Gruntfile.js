/// <binding BeforeBuild='build' />
/*global module:false*/
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/**\n * @license <%= pkg.title || pkg.name %> v<%= pkg.version %>\n' +
          ' * (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
          ' * License: <%= pkg.license %>\n' +
          ' * <%= pkg.homepage %>\n */\n',        
        connect: {
            server: {
                options: {
                    port: 8000,
                    hostname: 'localhost',
                    keepalive: true,
                    livereload: true,
                    open: {
                        target:'http://localhost:8000/demo/index.html'
                    }
                }
            }
        },
        concat: {
            options: {
                banner: '<%= banner %>',
                // remove tsd and jshint annotations
                stripBanners: { block: true, line: true },
                sourceMap: false
            },
            js: {
                src: ['src/third-party/code-mirror/*.js', 'src/third-party/code-mirror/addon/*/*.js', 'src/*.js', 'src/serivces/*.js', 'src/directives/*/*.js'],
                dest: 'dist/<%= pkg.name %>.js'
            },
            css: {
                src: ['src/third-party/code-mirror/*.css', 'src/third-party/code-mirror/addon/*/*.css', 'src/directives/*/*.css'],
                dest: 'dist/<%= pkg.name %>.css'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>',
                sourceMap: false
            },
            dist: {
                src: '<%= concat.js.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        wiredep: {
            task: {

                // Point to the files that should be updated when
                // you run `grunt wiredep`
                src: [
                  'demo/index.html'
                ],

                options: {
                    exclude: ["underscore.js"]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-wiredep');
    
    grunt.registerTask('build', ['concat', 'uglify']);
    grunt.registerTask('buildDemo', ['build', 'wiredep']);
    grunt.registerTask('runDemo', ['buildDemo', 'connect']);
};
