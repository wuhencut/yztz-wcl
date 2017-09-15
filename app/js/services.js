/**
 * Created by JIAQIANG on 2015/11/5.
 */
'use strict';
//noinspection JSUnresolvedFunction
var myServices = angular.module('myServices', []);
//请求地址服务
myServices.factory('URLService', function () {
    var baseHost = '';
    //noinspection JSDuplicatedDeclaration
    var urls = {
        login: '/sso/yztz_user_login_check.json',
        logout: '/sso/j_spring_security_logout.json',
        getUserInfo: '/user/userInfo/getUserInfo.json',
        getIndexData: '/index/getIndexData.json',
        getServerTime: '/home/currentTime.json',
        stockServer: '/stock/servlet/StockServlet.htm',
        checkMobile: '/sso/register/checkMobile.json',
        regNextStep: '/sso/register/goNextStep.json',
        getRegisterCode: '/sso/register/getRegisterCode.json',
        // doRegister: '/sso/register/doRegister.json',
        doRegister: '/sso/register/doRegisterNew.json',
        resetForgetPassword: '/sso/forget/resetForgetPassword.json',
        forgetCheckLogin: '/sso/forget/checkLogin.json',
        getRiskStock: '/home/getRiskStock.json',
        initTrade: '/home/strategy/index.json',
        getStockStatisticsInfo: '/trade/strategy/getStockStatisticsInfo.json',
        createTrade: '/trade/strategy/create.json',
        getSaleStrategyByPage: '/trade/strategy/getSaleStrategyByPage.json',
        getSaleStrategyOfMemcache: '/trade/strategy/getSaleStrategyOfMemcache.json',
        getSaleStrategyById: '/trade/strategy/getSaleStrategyById.json',
        getSettleStrategyByPage: '/trade/strategy/getSettleStrategyByPage.json',
        getSettleStrategyById: '/trade/strategy/getSettleStrategyById.json',
        closeStrategy: '/trade/strategy/closeStrategy.json',
        getMsgPage: '/user/messager/getMsgPage.json',
        postMsg: '/user/messager/postMsg.json',
        signAgreement: '/user/userInfo/signAgreement.json',
        getAgreementStrategyById: '/trade/strategy/getAgreementStrategyById.json',
        getBalance: '/pay/global/assets/getBalance.json',
        getDelayBalance: '/trade/strategy/getPayableDeferCharge.json',
        getBankInfo: '/home/getBankInfo.json',
        getBankCards: '/pay/bankCard/getBankCards.json',
        getBankCardInfo: '/pay/bankCard/getBankCardInfo.json',
        bindBankCard: '/pay/bankCard/bindBankCard.json',
        delBankCard: '/pay/bankCard/deleteCard.json',
        setDefaultBankCard: '/pay/bankCard/setDefaultCard.json',
        updateCardInfo: '/pay/bankCard/updateCardInfo.json',
        getBankCardById: '/pay/bankCard/getBankCardById.json',

        sendForgetCode: '/sso/forget/sendForgetCode.json',
        doWithdraw: '/pay/withdraw/doWithdraw.json',
        updateRealname: '/user/security/updateRealname.json',
        loginPwdModify: '/user/security/loginPwdModify.json',
        withdrawPwdSet: '/user/security/withdrawPwdSet.json',
        withdrawPwdModify: '/user/security/withdrawPwdModify.json',
        getSubBank: '/pay/bankCard/getSubBank.json',
        getFundDetail: '/pay/user/fundDetail/getFundDetail.json',
        getFundAll: '/pay/user/fundDetail/getFundAll.json',
        getNoticeList: '/index/getNoticeList.json',
        forgetWithdrawPasswordCode: '/user/security/forgetWithdrawPasswordCode.json',
        resetWithdrawPwd: '/user/security/resetWithdrawPwd.json',
        getNoticeById: '/index/getNoticeById.json',
        h5FirstPayUrl: '/pay/payGateway/h5FirstPayUrl.json',
        h5PayUrl: '/pay/payGateway/h5PayUrl.json',
        payGateway: '/pay/payGateway/getHCPayUrl.json',
        alipay: '/pay/alipay.json',
        //获取广告
        getHeader: '/home/header.json',

        //T+D点买金额申请初始数据加载(风控参数)
        initTDTrade: '/home/scheme/index.json',
        //T+D点买金额申请发起
        createTDTrade: '/trade/scheme/create.json',
        // T+D点买股票
        strategyCreate: '/trade/scheme/strategyCreate.json',
        //T+D查询方案下持仓策略
        TDGetSaleStrategy: '/trade/scheme/getSaleStrategy.json',
        //T+D结算数据
        TDGetSettleStrategyByPage: '/trade/scheme/getSettleStrategyByPage.json',
        //T+D历史策略组
        getHistorySchemes: '/trade/scheme/getHistorySchemes.json',
        //追加点买金额加载初始化
        schemeAddMoneyInitiate: '/trade/scheme/schemeAddMoneyInitiate.json',
        //追加点买金
        addMoney: '/trade/scheme/addMoney.json',
        //追加保证金
        addPrincipal: '/trade/scheme/addPrincipal.json',
        //申请清算
        applicationLiquidationScheme: '/trade/scheme/applicationLiquidationScheme.json',
        //组合策略续期加载初始化
        extendSchemeInitiate: '/trade/scheme/extendSchemeInitiate.json',
        //期限续期
        extendScheme: '/trade/scheme/extendScheme.json',
        //查询已买断策略（包括T+1、T+D） -->get
        getTakeOverStrategy: '/trade/strategy/getTakeOverStrategy.json',
        //查询当前方案信息
        getHoldingScheme: '/trade/scheme/getHoldingScheme.json',
        //查询持仓市值
        getStrategyMarketValue: '/scheme/getStrategyMarketValue.json',
        //T+D缓存查询接口
        TDGetSaleStrategyOfMemcache: '/trade/scheme/getSaleStrategyOfMemcache.json',
        //买断/放弃策略
        takeOverStrategy: '/trade/strategy/takeOverStrategy.json',
        //T+D点卖阀杆策略
        TDCloseStrategy: '/trade/scheme/closeStrategy.json',
        //T+1买断弹窗初始化，可能有拖欠的递延费
        takeOverInitiate: '/trade/strategy/takeOverInitiate.json',

        //一元体验 ----------------------

        //一元体验点买初始数据加载POST
        initOneyuan: '/home/experience/strategy/index.json',
        //一元体验发起策略POST
        oneYuanCreate: '/trade/experience/strategy/create.json',
        //点卖策略POST
        oneYuanCloseStrategy: '/trade/strategy/closeStrategy.json',
        //查询一元体验点卖策略POST
        oneYuanGetSaleStrategy: '/trade/experience/strategy/getSaleStrategy.json',
        //从缓存查询一元体验点卖策略 POST
        oneYuanGetSaleStrategyByMemca: '/trade/experience/strategy/getSaleStrategyByMemca.json',
        //查询清算策略 POST
        oneYuanGetSettleStrategy: '/trade/experience/strategy/getSettleStrategy.json',
        //查询清算策略ById POST
        oneYuanGetSettleStrategyById: '/trade/strategy/getSettleStrategyById.json',
        //查询策略协议信息详情 POST
        oneYuanGetAgreementStrategyById: '/trade/strategy/getAgreementStrategyById.json',
        //---------------------------
        //支付宝账户认证
        bindingAlipayAccount: '/user/security/bindingAlipayAccount.json',

        //模拟炒股----------------------------
        //模拟炒股活动页基础数据
        simSpecial: '/simstrategy/special.json',
        //模拟炒股活动页历届冠军排行榜
        getUserRanks: '/simstrategy/getUserRanks.json',
        //模拟炒股活动页百强榜
        getMatchInfo: '/simstrategy/getMatchInfo.json',
        //模拟炒股活动页立即报名/立即参赛
        joinStrategyComp: '/trade/simstrategy/joinStrategyComp.json',
        //模拟炒股活动 体验金总额、持仓盈亏
        getSimAsset: '/trade/simstrategy/getSimAsset.json',
        //模拟炒股活动页点买模拟风控参数及比赛所处时段
        simIndex: '/trade/simstrategy/index.json',
        //查看百强用户点买策略
        getUserDetailInfo: '/simstrategy/getUserDetailInfo.json',
        //模拟炒股点买初始数据加载GET
        initSimTrade: '/trade/simstrategy/index.json',
        createSimTrade: '/trade/simstrategy/create.json',
        getSimSaleStrategy: '/trade/simstrategy/getSaleStrategy.json',
        closeSimStrategy: '/trade/simstrategy/closeStrategy.json',
        getSimSaleStrategyOfMemcache: '/trade/simstrategy/getSaleStrategyOfMemcache.json',
        getSimSettleStrategy: '/trade/simstrategy/getSettleStrategy.json',
        getSimAgreementStrategyById: '/trade/simstrategy/getAgreementStrategyById.json',
        getSimStockStatisticsInfo: '/trade/simstrategy/getStockStatisticsInfo.json',
        //------------------------------------
        //推广赚钱信息
        getGeneralizeInfo: '/home/generalize/getGeneralizeInfo.json',
        //推广赚钱获得我的下线用户信息
        getGeneralizeUsers: '/home/generalize/getGeneralizeUsers.json',
        //推广赚钱获得我的二维码
        getQRcode: '/home/generalize/getQRcode.json',
        //策略动态
        getTradingInfo: '/index/getTradingStrategies.json',
        //发送手机解绑短信验证码
        mobileUnbindCode: '/user/security/mobileUnbindCode.json',
        //手机号解绑
        unbindMobile: '/user/security/unbindMobile.json',
        //发送手机绑定短信验证码
        mobileBindCode: '/user/security/mobileBindCode.json',
        //手机号绑定
        bindMobile: '/user/security/bindMobile.json',
        cancelWithdraw: '/pay/withdraw/cancelWithdraw.json',
        //改版 公告
        getNotices: '/index/getNotices.json',
        //获取策略周榜单接口  /index/getStrategyWeekData.json
        getStrategyWeekData: '/index/getStrategyWeekData.json',
        //昨日盈利排行榜
        getUserRank: '/index/getUserRank.json',
        //上月盈利排行榜
        getUnionRank: '/union/getUnionRank.json',
        //红包列表
        getPacketInfo: '/activity/getActAwardSetInfo.json',//红包
        receivePacket: '/tip/receiveTipByActivity.json',//红包领取
        getPacketRecordList: '/tip/getTipRecord.json',//我的红包资金明细
        getPacketFundInfo: '/tip/getTipFundInfo.json',//获取红包资金信息
        getNewsList: '/index/getFuturesNews.json',
        //活动中心
        getActivityList: '/activity/getActivityInfo.json',
        //应缴递延费提醒
        getWaitPayDeferForRemind: '/trade/strategy/getWaitPayDeferForRemind.json'
    };
    return {
        getURL: function (method) {
            return baseHost + urls[method];
        }
    };
});
//登录服务
myServices.factory('IndexService', function ($http, URLService) {
    return {
        indexData: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getIndexData'),
                params: params
            });
        },
        getTradingInfo: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getTradingInfo'),
                params: params
            });
        },
        getStrategyWeekData: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getStrategyWeekData'),
                params: params
            });
        }
    };

});
//登录服务
myServices.factory('LoginService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        login: function (username, password) {
            var data = {
                authencationType: 'AJAX',
                device: 1,
                remeber: true,
                entrance: '',
                username: username,
                password: password
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('login'),
                data: $httpParamSerializerJQLike(data)
            });
        },

        logout: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('logout'),
                data: $httpParamSerializerJQLike(data)
            });
        }

    };
});
//注册服务
myServices.factory('RegisterService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        //检查手机号是否已经存在
        checkMobile: function (mobile) {
            var data = {
                device: 1,
                mobile: mobile
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('checkMobile'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //注册下一步
        regNextStep: function (mobile, checkCode) {
            var data = {
                device: 1,
                mobile: mobile,
                checkCode: checkCode
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('regNextStep'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        /*//注册
        doRegister: function (mobile, checkCode, password, username) {
            var data = {
                device: 1,
                type: 1,
                checkCode: checkCode,
                password: password,
                mobile: mobile,
                username: username
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('doRegister'),
                data: $httpParamSerializerJQLike(data)
            });
        },*/
        //注册
        doRegister: function (mobile, username, password) {
            var data = {
                device: 1,
                type: 1,
                password: password,
                mobile: mobile,
                username: username
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('doRegister'),
                data: $httpParamSerializerJQLike(data)
            });
        },

        //获取验证码
        getRegisterCode: function (mobile, checkCode) {
            var data = {
                device: 1,
                type: 2,
                mobile: mobile,
                checkCode: checkCode
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getRegisterCode'),
                data: $httpParamSerializerJQLike(data)
            });
        }
    };
});
//密码服务
myServices.factory('PasswordService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        //忘记密码服务
        resetForgetPassword: function (mobile, checkCode, password) {
            var data = {
                device: 1,
                mobile: mobile,
                checkCode: checkCode,
                password: password
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('resetForgetPassword'),
                data: $httpParamSerializerJQLike(data)
            });
        },

        //获取验证码
        sendForgetCode: function (mobile, checkCode) {
            var data = {
                device: 1,
                type: 2,
                mobile: mobile,
                checkCode: checkCode
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('sendForgetCode'),
                data: $httpParamSerializerJQLike(data)
            });
        },

        //修改登录密码
        loginPwdModify: function (oldPassword, newPassword) {
            var data = {
                device: 1,
                newPassword: newPassword,
                oldPassword: oldPassword
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('loginPwdModify'),
                data: $httpParamSerializerJQLike(data)
            })
        },

        //提现密码服务
        PwdSet: function (password) {
            var data = {
                device: 1,
                password: password
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('withdrawPwdSet'),
                data: $httpParamSerializerJQLike(data)
            })
        },

        PwdModify: function (newPwd, oldPwd) {
            var data = {
                device: 1,
                newPassword: newPwd,
                oldPassword: oldPwd
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('withdrawPwdModify'),
                data: $httpParamSerializerJQLike(data)
            })
        },

        //重置提现密码服务
        resetWithdrawPwd: function (password, checkCode) {
            var data = {
                device: 1,
                password: password,
                checkCode: checkCode
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('resetWithdrawPwd'),
                data: $httpParamSerializerJQLike(data)
            });
        },

        //获取提现密码重置验证码
        sendPasswordCode: function () {
            var data = {
                device: 1,
                useVoice: false
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('forgetWithdrawPasswordCode'),
                data: $httpParamSerializerJQLike(data)
            });
        }

    };
});
//用户服务
myServices.factory('UserService', function ($http, $httpParamSerializerJQLike, $q, URLService) {
    return {
        getUserInfo: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getUserInfo'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //获取用户余额
        getBalance: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getBalance'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //获取提现冻结延迟费
        getDelayBalance: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getDelayBalance'),
                params: params
            });
        },
        bindingAlipayAccount: function (alipayAccount, tradeAmount, tradeNo) {
            var data = {
                device: 1,
                alipayAccount: alipayAccount,
                tradeNo: tradeNo,
                tradeAmount: tradeAmount
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('bindingAlipayAccount'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //查询持仓市值
        getStrategyMarketValue: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getStrategyMarketValue'),
                params: params
            })
        },
        //获取银行信息
        getBankInfo: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getBankInfo'),
                params: params
            });
        },
        //获取银行卡信息
        getBankCardInfo: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getBankCardInfo'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //获取银行卡信息
        getBankCards: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getBankCards'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getBankCardById: function (bankCardId) {
            var data = {
                device: 1,
                cardId: bankCardId
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getBankCardById'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        bindBankCard: function (bank, province, city, branch, bankCard) {
            var data = {
                device: 1,
                bank: bank,
                province: province,
                city: city,
                branch: branch,
                bankCard: bankCard
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('bindBankCard'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //更新银行卡setDefaultBankCard
        updateCardInfo: function (id, bank, province, city, branch) {
            var data = {
                device: 1,
                bank: bank,
                province: province,
                city: city,
                branch: branch,
                id: id
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('updateCardInfo'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //设置默认银行卡
        setDefaultBankCard: function (bankCardId) {
            var data = {
                device: 1,
                cardId: bankCardId
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('setDefaultBankCard'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //删除银行卡
        delBankCard: function (bankCardId) {
            var data = {
                device: 1,
                cardId: bankCardId
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('delBankCard'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //获取分支行
        getSubBank: function (bank, province, city) {
            var data = {
                device: 1,
                bankName: bank,
                province: province,
                city: city
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getSubBank'),
                data: $httpParamSerializerJQLike(data)
            });
        },

        //实名认证
        realName: function (name, IDNum) {
            var data = {
                device: 1,
                name: name,
                idNumber: IDNum
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('updateRealname'),
                data: $httpParamSerializerJQLike(data)
            });
        },

        getMsgPage: function (page, pageSize) {
            var data = {
                device: 1,
                page: page || 1,
                pageSize: pageSize || 10
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getMsgPage'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        postMsg: function (type, contact, content) {
            var data = {
                device: 1,
                type: type,
                contact: contact,
                content: content
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('postMsg'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        signAgreement: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('signAgreement'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getHeader: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getHeader'),
                params: params
            });
        },
        getGeneralizeInfo: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getGeneralizeInfo'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getGeneralizeUsers: function (page, pageSize) {
            var data = {
                device: 1,
                page: page,
                pageSize: pageSize
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getGeneralizeUsers'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //发送手机解绑短信验证码
        mobileUnbindCode: function (checkCode) {
            var data = {
                device: 1,
                checkCode: checkCode
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('mobileUnbindCode'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //手机号解绑
        unbindMobile: function (code) {
            var data = {
                device: 1,
                checkCode: code
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('unbindMobile'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //发送手机绑定短信验证码
        mobileBindCode: function (checkCode, mobile) {
            var data = {
                device: 1,
                mobile: mobile,
                checkCode: checkCode
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('mobileBindCode'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //发送手机绑定短信验证码
        bindMobile: function (code, mobile) {
            var data = {
                device: 1,
                checkCode: code,
                mobile: mobile
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('bindMobile'),
                data: $httpParamSerializerJQLike(data)
            });
        },
    };
});
//支付服务
myServices.factory('PayService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        getFundDetail: function (action, explain, page, pageSize) {
            var data = {
                device: 1,
                action: action,
                timeStart: '1year',//一周，一月，半年，一年
                explain: explain,//支出，收入
                page: page || 1,
                pageSize: pageSize || 20
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getFundDetail'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getFundAll: function (action, page, pageSize) {
            var data = {
                device: 1,
                action: action,
                timeStart: '1year',//一周，一月，半年，一年
                page: page || 1,
                pageSize: pageSize || 20
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getFundAll'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //联动首次充值链接
        h5FirstPayUrl: function (bankCode, money, card, charge) {
            var data = {
                device: 1,
                bankCode: bankCode,
                money: money,
                bankCard: card,
                charge: charge
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('h5FirstPayUrl'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //联动非首次充值链接
        h5PayUrl: function (cardId, money, charge) {
            var data = {
                device: 1,
                cardId: cardId,
                money: money,
                charge: charge
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('h5PayUrl'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        payGateway: function (money) {
            var data = {
                device: 1,
                money: money
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('payGateway'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //支付宝
        alipay: function (money, account) {
            var data = {
                device: 1,
                alipayName: account,
                money: money,
                charge: 0
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('alipay'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //用户提现
        doWithdraw: function (cardId, money, password) {
            var data = {
                device: 1,
                cardId: cardId,
                money: money,
                password: password
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('doWithdraw'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        cancelWithdraw: function (id) {
            var data = {
                device: 1,
                id: id
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('cancelWithdraw'),
                data: $httpParamSerializerJQLike(data)
            });
        }
    };
});
//公告服务
myServices.factory('NoticeService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        getNoticeList: function (page, pageSize) {
            var params = {
                device: 1,
                page: page || 1,
                pageSize: pageSize || 10
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getNoticeList'),
                params: params
            });
        },
        getNoticeById: function (noticeId) {
            var params = {
                device: 1,
                noticeId: noticeId
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getNoticeById'),
                params: params
            });
        },
        //改版公告
        getNotices: function (page, pageSize) {
            var params = {
                device: 1,
                page: page || 1,
                pageSize: pageSize || 10
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getNotices'),
                params: params
            });
        }
    };
});
//交易服务
myServices.factory('TradeService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        getRiskStock: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getRiskStock'),
                cache: true,
                params: params
            });
        },
        getWaitPayDeferForRemind: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getWaitPayDeferForRemind'),
                params: params
            })
        },
        //T+1风控参数
        getInitTrade: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('initTrade'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        createTrade: function (data) {
            data.device = 1;
            return $http({
                method: 'POST',
                url: URLService.getURL('createTrade'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //T+1持仓
        getSaleStrategyByPage: function () {
            var data = {
                device: 1,
                page: 1,
                pageSize: 100
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getSaleStrategyByPage'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //T+D持仓
        TDGetSaleStrategy: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('TDGetSaleStrategy'),
                params: params
            })
        },
        //T+1买断页面返回递延费
        takeOverInitiate: function (id) {
            var params = {
                device: 1,
                id: id
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('takeOverInitiate'),
                params: params
            });
        },
        //缓存
        TDGetSaleStrategyOfMemcache: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('TDGetSaleStrategyOfMemcache'),
                params: params
            })
        },
        //查询当前方案信息
        getHoldingScheme: function () {
            var params = {
                device: 1
            };
            return $http({
                method: "GET",
                url: URLService.getURL('getHoldingScheme'),
                params: params
            });
        },
        //T+D从策略发起
        strategyCreate: function (schemeId, money, serviceCharge, stockCode, volumeOrder, useTip) {
            var data = {
                device: 1,
                schemeId: schemeId,
                money: money,
                serviceCharge: serviceCharge,
                stockCode: stockCode,
                volumeOrder: volumeOrder,
                useTip: useTip
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('strategyCreate'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //T+D结算策略
        TDGetSettleStrategyByPage: function (page, pageSize, schemeId) {
            var params = {
                device: 1,
                page: page,
                pageSize: pageSize,
                schemeId: schemeId
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('TDGetSettleStrategyByPage'),
                params: params
            });
        },
        //T+D方案策略
        TDCloseStrategy: function (strategyId, isAlwaysClose) {
            var data = {
                device: 1,
                strategyId: strategyId,
                isAlwaysClose: isAlwaysClose
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('TDCloseStrategy'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //买断/放弃策略
        takeOverStrategy: function (tradeID, isTakeOver, lossPrincipal) {
            var data = {
                device: 1,
                id: tradeID,
                isTakeOver: isTakeOver,
                lossPrincipal: lossPrincipal
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('takeOverStrategy'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //查询已买断策略
        getTakeOverStrategy: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getTakeOverStrategy'),
                params: params
            })
        },
        //查询持仓市值
        getStrategyMarketValue: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getStrategyMarketValue'),
                params: params
            });
        },
        getSaleStrategyOfMemcache: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getSaleStrategyOfMemcache'),
                params: params
            });
        },
        closeStrategy: function (tradeID, isAlwaysClose) {
            var data = {
                device: 1,
                id: tradeID,
                isAlwaysClose: isAlwaysClose
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('closeStrategy'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getSettleStrategyByPage: function (page, pageSize) {
            var data = {
                device: 1,
                page: page || 1,
                pageSize: pageSize || 10
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getSettleStrategyByPage'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getSettleStrategyById: function (tradeID) {
            var data = {
                device: 1,
                strategyId: tradeID
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getSettleStrategyById'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getSaleStrategyById: function (tradeID) {
            var data = {
                device: 1,
                strategyId: tradeID
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getSaleStrategyById'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getAgreementStrategyById: function (tradeID) {
            var data = {
                device: 1,
                strategyId: tradeID
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('getAgreementStrategyById'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getStockStatisticsInfo: function (stockCode) {
            var params = {
                device: 1,
                stockCode: stockCode
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getStockStatisticsInfo'),
                params: params
            });
        },
        //T+D申请点买金额方案初始数据加载
        initTDTrade: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('initTDTrade'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //T+D申请点买金额方案发起
        createTDTrade: function (data) {
            data.device = 1;
            return $http({
                method: 'POST',
                url: URLService.getURL('createTDTrade'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        getHistorySchemes: function (page, pageSize) {
            var params = {
                device: 1,
                page: page,
                pageSize: pageSize
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getHistorySchemes'),
                params: params
            });
        },
        //追加保证金
        addPrincipal: function (id, lossPrincipal) {
            var data = {
                device: 1,
                id: id,
                lossPrincipal: lossPrincipal
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('addPrincipal'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //申请清算
        applyFinish: function (id) {
            var data = {
                device: 1,
                schemeId: id
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('applicationLiquidationScheme'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //组合策略追加点买金额加载初始化
        schemeAddMoneyInitiate: function (id, money) {
            var data = {
                device: 1,
                id: id,
                money: money
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('schemeAddMoneyInitiate'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //追加总点买金额
        addMoney: function (id, lossPrincipal, money, deferCharge) {
            var data = {
                deferCharge: deferCharge,
                device: 1,
                id: id,
                lossPrincipal: lossPrincipal,
                money: money
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('addMoney'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //期限续期加载初始化
        extendSchemeInitiate: function (id, holdDays) {
            var data = {
                device: 1,
                holdDays: holdDays,
                id: id
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('extendSchemeInitiate'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //期限续期
        extendScheme: function (id, holdDays, lossPrincipal, diffBalance, deferCharge) {
            var data = {
                device: 1,
                holdDays: holdDays,
                id: id,
                lossPrincipal: lossPrincipal,
                diffBalance: diffBalance,
                deferCharge: deferCharge
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('extendScheme'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //一元体验点买初始数据加载POST
        initOneyuan: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('initOneyuan'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //一元体验发起策略POST
        oneYuanCreate: function (stockCode, volumeOrder, token) {
            var data = {
                device: 1,
                stockCode: stockCode,
                volumeOrder: volumeOrder,
                token: token
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('oneYuanCreate'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //点卖策略POST
        oneYuanCloseStrategy: function (id, isAlwaysClose) {
            var data = {
                device: 1,
                id: id,
                isAlwaysClose: isAlwaysClose
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('oneYuanCloseStrategy'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //查询一元体验持仓 POST
        oneYuanGetSaleStrategy: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('oneYuanGetSaleStrategy'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //从缓存查询一元体验点卖策略 POST
        oneYuanGetSaleStrategyByMemca: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('oneYuanGetSaleStrategyByMemca'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        // 查询清算策略 POST
        oneYuanGetSettleStrategy: function () {
            var data = {
                device: 1
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('oneYuanGetSettleStrategy'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //查询清算策略ById POST
        oneYuanGetSettleStrategyById: function (strategyId) {
            var data = {
                device: 1,
                strategyId: strategyId
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('oneYuanGetSettleStrategyById'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //查询策略协议信息详情 POST
        oneYuanGetAgreementStrategyById: function (strategyId) {
            var data = {
                device: 1,
                strategyId: strategyId
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('oneYuanGetAgreementStrategyById'),
                data: $httpParamSerializerJQLike(data)
            });
        },
    };
});
//模拟炒股服务
myServices.factory('SimulateService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        //模拟炒股活动页基础数据
        simSpecial: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('simSpecial'),
                params: params
            });
        },
        //模拟炒股活动页历届冠军排行榜
        getUserRanks: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getUserRanks'),
                params: params
            });
        },
        //模拟炒股活动页百强榜
        getMatchInfo: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getMatchInfo'),
                params: params
            });
        },
        //模拟炒股活动页立即报名/立即参赛
        joinStrategyComp: function (operateType) {
            var data = {
                device: 1,
                operateType: operateType
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('joinStrategyComp'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //体验金总额、持仓盈亏
        getSimAsset: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getSimAsset'),
                params: params
            });
        },
        //点买模拟风控参数及比赛所处时段
        simIndex: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('simIndex'),
                params: params
            });
        },
        //查看百强用户点买策略
        getUserDetailInfo: function (id) {
            var params = {
                device: 1,
                userId: id
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getUserDetailInfo'),
                params: params
            });
        },
        //模拟炒股点买初始数据加载
        initSimTrade: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('initSimTrade'),
                params: params
            });
        },
        //模拟炒股点买
        createSimTrade: function (data) {
            data.device = 1;
            return $http({
                method: 'POST',
                url: URLService.getURL('createSimTrade'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //模拟炒股点卖列表
        getSimSaleStrategy: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getSimSaleStrategy'),
                params: params
            });
        },
        //模拟炒股点卖
        closeSimStrategy: function (id, isAlwaysClose) {
            var data = {
                device: 1,
                id: id,
                operateType: isAlwaysClose
            };
            return $http({
                method: 'POST',
                url: URLService.getURL('closeSimStrategy'),
                data: $httpParamSerializerJQLike(data)
            });
        },
        //模拟炒股查询缓存点卖列表
        getSimSaleStrategyOfMemcache: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getSimSaleStrategyOfMemcache'),
                params: params
            });
        },
        //模拟炒股已结算列表
        getSimSettleStrategy: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getSimSettleStrategy'),
                params: params
            });
        },
        //模拟炒股已结算列表详情
        getSimAgreementStrategyById: function (id) {
            var params = {
                device: 1,
                strategyId: id
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getSimAgreementStrategyById'),
                params: params
            });
        },
        //模拟炒股个股累计点买金额
        getSimStockStatisticsInfo: function (code) {
            var params = {
                device: 1,
                stockCode: code
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getSimStockStatisticsInfo'),
                params: params
            });
        }
    };
});
//股票信息服务
myServices.factory('StockService', function ($http, SystemService, URLService) {
    return {
        getAllStockList: function () {
            var params = {
                type: 'appAll',
                callback: 'JSON_CALLBACK'
            };
            return $http({
                url: URLService.getURL('stockServer'),
                method: 'JSONP',
                params: params
            });
        },
        getSLine: function (stockCode) {
            var params = {
                type: 'sline',
                stockCode: stockCode,
                callback: 'JSON_CALLBACK'
            };
            return $http({
                url: URLService.getURL('stockServer'),
                method: 'JSONP',
                params: params
            });
        },
        getKLine: function (stockCode) {
            var timeGe = Date.now(), timeLe = timeGe - 90 * 24 * 3600 * 1000;
            var params = {
                type: 'kline',
                stockCode: stockCode,
                timeGe: timeGe,
                timeLe: timeLe,
                callback: 'JSON_CALLBACK'
            };
            return $http({
                url: URLService.getURL('stockServer'),
                method: 'JSONP',
                params: params
            });
        },
        getStockInfo: function (stockCode) {
            var params = {
                type: 'info',
                stockCode: stockCode,
                callback: 'JSON_CALLBACK'
            };
            return $http({
                url: URLService.getURL('stockServer'),
                method: 'JSONP',
                params: params
            });
        },
        //获取周/月K线图数据
        getWMKline: function (stockCode, type) {
            var params = {
                stockCode: stockCode,
                type: type
            };
            return $http({
                url: URLService.getURL('stockServer'),
                method: 'GET',
                params: params
            });
        }
    };
});
//系统服务
myServices.factory('SystemService', function ($http, URLService) {
    //节假日 CNY中国假日，USD美国假日
    var holidays = {
        CNY: {}
    };
    //交易时间段，通过获取后台接口配置，经过转化处理，缓存与该对象
    var TRADEPERIOD = {};
    //行情时间段
    var PERIOD = {
        DEFER: [['09:30', '15:30']],//A股递延费提示时间段
        STOCK: [['09:30', '11:30'], ['13:00', '15:00']],//A股
        //HSI: [[["09:30", "12:00"], ["13:00", "16:00"]], [["17:00", "23:30"]]],//恒指
        /*HSI: [["09:30", "12:00"], ["13:00", "16:00"]],//恒指
         GC: [['06:00', '24:00'], ['00:00', '05:00']],//美黄金
         CL: [['06:00', '24:00'], ['00:00', '05:00']]//美原油*/
    };
    var systemTime = Date.now(), currencyType = 'CNY';

    window.setInterval(function () {
        systemTime += 1000;
    }, 1000);

    return {
        getServerTime: function () {
            return $http({
                url: URLService.getURL('getServerTime'),
                method: 'GET'
            });
        },
        getCurrentTime: function () {
            return systemTime;
        },
        setCurrentTime: function (time) {
            var hour = new Date().getTimezoneOffset();
            systemTime = time + (480 + hour) * 60000;
        },
        setCurrentCurrencyType: function (type) {
            currencyType = type;
        },
        /**
         * 设置节假日对象
         * @param holiday[Object]
         */
        setHoliday: function (holiday) {
            holidays[currencyType] = holiday;
        },
        setTradePeriod: function (period) {
            TRADEPERIOD = period;
        },
        /**
         * 是否是节假日
         * @param time判断的时间,毫秒或者日期类型
         * @param type中国节日或者美国节日(CNY,USD)
         * @returns {boolean}
         */
        isHoliday: function (time) {
            if (time && !X.isDate(time)) {
                time = new Date(time);
            }
            var holiday = holidays[currencyType], now = time || new Date(systemTime);
            var year = holiday[now.getFullYear()];
            if (!year) {
                return false;
            }
            var month = year[now.getMonth() + 1];
            if (!month) {
                return false;
            }
            var date = now.getDate();
            // , c = s + (t.getHours() < 18 ? "D" : "N");

            return month.indexOf(date) != -1;
        },
        /**
         * 是否是周末
         * @param time日期或者毫秒
         * @returns {boolean}
         */
        isWeekend: function (time) {
            time = time || new Date(systemTime);
            time = X.isDate(time) ? time : new Date(time);
            var t = time.getDay();
            return 0 === t || 6 === t;
        },
        /**
         * 解析节假日配置
         * @param str节假日字符串
         * @returns {{}}节假日对象
         */
        parseHoliday: function (str) {
            if (!str)return;
            var h = {}, arr = str.split(',');
            arr.forEach(function (dateStr) {
                var dateArr = dateStr.split('-'),
                    year = dateArr[0] - 0, month = dateArr[1] - 0, day = dateArr[2] - 0;
                if (h[year]) {
                    if (h[year][month]) {
                        h[year][month].push(day);
                    } else {
                        h[year][month] = [day];
                    }
                } else {
                    h[year] = {};
                    h[year][month] = [day];
                }
            });
            return h;
        },
        /**
         * 解析字符串的交易时段为对象
         * @param strPeriod时段字符串
         * @returns {Array}时段对象
         */
        parsePeriod: function (strPeriod) {
            //strPeriod : "08:30,12:00|13:00,19:55"
            //strPeriod : "08:30,12:00|13:00,19:55;20:00,21:00|22:00,23:00"
            if (!strPeriod) {
                return;
            }
            var outer = strPeriod.split(';'), retOuter = [];
            outer.forEach(function (str) {
                var inner = str.split('|'), retInner = [];
                inner.forEach(function (time) {
                    var times = time.split(',');
                    if (times[0].length == 4)times[0] = '0' + times[0];
                    if (times[1].length == 4)times[1] = '0' + times[1];
                    retInner.push(times);
                });
                retOuter.push(retInner);
            });
            if (retOuter.length == 1) {
                retOuter = retOuter[0];
            }
            return retOuter;
        },
        /**
         * 获取对应条件的时间段，这个时间段可能是行情的时间（本地配置），也可能是交易时间（服务器配置）
         * @param commNo商品编号
         * @param type交易类别(quote:行情时间,trade:交易时间)
         * @returns {{}}
         */
        getQueryPeriod: function (commNo, type) {
            return type == 'trade' ? TRADEPERIOD : PERIOD[commNo];
        },
        /**
         * 获取真实的时间段
         * @param commNo商品编号
         * @param time相对的时间 930,1111 number
         * @param type交易类别(quote:行情时间,trade:交易时间)
         * @returns {*|{}}
         */
        getRealPeriod: function (commNo, time, type) {
            var period = this.getQueryPeriod(commNo, type);
            if (X.isArray(period[0][0])) {
                var bp = period[0], ep = period[1];
                var bbt = bp[0][0].replace(":", "") - 0, ebt = ep[0][0].replace(":", "") - 0;
                period = time >= bbt && time < ebt ? bp : ep;
            }
            return period;
        },
        /**
         * 根据商品编号和查询类型判断当前时间是否在交易时段
         * @param commNo
         * @param type(trade,quote)
         * @returns {boolean}
         */
        isInPeriod: function (commNo, type) {
            var now = new Date(systemTime), day = now.getDay(), isIn = false;
            if (day == 0) {
                return isIn;
            }
            var prevDay = new Date(systemTime).setDate(now.getDate() - 1);
            var prevIsHoliday = this.isHoliday(prevDay), isHoliday = this.isHoliday();
            var time = X.formatDate(now, 'h:m'), period = this.getRealPeriod(commNo, time.replace(":", "") - 0, type);
            //X.log(time, prevIsHoliday, isHoliday,period);
            period.forEach(function (t) {
                var bTime = t[0], eTime = t[1];
                //这里判断什么条件下能够处在交易时间段
                //1、如果包括跨天时间段，并且当前时间在时间段中间，这时候如果前一天不是节假日并且今天也不是周一则在交易时段
                //2、如果不包括跨天则判断是否是非周六的时间段内，如果满足条件只要判断下今天是不是节假日就好了
                if ("00:00" === bTime && time >= bTime && time < eTime) {
                    if (!prevIsHoliday && day != 1) {
                        isIn = true;
                    }
                } else {
                    if (day != 6 && time >= bTime && time < eTime) {
                        isIn = !isHoliday;
                    }
                }
            });
            return isIn;
        },
        //判断是否在集合进价时段（09:00-09:30）
        isInJJPeriod: function () {
            var now = new Date(systemTime), time = X.formatDate(now, 'h:m'), period = ['09:00', '09:30'];
            return time >= period[0] && time <= period[1];
        },

        //判断是否在14：30 - 14:50之间   此判断在后台已做了，前端不用此方法了
        isInDYTipPeriod: function () {
            var now = new Date(systemTime), time = X.formatDate(now, 'h:m'), period = ['14:30', '14:50'];
            return time >= period[0] && time <= period[1];
        },
        cellPhoneNumber: function (){
            var now = new Date(systemTime), time = X.formatDate(now,'h:m'), period = ['17:30', '21:00'],obj = {cellPhone: '057128834670',cellPhoneATag : 'tel:057128834670'};
            if(time >= period[0] && time <= period[1]){obj.cellPhone = '15575990597';obj.cellPhoneATag = 'tel:15575990597'};
            return obj;
        },

        /**
         * 获取下一个交易时间提示
         * @param commNo商品标识
         * @returns {string}
         */
        getTipsForNextTime: function (commNo) {
            var t = this, now = new Date(systemTime), time = X.formatDate(now, 'h:m'), period = this.getQueryPeriod(commNo, 'trade');
            if (X.isArray(period[0][0])) {
                period = period[0].slice().concat(period[1]);
            }
            var len = period.length, i, nextTime;
            for (i = 0; i < len; i++) {
                var timePeriod = period[i], bt = timePeriod[0];
                if ("00:00" !== bt && time < bt) {
                    nextTime = bt;
                    break;
                }
            }
            var beginTime = period[0][0], endTime = period[period.length - 1][1], nextDay = '今天';

            function nextTradeDay() {
                var day = 0;
                do {
                    day++;
                    now.setDate(now.getDate() + 1);
                } while (t.isWeekend(now) || t.isHoliday(now));
                nextTime = beginTime;
                nextDay = day <= 1 ? '明天' : X.formatDate(now, 'M月D日');
            }

            if (t.isWeekend(now) || t.isHoliday(now) || (endTime > beginTime && time >= endTime)) {
                nextTradeDay();
            }
            return '下次交易时间为' + nextDay + nextTime;
        },
        /**
         * 获取当前时段结束提示
         * @param commNo商品标识
         * @returns {string}
         */
        getTipsForTradeStopTime: function (commNo) {
            var now = new Date(systemTime), time = X.formatDate(now, 'h:m'), period = this.getRealPeriod(commNo, time.replace(":", "") - 0, 'trade');
            // if (X.isArray(period[0][0])) {
            //     period = period[0].slice().concat(period[1]);
            // }
            //X.log(period)
            var stopTime = period[period.length - 1][1];
            // for (var i = 0; i < period.length; i++) {
            //     var timePeriod = period[i], et = timePeriod[1];
            //     if ("24:00" !== et && time < et) {
            //         stopTime = et;
            //         break;
            //     }
            // }

            return '持仓时间至' + stopTime;
        },

        uuid: function (len) {
            var r = "0Aa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0Kk1Ll2Mm3Nn4Oo5Pp6Qq7Rr8Ss9Tt0Uu1Vv2Ww3Xx4Yy5Zz6789", l = r.length, ret = '';
            len = len || 20;
            while (len--) {
                ret += r.charAt(Math.random() * l | 0);
            }
            return ret;
        },
        getProvince: function () {
            var province = [["1", "北京市"], ["2", "天津市"], ["3", "河北省"], ["4", "山西省"], ["5", "内蒙古自治区"], ["6", "辽宁省"], ["7", "吉林省"], ["8", "黑龙江省"], ["9", "上海市"], ["10", "江苏省"],
                ["11", "浙江省"], ["12", "安徽省"], ["13", "福建省"], ["14", "江西省"], ["15", "山东省"], ["16", "河南省"], ["17", "湖北省"], ["18", "湖南省"], ["19", "广东省"],
                ["20", "广西壮族自治区"], ["21", "海南省"], ["22", "重庆市"], ["23", "四川省"], ["24", "贵州省"], ["25", "云南省"], ["26", "西藏自治区"], ["27", "陕西省"], ["28", "甘肃省"], ["29", "青海省"],
                ["30", "宁夏回族自治区"], ["31", "新疆维吾尔自治区"], ["32", "香港特别行政区"], ["33", "澳门特别行政区"], ["34", "台湾省"]];
            return province;
        },
        getCities: function () {
            var cities = [
                ["1", "1", "北京市", "100000"], ["2", "2", "天津市", "100000"], ["3", "3", "石家庄市", "050000"], ["3", "4", "唐山市", "063000"], ["3", "5", "秦皇岛市", "066000"], ["3", "6", "邯郸市", "056000"], ["3", "7", "邢台市", "054000"], ["3", "8", "保定市", "071000"], ["3", "9", "张家口市", "075000"], ["3", "10", "承德市", "067000"], ["3", "11", "沧州市", "061000"], ["3", "12", "廊坊市", "065000"], ["3", "13", "衡水市", "053000"], ["4", "14", "太原市", "030000"], ["4", "15", "大同市", "037000"], ["4", "16", "阳泉市", "045000"], ["4", "17", "长治市", "046000"], ["4", "18", "晋城市", "048000"], ["4", "19", "朔州市", "036000"], ["4", "20", "晋中市", "030600"], ["4", "21", "运城市", "044000"], ["4", "22", "忻州市", "034000"], ["4", "23", "临汾市", "041000"], ["4", "24", "吕梁市", "030500"], ["5", "25", "呼和浩特市", "010000"], ["5", "26", "包头市", "014000"], ["5", "27", "乌海市", "016000"], ["5", "28", "赤峰市", "024000"], ["5", "29", "通辽市", "028000"], ["5", "30", "鄂尔多斯市", "010300"], ["5", "31", "呼伦贝尔市", "021000"], ["5", "32", "巴彦淖尔市", "014400"], ["5", "33", "乌兰察布市", "011800"], ["5", "34", "兴安盟", "137500"], ["5", "35", "锡林郭勒盟", "011100"], ["5", "36", "阿拉善盟", "016000"], ["6", "37", "沈阳市", "110000"], ["6", "38", "大连市", "116000"], ["6", "39", "鞍山市", "114000"], ["6", "40", "抚顺市", "113000"], ["6", "41", "本溪市", "117000"], ["6", "42", "丹东市", "118000"], ["6", "43", "锦州市", "121000"], ["6", "44", "营口市", "115000"], ["6", "45", "阜新市", "123000"], ["6", "46", "辽阳市", "111000"], ["6", "47", "盘锦市", "124000"], ["6", "48", "铁岭市", "112000"], ["6", "49", "朝阳市", "122000"], ["6", "50", "葫芦岛市", "125000"], ["7", "51", "长春市", "130000"], ["7", "52", "吉林市", "132000"], ["7", "53", "四平市", "136000"], ["7", "54", "辽源市", "136200"], ["7", "55", "通化市", "134000"], ["7", "56", "白山市", "134300"], ["7", "57", "松原市", "131100"], ["7", "58", "白城市", "137000"], ["7", "59", "延边州", "133000"], ["8", "60", "哈尔滨市", "150000"], ["8", "61", "齐齐哈尔市", "161000"], ["8", "62", "鸡西市", "158100"], ["8", "63", "鹤岗市", "154100"], ["8", "64", "双鸭山市", "155100"], ["8", "65", "大庆市", "163000"], ["8", "66", "伊春市", "152300"], ["8", "67", "佳木斯市", "154000"], ["8", "68", "七台河市", "154600"], ["8", "69", "牡丹江市", "157000"], ["8", "70", "黑河市", "164300"], ["8", "71", "绥化市", "152000"], ["8", "72", "大兴安岭地区", "165000"], ["9", "73", "上海市", "200000"], ["10", "74", "南京市", "210000"], ["10", "75", "无锡市", "214000"], ["10", "76", "徐州市", "221000"], ["10", "77", "常州市", "213000"], ["10", "78", "苏州市", "215000"], ["10", "79", "南通市", "226000"], ["10", "80", "连云港市", "222000"], ["10", "81", "淮安市", "223200"], ["10", "82", "盐城市", "224000"], ["10", "83", "扬州市", "225000"], ["10", "84", "镇江市", "212000"], ["10", "85", "泰州市", "225300"], ["10", "86", "宿迁市", "223800"], ["11", "87", "杭州市", "310000"], ["11", "88", "宁波市", "315000"], ["11", "89", "温州市", "325000"], ["11", "90", "嘉兴市", "314000"], ["11", "91", "湖州市", "313000"], ["11", "92", "绍兴市", "312000"], ["11", "93", "金华市", "321000"], ["11", "94", "衢州市", "324000"], ["11", "95", "舟山市", "316000"], ["11", "96", "台州市", "318000"], ["11", "97", "丽水市", "323000"], ["12", "98", "合肥市", "230000"], ["12", "99", "芜湖市", "241000"], ["12", "100", "蚌埠市", "233000"], ["12", "101", "淮南市", "232000"], ["12", "102", "马鞍山市", "243000"], ["12", "103", "淮北市", "235000"], ["12", "104", "铜陵市", "244000"], ["12", "105", "安庆市", "246000"], ["12", "106", "黄山市", "242700"], ["12", "107", "滁州市", "239000"], ["12", "108", "阜阳市", "236100"], ["12", "109", "宿州市", "234100"], ["12", "110", "巢湖市", "238000"], ["12", "111", "六安市", "237000"], ["12", "112", "亳州市", "236800"], ["12", "113", "池州市", "247100"], ["12", "114", "宣城市", "366000"], ["13", "115", "福州市", "350000"], ["13", "116", "厦门市", "361000"], ["13", "117", "莆田市", "351100"], ["13", "118", "三明市", "365000"], ["13", "119", "泉州市", "362000"], ["13", "120", "漳州市", "363000"], ["13", "121", "南平市", "353000"], ["13", "122", "龙岩市", "364000"], ["13", "123", "宁德市", "352100"], ["14", "124", "南昌市", "330000"], ["14", "125", "景德镇市", "333000"], ["14", "126", "萍乡市", "337000"], ["14", "127", "九江市", "332000"], ["14", "128", "新余市", "338000"], ["14", "129", "鹰潭市", "335000"], ["14", "130", "赣州市", "341000"], ["14", "131", "吉安市", "343000"], ["14", "132", "宜春市", "336000"], ["14", "133", "抚州市", "332900"], ["14", "134", "上饶市", "334000"], ["15", "135", "济南市", "250000"], ["15", "136", "青岛市", "266000"], ["15", "137", "淄博市", "255000"], ["15", "138", "枣庄市", "277100"], ["15", "139", "东营市", "257000"], ["15", "140", "烟台市", "264000"], ["15", "141", "潍坊市", "261000"], ["15", "142", "济宁市", "272100"], ["15", "143", "泰安市", "271000"], ["15", "144", "威海市", "265700"], ["15", "145", "日照市", "276800"], ["15", "146", "莱芜市", "271100"], ["15", "147", "临沂市", "276000"], ["15", "148", "德州市", "253000"], ["15", "149", "聊城市", "252000"], ["15", "150", "滨州市", "256600"], ["15", "151", "菏泽市", "255000"], ["16", "152", "郑州市", "450000"], ["16", "153", "开封市", "475000"], ["16", "154", "洛阳市", "471000"], ["16", "155", "平顶山市", "467000"], ["16", "156", "安阳市", "454900"], ["16", "157", "鹤壁市", "456600"], ["16", "158", "新乡市", "453000"], ["16", "159", "焦作市", "454100"], ["16", "160", "濮阳市", "457000"], ["16", "161", "许昌市", "461000"], ["16", "162", "漯河市", "462000"], ["16", "163", "三门峡市", "472000"], ["16", "164", "南阳市", "473000"], ["16", "165", "商丘市", "476000"], ["16", "166", "信阳市", "464000"], ["16", "167", "周口市", "466000"], ["16", "168", "驻马店市", "463000"], ["17", "169", "武汉市", "430000"], ["17", "170", "黄石市", "435000"], ["17", "171", "十堰市", "442000"], ["17", "172", "宜昌市", "443000"], ["17", "173", "襄樊市", "441000"], ["17", "174", "鄂州市", "436000"], ["17", "175", "荆门市", "448000"], ["17", "176", "孝感市", "432100"], ["17", "177", "荆州市", "434000"], ["17", "178", "黄冈市", "438000"], ["17", "179", "咸宁市", "437000"], ["17", "180", "随州市", "441300"], ["17", "181", "恩施州", "445000"], ["17", "182", "神农架", "442400"], ["18", "183", "长沙市", "410000"], ["18", "184", "株洲市", "412000"], ["18", "185", "湘潭市", "411100"], ["18", "186", "衡阳市", "421000"], ["18", "187", "邵阳市", "422000"], ["18", "188", "岳阳市", "414000"], ["18", "189", "常德市", "415000"], ["18", "190", "张家界市", "427000"], ["18", "191", "益阳市", "413000"], ["18", "192", "郴州市", "423000"], ["18", "193", "永州市", "425000"], ["18", "194", "怀化市", "418000"], ["18", "195", "娄底市", "417000"], ["18", "196", "湘西土家族苗族自治州", "416000"], ["19", "197", "广州市", "510000"], ["19", "198", "韶关市", "521000"], ["19", "199", "深圳市", "518000"], ["19", "200", "珠海市", "519000"], ["19", "201", "汕头市", "515000"], ["19", "202", "佛山市", "528000"], ["19", "203", "江门市", "529000"], ["19", "204", "湛江市", "524000"], ["19", "205", "茂名市", "525000"], ["19", "206", "肇庆市", "526000"], ["19", "207", "惠州市", "516000"], ["19", "208", "梅州市", "514000"], ["19", "209", "汕尾市", "516600"], ["19", "210", "河源市", "517000"], ["19", "211", "阳江市", "529500"], ["19", "212", "清远市", "511500"], ["19", "213", "东莞市", "511700"], ["19", "214", "中山市", "528400"], ["19", "215", "潮州市", "515600"], ["19", "216", "揭阳市", "522000"], ["19", "217", "云浮市", "527300"], ["20", "218", "南宁市", "530000"], ["20", "219", "柳州市", "545000"], ["20", "220", "桂林市", "541000"], ["20", "221", "梧州市", "543000"], ["20", "222", "北海市", "536000"], ["20", "223", "防城港市", "538000"], ["20", "224", "钦州市", "535000"], ["20", "225", "贵港市", "537100"], ["20", "226", "玉林市", "537000"], ["20", "227", "百色市", "533000"], ["20", "228", "贺州市", "542800"], ["20", "229", "河池市", "547000"], ["20", "230", "来宾市", "546100"], ["20", "231", "崇左市", "532200"], ["21", "232", "海口市", "570000"], ["21", "233", "三亚市", "572000"], ["22", "234", "重庆市", "400000"], ["23", "235", "成都市", "610000"], ["23", "236", "自贡市", "643000"], ["23", "237", "攀枝花市", "617000"], ["23", "238", "泸州市", "646100"], ["23", "239", "德阳市", "618000"], ["23", "240", "绵阳市", "621000"], ["23", "241", "广元市", "628000"], ["23", "242", "遂宁市", "629000"], ["23", "243", "内江市", "641000"], ["23", "244", "乐山市", "614000"], ["23", "245", "南充市", "637000"], ["23", "246", "眉山市", "612100"], ["23", "247", "宜宾市", "644000"], ["23", "248", "广安市", "638000"], ["23", "249", "达州市", "635000"], ["23", "250", "雅安市", "625000"], ["23", "251", "巴中市", "635500"], ["23", "252", "资阳市", "641300"], ["23", "253", "阿坝藏族羌族自治州", "624600"], ["23", "254", "甘孜藏族自治州", "626000"], ["23", "255", "凉山州", "615000"], ["24", "256", "贵阳市", "55000"], ["24", "257", "六盘水市", "553000"], ["24", "258", "遵义市", "563000"], ["24", "259", "安顺市", "561000"], ["24", "260", "铜仁地区", "554300"], ["24", "261", "黔西南州", "551500"], ["24", "262", "毕节地区", "551700"], ["24", "263", "黔东南州", "551500"], ["24", "264", "黔南州", "550100"], ["25", "265", "昆明市", "650000"], ["25", "266", "曲靖市", "655000"], ["25", "267", "玉溪市", "653100"], ["25", "268", "保山市", "678000"], ["25", "269", "昭通市", "657000"], ["25", "270", "丽江市", "674100"], ["25", "271", "思茅市", "665000"], ["25", "272", "临沧市", "677000"], ["25", "273", "楚雄州", "675000"], ["25", "274", "红河州", "654400"], ["25", "275", "文山州", "663000"], ["25", "276", "西双版纳州", "666200"], ["25", "277", "大理州", "671000"], ["25", "278", "德宏州", "678400"], ["25", "279", "怒江州", "671400"], ["25", "280", "迪庆州", "674400"], ["26", "281", "拉萨市", "850000"], ["26", "282", "昌都地区", "854000"], ["26", "283", "山南地区", "856000"], ["26", "284", "日喀则地区", "857000"], ["26", "285", "那曲地区", "852000"], ["26", "286", "阿里地区", "859100"], ["26", "287", "林芝地区", "860100"], ["27", "288", "西安市", "710000"], ["27", "289", "铜川市", "727000"], ["27", "290", "宝鸡市", "721000"], ["27", "291", "咸阳市", "712000"], ["27", "292", "渭南市", "714000"], ["27", "293", "延安市", "716000"], ["27", "294", "汉中市", "723000"], ["27", "295", "榆林市", "719000"], ["27", "296", "安康市", "725000"], ["27", "297", "商洛市", "711500"], ["28", "298", "兰州市", "730000"], ["28", "299", "嘉峪关市", "735100"], ["28", "300", "金昌市", "737100"], ["28", "301", "白银市", "730900"], ["28", "302", "天水市", "741000"], ["28", "303", "武威市", "733000"], ["28", "304", "张掖市", "734000"], ["28", "305", "平凉市", "744000"], ["28", "306", "酒泉市", "735000"], ["28", "307", "庆阳市", "744500"], ["28", "308", "定西市", "743000"], ["28", "309", "陇南市", "742100"], ["28", "310", "临夏回族自治州", "731100"], ["28", "311", "甘南藏族自治州", "747000"], ["29", "312", "西宁市", "810000"], ["29", "313", "海东地区", "810600"], ["29", "314", "海北藏族自治州", "810300"], ["29", "315", "黄南藏族自治州", "811300"], ["29", "316", "海南藏族自治州", "813000"], ["29", "317", "果洛藏族自治州", "814000"], ["29", "318", "玉树藏族自治州", "815000"], ["29", "319", "海西蒙古族藏族自治州", "817000"], ["30", "320", "银川市", "750000"], ["30", "321", "石嘴山市", "753000"], ["30", "322", "吴忠市", "751100"], ["30", "323", "固原市", "756000"], ["30", "324", "中卫市", "751700"], ["31", "325", "乌鲁木齐市", "830000"], ["31", "326", "克拉玛依市", "834000"], ["31", "327", "吐鲁番地区", "838000"], ["31", "328", "哈密地区", "839000"], ["31", "329", "昌吉回族自治州", "831100"], ["31", "330", "博尔塔拉蒙古自治州", "833400"], ["31", "331", "巴音郭楞蒙古自治州", "841000"], ["31", "332", "阿克苏地区", "843000"], ["31", "333", "克孜勒苏柯尔克孜自治州", "835600"], ["31", "334", "喀什地区", "844000"], ["31", "335", "和田地区", "848000"], ["31", "336", "伊犁哈萨克自治州", "833200"], ["31", "337", "塔城地区", "834700"], ["31", "338", "阿勒泰地区", "836500"], ["31", "339", "石河子市", "832000"], ["31", "340", "阿拉尔市", "843300"], ["31", "341", "图木舒克市", "843900"], ["31", "342", "五家渠市", "831300"], ["32", "343", "香港特别行政区", "000000"], ["33", "344", "澳门特别行政区", "000000"], ["34", "345", "台湾省", "000000"]];
            return cities;
        }
    };
});
//认证服务
myServices.factory('AuthService', function () {
    var sessionStorage = window.sessionStorage;
    return {
        auth: function () {
            var session = sessionStorage.getItem('sessionID'), now = Date.now(), timeOut = 2 * 60 * 60 * 1000;
            //没有找到用户信息为未登录
            if (!session) {
                return false;
            }
            var sessionArr = session.split('#'), lastLoginTime = sessionArr[1];
            //session超时
            if (now - lastLoginTime > timeOut) {
                sessionStorage.removeItem('sessionID');
                return false;
            }
            sessionArr[1] = now;
            sessionStorage.setItem('sessionID', sessionArr.join('#'));
            return true;
        },
        signIn: function (userID) {
            var authStr = [userID, Date.now()].join('#');
            sessionStorage.setItem('sessionID', authStr);
        },
        signOut: function () {
            sessionStorage.removeItem('sessionID');
        }
    };
});
//拦截器
myServices.factory('myInterceptor', function ($location, AuthService) {
    var interceptor = {
        'request': function (config) {
            return config;
        },
        'response': function (response) {
            if (response.config.method == 'GET' && response.config.url == '/trade/scheme/getHoldingScheme.json') {
                return response;
            }

            if (X.isObject(response.data)) {
                if (response.data.code == 100) {
                    AuthService.auth();
                } else if (response.data.code == 405) {
                    AuthService.signOut();
                    $location.path('/login').replace();
                }
            }
            return response;
        },
        'requestError': function (rejection) {
            return rejection;
        },
        'responseError': function (rejection) {
            return rejection;
        }
    };
    return interceptor;
});
//排行服务
myServices.factory('RankService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        getRank: function (type) {
            var url = type == 'day' ? URLService.getURL('getUserRank') : URLService.getURL('getUnionRank');
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: url,
                params: params
            })

        }
    };
});
//红包
myServices.factory('PacketService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        getPacketInfoData: function (activityId) {
            var params = {
                device: 1,
                agentCode: 'yztz',
                activityId: activityId
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getPacketInfo'),
                params: params
            });
        },
        receivePacketData: function (params) {
            params.device = 1;
            params.agentCode = 'YZTZ';
            /* var params = {
             device: 1,
             agentCode:'yztz',
             title: title,
             money: money,
             awardLogId:awardLogId
             };*/
            return $http({
                method: 'POST',
                url: URLService.getURL('receivePacket'),
                params: params
            });
        },
        getPacketFundInfoData: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getPacketFundInfo'),
                params: params
            });
        },
        getPacketRecordListData: function () {
            var params = {
                device: 1
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getPacketRecordList'),
                params: params
            });
        }

    };
});
//活动中心
myServices.factory('ActivityService', function ($http, $httpParamSerializerJQLike, URLService) {
    return {
        getActivityListData: function () {
            var params = {
                device: 1,
                agentCode: 'yztz'
            };
            return $http({
                method: 'GET',
                url: URLService.getURL('getActivityList'),
                params: params
            });
        }

    };
});