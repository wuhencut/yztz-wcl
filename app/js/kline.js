/**
 * Created by JIAQIANG on 2015/10/29.
 */
(function ($, window, undefined) {
    'use strict';
    var dom = X.dom;

    var COLOR_W = '#1C262F', //外线
        COLOR_S = '#1C262F', //网格线
        COLOR_T = '#999999',
        COLOR_OPEN_MA = '#E8003F', // 涨，阳线
        COLOR_OPEN_REF = '#41FFAD', // 跌，阴线
        COLOR_OPEN_MID = '#FFFFFF'; // 平

    var Kline = function (opts) {
        this.data = [];
        this.days = 0;
        this.unitWidth = 8;//单位宽度 一个K线图的宽度，但是实际path绘图路径中显示只有6像素，10只显示8像素，猜测应该是每个K线图之间的空隙

        this.wrap = document.getElementById(opts.wrap) || document.body;
        this.svg = dom.createNS('svg');
        this.baseG = dom.createNS('g');//框架分组
        this.chartG = dom.createNS('g');//图形分组
        this.textG = dom.createNS('g');//标记分组
        this.cacheEl = [];

        this.init();
    };
    Kline.prototype = {
        init: function () {
            dom.attr(this.svg, {'xmlns': 'http://www.w3.org/2000/svg', 'version': '1.1'});
            this.svg.appendChild(this.baseG);
            this.svg.appendChild(this.chartG);
            this.svg.appendChild(this.textG);
            this.wrap.appendChild(this.svg);
            //计算布局框架
            this.resize();
            //画主面板
            this._drawFrame();
            //画价格线
            this._drawBasePriceLine();
            //将数据画到chart上
            this.draw();
        },
        //重新计算高和宽，只有刷新页面才会重新计算高宽，所以在不刷心的情况下变化宽度，svg的图并不会自适应
        resize: function () {
            var padding = 0;
            this.svgWidth = dom.getSize(this.wrap).width;
            this.svgHeight = dom.getSize(this.wrap).height;
            this.kChartBox = {
                x: {
                    begin: padding,
                    end: this.svgWidth - padding,
                    width: this.svgWidth - padding * 2
                },
                y: {
                    begin: padding,
                    end: this.svgHeight - padding - 20,
                    height: this.svgHeight - padding * 2 - 20
                }
            };
            //this.days = this.kChartBox.x.width / this.unitWidth | 0;
        },
        draw: function (data) {
            this.days = this.kChartBox.x.width / this.unitWidth | 0;  //算出一个页面的宽度可以画多少个K线图
            if (data && data.length) {
                //取data和days的较小值，data长度大于页面可以画的最长K线图数，则取后者。data过长，不会全画，只画页面能画下的最近days长度的数据
                this.days = this._getDays(data.length, this.days);
                this.data = data.slice(data.length - this.days);
            }
            this._draw();
        },
        _drawFrame: function () {
            var g, pbox, bx, by, d, t, l, r, b;
            g = this.baseG;
            pbox = this.kChartBox;
            bx = pbox.x;
            by = pbox.y;
            d = '';
            t = 'M' + bx.begin + ',' + (by.begin - 0.5) + 'L' + bx.end + ',' + (by.begin - 0.5);
            r = 'M' + (bx.end - 0.5) + ',' + by.begin + 'L' + (bx.end - 0.5) + ',' + by.end;
            b = 'M' + bx.end + ',' + (by.end - 0.5) + 'L' + bx.begin + ',' + (by.end - 0.5);
            l = 'M' + (bx.begin - 0.5) + ',' + by.end + 'L' + (bx.begin - 0.5) + ',' + by.begin;
            d = t + b;
            var path = this._path(d, COLOR_W, 'none', '');
            dom.append(g, path);
            //g.path().attr({'path': d, stroke: COLOR_W});
        },
        //画每个横条价格线
        _drawBasePriceLine: function () {
            var PART = 4,
                g = this.baseG,
                bx = this.kChartBox.x,
                by = this.kChartBox.y;
            //单个网格的高度
            var h = (by.height - 2) / PART;//去掉上下1px边框
            for (var i = 1; i < PART; i++) {
                var x1 = bx.begin + 1,
                    y1 = ((by.begin + 1 + i * h) | 0) - 0.5,
                    x2 = bx.end,
                    y2 = y1;
                var d = 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2;
                var path = this._path(d, COLOR_S, 'none', '');//, '3,1'
                dom.append(g, path);
                //g.path().attr({'path': d, stroke: COLOR_S, 'stroke-dasharray': '-'});
            }
        },
        _clear: function () {
            $.each(this.cacheEl, function (i, el) {
                el && dom.remove(el);
            });
            this.cacheEl.length = 0;
        },
        _draw: function () {
            this._calcMaxMin();
            this._clear();
            if (this.data.length) {
                this._drawDateLine();
                this._drawChart();
                this._drawChartData();
            }
        },
        //计算data数组对象里，最大的maxPrice值，最小的minPrice值
        _calcMaxMin: function () {
            var t = this;
            t.maxPrice = 0;
            t.minPrice = 0;
            $.each(this.data, function (i, o) {
                var arr = [];
                t.maxPrice && arr.push(t.maxPrice);
                t.minPrice && arr.push(t.minPrice);
                arr.push(o.high);
                arr.push(o.low);
                t.maxPrice = Math.max.apply(Math, arr);
                t.minPrice = Math.min.apply(Math, arr);
            });
        },
        //unitDay:一个网格画几个K线图
        _drawDateLine: function () {
            var t = this, g = this.baseG, box = t.kChartBox, bx = box.x, by = box.y,
                data = t.data, unitDay = 7, totalDay = data.length / unitDay | 0, width = t.unitWidth, w = width - 2;
            var time = '', x, x1, x2, y1, y2, d, path, dateTextEl;
            for (var i = 0; i < totalDay; i++) {
                d = '';
                time = data[i * unitDay]['time'];
                time = processDate(time);
                x = t._c2x_k(i * unitDay, width);
                x1 = x2 = t.half(x + w / 2);
                y1 = by.begin + 1;
                y2 = by.end - 1;
                d = 'M' + x1 + ',' + y1 + ',' + x2 + ',' + y2;
                path = t._path(d, COLOR_S, 'none', '');//, '3,1'
                dom.append(g, path);
                dateTextEl = t._text(g, x2, y2 + 15, time, COLOR_T);
                t.cacheEl.push(path, dateTextEl);
            }

            function processDate(dateStr) {
                if (dateStr.length != 8)return;
                var date = new Date();
                var y = dateStr.substring(0, 4) - 0, m = dateStr.substring(4, 6) - 0, d = dateStr.substring(6) - 0;
                var year = date.getFullYear();
                if (y != year) {
                    y += '';
                    y = y.substring(2, 4) + '/';
                } else {
                    y = '';
                }
                return y + m + '/' + d;
            }

        },
        _drawChart: function () {
            var t = this, g = this.chartG, width = this.unitWidth;
            $.each(this.data, function (i, o) {
                var path = '', color = o.price > o.open ? COLOR_OPEN_MA : o.price < o.open ? COLOR_OPEN_REF : COLOR_OPEN_MID;
                var x, y, w, h;
                x = t._c2x_k(i, width);
                w = width - 2;
                y = t._c2y_k(Math.max(o.open, o.price));
                h = t._c2y_k(Math.min(o.open, o.price)) - y;
                path += 'M' + x.toFixed(5) + ',' + y.toFixed(2) + 'L' + (x + w).toFixed(2) + ',' + (y.toFixed(2)) + 'L' + (x + w).toFixed(2) + ',' + (y + h).toFixed(2) + 'L' + (x.toFixed(2)) + ',' + (y + h).toFixed(2) + 'Z';
                var x1, y1, x2, y2;
                x1 = x2 = (x + w / 2);
                y1 = t._c2y_k(o.high);
                y2 = t._c2y_k(o.low);
                path += 'M' + x1.toFixed(2) + ',' + y1.toFixed(2) + 'L' + x2.toFixed(2) + ',' + y2.toFixed(2);
                path = path.replace(/\.\d+/g, '.5');
                var _path = t._path(path, color, color, '');
                dom.append(g, _path);
                t.cacheEl.push(_path);
            });
        },
        _drawChartData: function () {
            var t = this, svg = t.textG, box = t.kChartBox, bx = box.x, by = box.y, cacheEl = t.cacheEl, max = t.maxPrice, min = t.minPrice;
            var mid = (max - min) / 2 + min;
            var x = bx.end, yMin = by.end - 3, yMax = by.begin + 12, yMid = by.begin + (by.height / 2) - 3;
            var dataMaxEl = t._text(svg, x, yMax, max.toFixed(2), COLOR_T, 'end');
            var dataMinEl = t._text(svg, x, yMin, min.toFixed(2), COLOR_T, 'end');
            var dataMidEl = t._text(svg, x, yMid, mid.toFixed(2), COLOR_T, 'end');
            cacheEl.push(dataMaxEl, dataMinEl, dataMidEl);
        },
        _c2x_k: function (i, w) {
            var bx = this.kChartBox.x;
            return bx.begin + i * w + 1;
        },
        _c2y_k: function (p) {
            var by = this.kChartBox.y, bp = this.maxPrice, ep = this.minPrice, absp = 0, h = by.height - 2;
            absp = bp - ep;
            if (absp == 0) {
                return h / 2;
            }
            return by.begin + (bp - p) / absp * h;
        },
        _path: function (d, stroke, fill, opacity, dash) {
            var attrObj = {}, path = dom.createNS('path');
            if (d) {
                attrObj['d'] = d;
            }
            if (stroke) {
                attrObj['stroke'] = stroke;
            }
            if (fill) {
                attrObj['fill'] = fill;
            }
            if (opacity) {
                attrObj['fill-opacity'] = opacity;
            }
            if (dash) {
                attrObj['stroke-dasharray'] = dash;
            }
            dom.attr(path, attrObj);
            return path;
        },
        _text: function (g, x, y, txt, color, anchor, refEl) {
            var elem = dom.createNS('text');
            dom.attr(elem, {
                x: x,
                y: y,
                fill: color || COLOR_T,
                style: {
                    'text-anchor': anchor || 'start',//定位文本的水平位置：start ,middle, alignment
                    'font-size': '10px'
                }
            });
            dom.textContent(elem, txt);
            refEl ? dom.insert(g, elem, refEl) : dom.append(g, elem);
            return elem;
        },
        _getDays: function (len, days) {
            if (len === 0) {
                len = days;
            }
            if (days === 0) {
                days = len;
            }
            return Math.min(len, days);
        },
        half: function (n) {
            return (n | 0) + 0.5;
        }
    };
    X.Kline = Kline;
})(jQuery, window);