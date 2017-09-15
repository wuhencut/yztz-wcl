//包装函数
module.exports = function (grunt) {
    //任务配置，所有任务参数都配置在这里
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cssmin: {
            target: {
                options: {
                    rebase: true//该设置可以更新其他子类里的相对路径
                },
                files: [{
                    expand: true,
                    cwd: 'app/css/',
                    src: 'merge.css',
                    dest: 'app/css',
                    ext: '.min.css'
                }]
            }
        },
        uglify:{
            options: {
                banner: '/*! zhoujiaqiang | shilei | liuxiaolin; last modify： <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                //footer:'\n/*! last modify： <%= grunt.template.today("yyyy-mm-dd") %> */'
            },
            //任务一：压缩js，不混淆变量名，不保留注释，添加banner和footer
            minapp: {
                options: {
                    mangle: false, //不混淆变量名
                    preserveComments: false //不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
                    //footer:'\n/*! last modify： <%= grunt.template.today("yyyy-mm-dd") %> */'//添加footer
                },
                files: {
                    'app/js/app.min.js': [
                        'app/js/app.js',
                        'app/js/controllers.js',
                        'app/js/services.js',
                        'app/js/directives.js'
                    ]
                }
            },
            //任务二：压缩b.js，输出压缩信息
            minyztz:{
                files: {
                    'app/js/yztz.min.js': [
                        'app/js/yztz.js',
                        'app/js/dom.js',
                        'app/js/sline.js',
                        'app/js/kline.js',
                        'app/js/tick.js'
                    ],
                    'app/js/index.min.js': [
                        'app/js/index.js'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    //
    grunt.registerTask('minapp', ['uglify:minapp']);
    grunt.registerTask('minyztz', ['uglify:minyztz']);

    //注册任务，在命令行执行grunt命令执行的任务
    grunt.registerTask('default', ['cssmin', 'uglify']);
};