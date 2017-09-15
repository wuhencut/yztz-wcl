/**
 * Created by JIAQIANG on 2015/11/5.
 */
'use strict';
//noinspection JSUnresolvedFunction
var myApp = angular.module('myApp', ['ngRoute', 'ngCookies', 'ngAnimate', 'ngTouch', 'myControllers', 'myServices', 'myDirectives']);

myApp.constant('ST', {
    v: '?v=' + (new Date().getTime())
});

myApp.config(function ($httpProvider, $routeProvider, ST) {
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    $httpProvider.interceptors.push('myInterceptor');
    $routeProvider.when('/index', {
        templateUrl: 'partials/index.html' + ST.v,
        controller: 'IndexCtrl',
        access: true
    }).when('/login', {
        templateUrl: 'partials/login.html' + ST.v,
        controller: 'LoginCtrl',
        access: true
    }).when('/register1', {
        templateUrl: 'partials/register1.html' + ST.v,
        controller: 'Register1Ctrl',
        access: true
    }).when('/register2/:mobile', {
        templateUrl: 'partials/register2.html' + ST.v,
        controller: 'Register2Ctrl',
        access: true
    }).when('/trade', {
        templateUrl: 'partials/trade.html' + ST.v,
        controller: 'TradeCtrl',
        access: true,
        resolve: {
            initData: function (TradeService) {
                return TradeService.getInitTrade().then(function (res) {
                    if (res.data.code == 100) {
                        return res.data.data;
                    } else {
                        return null;
                    }
                }).catch(function () {
                    return null;
                });
            }
        }
    }).when('/tradeBuy/:stockCode', {
        templateUrl: 'partials/tradeBuy.html' + ST.v,
        controller: 'TradeBuyCtrl',
        access: false
    }).when('/tradeSell', {
        templateUrl: 'partials/tradeSell.html' + ST.v,
        controller: 'TradeSellCtrl',
        access: false
    }).when('/tradeResult', {
        templateUrl: 'partials/tradeResult.html' + ST.v,
        controller: 'TradeResultCtrl',
        access: false
    }).when('/tradeDetail/:tradeId', {
        templateUrl: 'partials/tradeDetail.html' + ST.v,
        controller: 'TradeDetailCtrl',
        access: false
    }).when('/agreementSigned', {
        templateUrl: 'partials/agreementSigned.html' + ST.v,
        controller: 'AgreementSignedCtrl',
        access: true
    }).when('/agreementTrade', {
        templateUrl: 'partials/agreementTrade.html' + ST.v,
        controller: 'AgreementTradeCtrl',
        access: true
    }).when('/agreementSaletor', {
        templateUrl: 'partials/agreementSaletor.html' + ST.v,
        controller: 'AgreementSaletorCtrl',
        access: true
    }).when('/agreementInvestor', {
        templateUrl: 'partials/agreementInvestor.html' + ST.v,
        controller: 'AgreementInvestorCtrl',
        access: true
    }).when('/agreementRegister', {
        templateUrl: 'partials/agreementRegister.html' + ST.v,
        controller: 'AgreementRegister',
        access: true
    }).when('/mine', {
        templateUrl: 'partials/mine.html' + ST.v,
        controller: 'MineCtrl',
        access: true
    }).when('/mineSearch', {
        templateUrl: 'partials/mineSearch.html' + ST.v,
        controller: 'MineSearchCtrl',
        access: true
    }).when('/mineModify', {
        templateUrl: 'partials/mineModify.html' + ST.v,
        controller: 'MineModifyCtrl',
        access: true
    }).when('/myHome', {
        templateUrl: 'partials/myHome.html' + ST.v,
        controller: 'MyHomeCtrl',
        access: false
    }).when('/myInfo', {
        templateUrl: 'partials/myInfo.html' + ST.v,
        controller: 'MyInfoCtrl',
        access: false
    }).when('/forgetUserPass', {
        templateUrl: 'partials/forgetUserPass.html' + ST.v,
        controller: 'ForgetUserPassCtrl',
        access: true
    }).when('/forgetTradePass', {
        templateUrl: 'partials/forgetTradePass.html' + ST.v,
        controller: 'ResetTradePassCtrl',
        access: false
    }).when('/userPassModify', {
        templateUrl: 'partials/userPassModify.html' + ST.v,
        controller: 'UserPassModifyCtrl',
        access: false
    }).when('/identification', {
        templateUrl: 'partials/identification.html' + ST.v,
        controller: 'IdentificationCtrl',
        access: false
    }).when('/tradePassSet', {
        templateUrl: 'partials/tradePassSet.html' + ST.v,
        controller: 'TradePassSetCtrl',
        access: false
    }).when('/tradePassModify', {
        templateUrl: 'partials/tradePassModify.html' + ST.v,
        controller: 'TradePassModifyCtrl',
        access: false
    }).when('/payType', {
        templateUrl: 'partials/payType.html' + ST.v,
        controller: 'PayTypeCtrl',
        access: false
    }).when('/payBank', {
        templateUrl: 'partials/payBank.html' + ST.v,
        controller: 'PayBankCtrl',
        access: false
    }).when('/payMobile', {
        templateUrl: 'partials/payMobile.html' + ST.v,
        controller: 'PayMobileCtrl',
        access: false
    }).when('/paySuccess', {
        templateUrl: 'partials/paySuccess.html' + ST.v,
        controller: 'PaySuccessCtrl',
        access: false
    }).when('/bankInfo', {
        templateUrl: 'partials/bankInfo.html' + ST.v,
        controller: 'BankInfoCtrl',
        access: false
    }).when('/bankCardList', {
        templateUrl: 'partials/bankCardList.html' + ST.v,
        controller: 'BankCardListCtrl',
        access: false
    }).when('/addBankCard', {
        templateUrl: 'partials/addBankCard.html' + ST.v,
        controller: 'AddBankCardCtrl',
        access: false
    }).when('/modifyBankCard/:bankCardId', {
        templateUrl: 'partials/modifyBankCard.html' + ST.v,
        controller: 'ModifyBankCardCtrl',
        access: false
    }).when('/withdraw', {
        templateUrl: 'partials/withdraw.html' + ST.v,
        controller: 'WithdrawCtrl',
        access: false
    }).when('/fund', {
        templateUrl: 'partials/fund.html' + ST.v,
        controller: 'FundCtrl',
        access: false
    }).when('/notice', {
        templateUrl: 'partials/notice.html' + ST.v,
        controller: 'NoticeCtrl',
        access: false
    }).when('/noticeDetail/:noticeId', {
        templateUrl: 'partials/noticeDetail.html' + ST.v,
        controller: 'NoticeDetailCtrl',
        access: false
    }).when('/help', {
        templateUrl: 'partials/help.html' + ST.v,
        controller: 'HelpCtrl',
        access: true
    }).when('/helpDetail/:helpDetailId', {
        templateUrl: 'partials/helpDetail.html' + ST.v,
        controller: 'HelpDetailCtrl',
        access: true
    }).when('/helpCenter', {
        templateUrl: 'partials/helpCenter.html' + ST.v,
        controller: 'HelpCenterCtrl',
        access: false
    }).when('/helpAsk', {
        templateUrl: 'partials/helpAsk.html' + ST.v,
        controller: 'HelpAskCtrl',
        access: false
    }).when('/guide', {
        templateUrl: 'partials/guide.html' + ST.v,
        controller: 'GuideCtrl',
        access: true
    }).when('/tradeRule', {
        templateUrl: 'partials/tradeRule.html' + ST.v,
        controller: 'TradeRuleCtrl',
        access: true
    }).when('/safe', {
        templateUrl: 'partials/safe.html' + ST.v,
        controller: 'SafeCtrl',
        access: true
    }).when('/aboutUs', {
        templateUrl: 'partials/aboutUs.html' + ST.v,
        controller: 'AboutUsCtrl',
        access: true
    }).when('/introduce', {
        templateUrl: 'partials/introduce.html' + ST.v,
        controller: 'IntroduceCtrl',
        access: true
    }).when('/alipay', {
        templateUrl: 'partials/alipay.html' + ST.v,
        controller: 'AlipayCtrl',
        access: false
    }).when('/alipayDetail', {
        templateUrl: 'partials/alipayDetail.html' + ST.v,
        controller: 'AlipayDetailCtrl',
        access: false
    }).when('/myStrategyGroup', {
        templateUrl: 'partials/myStrategyGroup.html' + ST.v,
        controller: 'MyStrategyGroupCtrl',
        access: false
    }).when('/suspendStocks', {
        templateUrl: 'partials/suspendStocks.html' + ST.v,
        controller: 'SuspendStocksCtrl',
        access: false
    }).when('/article-20160831', {
        templateUrl: 'partials/article-20160831.html' + ST.v,
        controller: 'ArticleCtrl',
        access: true
    }).when('/article-20161021', {
        templateUrl: 'partials/article-20161021.html' + ST.v,
        controller: 'ArticleCtrl',
        access: true
    }).when('/attention', {
        templateUrl: 'partials/attention.html' + ST.v,
        controller: 'AttentionCtrl',
        access: false
    }).when('/discover', {
        templateUrl: 'partials/discover.html' + ST.v,
        controller: 'DiscoverCtrl',
        access: true
    }).when('/oneYuanIntroduce', {
        templateUrl: 'partials/oneYuanIntroduce.html' + ST.v,
        controller: 'OneYuanIntroduceCtrl',
        access: true
    }).when('/oneYuanTrade', {
        templateUrl: 'partials/oneYuanTrade.html' + ST.v,
        controller: 'OneYuanTradeCtrl',
        access: false,
        resolve: {
            initData: function (TradeService) {
                return TradeService.initOneyuan().then(function (res) {
                    if (res.data.code == 100) {
                        return res.data.data;
                    } else {
                        return null;
                    }
                }).catch(function () {
                    return null;
                });
            }
        }
    }).when('/oneYuanTradeSell', {
        templateUrl: 'partials/oneYuanTradeSell.html' + ST.v,
        controller: 'OneYuanTradeSellCtrl',
        access: false
    }).when('/oneYuanTradeResult', {
        templateUrl: 'partials/oneYuanTradeResult.html' + ST.v,
        controller: 'OneYuanTradeResultCtrl',
        access: false
    }).when('/aliPayIdentification', {
        templateUrl: 'partials/aliPayIdentification.html' + ST.v,
        controller: 'AliPayIdentificationCtrl',
        access: false
    }).when('/TDTrade', {
        templateUrl: 'partials/TDTrade.html' + ST.v,
        controller: 'TDTradeCtrl',
        access: true,
        resolve: {
            initData: function (TradeService) {
                return TradeService.initTDTrade().then(function (res) {
                    if (res.data.code == 100) {
                        return res.data.data;
                    } else {
                        return null;
                    }
                }).catch(function () {
                    return null;
                });
            }
        }
    }).when('/TDTradeBuy', {
        templateUrl: 'partials/TDTradeBuy.html' + ST.v,
        controller: 'TDTradeBuyCtrl',
        access: true,
        resolve: {
            initData: function (TradeService) {
                return TradeService.initTDTrade().then(function (res) {
                    if (res.data.code == 100) {
                        return res.data.data;
                    } else {
                        return null;
                    }
                }).catch(function () {
                    return null;
                });
            }
        }
    }).when('/TDTradeSell', {
        templateUrl: 'partials/TDTradeSell.html' + ST.v,
        controller: 'TDTradeSellCtrl',
        access: false
    }).when('/TDTradeResult', {
        templateUrl: 'partials/TDTradeResult.html' + ST.v,
        controller: 'TDTradeResultCtrl',
        access: false
    }).when('/TDTradeDetail/:tradeId', {
        templateUrl: 'partials/TDTradeDetail.html' + ST.v,
        controller: 'TradeDetailCtrl',
        access: false
    }).when('/suspendDetail/:tradeId', {
        templateUrl: 'partials/suspendDetail.html' + ST.v,
        controller: 'TradeDetailCtrl',
        access: false
    }).when('/historyStrategies', {
        templateUrl: 'partials/historyStrategies.html' + ST.v,
        controller: 'historyStrategiesCtrl',
        access: false
    }).when('/strategyDetail', {
        templateUrl: 'partials/strategyDetail.html' + ST.v,
        controller: 'strategyDetailCtrl',
        access: false
    }).when('/TDApply', {
        templateUrl: 'partials/TDApply.html' + ST.v,
        controller: 'TDApplyCtrl',
        access: false
    }).when('/TDApplyConfirm', {
        templateUrl: 'partials/TDApplyConfirm.html' + ST.v,
        controller: 'TDApplyConfirmCtrl',
        access: false
    }).when('/agreementTDInvestor', {
        templateUrl: 'partials/agreementTDInvestor.html' + ST.v,
        controller: 'AgreementInvestorCtrl',
        access: true
    }).when('/agreementTDSaletor', {
        templateUrl: 'partials/agreementTDSaletor.html' + ST.v,
        controller: 'AgreementSaletorCtrl',
        access: true
    }).when('/TDTradeRule', {
        templateUrl: 'partials/TDTradeRule.html' + ST.v,
        controller: 'TradeRuleCtrl',
        access: true
    }).when('/simulateStock', {
        templateUrl: 'partials/simulateStock.html' + ST.v,
        controller: 'SimulateStockCtrl',
        access: true
    }).when('/simulateTrade', {
        templateUrl: 'partials/simulateTrade.html' + ST.v,
        controller: 'SimulateTradeCtrl',
        access: false,
        resolve: {
            initData: function (SimulateService) {
                return SimulateService.initSimTrade().then(function (res) {
                    if (res.data.code == 100) {
                        return res.data.data;
                    }else if (res.data.code == 900){
                        return res.data.resultMsg;
                    } else {
                        return null;
                    }
                }).catch(function () {
                    return null;
                });
            }
        }
    }).when('/simulateTradeBuy/:stockCode', {
        templateUrl: 'partials/simulateTradeBuy.html' + ST.v,
        controller: 'SimulateTradeBuyCtrl',
        access: false
    }).when('/simulateTradeSell', {
        templateUrl: 'partials/simulateTradeSell.html' + ST.v,
        controller: 'SimulateTradeSellCtrl',
        access: false
    }).when('/simulateTradeResult', {
        templateUrl: 'partials/simulateTradeResult.html' + ST.v,
        controller: 'SimulateTradeResultCtrl',
        access: false
    }).when('/simulateTradeDetail/:tradeId', {
        templateUrl: 'partials/simulateTradeDetail.html' + ST.v,
        controller: 'SimulateTradeDetailCtrl',
        access: false
    }).when('/extension', {
        templateUrl: 'partials/extension.html' + ST.v,
        controller: 'ExtensionCtrl',
        access: true
    }).when('/phoneBind1', {
        templateUrl: 'partials/phoneBind1.html' + ST.v,
        controller: 'PhoneBind1Ctrl',
        access: false
    }).when('/phoneBind2', {
        templateUrl: 'partials/phoneBind2.html' + ST.v,
        controller: 'PhoneBind2Ctrl',
        access: false
    }).when('/dayGainList', {
        templateUrl: 'partials/dayGainList.html' + ST.v,
        controller: 'DayGainListCtrl',
        access: true
    }).when('/activityCenter', {
        templateUrl: 'partials/activityCenter.html' + ST.v,
        controller: 'ActivityCenterCtrl',
        access: true
    }).when('/actPacket', {
        templateUrl: 'partials/actPacket.html' + ST.v,
        controller: 'ActPacketCtrl',
        access: true
    }).when('/myPacket', {
        templateUrl: 'partials/myPacket.html' + ST.v,
        controller: 'MyPacketCtrl',
        access: false
    }).otherwise({
        redirectTo: '/index'
    });
}).run(function ($rootScope, $location, AuthService) {
    $rootScope.$on('$routeChangeStart', function (evt, next) {
        // X.loading.hide();
        // X.dialog.close();
        var goURL = next.originalPath, key;
        if (next.originalPath && !next.access) {
            for (key in next.params) {
                //noinspection JSUnfilteredForInLoop
                goURL = goURL.replace(':' + key, next.params[key]);
            }
            X.log('-----路由拦截 URL:' + goURL + '-----');
            if (!AuthService.auth()) {
                X.log('-----用户未登录，跳转到登录-----');
                evt.preventDefault();
                $location.path('/login').search({'goURL': goURL});
            } else {
                X.log('-----用户已登录，放行-----');
            }
        } else {
            X.log('-----路由放行 URL:' + next.originalPath + '-----');
        }
    });
});