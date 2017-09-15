/**
 * Created by JIAQIANG on 2016/05/12.
 */
(function () {
    var ua = navigator.userAgent,
        isOpen = false,
        url = 'http://www.yztz.com/appstore/info.html';
    var isWX = (ua.indexOf("MicroMessenger") > -1),
        android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
        ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
        ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
        iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);
    if (isOpen && !(isWX || android || iphone || ipad || ipod)) {
        window.location.href = url;
        return;
    }
    //type = 'dev'||'online'
    var type = 'online', rootURL = '/app/', i, headEl = document.getElementsByTagName('head')[0], sync = true, appVersionTag = '?v=' + new Date().getTime();
    var styles = {
        'dev': ['css/merge.css'],
        'online': ['css/merge.min.css']
    };
    var scripts = {
        'dev': [
            'lib/jquery/jquery-2.0.3.min.js',
            'lib/angular/angular.min.js',
            'lib/angular/angular-route.min.js',
            'lib/angular/angular-cookies.min.js',
            'lib/angular/angular-animate.min.js',
            'lib/angular/angular-touch.min.js',
            'js/yztz.js',
            'js/dom.js',
            'js/sline.js',
            'js/kline.js',
            'js/tick.js',
            'js/app.js',
            'js/controllers.js',
            'js/services.js',
            'js/directives.js'
        ],
        'online': [
            'lib/jquery/jquery-2.0.3.min.js',
            'lib/angular/angular.min.js',
            'lib/angular/angular-route.min.js',
            'lib/angular/angular-cookies.min.js',
            'lib/angular/angular-animate.min.js',
            'lib/angular/angular-touch.min.js',
            'js/yztz.min.js',
            'js/app.min.js'
        ]
    };
    for (i in styles[type]) {
        addTag('link', {rel: 'stylesheet', href: rootURL + styles[type][i] + appVersionTag, type: 'text/css'});
    }
    for (i in scripts[type]) {
        addTag('script', {src: rootURL + scripts[type][i] + appVersionTag}, sync);
    }

    function addTag(name, attributes, sync) {
        var el = document.createElement(name), attrName;

        for (attrName in attributes) {
            el.setAttribute(attrName, attributes[attrName]);
        }

        sync ? document.write(outerHTML(el)) : headEl.appendChild(el);
    }

    function outerHTML(node) {
        // if IE, Chrome take the internal method otherwise build one
        return node.outerHTML || (function (n) {
                var div = document.createElement('div'), h;
                div.appendChild(n);
                h = div.innerHTML;
                div = null;
                return h;
            })(node);
    }
})();
(function(){
    window.zhuge = window.zhuge || [];
    window.zhuge.methods = "_init debug identify track trackLink trackForm page".split(" ");
    window.zhuge.factory = function(b) {
        return function() {
            var a = Array.prototype.slice.call(arguments);
            a.unshift(b);
            window.zhuge.push(a);
            return window.zhuge;
        }
    };
    for (var i = 0; i < window.zhuge.methods.length; i++) {
        var key = window.zhuge.methods[i];
        window.zhuge[key] = window.zhuge.factory(key);
    }
    window.zhuge.load = function(b, x) {
        if (!document.getElementById("zhuge-js")) {
            var a = document.createElement("script");
            var verDate = new Date();
            var verStr = verDate.getFullYear().toString()
                + verDate.getMonth().toString() + verDate.getDate().toString();

            a.type = "text/javascript";
            a.id = "zhuge-js";
            a.async = !0;
            a.src = (location.protocol == 'http:' ? "http://sdk.zhugeio.com/zhuge-lastest.min.js?v=" : 'https://zgsdk.zhugeio.com/zhuge-lastest.min.js?v=') + verStr;
            var c = document.getElementsByTagName("script")[0];
            c.parentNode.insertBefore(a, c);
            window.zhuge._init(b, x)
        }
    };
    window.zhuge.load('d6d83614976f4ae1a13064436dc56627');
}());