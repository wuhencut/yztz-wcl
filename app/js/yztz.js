/**
 * Created by JIAQIANG on 2015/11/19.
 */
var X = X || {};

X.domain = 'yztz.com';
X.debug = true;
X.code = {
    argument: "301",
    loseSecurityCode: "302",
    unauthorized: "405",
    nameUnsettled: "407",
    notifyInterval: "601",
    schemeError: "700",
    balanceShortage: "800",
    rebate: "801",
    system: "900"
};

(function () {
    function isType(type) {
        return function (obj) {
            return Object.prototype.toString.call(obj) == "[object " + type + "]"
        }
    }

    var isObject = isType("Object");
    var isString = isType("String");
    var isNumber = isType("Number");
    var isDate = isType("Date");
    var isArray = Array.isArray || isType("Array");
    var isFunction = isType("Function");
    var isUndefined = isType("Undefined");
    var log = function () {
        if (X.debug) {
            console.log.apply(console, arguments);
        }
    };
    X.log = log,
        X.isObject = isObject,
        X.isString = isString,
        X.isNumber = isNumber,
        X.isDate = isDate,
        X.isArray = isArray,
        X.isFunction = isFunction,
        X.isUndefined = isUndefined;
})();

(function () {
    //获取当前日期的毫秒数
    function getTime() {
        return getDate().getTime();
    }

    //获取参数对应的时间对象，若没有传参则为当前日期
    function getDate(t) {
        if (t)return new Date(t);
        return new Date();
    }

    //转换成整数
    function toInt(s) {
        return parseInt(s);
    }

    //转换成浮点数
    function toFloat(s) {
        return parseFloat(s);
    }

    //是否是整数
    function isInt(o) {
        return X.isNumber(o) && Math.round(o) == o;
    }

    // 格式化数字，如1234567 --> 1,234,567
    function formatNumber(n) {
        if (!X.isNumber(n)) {
            return n + '';
        }
        var f = n < 0 ? '-' : '',
            s = Math.abs(n) + '',
            i = s.length,
            r = '',
            c = 0;

        while (i-- > 0) {
            c++;
            r = s.charAt(i) + r;
            if (c % 3 === 0 && i !== 0) {
                c = 0;
                r = ',' + r;
            }
        }
        return f + r;
    }

    // 格式化金额，小数点保留
    function money(m, n) {
        var num = m | 0,
            n = n || 2,
            m = m + '',
            i = m.indexOf('.');
        if (n < 1)n = 2;
        if (n > 9) n = 9;
        if (i === -1) {
            return formatNumber(num) + '.' + '0000000000'.substr(0, n);
        } else {
            m = m + '0000000000';
            return formatNumber(num) + (m.substr(i, n + 1));
        }
    }


    function parse2fill0(m){
        m = parseInt(Math.round(m * 10000) /100) /100;
        m = X.money(m);
        return m;
    }

    function parse2(m){
        m = parseInt(Math.round(m * 10000) /100) /100;
        return m;
    }

    // 不够2位，用0填充
    function fill(v) {
        return (v < 10 ? '0' : '') + v;
    }

    //格式化日期
    //value可以为实际日期或者能格式化为日期的字符串
    //pattern Y-M-D h:m:s
    function formatDate(value, pattern) {

        pattern = pattern || 'Y-M-D h:m:s';

        var date = new Date(), hour = date.getTimezoneOffset(), time;
        if (X.isDate(value) && value.getTime) {
            date = value;
        } else if (X.isNumber(value)) {
            time = value + (480 + hour) * 60000;
            date = new Date(time);
        }

        var len = pattern.length,
            ret = pattern;

        for (var i = 0; i < len; i++) {
            switch (pattern.charAt(i)) {
                case 'Y':
                    ret = ret.replace(/Y/g, fill(date.getFullYear()));
                    break;
                case 'y':
                    ret = ret.replace(/y/g, fill(date.getFullYear()).substring(2));
                    break;
                case 'M':
                    ret = ret.replace(/M/g, fill(date.getMonth() + 1));
                    break;
                case 'D':
                    ret = ret.replace(/D/g, fill(date.getDate()));
                    break;
                case 'h':
                    ret = ret.replace(/h/g, fill(date.getHours()));
                    break;
                case 'm':
                    ret = ret.replace(/m/g, fill(date.getMinutes()));
                    break;
                case 's':
                    ret = ret.replace(/s/g, fill(date.getSeconds()));
                    break;
            }
        }
        return ret;
    }

    //缩减数字
    function sketchNumber(n, m) {
        m = m || 0;
        if (n >= 100000000) {
            return (n / 100000000).toFixed(m) + '亿';
        }
        if (n >= 10000) {
            return (n / 10000).toFixed(m) + '万';
        }
        return n;
    }

    //是否为身份证号码
    function isIdentityNumber(number) {
        if ($.trim(number) == '' || !/^[0-9]{17}[0-9X]$/.test(number)) {
            return false;
        }
        var weights = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
        var parityBits = new Array("1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2");
        var power = 0;
        for (var i = 0; i < 17; i++) {
            power += parseInt(number.charAt(i), 10) * weights[i];
        }
        return parityBits[power % 11] == number.substr(17);
    }

    //是否为手机号码
    function isMobile(mobile) {
        return mobile && /^1[34578]\d{9}$/.test(mobile);
    }

    //是否为电子邮箱
    function isEmail(email) {
        return email && /^[0-9a-zA-Z_\.\-]+@[0-9a-zA-Z_\-]+\.\w{1,5}(\.\w{1,5})?$/.test(email);
    }

    //是否为银行卡
    function isBankCard(cardNumber) {
        return cardNumber && /^\d{15,30}$/.test(cardNumber);
    }

    //是否为中文名字
    function isChinaName(name) {
        return /^[\u4e00-\u9fa5]{2,}$/.test(name);
    }

    //是否为图片
    function isImg(filename) {
        var imgs = ['.png', '.bmp', '.jpg', '.jpeg', '.gif'];
        for (var i = 0; i < imgs.length; i++) {
            if ($.trim(filename).toLowerCase().endsWith(imgs[i]))
                return true;
        }
        return false;
    }

    function isNum(data, isPositive) {
        return isPositive ? /^\d+(\.\d+)?$/.test(data) && parseFloat(data) > 0 : /^(-)?\d+(\.\d+)?$/.test(data);
    }

    function isMoney(data, isPositive) {
        return isPositive ? /^\d+(\.\d{1,2})?$/.test(data) && parseFloat(data) > 0 : /^(-)?\d+(\.\d{1,2})?$/.test(data);
    }

    function isInteger(data, isPositive) {
        return isPositive ? /^\d+$/.test(data) && parseInt(data, 10) > 0 : /^(-)?\d+$/.test(data);
    }

    function strLen(s) {
        return s.replace(/[^\x00-\xff]/g, "**").length
    }

    function maskName(name) {
        var len = name.length;
        return name.substr(0, len - 1) + '×';

    }

    X.getTime = getTime,
        X.getDate = getDate,
        X.toInt = toInt,
        X.toFloat = toFloat,
        X.isInt = isInt,
        X.formatNumber = formatNumber,
        X.money = money,
        X.fill = fill,
        X.formatDate = formatDate,
        X.sketchNumber = sketchNumber,
        X.strLen = strLen,
        X.isIdentityNumber = isIdentityNumber,
        X.isMobile = isMobile,
        X.isEmail = isEmail,
        X.isBankCard = isBankCard,
        X.isImg = isImg,
        X.isNum = isNum,
        X.isMoney = isMoney,
        X.isInteger = isInteger,
        X.maskName = maskName,
        X.isChinaName = isChinaName,
        X.parse2fill0 = parse2fill0,
        X.parse2 = parse2;
})();


(function () {
    var engine = {
        //引擎ID
        id: null,
        //执行间隔
        interval: 100,
        //任务列表
        tasks: {},
        taskID: 0,
        //启动引擎
        start: function () {
            var t = this;
            if (t.id || t.tasks.length == 0) return;
            t._exec();
            t.id = setInterval(function () {
                t._exec();
            }, t.interval);
        },
        //停止引擎
        stop: function () {
            clearInterval(this.id);
            this.id = null;
        },
        //执行任务
        _exec: function () {
            var t = this;
            var taskIDs = Object.keys(t.tasks);
            if (!taskIDs.length)return;
            var now = Date.now();
            taskIDs.forEach(function (id) {
                var task = t.tasks[id];
                if (task == null) {
                    return;
                }
                if (now - task.time >= task.wait) {
                    var count = task.count;
                    if (count > 0) {
                        count--;
                    }
                    task.fn.call();
                    if (count === -1 || count > 0) {
                        // 时间重置，需要放在任务执行之后，
                        // 确保每次任务执行时间的间隔一致
                        task.time = Date.now();
                        task.count = count;
                    } else {
                        task = null;
                        delete t.tasks[id];
                    }
                }
            });
        },
        //添加任务
        addTask: function (fn, wait, count) {
            var t = this;
            t.taskID++;
            if (wait < 100)wait = 100;
            count = count || -1;
            t.tasks[t.taskID] = {
                fn: fn,
                wait: wait,
                count: count,
                time: Date.now()
            };
            return t.taskID;
        },
        removeTask: function (id) {
            if (!id) {
                this.tasks = {};
            }
            this.tasks[id] && delete this.tasks[id]
        },
        destroy: function () {
            this.removeTask();
            this.stop();
        }
    };
    X.engine = engine;
}());

//UI组件
(function ($, window, undefined) {
    var tipHtml, loadHtml;

    var tip = function (msg) {
        if (tipHtml != undefined) {
            return;
        }
        tipHtml = '<div class="db-tip-wrap"><div class="db-tip">' + msg + '</div></div>';
        var $html = $(tipHtml);
        $('body').append($html);
        setTimeout(function () {
            $html.remove();
            tipHtml = undefined;
        }, 2000);
    };

    var loading = {
        show: function () {
            if (loadHtml != undefined) {
                return;
            }
            var html = '<div id="loading"><div class="load-wrap"><p></p></div></div>';
            loadHtml = $(html);
            $('body').append(loadHtml);
        },
        hide: function () {
            if (loadHtml != undefined) {
                loadHtml.remove();
                loadHtml = undefined;
            }
        }
    };

    var zi = 10000;//弹窗基本层级

    var dialog = {
        dbs: [],
        open: function (content, ps) {
            ps = $.extend({title: '', notify: null}, ps || {});
            //db = [索引，背景，内容，回调]
            var t = this, bgi = t._zi(), di = t._zi(), db = [di], size = t._ps(), h, hh = size.height, dt = -10;
            if (ps.title != '') {
                content = '<div class="db-header">' + ps.title + '</div>' + content;
            }
            if (content) {
                content = content.replace(new RegExp('#di#', 'g'), di);
            }
            db[1] = $('<div class="db-bg"></div>');
            db[1].css('zIndex', bgi);
            db[1].attr('id', 'dialog-bg-' + di);
            if (ps.type === 'info') {
                db[1].bind('click', function () {
                    t.close(di, 0);
                });
            }

            db[2] = $('<div class="db-wrap"></div>');
            db[2].css('zIndex', di);
            db[2].html(content);
            db[3] = ps.notify;
            $('body').append(db[1], db[2]);
            h = db[2].height();
            dt = Math.round((hh - h) / 2 + dt);
            if (dt < 10)dt = 10;
            db[2].css('zIndex', di);
            db[2].css('top', dt + 'px');
            db[2].show();
            t.dbs.push(db);
        },
        info: function (title,msg) {
            var t = this, s = '';
            s += '<div class="db-title" style="padding: 16px 30px 11px 30px;border-bottom:1px solid #CCCCCC;font-size:16px;">'+ title + '</div>';
            s += '<div class="db-content"><div style="padding:10px 30px 30px 30px;">' + msg + '</div></div>';
            t.open(s, {type: 'info'});
        },
        alert: function (msg, ps) {
            ps = $.extend({title: '', sureBtn: '确定'}, ps || {});
            ps.type = 'alert';
            var t = this, s = '', txtX;
            txtX = ps.title == '' ? 'center' : 'left';
            s += '<div class="db-content"><div style="padding: 15px 20px 20px; text-align: ' + txtX + ';">' + msg + '</div></div>';

            s += '<div class="db-footer"><ul>';
            s += '<li><a href="javascript:;" onclick="X.dialog.close(#di#,0);">' + ps.sureBtn + '</a></li>';
            s += '</ul></div>';
            t.open(s, ps);
        },
        confirm: function (msg, ps) {
            ps = $.extend({title: '', sureBtn: '确定', cancelBtn: '取消'}, ps || {});
            ps.type = 'confirm';
            var t = this, s = '', txtX;
            txtX = ps.title == '' ? 'center' : 'left';
            s += '<div class="db-content"><div style="padding: 15px 20px 20px; text-align: ' + txtX + ';">' + msg + '</div></div>';

            s += '<div class="db-footer"><ul>';
            s += '<li><a href="javascript:;" onclick="X.dialog.close(#di#,0);">' + ps.cancelBtn + '</a></li>';
            s += '<li><a href="javascript:;" onclick="X.dialog.close(#di#,1);">' + ps.sureBtn + '</a></li>';
            s += '</ul></div>';
            t.open(s, ps);
        },
        close: function (di, nt) {
            var t = this, b;
            nt = nt || 0;
            if (di != undefined && typeof di === 'number') {
                b = t.get(di);
                if (b) {
                    //如果有回调则执行回调，否则关闭弹窗并结束
                    if (b[3]) {
                        //如果回调标识不为-1，则回调执行完成直接关闭，如果回调标识为-1，则代表人工手动干预关闭时机。
                        if (nt != -1) {
                            b[3](nt);
                            t.get(di, true);
                            b[2].remove();
                            b[1].remove();
                        } else {
                            b[3](nt, function () {
                                t.get(di, true);
                                b[2].remove();
                                b[1].remove();
                            });
                        }
                    } else {
                        t.get(di, true);
                        b[2].remove();
                        b[1].remove();
                    }
                }
            } else {
                var l = t.dbs.length;
                if (l > 0)t.close(t.dbs[l - 1][0], 0);
            }
        },
        get: function (di, del) {
            var t = this, bs = t.dbs, db;
            for (var i = 0; i < bs.length; i++) {
                if (bs[i][0] == di) {
                    db = bs[i];
                    if (del)
                        bs.splice(i, 1);
                    break;
                }
            }
            return db;
        },
        _zi: function () {
            return zi++;
        },
        _ps: function () {
            var h = $(window).height(), w = $(window).width();
            return {height: h, width: w};
        }
    };

    X.tip = tip, X.loading = loading, X.dialog = dialog;
}(jQuery, window));

(function () {
    var clipboard = {
        init: function (str) {
            this.click(str);
        },
        click: function (str) {
            var t = this;
            if(!str){
                $("span.copy").on("click", function () {
                    var tar = t.copy($(this).prev()[0]);
                    tar && X.tip("复制成功");
                })
            }else{
                $("span.copy-target").on("click", function () {
                    var tar = t.copy($('.copy')[0]);
                    tar && X.tip("复制成功");
                })
            }
        },
        copy: function (s) {
            this.focus(s);
            var succ = this.way("copy");
            return succ;
        },
        way: function (e) {
            var co;
            try {
                co = document.execCommand(e)
            } catch (t) {
                co = !1
            }
            return co;
        },
        focus: function (e) {
            var cont;
            if ("INPUT" === e.nodeName || "TEXTAREA" === e.nodeName)
                e.focus(),
                    e.setSelectionRange(0, e.value.length),
                    cont = e.value;
            else {
                if (e.hasAttribute('contenteditable')) {
                    e.focus();
                }
                var getSel = window.getSelection(),
                    createR = document.createRange();
                createR.selectNodeContents(e),
                    getSel.removeAllRanges(),
                    getSel.addRange(createR),
                    cont = getSel.toString()
            }
            return cont;
        }
    };
    X.clipboard = clipboard;
}());

(function ($) {
    var slide = {
        init: function (el, arr, $swipe) {
            var $el = $("#" + el);
            this.el = $el;
            this.wrap = $el.find("ul.slide-wrap");
            this.arr = arr;
            this.len = arr.length;
            this.index = 0;

            this.initHtml();
            this.createMenu();

            var t = this;
            this.timer = setTimeout(function () {
                t.swipe('L');
            }, 3000);

            var startX, l = Date.now();
            $swipe.bind($el, {
                'start': function (coords, event) {
                    startX = coords.x;
                },
                'end': function (coords, event) {
                    var ll = Date.now();
                    if (ll - l > 500) {
                        l = ll;
                        var diff = coords.x - startX;
                        if (diff > 10) {
                            t.swipe('R');
                        } else if (diff < -10) {
                            t.swipe('L');
                        }
                    }
                }
            });
        },
        initHtml: function () {
            var t = this, arr = t.arr, $el = t.el, wrap = t.wrap;
            var inner = '';
            for (var i in arr) {
                var item = arr[i];
                if (item.link) {
                    // item.link = item.link + '?backURL=/index';
                    if(item.btnText && item.btnLink){
                        var btnText = encodeURIComponent(item.btnText) , btnLink = encodeURIComponent(item.btnLink);
                        item.link = item.link + '&btnText=' + btnText + '&btnLink='+ btnLink;
                    }
                    inner += '<li><a href="' + item.link + '"><img src="' + item.imgUrl + '"/></a></li>'
                } else {
                    inner += '<li><img src="' + item.imgUrl + '"/></li>'
                }
            }
            wrap.append(inner);
            var li = $('ul.slide-wrap > li');
            li.css('left', '100%');
            li.eq(0).css('left', 0);
            this.li = li;
        },
        createMenu: function () {
            var t = this, len = t.len, $el = t.el;
            var menu = '<ul class="slide-menu">';
            for (var i = 0; i < len; i++) {
                menu += '<li></li>';
            }
            menu += '</ul>';
            $el.append(menu);
            var $menu = $('.slide-menu > li');
            $menu.eq(0).addClass('curr');
            this.menu = $menu;
        },
        swipe: function (dir) {
            var t = this, index = t.index, len = t.len, li = t.li, menu = t.menu;
            t.clearTimer();
            var next = dir == 'L' ? index + 1 : index - 1;
            next = next < 0 ? len - 1 : next > len - 1 ? 0 : next;
            li.eq(index).animate({'left': dir == 'L' ? '-100%' : '100%'});
            menu.removeClass('curr');
            menu.eq(next).addClass('curr');
            li.eq(next).css({'left': dir == 'L' ? '100%' : '-100%'}).animate({'left': '0'}, function () {
                t.index = next;
            });
            t.timer = setTimeout(function () {
                t.swipe('L');
            }, 3000);
        },
        clearTimer: function () {
            var t = this, timer = t.timer;
            if (timer) {
                clearTimeout(timer);
            }
        }
    };
    X.slide = slide;
}(angular.element));