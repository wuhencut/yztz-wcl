/**
 * Created by JIAQIANG on 2015/11/5.
 */
'use strict';
var myDirectives = angular.module('myDirectives', []);
myDirectives.directive('commonTitle', function () {
    return {
        restrict: 'EA',
        replace: true,
        template: function () {
            var html = '';
            html += '<h3>';
            html += '<span ng-click="showMenu=!showMenu">{{stockType}}点买A股';
            html += ' <i ng-if="!showMenu" class="iconfont">&#xe608;</i><i ng-if="showMenu" class="iconfont">&#xe609;</i>';
            html += '</span>';
            html += '</h3>';
            return html;
        }
    };
});
myDirectives.directive('commonMenu', function () {
    return {
        restrict: 'EA',
        replace: true,
        template: function () {
            var html = '';
            html += '<div ng-show="showMenu" ng-click="showMenu=false;" class="mod-stockType-list db-bg" style="z-index: 99;">';
            html += '<div class="wrap">';
            /*html += '<a ng-if="futureInfo.commodityTitle != stockA" href="#/trade/{{type}}">A股</a>';*/
            html += '<a ng-repeat="(key, value) in stockTypes" href="#/{{key}}" ng-if="value != stockType">{{value}}点买A股</a>';
            html += '</div>';
            html += '</div>';
            return html;
        }
    };
});

myDirectives.directive('dialog', function () {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        template: '<div class="db-bg" ng-transclude style="z-index: 10000"></div>'
    };
});
myDirectives.directive('call', function (SystemService) {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        template: '<a ng-click="getTime()" href={{cellPhone.cellPhoneATag}} ng-transclude class="nav-right"><i class="icon-tel"></i></a>',
        link: function ($scope) {
            $scope.getTime = function () {
                // $scope.tel = 'tel:057128834670';
                /*SystemService.getServerTime().then(function (res) {
                    var data = res.data;
                    if (data.code == 100) {
                        var time = X.formatDate(data.data.currentTime, 'hm'), h, m;
                        // X.log(time);
                        /!*if(time.length == 4){
                         h = time.slice(0,2) - 0;
                         m = time.slice(2) - 0;
                         } else if(time.length == 3){
                         h = time.slice(0,1) - 0;
                         m = time.slice(1) - 0;
                         }*!/
                        if (time > 1730 && time < 2100) {
                            $scope.tel = 'tel:15575990597';
                        }
                        // X.log(h,m);
                    } else {
                        X.tip(data['resultMsg']);
                    }
                }).catch(function () {
                    X.tip('服务器请求异常');
                });*/
                $scope.cellPhone = SystemService.cellPhoneNumber();
            };

            $scope.getTime();
        }
    };
});
myDirectives.directive('slide', function ($timeout) {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        template: '<div class="mod-slide" ng-transclude  ng-swipe-right="swipeRight();" ng-swipe-left="swipeLeft();"></div>',
        link: function ($scope, $el) {
            var index = 0, timer;
            var li = $el.find('ul.slide-wrap > li'), len = li.length;
            createMenu();
            if (len < 2)return;
            var menu = $el.find('ul.slide-menu > li');
            li.css('left', '100%');
            li.eq(0).css('left', 0);
            menu.eq(0).addClass('curr');
            $scope.swipeRight = function () {
                swipe('R');
            };
            $scope.swipeLeft = function () {
                swipe('L');
            };
            function swipe(dir) {
                clearTimer();
                var next = dir == 'L' ? index + 1 : index - 1;
                next = next < 0 ? len - 1 : next > len - 1 ? 0 : next;
                li.eq(index).animate({'left': dir == 'L' ? '-100%' : '100%'});
                menu.removeClass('curr');
                menu.eq(next).addClass('curr');
                li.eq(next).css({'left': dir == 'L' ? '100%' : '-100%'}).animate({'left': '0'}, function () {
                    index = next;
                });
                timer = $timeout(function () {
                    $scope.swipeLeft();
                }, 3000);
            }

            function createMenu() {
                var menu = '<ul class="slide-menu">';
                for (var i = 0; i < len; i++) {
                    menu += '<li></li>';
                }
                menu += '</ul>';
                $el.append(menu);
            }

            function clearTimer() {
                if (timer) {
                    $timeout.cancel(timer);
                }
                timer = null;
            }

            timer = $timeout(function () {
                $scope.swipeLeft();
            }, 3000);

            $scope.$on('$destroy', function () {
                clearTimer();
            });
        }
    };
});
myDirectives.directive('backMenu', function ($location) {
    return {
        restrict: 'EA',
        replace: true,
        template: function () {
            var backURL = $location.search()['backURL'];
            var historyLen = window.history.length;
            //console.log(historyLen);
            if(historyLen < 2){
                backURL = '/index';
            }
            if(backURL){
                return '<a href="#'+backURL+'" class="nav-left"><i class="icon-back"></i></a>'
            }else{
                return '<a href="javascript:window.history.back();" class="nav-left"><i class="icon-back"></i></a>'
            }
        }
    };
});
// financeDirectives.directive('tradePassWarp', function () {
//     return {
//         // scope: {
//     //@单向文本
//     //=双向数据绑定
//     //&调用父域函数
//     type: '@',
//     commodity: '='
// },
//         templateUrl: 'partials/tradePassWrapTemp.html?v=' + new Date().getTime(),
//         link: function ($scope, $element, $attr) {
//             var wrap = $('#pass-c-wrap'), inp = $('#inp'), el = $('#pass-c-wrap span');
//             wrap.on('click', function () {
//                 inp.focus();
//             });
//
//             inp.on('input', function () {
//                 var value = $(this).val(), arr = value.split('');
//                 if (arr.length == 6) {
//                     $scope.pay({pass: value});
//                 }
//                 for (var i = 0; i < 6; i++) {
//                     $(el[i]).text((arr[i] || '').replace(arr[i], '●'));
//                 }
//             });
//         }
//     };
// });