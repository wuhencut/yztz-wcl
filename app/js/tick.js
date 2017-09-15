/**
 * Created by JIAQIANG on 2016/05/26.
 */
var X = window.X || {};
(function () {

    function isString(s) {
        return typeof s === 'string';
    }

    function isObject(obj) {
        return obj && typeof obj === 'object';
    }

    function isNumber(n) {
        return typeof n === 'number';
    }

    function defined(obj) {
        return obj !== undefined && obj !== null;
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    var Tick = function (opts) {
        this.init.call(this, opts);
    };

    var COLOR_P = '#1C81DB', //闪电
        COLOR_L = '#F8F8F8',
        COLOR_T = '#999999';

    Tick.prototype = {
        init: function (opts) {
            this.wrap = document.getElementById(opts.wrap) || document.body;
            this.wrap.innerHTML = '';
            this.svgElement = new SVGElement();
            this.svg = this.svgElement.createElement('svg');
            this.baseG = this.svgElement.createElement('g');
            this.markG = this.svgElement.createElement('g');
            this.pathG = this.svgElement.createElement('g');
            this.svgElement.attr(this.svg, {
                'xmlns': 'http://www.w3.org/2000/svg', 'version': '1.1'
            });
            this.svg.appendChild(this.baseG);
            this.svg.appendChild(this.markG);
            this.svg.appendChild(this.pathG);
            this.wrap.appendChild(this.svg);

            this.cacheEl = [];
            this.data = [];
            this.cacheData = {};
            this.dataLen = opts.dataLen || 200;
            this.unit = opts.unit || 0.01;
            this.multiple = opts.multiple || 2;
            this.basePrice = 0;
            this.minPricePeriod = this.unit * this.multiple;
            this.pricePeriod = 6;
            this.beyond = 1;//最大最小值超过标准线的倍数

            this.getChartSize();
            this.drawFrame();
        },
        getChartSize: function () {
            var t = this, wrap = t.wrap, svg = t.svg, svgElement = t.svgElement, padding = 0;
            this.svgWidth = svgElement.getSize(wrap).width;
            this.svgHeight = svgElement.getSize(wrap).height;

            this.chartBox = {
                x: {
                    begin: padding,
                    end: t.svgWidth - padding,
                    width: t.svgWidth - padding * 2
                },
                y: {
                    begin: padding,
                    end: t.svgHeight - padding,
                    height: t.svgHeight - padding * 2
                }
            };
            svgElement.attr(svg, {
                width: t.svgWidth,
                height: t.svgHeight
            });
        },
        drawFrame: function () {
            var t = this, chartBox = t.chartBox, bx = chartBox.x, by = chartBox.y, g = t.baseG, svgElement = t.svgElement;
            var x1 = bx.begin, x2 = bx.end, y1 = by.begin, y2 = by.end - 1;
            var clear = svgElement.clear([y1, y2]);
            svgElement.line({
                x1: x1,
                y1: clear[0],
                x2: x2,
                y2: clear[0],
                fill: 'none',
                stroke: COLOR_L
            }, g);
            svgElement.line({
                x1: x1,
                y1: clear[1],
                x2: x2,
                y2: clear[1],
                fill: 'none',
                stroke: COLOR_L
            }, g);
        },
        drawBasePriceLine: function () {
            var t = this, box = t.chartBox, bx = box.x, by = box.y,
                g = t.markG, cacheEl = t.cacheEl, svgElement = t.svgElement,
                pricePeriod = t.pricePeriod, minPricePeriod = t.minPricePeriod, padding = 10,
                currentMax = t.currentMax, height = by.height - padding * 2 - 2, i;


            var period = height / pricePeriod;

            var x1 = bx.begin, y = by.begin + padding + 1,
                textLen = t.basePrice.toFixed(t.digit).length, //标记价格的长度
                textWidth = textLen * 6 + 10, //标记价格的宽度，每个数字按照8像素计算，左右间距为7，可以根据实际情况调整
                x2 = bx.end - textWidth;

            var line, text, _y, _p;
            for (i = 0; i <= pricePeriod; i++) {
                _p = currentMax - i * minPricePeriod;
                _y = y + i * period;
                _y = svgElement.clear([_y])[0];
                line = svgElement.line({
                    x1: x1,
                    y1: _y,
                    x2: x2,
                    y2: _y,
                    fill: 'none',
                    stroke: COLOR_L
                }, g);
                cacheEl.push(line);
                text = svgElement.text(_p.toFixed(t.digit), {
                    x: x2 + 4,
                    y: _y + 3,
                    fill: COLOR_T,
                    'text-anchor': 'start',
                    'font-size': '12px'
                }, g);
                cacheEl.push(text);
            }
        },
        drawPricePath: function () {
            var t = this, box = t.chartBox, bx = box.x, by = box.y,
                dataLen = t.dataLen, g = t.pathG, cacheEl = t.cacheEl, svgElement = t.svgElement,
                datas = t.data, basePrice = t.basePrice, padding = 10, height = by.height - padding * 2 - 2,
                currentPrice, i;

            var currentMax = t.currentMax, currentMin = t.currentMin,
                unitH = height / ((currentMax - currentMin) / t.unit);//单位高度
            var x1 = bx.begin, x2 = bx.end, y = by.begin + padding + 1,
                textLen = basePrice.toFixed(t.digit).length,
                textWidth = textLen * 6 + 10, //文字宽度
                splitWidth = 15,
                width = x2 - textWidth - splitWidth,
                unitW = width / dataLen,//单位宽度
                lastX, lastY, d = '';
            for (i = 0; i < datas.length; i++) {
                currentPrice = datas[i];
                lastX = c2x(i);
                lastY = c2y(currentPrice);
                if (i == 0) {
                    d = c2start(currentPrice);
                } else {
                    d += 'L' + lastX + ',' + lastY;
                }
            }
            d += 'L' + (x2 - textWidth) + ',' + lastY;

            if (t.pricePath) {
                svgElement.attr(t.pricePath, {d: d});
            } else {
                t.pricePath = svgElement.path({
                    d: d,
                    stroke: COLOR_P,
                    fill: 'none'
                }, g);
            }
            var ani = svgElement.createElement('animate');
            svgElement.attr(ani, {
                attributeName:"r", values:"1;1.5;1", dur:".5s", repeatCount:"indefinite"
            });
            if (t.heartbeat) {
                svgElement.attr(t.heartbeat, {cx: lastX, cy: lastY});
            } else {
                t.heartbeat = svgElement.circle({
                    cx: lastX,
                    cy: lastY,
                    r: 1,
                    stroke: '#F3976C',
                    fill: '#FF3366',
                    'stroke-width': 1.5
                    //'fill-opacity': 0.2,
                    //'class': 'heartbeat'
                }, g);
                t.heartbeat.appendChild(ani);
            }
            var rect = svgElement.rect({
                x: x2 - textWidth,
                y: lastY - 7,
                width: textWidth - 2,
                height: 13,
                rx: 3,
                ry: 3,
                fill: COLOR_P
            }, g);
            cacheEl.push(rect);
            var text = svgElement.text(currentPrice.toFixed(t.digit), {
                x: x2 - textWidth + 4,
                y: c2y(currentPrice) + 4,
                fill: '#FFFFFF',
                'text-anchor': 'start',
                'font-size': '12px'
            }, g);
            cacheEl.push(text);

            function c2y(price) {
                return ((y + (currentMax - price) / t.unit * unitH) | 0) + 0.5;
            }

            function c2x(i) {
                return x1 + unitW * i
            }

            function c2start(d) {
                return 'M' + x1 + ',' + c2y(d);
            }
        },
        /**
         * 根据参数画图
         * @param data ｛time,price｝
         */
        draw: function (data) {
            this.process(data);
            this.setMaxMin();
            this.clear();
            this.drawBasePriceLine();
            this.drawPricePath()
        },
        clear: function () {
            var t = this, cacheEl = t.cacheEl, svgElement = t.svgElement, i, el;
            for (i in cacheEl) {
                el = cacheEl[i];
                el && svgElement.remove(el);
            }
            this.cacheEl.length = 0;
        },
        process: function (d) {
            var t = this, data = t.data, cacheData = this.cacheData, time = d.time, price = d.price;
            if (cacheData[time] != undefined) {
                return;
            }
            cacheData[time] = price;
            t.currentPrice = price;
            if (t.basePrice == 0) {
                t.basePrice = price;
            }
            if (data.length >= t.dataLen) {
                data.shift();
                data.push(price);
            } else {
                data.push(price);
            }
            //计算当前数值精度
            if (t.unit < 1) {
                t.digit = t.unit.toString().length - 2;
            } else {
                t.digit = 0;
            }
        },
        setMaxMin: function () {
            var t = this, data = t.data, maxPrice, minPrice;
            t.maxPrice = maxPrice = Math.max.apply(Math, data);
            t.minPrice = minPrice = Math.min.apply(Math, data);

            var pricePeriod = t.pricePeriod, //价格分段数量6
                unit = t.unit, //最小单位
                multiple = t.multiple; //倍数

            if (!t.currentMax) {
                t.currentMax = maxPrice;
            }
            if (!t.currentMin) {
                t.currentMin = minPrice;
            }
            var beyond = Math.ceil((maxPrice - minPrice) / (pricePeriod * unit * multiple));
            var minLen = pricePeriod / 2 * multiple;
            //当前最大值和最小值是否超过标记的最大值和最小值，如果超过则直接翻倍倍数，以至于可以继续容纳闪电图
            //如果不超过但是单方向已经超过某个方向的边界，则移动基础价格
            if (maxPrice == minPrice) {
                t.currentMax = t.basePrice + pricePeriod / 2 * t.minPricePeriod;
                t.currentMin = t.basePrice - pricePeriod / 2 * t.minPricePeriod;
            } else {
                //如果当前倍数反生变化则重置参考量并记录最新的倍数
                if (beyond != t.beyond) {
                    t.beyond = beyond;
                    t.minPricePeriod = unit * multiple * beyond;
                    t.setBasePrice();
                }
                //如果图形都在一侧则移到中间位置
                if ((data.length >= minLen && (t.maxPrice <= t.basePrice || t.minPrice >= t.basePrice)) || t.maxPrice > t.currentMax || t.minPrice < t.currentMin) {
                    t.setBasePrice();
                }
            }
        },
        setBasePrice: function () {
            var t = this, maxPrice = t.maxPrice, minPrice = t.minPrice, pricePeriod = t.pricePeriod, b = Math.pow(10, t.digit);
            t.basePrice = Math.round(((maxPrice - minPrice) / 2 + minPrice) * b) / b;
            t.currentMax = t.basePrice + pricePeriod / 2 * t.minPricePeriod;
            t.currentMin = t.basePrice - pricePeriod / 2 * t.minPricePeriod;
        }
    };

    var SVGElement = function () {
    };
    SVGElement.prototype = {
        SVG_NS: 'http://www.w3.org/2000/svg',
        createElement: function (nodeName) {
            return document.createElementNS(this.SVG_NS, nodeName);
        },
        createText: function (txt) {
            return document.createTextNode(txt);
        },
        remove: function (el) {
            el.parentNode.removeChild(el);
        },
        g: function (name) {
            var elem = this.createElement('g');
            return defined(name) ? this.attr(elem, {'class': name}) : elem;
        },
        line: function (attr, refEl) {
            var elem = this.createElement('line');
            this.attr(elem, attr);
            refEl && refEl.appendChild(elem);
            return elem;
        },
        rect: function (attr, refEl) {
            var elem = this.createElement('rect');
            this.attr(elem, attr);
            refEl && refEl.appendChild(elem);
            return elem;
        },
        circle: function (attr, refEl) {
            var elem = this.createElement('circle');
            this.attr(elem, attr);
            refEl && refEl.appendChild(elem);
            return elem;
        },
        path: function (attr, refEl) {
            var elem = this.createElement('path');
            this.attr(elem, attr);
            refEl && refEl.appendChild(elem);
            return elem;
        },
        text: function (text, attr, refEl) {
            var elem = this.createElement('text');
            this.attr(elem, attr, refEl);
            var tspan = this.createElement('tspan');
            tspan.appendChild(this.createText(text));
            elem.appendChild(tspan);
            refEl && refEl.appendChild(elem);
            return elem;
        },
        getSize: function (svg) {
            var clientRect = svg.getBoundingClientRect();
            return {
                width: clientRect.width,
                height: clientRect.height
            };
        },
        attr: function (elem, prop, value) {
            var key,
                ret;

            // if the prop is a string
            if (isString(prop)) {
                // set the value
                if (defined(value)) {
                    elem.setAttribute(prop, value);

                    // get the value
                } else if (elem && elem.getAttribute) { // elem not defined when printing pie demo...
                    ret = elem.getAttribute(prop);
                }

                // else if prop is defined, it is a hash of key/value pairs
            } else if (defined(prop) && isObject(prop)) {
                for (key in prop) {
                    elem.setAttribute(key, prop[key]);
                }
            }
            return ret;
        },
        clear: function (arr) {
            if (!isArray(arr)) {
                arr = [arr];
            }
            var i, len = arr.length, tem, ret = [];
            for (i = 0; i < len; i++) {
                tem = arr[i] | 0;
                ret.push(tem + 0.5);
            }
            return ret;
        },
        css: function (el, styles) {
            this.extend(el.style, styles);
        },
        extend: function (a, b) {
            var n;
            if (!a) {
                a = {};
            }
            for (n in b) {
                a[n] = b[n];
            }
            return a;
        }
    };

    X.Tick = Tick;
}());