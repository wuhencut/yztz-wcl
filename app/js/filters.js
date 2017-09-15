/**
 * Created by JIAQIANG on 2015/11/5.
 */
'use strict';
var financeFilters = angular.module('financeFilters', []);

financeFilters.filter('checkmark', function () {
    return function (input) {
        return input ? '\u2713' : '\u2718';
    };
});