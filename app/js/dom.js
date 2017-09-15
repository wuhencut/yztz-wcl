/**
 * Created by JIAQIANG on 2015/10/19.
 */
(function ($, window, undefined) {
    'use strict';
    var dom = {
        create: function (tagName) {
            return document.createElement(tagName);
        },
        createNS: function (tagName) {
            if (!document.createElementNS) {
                return this.create(tagName);
            }
            return document.createElementNS(
                'http://www.w3.org/2000/svg', tagName
            );
        },
        createText: function (txt) {
            return document.createTextNode(txt);
        },

        append: function (parent, child) {
            parent.appendChild(child);
            return child;
        },

        insert: function (p, c, r) {
            p.insertBefore(c, r);
            return c;
        },

        remove: function (el) {
            el.parentNode.removeChild(el);
        },

        query: function (selector) {
            return document.querySelector(selector);
        },

        childs: function (el) {
            if (el.children) {
                return el.children;
            }
            var nodes = el.childNodes,
                ret = [];
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType === 1) {
                    ret.push(nodes[i]);
                }
            }
            return ret;
        },

        attr: function (el, name, value) {
            // get value
            if (X.isString(name) && value == null) {
                return el.getAttribute(name);
            }
            // set value
            if (X.isString(name)) {
                if (name === 'style' && X.isObject(value)) {
                    var vals = '';
                    $.each(value, function (n, v) {
                        vals += n + ':' + v + ';';
                    });
                    value = vals;
                }
                el.setAttribute(name, value);
            }
            // name = object
            else {
                $.each(name, function (key, value) {
                    dom.attr(el, key, value);
                });
            }
        },

        textContent: function (el, txt) {
            if (txt == null) {
                return el.firstChild.nodeValue;
            }

            var tspan = dom.createNS('tspan');
            dom.append(tspan, dom.createText(txt));

            dom.append(el, tspan);
        },

        getSize: function (svg) {
            //var o = svg.getBoundingClientRect();
            return {
                width: $(svg).width(),
                height: $(svg).height()
            };
        }
    };
    X.dom = dom;
})(jQuery, window);