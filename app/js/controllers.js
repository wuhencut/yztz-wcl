/**
 * Created by JIAQIANG on 2015/11/5.
 */
'use strict';
//noinspection JSUnresolvedFunction
var myControllers = angular.module('myControllers', []);
//首页 DONE
myControllers.controller('IndexCtrl', function ($scope, $swipe, $q, $interval, UserService, TradeService, SystemService, StockService, IndexService) {
    var banner = [],
        stockCodes = ['SH000001', 'SZ399001', 'SZ399006'],//股票代码数组，默认有上证，深证，创业板
        isInQuoteTime = false,//是否在股票时间
        isHoliday = true,//节假日
        dataIsLoaded = true,//数据加载
        cldtData, clbdData;
    $scope.defaultList = [];//
    $scope.dataLoaded = false;//是否已加载
    $scope.actType = 'cpdr';//策略排行和操盘大人切换
    $scope.strategies = [];
    $scope.users = [];
    $scope.ad = {};
    $scope.showAd = false;

    X.loading.show();
    $q.all({
        tradeInit: TradeService.getInitTrade(),
        cldt: IndexService.getTradingInfo(),
        clbd: IndexService.getStrategyWeekData()
    }).then(function (res) {
        var tradeInitData = res.tradeInit.data;
        cldtData = res.cldt.data;
        clbdData = res.clbd.data;
        if (tradeInitData.code == 100 && cldtData.code == 100 && clbdData.code == 100) {
            var initData = tradeInitData.data;
            $scope.clbdList = clbdData.data;
            isHoliday = initData['isHoliday'];
            SystemService.setCurrentTime(initData['nowTime']);
            //会出现一种情况，排行code为100，但是data为null，因此做了特殊处理，当data存在才对数据进行处理，不存在则跳出，处理股票数据
            getShowData();
            query();
        } else {
            if (tradeInitData.code != 100) {
                X.tip(tradeInitData['resultMsg']);
            } else if (cldtData.code != 100) {
                X.tip(cldtData['resultMsg']);
            } else if (clbdData.code != 100) {
                X.tip(clbdData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //策略排行操盘达人
    function getShowData() {
        isInQuoteTime = SystemService.isInPeriod('STOCK', 'quote');
        if (!isHoliday && isInQuoteTime) {
            IndexService.getTradingInfo().then(function (res) {
                var data = res.data;
                if (data.code == 100) {
                    calTimeColor(data);
                } else {
                    X.tip(data['resultMsg'])
                }
            }).catch(function () {
                X.tip('服务器请求异常')
            });
        } else {
            calTimeColor(cldtData);
        }
    }


    //组装时间差和头部显示的颜色
    function calTimeColor(data) {
        var cldtList = data.data, id = 1;
        for (var i in data.data) {
            cldtList[i]['diffTime'] = calTime(cldtList[i]['tradingTime']);

            cldtList[i]['buyPriceDeal'] = (parseInt(cldtList[i]['buyPriceDeal'] * 100) / 100).toFixed(2);

            if (id == 1 || id == 4 || id == 7) {
                cldtList[i]['status'] = 'red';
            } else if (id == 2 || id == 5) {
                cldtList[i]['status'] = 'blue';
            } else if (id == 3 || id == 6) {
                cldtList[i]['status'] = 'yellow';
            }
            id++;
        }
        $scope.cldtList = cldtList;
    }

    //定时器，一分钟刷一次
    X.engine.addTask(getShowData, 60000);
    X.engine.start();

    //计算时间
    function calTime(time) {
        var localTime = new Date().getTime(), diffTime = localTime - time, diff;
        if (diffTime < 60000) {
            diff = '1分钟'
        } else {
            if (diffTime < 3600000) {
                diff = parseInt(diffTime / 60000) + '分钟';
            } else if (diffTime > 3600000 && diffTime < 86400000) {
                diff = parseInt(diffTime / 3600000) + '小时';
            } else {
                diff = parseInt(diffTime / 86400000) + '天';
            }
        }
        return diff;
    }

    //查询方法
    function query() {
        getStockInfo();
        isInQuoteTime = SystemService.isInPeriod('STOCK', 'quote');
        if (!isHoliday && isInQuoteTime && dataIsLoaded) {
            dataIsLoaded = false;
            X.engine.addTask(getStockInfo, 1000);
            X.engine.start();
        }
        /*timer = $interval(function () {
         X.log('自选定时器运行中。。。');
         isInQuoteTime = SystemService.isInPeriod('STOCK', 'quote');
         if (!isHoliday && isInQuoteTime && dataIsLoaded) {
         dataIsLoaded = false;
         getStockInfo();
         }
         }, 1000);*/
    }

    /*//清空轮询任务
     function clearTimer() {
     if (timer) {
     $interval.cancel(timer);
     }
     }*/

    //获取股票信息
    function getStockInfo() {
        X.log('行情定时器运行中。。。');
        StockService.getStockInfo(stockCodes.join(',')).then(function (res) {
            dataIsLoaded = true;
            var infoData = res.data;
            if (infoData.code == 100) {
                processStockInfoData(infoData.data);
            } else {
                X.tip(infoData['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            dataIsLoaded = true;
            X.tip('服务器请求异常');
        });
    }

    //组装展示数据
    function processStockInfoData(data) {
        $scope.dataLoaded = true;
        /*//组装新数据前先清空原来数据
         $scope.mineList = [];*/
        $scope.defaultList = [];
        var dataList = [];
        $.each(stockCodes, function (i, item) {
            var obj = data[item], stockObj = {};
            //如果本地自选股票下架，将查询不到股票的相关信息，此处直接跳过
            if (!obj) {
                return;
            }
            stockObj['stockName'] = obj['stockName'];

            var lastClosePrice = obj['lastClosePrice'], price = obj['newPrice'];
            var diff = price - lastClosePrice,
                rote = (diff / lastClosePrice * 100);
            stockObj['price'] = price.toFixed(2);
            stockObj['rote'] = rote.toFixed(2);
            stockObj['diff'] = diff.toFixed(2);
            dataList.push(stockObj);
        });

        /*$scope.mineList = dataList.splice(3);//切割后的数组*/
        $scope.defaultList = dataList;//完成数据数组
    }

    function getBanner() {
        UserService.getHeader().then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                var headerData = data.data;
                //将广告进行数组处理，并拆分成banner轮播图和ad弹窗广告
                getArr(headerData);
                //判断是否有弹窗
                if ($scope.ad.id && $scope.ad.imgUrl) {
                    adPop($scope.ad.id);
                }
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    function getArr(data) {
        var arr = [];
        for (var i in data) {
            arr[i] = {
                id: data[i][0],
                type: data[i][2],
                imgUrl: data[i][3],
                link: data[i][5] || '',
                btnText: data[i][6] || '',
                btnLink: data[i][8] || ''
            };
            if (arr[i].type == 1) {
                banner.push(arr[i]);
            } else {
                //当存在两个或多个type值为0时，弹窗广告取最后一个
                $scope.ad = arr[i];
            }
        }
        X.slide.init('mod-slide', banner, $swipe);
    }

    function adPop(id) {
        var storage = window.localStorage, AD = 'AD', adStr = storage.getItem(AD) || '';
        if (adStr == '' || adStr != id) {
            $scope.showAd = true;
            storage.setItem(AD, id);
        }
    }

    //跳转链接
    $scope.toDetail = function (obj) {
        if (!obj.link) return;
        var link = obj.link;
        if (obj.btnText && obj.btnLink) {
            var btnText = encodeURIComponent(obj.btnText), btnLink = encodeURIComponent(obj.btnLink);
            link = link + '?btnText=' + btnText + '&btnLink=' + btnLink;
        }
        window.location = link;
    };

    getBanner();

    //controller卸载的时候清除定时器任务
    $scope.$on('$destroy', function () {
        X.engine.destroy();
    });
});
//登录 DONE
myControllers.controller('LoginCtrl', function ($rootScope, $interval, $scope, $location, LoginService, AuthService) {
    $scope.goURL = $location.search()['goURL'] || '/myHome';
    var timer = null;
    $scope.btnState = '';

    $scope.form = {
        username: '',
        password: ''
    };

    $scope.login = function () {
        /*if ($scope.form.username == '') {
         return;
         X.tip('请输入您的账号');
         }
         if ($scope.form.password == '') {
         X.tip('请输入登录密码');
         return false;
         }*/
        if ($scope.form.username == '' || $scope.form.password == '')return;

        X.loading.show();
        LoginService.login($scope.form.username, $scope.form.password).then(function (res) {
            var data = res.data;
            if (data['authenticated']) {
                $rootScope.isLogin = true;
                if ($scope.goURL == '/login') {
                    $scope.goURL = '/myHome';
                }
                AuthService.signIn(data['userId']);
                $location.url($scope.goURL);

                //埋点：用户id
                zhuge.identify(data['userId']);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFn() {
        timer = $interval(function () {
            $scope.btnState = 'disable';
            if ($scope.form.username != '' && $scope.form.password != '') {
                $scope.btnState = 'orange'
            } else if ($scope.form.username == '' || $scope.form.password == '') {
                $scope.state = '';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFn();
});
//注册第一步 DONE
myControllers.controller('Register1Ctrl', function ($scope, $interval, $location, RegisterService) {
    $scope.mobile = '';
    $scope.state = '';
    $scope.btnState = 'disable';
    $scope.agreement = true;
    $scope.showCodeDialog = false;
    $scope.temptimes = Date.now();
    $scope.imgCode = '';
    var timer = null;
    $scope.time = 0;
    $scope.checkCode = '';//验证码
    $scope.register = function () {
        if (!X.isMobile($scope.mobile)) {
            X.tip('请输入正确的手机号码');
            return
        } else if ($scope.checkCode == '') {
            X.tip('请输入验证码');
            return
        } else if($scope.checkCode.length != 4){
            X.tip('验证码输入有误');
            return
        } else{
            goNextStep()
        }

    };

    function goNextStep (){
        if($scope.btnState === 'disable')return;
        //验证手机号码是否已经注册
        X.loading.show();
        RegisterService.regNextStep($scope.mobile, $scope.checkCode).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $location.path('/register2/' + $scope.mobile);
                //埋点：注册-开始注册
                zhuge.track('注册-开始注册');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //显示图片验证码
    $scope.getImgCode = function () {
        if ($scope.mobile == '') {
            X.tip('请输入手机号码');
            return false;
        }
        if (!X.isMobile($scope.mobile)) {
            X.tip('手机号码输入错误');
            return false;
        }
        $scope.refreshCode();
        $scope.showCodeDialog = true;
    };

    $scope.clearMobile = function(){
        if ($scope.mobile && $scope.mobile != '') {
            $scope.mobile = '';
        } else {
            return;
        }
    };

    // 关闭弹出框
    $scope.closeDialog = function () {
        $scope.showCodeDialog = false;
        $scope.imgCode = '';
    };

    //刷新验证码
    $scope.refreshCode = function () {
        $scope.temptimes = Date.now();
    };

    //获取验证吗
    $scope.registerCode = function () {
        if ($scope.mobile == '') {
            X.tip('请输入手机号码');
            return false;
        }
        if (!X.isMobile($scope.mobile)) {
            X.tip('手机号码输入错误');
            return false;
        }
        if ($scope.imgCode == '') {
            X.tip('请输入图片验证码');
            return false;
        }
        if (!/^\d{4}$/.test($scope.imgCode)) {
            X.tip('图片验证码输入错误');
            if($scope.imgCode == 4)$scope.refreshCode();
            return false;
        }

        X.log($scope.imgCode);
        //发送验证码请求
        RegisterService.getRegisterCode($scope.mobile,$scope.imgCode).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.time = 60;
                X.tip('验证码已发送至' + $scope.mobile + '，请稍等 !');
                timerFunc();
                $scope.closeDialog()
            } else if (data.code == 101) {
                $scope.time = data.data.interval;
                X.tip('验证码已发送至' + $scope.mobile + '，请稍等 !');
                timerFunc();
                $scope.closeDialog()
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    // 定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFn() {
        timer = $interval(function () {
            $scope.state = '';
            $scope.btnState = 'disable';
            if ($scope.mobile.length > 0) {
                $scope.state = '-orange';
            } else if ($scope.mobile == '') {
                $scope.state = '';
            }

            if ($scope.mobile.length == 11 && $scope.checkCode != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    var timerSec = null;
    //定时器 ： 倒计时
    function timerFunc() {
        timerSec = setInterval(function () {
            if ($scope.time > 0) {
                $scope.$apply(function () {
                    $scope.time--;
                });
            } else {
                timerSec && clearTimeout(timerSec);
            }
        }, 1000);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer);
        timerSec && $interval.cancel(timerSec);
    });

    timerFn();
    timerFunc();
});
//注册第二步 DONE
myControllers.controller('Register2Ctrl', function ($scope, $interval, $location, $routeParams, AuthService, RegisterService) {
    /*var mobile = $routeParams.mobile;
     //先验证参数是否合法
     if (!X.isMobile(mobile)) {
     $location.path('/register1');
     return false;
     }*/
    //定时器
    var timer = null;
    $scope.time = 0;
    // $scope.checkCode = '';//验证码
    $scope.password = '';//登录密码
    $scope.username = '';//昵称
    $scope.surepass = '';//
    $scope.mobile = $routeParams['mobile'] || '';
    if ($scope.mobile == '') {
        $location.url('/register1');
    }
    // $scope.mobile = mobile;
    $scope.pswType = 'password';

    //注册
    $scope.register = function () {
        var username = $.trim($scope.username);
        if (username == '' || $scope.password == '' || $scope.checkCode == '')return;

        /*if ($scope.checkCode == '') {
         X.tip('验证码不能为空');
         return false;
         }*/
        if (!/^\w{4,16}$/.test($scope.password) || /^\d+$/.test($scope.password) || /^([a-zA-Z]+)$/.test($scope.password)) {
            X.tip('登录密码为6-16位数字和字母组成');
            return false;
        }
        /*if (username == '') {
         X.tip('用户名不能为空');
         return false;
         }*/
        if (X.strLen(username) < 4 || X.strLen(username) > 16) {
            X.tip('用户名为4-16个字符，中文算2个字符');
            return false;
        }
        if (!/^[0-9a-zA-Z_\u4e00-\u9fa5]+$/.test(username)) {
            X.tip('用户名只允许字母、数字、下划线或中文');
            return false;
        }
        if (!/^\w{6,16}$/.test($scope.password) || /^\d+$/.test($scope.password) || /^([a-zA-Z]+)$/.test($scope.password)) {
            X.tip('登录密码为6-16位数字和字母组成');
            return false;
        }
        if ($scope.password != $scope.surepass) {
            X.tip('确认密码与密码不一致');
            return false;
        }

        X.loading.show();
        RegisterService.doRegister($scope.mobile, $scope.username, $scope.password).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('注册成功');
                $location.path('/myHome');
                //默认用户是在登录页面进入，如果是直接输入URL进入注册，此处将会有问题
                //history.go(-2);
                //埋点：注册-完成注册
                zhuge.track('注册-完成注册');
                AuthService.signIn(data['userId']);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    $scope.showPsw = function () {
        $scope.pswType == 'password' ? $scope.pswType = 'text' : $scope.pswType = 'password';
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            $scope.btnState = 'disable';
            if ($scope.checkCode != '' && $scope.password != '' && $scope.username != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();

    /* //获取验证吗
     $scope.registerCode = function () {
     //发送验证码请求
     RegisterService.getRegisterCode($scope.mobile).then(function (res) {
     var data = res.data;
     if (data.code == 100) {
     $scope.time = 60;
     timerFn();
     } else if (data.code == 101) {
     $scope.time = data.data.interval;
     timerFn();
     } else {
     X.tip(data['resultMsg']);
     }
     }).catch(function () {
     X.tip('服务器请求异常');
     });
     };*/

    //倒计时方法
    /*function timerFn() {
     timer = setInterval(function () {
     if ($scope.time > 0) {
     $scope.$apply(function () {
     $scope.time--;
     });
     } else {
     timer && clearTimeout(timer);
     }
     }, 1000);
     }*/

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && clearTimeout(timer);
    });
});
//忘记登陆密码 DONE
myControllers.controller('ForgetUserPassCtrl', function ($scope, $interval, $location, PasswordService) {
    var timer = null;//定时器
    /*$scope.backURL = $location.search()['backURL'] || '/login';*/
    $scope.time = 0;
    $scope.mobile = '';//手机号
    $scope.checkCode = '';//验证码
    $scope.newPass = '';//新登录密码
    $scope.confirmPass = '';//确认新的登录密码
    $scope.btnState = 'disable';

    //忘记密码
    $scope.forgetUserPass = function () {
        /*if ($scope.mobile == '') {
         X.tip('请输入手机号码');
         return false;
         }*/
        if ($scope.mobile == '' || $scope.newPass == '' || $scope.confirmPass == '' || $scope.confirmPass == '')return;

        if (!X.isMobile($scope.mobile)) {
            X.tip('手机号码错误');
            return false;
        }
        if ($scope.checkCode.length != 6) {
            X.tip('验证码输入错误');
            return false;
        }
        /*if ($scope.newPass == '') {
         X.tip('请输入新登录密码');
         return false;
         }*/
        if (!/^\w{6,16}$/.test($scope.newPass) || /^\d+$/.test($scope.newPass) || /^([a-zA-Z]+)$/.test($scope.newPass)) {
            X.tip('登录密码为6-16位数字和字母组成');
            return false;
        }
        /*if ($scope.confirmPass == '') {
         X.tip('请输入确认密码');
         return false;
         }*/
        if ($scope.confirmPass != $scope.newPass) {
            X.tip('两次密码输入不一致');
            return false;
        }

        X.loading.show();
        PasswordService.resetForgetPassword($scope.mobile, $scope.checkCode, $scope.newPass).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('密码重置成功，请重新登录');
                //如果注册成功默认登录，跳转到登录页面
                $location.path('/login');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //显示图片验证码
    $scope.getImgCode = function () {
        if ($scope.mobile == '') {
            X.tip('请输入手机号码');
            return false;
        }
        if (!X.isMobile($scope.mobile)) {
            X.tip('手机号码输入错误');
            return false;
        }
        $scope.refreshCode();
        $scope.showCodeDialog = true;
    };

    // 关闭弹出框
    $scope.closeDialog = function () {
        $scope.showCodeDialog = false;
        $scope.imgCode = '';
    };

    //刷新验证码
    $scope.refreshCode = function () {
        $scope.temptimes = Date.now();
    };

    //获取验证码
    $scope.sendCode = function () {
        if ($scope.mobile == '') {
            X.tip('请输入手机号码');
            return false;
        }
        if (!X.isMobile($scope.mobile)) {
            X.tip('手机号码输入错误');
            return false;
        }
        if ($scope.imgCode == '') {
            X.tip('请输入图片验证码');
            return false;
        }
        if (!/^\d{4}$/.test($scope.imgCode)) {
            X.tip('图片验证码输入错误');
            if($scope.imgCode == 4)$scope.refreshCode();
            return false;
        }
        //发送验证码请求
        X.loading.show();
        PasswordService.sendForgetCode($scope.mobile, $scope.imgCode).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.closeDialog();
                X.tip('验证码已发送至手机，请注意查收');
                $scope.time = 60;
                timerFn();
            } else if (data.code == 101) {
                $scope.closeDialog();
                X.tip('验证码已发送至手机，请注意查收');
                $scope.time = data.data.interval;
                timerFn();
            } else {
                X.tip(data['resultMsg']);
                $scope.refreshCode();
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            $scope.btnState = 'disable';
            if ($scope.mobile != '' && $scope.checkCode != '' && $scope.newPass != '' && $scope.confirmPass != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();

    //获取验证码
    $scope.getCheckCode = function () {
        if (!X.isMobile($scope.mobile)) {
            X.tip('请输入正确的手机号码');
            return false;
        }
        //发送验证码请求
        PasswordService.sendForgetCode($scope.mobile).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.time = 60;
                X.tip('验证码已发送至手机，请注意查收');
                timerFn();
            } else if (data.code == 101) {
                $scope.time = data.data.interval;
                timerFn();
            }
            else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //倒计时
    function timerFn() {
        timer = setInterval(function () {
            if ($scope.time > 0) {
                $scope.$apply(function () {
                    $scope.time--;
                });
            } else {
                timer && clearTimeout(timer);
            }
        }, 1000);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && clearTimeout(timer);
    });
});
//实名认证 DONE
myControllers.controller('IdentificationCtrl', function ($scope, $interval, $location, UserService) {
    $scope.goURL = $location.search()['goURL'] || '/myInfo';
    $scope.name = '';
    $scope.IDNum = '';
    $scope.btnState = 'disable';
    var timer = null;

    $scope.certification = function () {
        if ($scope.name == '' || $scope.IDNum == '')return;

        /*if ($scope.name == '') {
         X.tip('请输入您的姓名');
         return false;
         }
         */
        if (!X.isChinaName($scope.name)) {
            X.tip('请输入正确的姓名');
            return false;
        }

        /*if ($scope.IDNum == '') {
         X.tip('请输入身份证号码');
         return false;
         }*/

        if (!X.isIdentityNumber($scope.IDNum)) {
            X.tip('身份证号码错误');
            return false;
        }

        X.loading.show();
        UserService.realName($scope.name, $scope.IDNum).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('实名认证成功');
                $location.url($scope.goURL);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            if ($scope.name != '' && $scope.IDNum != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();
});
//修改登录密码 DONE
myControllers.controller('UserPassModifyCtrl', function ($scope, $interval, $location, PasswordService, AuthService) {
    $scope.oldPassword = '';
    $scope.newPassword = '';
    $scope.surePassword = '';
    $scope.btnState = 'disable';
    var timer = null;

    $scope.changePass = function () {
        if ($scope.oldPassword == '' || $scope.newPassword == '' || $scope.surePassword == '')return;

        /*if ($scope.oldPassword == '') {
         X.tip('请输入原登录密码');
         return false;
         }
         if ($scope.newPassword == '') {
         X.tip('请输入新密码');
         return false;
         }*/
        if (!/^\w{6,16}$/.test($scope.newPassword) || /^\d+$/.test($scope.newPassword) || /^([a-zA-Z]+)$/.test($scope.newPassword)) {
            X.tip('密码为6-16位数字和字母组成');
            return false;
        }
        /*if ($scope.surePassword == '') {
         X.tip('请输入确认密码');
         return false;
         }*/
        if ($scope.surePassword != $scope.newPassword) {
            X.tip('新密码与确认密码不一致');
            return false;
        }
        if ($scope.newPassword == $scope.oldPassword) {
            X.tip('新密码不能与原始密码相同');
            return false;
        }
        X.loading.show();
        PasswordService.loginPwdModify($scope.oldPassword, $scope.newPassword).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('密码修改成功，请重新登录');
                AuthService.signOut();
                $location.path('/login');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            if ($scope.oldPassword != '' && $scope.newPassword != '' && $scope.surePassword != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();
});
//设置提现密码 DONE
myControllers.controller('TradePassSetCtrl', function ($scope, $interval, $location, PasswordService) {
    $scope.goURL = $location.search()['goURL'] || '/myInfo';
    $scope.password = '';
    $scope.surePassword = '';
    $scope.btnState = 'disable';
    var timer = null;

    $scope.tradePassSet = function () {
        if ($scope.password == '' || $scope.surePassword == '')return;

        /*if ($scope.password == '') {
         X.tip('请输入提现密码');
         return false;
         }*/
        if (!/^\d{6}$/.test($scope.password)) {
            X.tip('提现密码为6位数字');
            return false;
        }
        /*if ($scope.surePassword == '') {
         X.tip('请输入确认密码');
         return false;
         }*/
        if ($scope.password != $scope.surePassword) {
            X.tip('两次密码不一致');
            return false;
        }
        X.loading.show();
        PasswordService.PwdSet($scope.password, $scope.surePassword).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('提现密码设置成功');
                $location.url($scope.goURL);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            if ($scope.password != '' && $scope.surePassword != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();

});
//修改提现密码 DONE
myControllers.controller('TradePassModifyCtrl', function ($scope, $interval, $location, PasswordService) {
    $scope.oldPwd = '';
    $scope.newPwd = '';
    $scope.surePwd = '';
    $scope.btnState = 'disable';
    var timer = null;

    $scope.tradePassModify = function () {
        if ($scope.oldPwd == '' || $scope.newPwd == '' || $scope.surePwd == '')return;
        /*if ($scope.oldPwd == '') {
         X.tip('请输入原始提现密码');
         return false;
         }*/
        if (!/^\d{6}$/.test($scope.oldPwd)) {
            X.tip('原始提现密码为6位数字');
            return false;
        }
        /*if ($scope.newPwd == '') {
         X.tip('请输入新提现密码');
         return false;
         }*/
        if (!/^\d{6}$/.test($scope.newPwd)) {
            X.tip('提现密码为6位数字');
            return false;
        }
        /*if ($scope.surePwd == '') {
         X.tip('请输入确认密码');
         return false;
         }*/
        if ($scope.surePwd != $scope.newPwd) {
            X.tip('新密码与确认密码不一致');
            return false;
        }
        if ($scope.newPwd == $scope.oldPwd) {
            X.tip('新密码不能与原始密码相同');
            return false;
        }
        X.loading.show();
        PasswordService.PwdModify($scope.newPwd, $scope.oldPwd).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('提现密码修改成功');
                $location.path('/myInfo');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            if ($scope.oldPwd != '' && $scope.newPwd != '' && $scope.surePwd != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();
});
//找回提现密码 DONE
myControllers.controller('ResetTradePassCtrl', function ($scope, $interval, $location, $q, PasswordService, UserService) {
    var timer = null;
    $scope.goURL = $location.search()['goURL'] || '/myInfo';
    $scope.mobile = '';
    $scope.hideMobile = '';
    $scope.checkCode = '';
    $scope.password = '';
    $scope.surePassword = '';
    $scope.time = 0;
    var time = null;
    $scope.btnState = 'disable';

    X.loading.show();
    $q.all({
        userInfo: UserService.getUserInfo()
    }).then(function (res) {
        var userInfoData = res.userInfo.data;
        if (userInfoData.code == 100) {
            $scope.mobile = userInfoData.data['loginMobileNoHidden'];
            $scope.hideMobile = userInfoData.data['loginMobile'];
        } else {
            X.tip(userInfoData['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    $scope.resetTradePassInfo = function () {
        if ($scope.checkCode == '' || $scope.password == '' || $scope.surePassword == '')return;

        /*if ($scope.checkCode == '') {
         X.tip('请输入验证码');
         return false;
         }*/
        if ($scope.checkCode.length < 6) {
            X.tip('验证码输入有误');
            return false;
        }
        /*if ($scope.password == '') {
         X.tip('请输入提现密码');
         return false;
         }*/
        if (!/^\d{6}$/.test($scope.password)) {
            X.tip('提现密码为6位数字');
            return false;
        }
        if ($scope.surePassword != $scope.password) {
            X.tip('提现密码与确认密码不符');
            return false;
        }
        //重置提现密码服务
        X.loading.show();
        PasswordService.resetWithdrawPwd($scope.password, $scope.checkCode).then(function (res) {
            var resetWithdrawPwdData = res.data;
            if (resetWithdrawPwdData.code == 100) {
                X.tip('提现密码修改成功');
                $location.url($scope.goURL);
            } else {
                X.tip(resetWithdrawPwdData['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    function timerFnc() {
        time = $interval(function () {
            if ($scope.checkCode != '' && $scope.password != '' && $scope.surePassword != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        time && $interval.cancel(time)
    });

    timerFnc();

    //获取验证码
    $scope.getPasswordCode = function () {
        //发送验证码请求
        PasswordService.sendPasswordCode($scope.mobile).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.time = 60;
                X.tip('验证码已发送至手机，请注意查收');
                timerFn();
            } else if (data.code == 101) {
                $scope.time = data.data.interval;
                timerFn();
            }
            else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //倒计时
    function timerFn() {
        timer = setInterval(function () {
            if ($scope.time > 0) {
                $scope.$apply(function () {
                    $scope.time--;
                });
            } else {
                timer && clearTimeout(timer);
            }
        }, 1000);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && clearTimeout(timer);
    });
});
//个人中心 DONE
myControllers.controller('MyHomeCtrl', function ($scope, $q, $location, UserService, TradeService, SystemService) {
    $scope.user = {};
    $scope.bankCards = [];
    var DYTip = false, inDYTipTime;

    X.loading.show();
    $q.all({
        userInfo: UserService.getUserInfo(),//获取用户基本信息
        balance: UserService.getBalance(),//获取用户账余额
        bankCards: UserService.getBankCards(),//获取银行卡
        DY: TradeService.getWaitPayDeferForRemind()
    }).then(function (res) {
        var userInfoData = res.userInfo.data;
        var balanceData = res.balance.data;
        var bankCardsData = res.bankCards.data, DYData = res.DY.data;

        if (userInfoData.code == 100 && balanceData.code == 100 && bankCardsData.code == 100 && DYData.code == 100) {
            $scope.user = userInfoData.data;
            $scope.user.balance = balanceData.data.balance;
            $scope.balance = parseInt(Math.round($scope.user.balance * 10000) / 100) / 100;
            $scope.balance = X.money($scope.balance);
            $scope.bankCards = bankCardsData.data;
            if (DYData.data != 0)DYTip = true;
        } else {
            if (userInfoData.code != 100) {
                X.tip(userInfoData['resultMsg']);
            } else if (balanceData.code != 100) {
                X.tip(balanceData['resultMsg']);
            } else if (bankCardsData.code != 100) {
                X.tip(bankCardsData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //去提现
    $scope.doWithdraw = function () {
        if (!$scope.user.named) {
            X.dialog.confirm('您还未实名认证，请先实名认证', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootURL('/identification?goURL=/myHome');
                    }
                }
            });
            return;
        }
        if ($scope.user.balance == 0) {
            X.tip('您的账户没有可提金额');
            return;
        }
        //没有银行卡提示添加银行卡
        if (!$scope.bankCards.length) {
            X.dialog.confirm('提款前请先添加提款银行卡', {
                sureBtn: '添加银行卡', notify: function (nt) {
                    if (nt == 1) {
                        //跳转到添加银行卡页面
                        bootURL('/addBankCard?goURL=/myHome');
                    }
                }
            });
            return;
        }
        //没有设置提现密码的提示去设置提现密码
        if (!$scope.user.withdrawPw) {
            X.dialog.confirm('您还未设置提现密码', {
                sureBtn: '马上设置', notify: function (nt) {
                    if (nt == 1) {
                        bootURL('/tradePassSet?goURL=/withdraw');
                    }
                }
            });
            return;
        }
        //银行卡列表可能有多张银行卡，没法校验用户到底选择哪一张卡，该判断放到用户发起提现时候后端校验
        // if ($scope.cardInfo.province == null || $scope.cardInfo.city == null || $scope.cardInfo['subbranch'] == null) {
        //     X.dialog.confirm('您的银行卡信息不全<br>请先完善银行卡信息', {
        //         sureBtn: '去完善', notify: function (nt) {
        //             if (nt == 1) {
        //                 bootURL('/bankInfo');
        //             }
        //         }
        //     });
        //     return;
        // }
        inDYTipTime = SystemService.isInDYTipPeriod();
        if (DYTip) {
            X.dialog.confirm('温馨提示：请您确认是否已经将今日递延<br/>费留在余额中等待扣款，如果继续操作可<br/>能会造成操盘中策略因递延费不足被平仓', {
                sureBtn: '确定', notify: function (nt) {
                    if (nt == 1) {
                        //跳转到添加银行卡页面
                        bootURL('/withdraw');
                    }
                }
            });
            return;
        }

        $location.path('/withdraw');
    };

    //引导跳转
    function bootURL(url) {
        $scope.$apply(function () {
            $location.url(url);
        });
    }
});
//我的详情 DONE
myControllers.controller('MyInfoCtrl', function ($scope, $rootScope, $q, $location, LoginService, UserService, AuthService, SystemService) {
    $scope.user = {};
    $scope.bankCards = [];

    X.loading.show();
    $q.all({userInfo: UserService.getUserInfo(), bankCards: UserService.getBankCards()}).then(function (res) {
        var userInfoData = res.userInfo.data;
        var bankCardsData = res.bankCards.data;
        if (userInfoData.code == 100 && bankCardsData.code == 100) {
            $scope.user = userInfoData.data;
            $scope.bankCards = bankCardsData.data;
            $scope.cellPhone = SystemService.cellPhoneNumber();
        } else {
            if (userInfoData.code != 100) {
                X.tip(userInfoData['resultMsg']);
            } else if (bankCardsData.code != 100) {
                X.tip(bankCardsData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //退出登陆
    $scope.logout = function () {
        X.dialog.confirm('确定要退出当前账号吗？', {
            notify: function (nt) {
                if (nt == 1) {
                    signOut();
                }
            }
        });
    };

    $scope.goCheckAli = function () {
        // X.dialog.alert('使用支付宝进行首次入金操作后，即可自动 <br>绑定支付宝账号。<a class="txt-red" href="">' + '去充值' + '</a>')
        X.dialog.confirm('使用支付宝进行首次入金操作后，即可自动<br>绑定支付宝账号。', {
            sureBtn: '去充值', notify: function (nt) {
                if (nt == 1) {
                    $scope.$apply(function () {
                        $location.url('/alipay?backURL=/myInfo');
                    })
                }
            }
        });
    };

    //拨打电话或者跳转支付宝认证
    $scope.telTip = function () {
        X.dialog.alert('如需要更换或解绑支付宝账号，请 <br>联系客服电话 <a class="txt-blue" href=' + $scope.cellPhone.cellPhoneATag + '>' + $scope.cellPhone.cellPhone + '</a>');
    }

    //退出登录
    function signOut() {
        X.loading.show();
        LoginService.logout().then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                AuthService.signOut();
                $location.url('/index');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }
});
//公告列表
myControllers.controller('NoticeCtrl', function ($scope, $q, $location, NoticeService) {
    $scope.items = [];
    $scope.pageIndex = 1;
    $scope.totalPage = 1;
    //获取公告列表
    $scope.getNoticeList = function (page) {
        var pageSize = 10;
        X.loading.show();
        NoticeService.getNoticeList(page, pageSize).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                var noticeData = data.data;
                $scope.pageIndex = noticeData['pageIndex'];
                $scope.totalPage = noticeData['totalPage'];
                if (page == 1) {
                    $scope.items = noticeData.items;
                } else {
                    $scope.items = $scope.items.concat(noticeData.items);
                }
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    $scope.getNoticeList($scope.pageIndex);
});
//公告详情 DONE
myControllers.controller('NoticeDetailCtrl', function ($scope, $q, $location, $sce, $routeParams, NoticeService) {
    var noticeId = $routeParams.noticeId;
    if (!noticeId) {
        X.tip('公告ID不能为空');
        $location.path('/notice');
        return;
    }

    $scope.notice = {};

    X.loading.show();
    $q.all({
        noticeDetail: NoticeService.getNoticeById(noticeId)
    }).then(function (res) {
        var noticeDetail = res.noticeDetail.data;
        if (noticeDetail.code == 100) {
            $scope.notice = noticeDetail.data;
            $scope.notice.noticeContent = $sce.trustAsHtml(noticeDetail.data['noticeContent']);
        } else {
            X.tip(noticeDetail['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });
});
//客服 DONE
myControllers.controller('HelpCtrl', function ($scope, $location, $sce) {
    /*$scope.backURL = $location.search()['backURL'] || '/index';*/
    $scope.showHeader = true;
    $scope.status = '&#xe608;';
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }

    $scope.toHelpCenter = function () {
        if ($scope.showHeader) {
            $location.path('/helpCenter');
        } else {
            window.location = 'jumpCenter::suggestion';
        }
    };

    $scope.helpObjs = {
        'QA0001': {
            status: false,
            content: $sce.trustAsHtml('<p>1、点买人发起点买后，若60秒内匹配投资人失败，则点买失败，相关资金退还到点买人账户中。</p><p>2、盘中涨幅≥8%或跌幅 ≤-8%时，投资人有权不执行点买人的点买指令，直至股票涨跌幅回落到（-8%,+8%）区间，投资人方接受并执行点买人的点买指令。</p><p>3、当股票进入《点买风险股名单》时，投资人也有权不执行点买人的点买指令。</p><p>4、当日点买人选择的股票触及过跌停，投资人也有权不接受点买指令。</p><p>5、单股最大持仓点买金额为30万，超出就无法再点买该股。</p><p>6、超过当天可点买次数，无法购买。</p>')
        },
        'QA0002': {
            status: false,
            content: $sce.trustAsHtml('<p>由于行情波动过大，点卖时会造成部分成交，只有全部成交后，才会结算该策略。</p>')
        },
        'QB0001': {
            status: false,
            content: $sce.trustAsHtml('<p>一般清算完后马上会到账户余额里，但是难免出现异常数据时，为了保证成交数据的正确性，我们会人工核实一遍数据，会造成清算时间一定的延迟。</p>')
        },
        'QB0002': {
            status: false,
            content: $sce.trustAsHtml('<p>若由于系统、接口等问题造成清算出错，我们会在核实数据后对用户该笔交易做资金修正。</p>')
        },
        'QC0001': {
            status: false,
            content: $sce.trustAsHtml('<p>目前WAP页面仅支持快捷支付充值方式</p>')
        },
        'QC0002': {
            status: false,
            content: $sce.trustAsHtml('<p>快捷充值，立马到账。</p>')
        },
        'QC0003': {
            status: false,
            content: $sce.trustAsHtml('<p>目前提款数量多，一般处理时间需要1-2个工作日左右，节假日可能会出现延迟。</p>')
        }
    };

    $scope.showDetail = function (id, item) {

    }
});
//客服中心静态详情 DONE
myControllers.controller('HelpDetailCtrl', function ($scope, $location, $sce, $routeParams) {
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
    var detailId = $routeParams['helpDetailId'];
    var helpObjs = {
        'QA0001': {
            title: '为什么我点买失败？',
            content: $sce.trustAsHtml('<p>1、点买人发起点买后，若60秒内匹配投资人失败，则点买失败，相关资金退还到点买人账户中。</p><p>2、盘中涨幅≥8%或跌幅 ≤-8%时，投资人有权不执行点买人的点买指令，直至股票涨跌幅回落到（-8%,+8%）区间，投资人方接受并执行点买人的点买指令。</p><p>3、当股票进入《点买风险股名单》时，投资人也有权不执行点买人的点买指令。</p><p>4、当日点买人选择的股票触及过跌停，投资人也有权不接受点买指令。</p><p>5、单股最大持仓点买金额为30万，超出就无法再点买该股。</p><p>6、超过当天可点买次数，无法购买。</p>')
        },
        'QA0002': {
            title: '为什么点卖时会部分成交，怎么结算？',
            content: $sce.trustAsHtml('<p>由于行情波动过大，点卖时会造成部分成交，只有全部成交后，才会结算该策略。</p>')
        },
        'QB0001': {
            title: '点卖清算后资金何时返还账户余额？',
            content: $sce.trustAsHtml('<p>一般清算完后马上会到账户余额里，但是难免出现异常数据时，为了保证成交数据的正确性，我们会人工核实一遍数据，会造成清算时间一定的延迟。</p>')
        },
        'QB0002': {
            title: '若清算时出现明显差错怎么办？',
            content: $sce.trustAsHtml('<p>若由于系统、接口等问题造成清算出错，我们会在核实数据后对用户该笔交易做资金修正。</p>')
        },
        'QC0001': {
            title: '怎么充值？',
            content: $sce.trustAsHtml('<p>目前WAP页面仅支持快捷支付充值方式</p>')
        },
        'QC0002': {
            title: '充值到账速度快吗？',
            content: $sce.trustAsHtml('<p>快捷充值，立马到账。</p>')
        },
        'QC0003': {
            title: '提款到账速度快吗？',
            content: $sce.trustAsHtml('<p>目前提款数量多，一般处理时间需要1-2个工作日左右，节假日可能会出现延迟。</p>')
        }
    };

    $scope.helpObj = helpObjs[detailId];
});
//客服中心 DONE
myControllers.controller('HelpCenterCtrl', function ($scope, UserService) {
    var pageSize = 6;
    $scope.helpList = [];
    $scope.currPage = 1;
    $scope.totalPage = 1;
    //
    $scope.getHelpList = function (page) {
        X.loading.show();
        UserService.getMsgPage(page, pageSize).then(function (res) {
            var msgListData = res.data;
            if (msgListData.code == 100) {
                var data = msgListData.data;
                $scope.helpList = $scope.helpList.concat(data['items']);
                $scope.currPage = data['pageIndex'];
                $scope.totalPage = data['totalPage'];
            } else {
                X.tip(msgListData['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    $scope.getHelpList(1);
});
//客服中心提问 DONE
myControllers.controller('HelpAskCtrl', function ($scope, $location, UserService) {
    //留言类别
    $scope.types = [
        '请选择留言类型',
        '账户充值及提款问题',
        '点买点卖问题',
        '结算问题',
        '我要投诉',
        '意见反馈',
        '其他问题'
    ];
    $scope.type = '请选择留言类型';
    $scope.content = '';

    //用户发起留言
    $scope.postMsg = function () {
        if ($scope.type == '请选择留言类型') {
            X.tip('请选择留言类型');
            return;
        }

        if (X.strLen($scope.content) < 1 || X.strLen($scope.content) > 300) {
            X.tip('留言内容不符合规范');
            return;
        }
        X.loading.show();
        UserService.postMsg($scope.type, '', $scope.content).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('留言成功');
                $location.path('/helpCenter');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };
});
//点买股票行情 DONE
myControllers.controller('TradeCtrl', function ($scope, $q, $sce, $location, $routeParams, $interval, initData, StockService, TradeService, SystemService) {
    if (initData == null) {
        X.tip('初始化信息加载错误，请重试');
        return;
    }
    var strRisk = JSON.parse(initData['strRisk']);
    var defaultStock = strRisk['defaultStock'].value;
    var priceRisk = strRisk['priceRisk'].value.split(',');

    var holiday = SystemService.parseHoliday(initData['holidays']);
    var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
    // //配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
    var isTrade = strRisk['bussmannSwitch'].value != '1';
    SystemService.setCurrentTime(initData['nowTime']);
    SystemService.setCurrentCurrencyType('CNY');
    SystemService.setHoliday(holiday);
    SystemService.setTradePeriod(tradeTime);

    var storage = window.localStorage, STOCKCODE = 'STOCKCODE', MINELIST = 'MINELIST';
    var stockCodeFromIndex = $location.search()['stock'];
    var stockCode = stockCodeFromIndex || storage.getItem(STOCKCODE) || defaultStock || 'SH600570';
    var mineListStr = storage.getItem(MINELIST) || '';
    var isInTradeTime = false, newPrice = 0, dataIsLoad = true;
    var riskStocks = [];//限制股票
    var slineChart = null, klineChart = null, QUOTE_DATA, CACHE_KLINE, CACHE_WEEKKLINE, CACHE_MONTHKLINE;//分时K线图
    var DYTip = false, DYData, inDYTipTime = false;
    /*var goURL = $location.search()['goURL'] || '/index';*/

    $scope.stockType = 'T+1';
    $scope.stockTypes = {
        trade: 'T+1',
        TDTrade: 'T+D'
    };
    $scope.uuid = SystemService.uuid();
    $scope.isRiskStock = false;
    $scope.showMenu = false;
    $scope.mineType = 'add';
    $scope.actType = 'sline';
    $scope.stopTimer = false;
    $scope.stock = {};
    $scope.btn = {
        className: 'disabled',
        btnText: '数据加载中',
        disabled: true
    };
    X.loading.show();
    $q.all({
        trade: TradeService.getRiskStock(),
        info: StockService.getStockInfo(stockCode),
        DY: TradeService.getWaitPayDeferForRemind()
    }).then(function (res) {
        var infoData = res.info.data, tradeData = res.trade.data, DYData = res.DY.data;
        if (tradeData.code == 100 && infoData.code == 100 && DYData.code == 100) {
            riskStocks = tradeData.data;
            confirmMineType();
            checkRiskStock();
            processStockInfoData(infoData.data[stockCode]);
            init();
            $scope.changeTab('sline');
            if (DYData.data != 0)DYTip = true;
        } else {
            if (tradeData.code != 100) {
                X.tip(tradeData['resultMsg']);
            } else if (infoData.code != 100) {
                X.tip(infoData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    $scope.changeTab = function (current) {
        $scope.actType = current;
        if (current == 'sline' && !slineChart) {
            getStockSline();
        } else if (current == 'kline' && !CACHE_KLINE) {
            getStockKline(current);
            // $scope.status = 0;
        } else if (current == 'weekKline' && !CACHE_WEEKKLINE) {
            getStockKline(current);
            // $scope.status = 1;
        } else if (current == 'monthKline' && !CACHE_MONTHKLINE) {
            getStockKline(current);
            // $scope.status = 2;
        }

        if (current == 'kline' && CACHE_KLINE) {
            drawKLine(CACHE_KLINE, current);
            // $scope.status = 0;
        } else if (current == 'weekKline' && CACHE_WEEKKLINE) {
            drawKLine(CACHE_WEEKKLINE, current);
            // $scope.status = 1;
        } else if (current == 'monthKline' && CACHE_MONTHKLINE) {
            drawKLine(CACHE_MONTHKLINE, current);
            // $scope.status = 2;
        }
    };

    //发起点买
    $scope.toTrade = function () {
        inDYTipTime = SystemService.isInDYTipPeriod();
        if (!QUOTE_DATA) {
            return false;
        }
        //停牌股票
        if (QUOTE_DATA['newPrice'] == 0) {
            X.dialog.alert('停牌股暂时无法进行买卖');
            return false;
        }
        //限制股票
        if ($scope.isRiskStock) {
            X.dialog.alert('该股今日为禁买股，请选择其他股票交易');
            return false;
        }
        var currPrice = QUOTE_DATA['newPrice'], closePrice = QUOTE_DATA['yesterdayPrice'];
        var diff = currPrice - closePrice, rote = (diff / closePrice * 100).toFixed(2);
        //风险股票
        if (rote > X.toFloat(priceRisk[1]) || rote < X.toFloat(priceRisk[0])) {
            X.dialog.alert('该股今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }

        if (DYTip) {
            X.dialog.confirm('温馨提示：请您确认是否已经将今日递延<br/>费留在余额中等待扣款，如果继续操作可<br/>能会造成操盘中策略因递延费不足被平仓', {
                sureBtn: '确定', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $location.path('/tradeBuy/' + stockCode);
                        })
                    }
                }
            });
            return;
        }
        $location.path('/tradeBuy/' + stockCode);
    };

    //添加或者删除自选
    $scope.addOrDelMine = function (stockCode, stockName) {
        if (!stockCode || !stockName) {
            return false;
        }
        var maxLen = 20;
        var mineListStr = storage.getItem(MINELIST) || '', mineArr = [];
        if (mineListStr == '' || mineListStr.indexOf(stockCode) == -1) {
            if (mineListStr != '') {
                mineArr = mineListStr.split(';');
            }
            if (mineArr.length >= maxLen) {
                X.dialog.alert('自选最多添加' + maxLen + '条记录');
                return;
            }
            mineArr.push(stockCode + ',' + stockName);
            storage.setItem(MINELIST, mineArr.join(';'));
            $scope.mineType = 'delete';
        } else {
            mineArr = mineListStr.split(';');
            for (var i = 0; i < mineArr.length; i++) {
                if (mineArr[i].indexOf(stockCode) != -1) {
                    mineArr.splice(i, 1);
                }
            }
            storage.setItem(MINELIST, mineArr.join(';'));
            $scope.mineType = 'add';
        }
    };

    /*//返回
     $scope.back = function () {
     $location.url(goURL);
     };*/

    function init() {
        getStockInfo(true);
        X.engine.addTask(getStockInfo, 1000);
        X.engine.start();
    }

    //判断是否是限制股
    function checkRiskStock() {
        for (var i = 0; i < riskStocks.length; i++) {
            var item = riskStocks[i];
            if (stockCode == item.stockCode) {
                $scope.isRiskStock = true;
                break;
            }
        }
    }

    //确认所选股票是否已经添加到自选，控制显示添加和删除
    function confirmMineType() {
        if (mineListStr == '') {
            $scope.mineType = 'add';
        } else {
            $scope.mineType = mineListStr.indexOf(stockCode) == -1 ? 'add' : 'delete';
        }
    }

    //绘制分时图
    function drawSLine(slineData) {
        if (!QUOTE_DATA)return;
        slineData = slineData || [];
        var data = {}, lastTime;
        slineData.forEach(function (obj, i) {
            lastTime = X.formatDate(obj.time, 'hm') - 0;
            data[lastTime] = {
                current: X.toFloat(obj['price']),
                volume: X.toFloat(obj['volume']),
                time: lastTime
            };
        });

        slineChart = new X.Sline({wrap: 'sline-wrap-' + $scope.uuid});
        slineChart.draw({
            data: data,
            quoteTime: lastTime,
            close: QUOTE_DATA['yesterdayPrice'],
            high: QUOTE_DATA['highPrice'],
            low: QUOTE_DATA['lowPrice'],
            limitUp: QUOTE_DATA['limitUpPrice'],
            limitDown: QUOTE_DATA['limitDownPrice'],
            period: SystemService.getRealPeriod('STOCK', lastTime),
            isStock: true,
            isIntl: false,
            code: stockCode
        });
    }

    //绘制K线图
    function drawKLine(klineData, type) {
        // X.log('正在执行 drawKline 方法');
        klineData = klineData || [];
        var data = [];
        klineData.forEach(function (o, i) {
            data[i] = {
                time: o['time'].length == 8 ? o['time'] : X.formatDate(o['time'], 'YMD'),
                open: o['open'],
                close: o['last'],
                high: o['high'],
                low: o['low'],
                price: o['price']
            }
        });

        if (!klineChart) {
            klineChart = new X.Kline({wrap: 'kline-wrap-' + $scope.uuid})
        }

        klineChart.draw(data);
        if (type == 'kline') {
            CACHE_KLINE = data;
        } else if (type == 'weekKline') {
            CACHE_WEEKKLINE = data;
        } else {
            CACHE_MONTHKLINE = data;
        }

    }

    //更新最新分时信息
    function newSlineQuoteData(quote) {
        var price = quote['newPrice'] == 0 ? quote['yesterdayPrice'] : quote['newPrice'];
        var o = {
            current: price,
            volume: 0,
            time: X.formatDate(quote.time, 'hm') - 0
        };

        slineChart && slineChart.perDraw(o, {
            quoteTime: o.time,
            close: quote['yesterdayPrice'],
            high: quote['highPrice'],
            low: quote['lowPrice'],
            limitUp: quote['limitUpPrice'],
            limitDown: quote['limitDownPrice'],
            period: SystemService.getRealPeriod('STOCK', o.time),
            isStock: true,
            code: stockCode
        });
    }

    //更新最新K线信息
    function newKlineQuoteData(quote) {
        // 累加和更新数据//如果股票停牌则不放到K线数据中PS：其实是可以看，接口数据错误所以先不加
        if (quote['newPrice'] == 0 || !CACHE_KLINE || !CACHE_KLINE.length) {
            return;
        }
        var o = {
            time: X.formatDate(quote.time, 'YMD'),
            open: quote['openPrice'],
            close: quote['yesterdayPrice'],
            high: quote['highPrice'],
            low: quote['lowPrice'],
            price: quote['newPrice']// 即时数据，使用当前价格
        };
        if ($scope.actType == 'kline') {
            var last = CACHE_KLINE[CACHE_KLINE.length - 1];

            if (last.time === o.time) {
                CACHE_KLINE[CACHE_KLINE.length - 1] = o;
            } else {
                CACHE_KLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_KLINE);
        } else if ($scope.actType == 'weekKline') {
            var last = CACHE_WEEKKLINE[CACHE_WEEKKLINE.length - 1];

            if (last.time === o.time) {
                CACHE_WEEKKLINE[CACHE_WEEKKLINE.length - 1] = o;
            } else {
                CACHE_WEEKKLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_WEEKKLINE);
        } else if ($scope.actType == 'monthKline') {
            var last = CACHE_MONTHKLINE[CACHE_MONTHKLINE.length - 1];

            if (last.time === o.time) {
                CACHE_MONTHKLINE[CACHE_MONTHKLINE.length - 1] = o;
            } else {
                CACHE_MONTHKLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_MONTHKLINE);
        }
    }

    function getStockSline() {
        StockService.getSLine(stockCode).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                drawSLine(data.data);
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    function getStockKline(current) {
        /*StockService.getKLine(stockCode,current).then(function (res) {
         var data = res.data;
         if (data.code == 100) {
         drawKLine(data.data, type);
         } else {
         X.tip(data['resultMsg']);
         }
         }).catch(function () {
         X.tip('服务器请求异常');
         });*/

        var http;

        if (current == 'kline') {
            http = StockService.getKLine(stockCode);
        } else if (current == 'weekKline') {
            http = StockService.getWMKline(stockCode, current);
        } else if (current == 'monthKline') {
            http = StockService.getWMKline(stockCode, current);
        }

        http.then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                drawKLine(data.data, current);
            } else {
                X.tip(data['resultMsg'])
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        })
    }

    //获取股票信息
    function getStockInfo(flag) {
        X.log('行情定时器运行中。。。');
        //判断是否是在交易时间段内
        if (isTrade) {
            isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            if (isInTradeTime) {
                if ($scope.isRiskStock) {
                    $scope.btn = {
                        className: 'disabled',
                        btnText: '立即点买',
                        disabled: true
                    };
                } else if (QUOTE_DATA && QUOTE_DATA['newPrice'] == 0) {
                    $scope.btn = {
                        className: 'disabled',
                        btnText: '立即点买',
                        disabled: true
                    };
                } else {
                    $scope.btn = {
                        className: 'orange',
                        btnText: '立即点买',
                        disabled: false
                    };
                }
            } else {
                $scope.btn = {
                    className: 'disabled',
                    btnText: '非点买时段',
                    disabled: true
                };
            }
        } else {
            isInTradeTime = false;
            $scope.btn = {
                className: 'disabled',
                btnText: '暂停交易',
                disabled: true
            };
        }

        var isInQuoteTime = SystemService.isInPeriod('STOCK', 'quote');

        if (!flag && !isInQuoteTime) {
            $scope.$apply();
        }

        //判断是否是在行情时间段内
        if (dataIsLoad && isInQuoteTime) {
            dataIsLoad = false;
            StockService.getStockInfo(stockCode).then(function (res) {
                dataIsLoad = true;
                var data = res.data;
                if (data.code == 100) {
                    processStockInfoData(data.data[stockCode]);
                } else {
                    X.tip(data['resultMsg']);
                }
            }).catch(function () {
                X.tip('服务器请求异常');
            });
        }
    }

    //将数据绑定到页面scope,加载股票信息
    function processStockInfoData(data) {
        var newPrice = data.newPrice;
        var lastClosePrice = data.lastClosePrice;
        var isStop = newPrice == 0;
        var style = '', dealNum = '', dealPrice = '';
        var diff = 0.00, rate = 0.00;
        if (!isStop) {
            diff = newPrice - lastClosePrice;
            rate = diff / lastClosePrice * 100;
            diff = diff.toFixed(2);
            rate = rate.toFixed(2);
            style = newPrice > lastClosePrice ? 'txt-red' : newPrice < lastClosePrice ? 'txt-green' : 'txt-white';
            dealNum = processNum(data, 'todayDealNum');
            dealPrice = processNum(data, 'todayDealPrice');
        }
        $scope.stock = {
            "stockLabel": data.stockLabel, //代码
            "stockName": data.stockName,//名称
            "price": newPrice,//当前价
            "lastClosePrice": lastClosePrice,//昨收
            isStop: isStop,
            diff: diff,//涨跌值
            rate: rate,//涨跌幅
            style: style,
            dealNum: dealNum,
            dealPrice: dealPrice,
            "openPrice": data.openPrice,//今开
            "highPrice": data.highPrice,//最高
            "lowPrice": data.lowPrice,//最低
            "limitDownPrice": parseFloat(data.limitDownPrice),//跌停
            "limitUpPrice": parseFloat(data.limitUpPrice),//涨停
            "amplitude": data.amplitude,//振幅
            "todayDealNum": data.todayDealNum,//成交量
            "todayDealPrice": data.todayDealPrice,//成交金额
            "buyPrice": isStop ? [0, 0, 0, 0, 0] : data.buyPrice,//买12345
            "buyNum": isStop ? [0, 0, 0, 0, 0] : data.buyNum,
            "sellPrice": isStop ? [0, 0, 0, 0, 0] : data.sellPrice,//卖12345
            "sellNum": isStop ? [0, 0, 0, 0, 0] : data.sellNum
        };

        QUOTE_DATA = {
            commodityTitle: 'STOCK',
            contractNo: data.stockLabel,
            time: data['time'],
            openPrice: data['openPrice'],
            yesterdayPrice: data['lastClosePrice'],
            highPrice: data['highPrice'],
            lowPrice: data['lowPrice'],
            newPrice: data['newPrice'],
            limitDownPrice: X.toFloat(data['limitDownPrice']),
            limitUpPrice: X.toFloat(data['limitUpPrice'])
        };

        newSlineQuoteData(QUOTE_DATA);
        newKlineQuoteData(QUOTE_DATA);
    }

    //转换html
    function htm(text) {
        //noinspection JSUnresolvedFunction
        return $sce.trustAsHtml(text);
    }

    //解析数字格式
    function processNum(data, type) {
        var num = data[type], unit = type == 'todayDealNum' ? '手' : '元';
        if (num > 100000000) {
            return (num / 100000000).toFixed(2) + '亿' + unit;
        }
        if (num > 10000) {
            return (num / 10000).toFixed(2) + '万' + unit;
        }
        return num + unit;
    }

    //controller卸载的时候清除定时器任务
    $scope.$on('$destroy', function () {
        X.engine.destroy();
    });
});
//点买 DONE
myControllers.controller('TradeBuyCtrl', function ($scope, $q, $routeParams, $location, TradeService, StockService, UserService, PacketService, SystemService) {
    var stockCode = $routeParams.stockCode;
    var stockCodeReg = /^(SZ|SH)\d{6,}$/;
    if (!stockCode || !stockCodeReg.test(stockCode)) {
        $location.path('/trade');
        return;
    }


    //可选点买金额，止盈比率，止损比率，单位服务费，单位递延费，单股最大购买数量，限制股,交易时间段，当前加载时间戳;
    var token = '', tradeMoneyList = [], highRateList = [], lowRateList = [], serviceCharge = 0, deferCharge = 0, stockBuyMoney, priceRisk = [-8, 8],
        maxMoneyOneStock = 100000, maxStockCount = 10000, tradingCountRatio = 1, riskStocks = [], tradingTimeLimit, initTime = Date.now(), isSignAgreement = false,
        littleServiceCharge = 0, littleDeferCharge = 0, litServiceCharge = 0, litDeferCharge;
    var isHoliday = true, isTrade;
    $scope.stock = {};
    $scope.trade = {};
    $scope.risk = {};
    $scope.currentIndex = 0;//点买金额索引
    $scope.highIndex = 0;//止盈索引
    $scope.lowIndex = 0;//止损索引
    $scope.money = 0;//所选点买金额
    $scope.highMoney = 0;//所选止盈金额
    $scope.lowMoney = 0;//所选止损金额
    $scope.tradeMoneyList = [];
    $scope.highMoneyList = [];
    $scope.lowMoneyList = [];
    $scope.principal = 0;//保证金
    $scope.serviceCharge = 0;//服务费
    $scope.stockCount = 0;//可购买股数
    $scope.canBuyCount = 0;//可点买次数
    $scope.isHoliday = true;
    $scope.user = {};
    $scope.btn = {
        className: 'disabled',
        btnText: '数据加载中',
        disabled: true
    };
    $scope.tipBalance = 0; //红包余额
    $scope.usTipBalance = 0; //使用红包金额
    $scope.useTip = true; //是否使用红包

    X.loading.show();
    $q.all({
        userInfo: UserService.getUserInfo(),
        stock: StockService.getStockInfo(stockCode),
        trade: TradeService.getInitTrade(),
        stockStatisticsInfo: TradeService.getStockStatisticsInfo(stockCode),
        tradeRisk: TradeService.getRiskStock(),
        packet: PacketService.getPacketFundInfoData()
    }).then(function (res) {
        var userInfoData = res.userInfo.data, stockData = res.stock.data, stockStatisticsInfoData = res.stockStatisticsInfo.data, tradeData = res.trade.data, tradeRiskData = res.tradeRisk.data, packetData = res.packet.data;
        if (userInfoData.code == 100 && stockData.code == 100 && tradeData.code == 100 && stockStatisticsInfoData.code == 100 && tradeRiskData.code == 100/*&&packetData.code == 100*/) {
            $scope.user = userInfoData.data;
            $scope.tipBalance = packetData.data.tipBalance;
            if ($scope.tipBalance == 0) {
                $scope.useTip = false;
            }
            riskStocks = tradeRiskData.data;
            stockBuyMoney = stockStatisticsInfoData.data.money || 0;
            initStockData(stockData.data[stockCode]);
            initTradeData(tradeData.data);
            //页面初始化完成以后，默认选择第一个点买金额
            $scope.chooseMoney($scope.currentIndex, $scope.tradeMoneyList[$scope.currentIndex].value);

            initValidate();
        } else {
            if (userInfoData.code != 100) {
                X.tip(userInfoData['resultMsg']);
            } else if (stockData.code != 100) {
                X.tip(stockData['resultMsg']);
            } else if (tradeData.code != 100) {
                X.tip(tradeData['resultMsg']);
            } else if (tradeRiskData.code != 100) {
                X.tip(tradeRiskData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //发起交易
    $scope.toTrade = function () {
        if (!isTrade) {
            X.dialog.alert('暂停交易');
            return false;
        }
        if (!SystemService.isInPeriod('STOCK', 'trade')) {
            X.dialog.alert('当前为非点买时段，无法发起策略');
            return false;
        }
        if ($scope.stock.stockPrice == 0) {
            X.dialog.alert('停牌股无法进行交易<br>请更换其他能够正常交易的股票');
            return false;
        }
        if (checkRiskStock()) {
            X.dialog.alert('【' + $scope.stock.stockName + '】今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }
        var currPrice = $scope.stock['stockPrice'], closePrice = $scope.stock['stockClose'];
        var diff = currPrice - closePrice, rote = (diff / closePrice * 100).toFixed(2);
        //风险股票
        if (rote > X.toFloat(priceRisk[1]) || rote < X.toFloat(priceRisk[0])) {
            X.dialog.alert('该股今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }
        var canBuyMoney = maxMoneyOneStock - stockBuyMoney;
        if (canBuyMoney < 0) {
            canBuyMoney = 0;
        }
        if ($scope.money > canBuyMoney) {
            X.dialog.alert('个股持仓累计金额最多' + maxMoneyOneStock + '元，当前还可点买' + canBuyMoney + '元');
            return false;
        }
        var now = Date.now(), min = 1;
        if (now - initTime > (min * 60 * 1000)) {
            X.dialog.alert('由于股票价格实时变化，您未在' + (min * 60) + '秒内发起策略，这将导致数据波动较大，请重新获取数据，尽快提交', {
                title: '系统提示', notify: function () {
                    window.location.reload();
                }
            });
            return false;
        }
        if ($scope.stockCount > maxStockCount) {
            X.dialog.alert('单股最高可购买数量为' + maxStockCount + '股');
            return false;
        }
        var needMoney = $scope.principal + $scope.serviceCharge + $scope.unHanldDeferCharge;
        //如果使用红包抵扣，从所需余额中减去红包部分
        if ($scope.useTip) {
            // needMoney -= $scope.usTipBalance;
            needMoney = parseInt(Math.round((needMoney - $scope.usTipBalance) * 10000)) / 10000;
        }
        if ($scope.balance < needMoney) {//余额不足
            var msg = $scope.unHanldDeferCharge > 0 ? '账户历史策略未缴纳递延费共' + $scope.unHanldDeferCharge + '元<br>' : '';
            X.dialog.confirm(msg + '当前余额不足，<br>请充值后再发起策略。', {
                sureBtn: '去充值', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $location.url('/payType?goURL=/tradeBuy/' + stockCode);
                        })
                    }
                }
            });
            return false;
        }
        if (!isSignAgreement) {
            $location.url('/agreementSigned?goURL=/tradeBuy/' + stockCode);
            return false;
        }
        //余额充足时如果用户有未缴纳递延费则提示递延费缴纳，否则不能发起新的策略
        if ($scope.unHanldDeferCharge > 0) {
            X.dialog.confirm('账户历史策略未缴纳递延费共' + $scope.unHanldDeferCharge + '元，需缴纳后才能发起新策略。<br>确定支付吗？', {
                notify: function (nt) {
                    if (nt == 1) {
                        trade();
                    }
                }
            });
        } else {
            trade();
        }
    };

    //页面提示
    $scope.tips = function (title, msg) {
        X.dialog.info(title, msg);
    };

    //选择点买金额
    var littleMoney = 0;
    $scope.chooseMoney = function (index, money) {
        $scope.currentIndex = index;
        $scope.money = money;

        if ($scope.money < 10000) {
            litServiceCharge = parseInt(Math.round(littleServiceCharge / 10000 * $scope.money * 10000) / 100) / 100;
            litDeferCharge = parseInt(Math.round(littleDeferCharge / 10000 * $scope.money * 10000) / 100) / 100;
            littleMoney = $scope.money;
        }

        $scope.serviceChargeTips = '交易综合费包含第一天的交易费，第二天的递延费。每万元点买金交易综合费为' + serviceCharge + '元，每万元点买金递延费为' + deferCharge + '元/天。' + littleMoney / 10000 + '万元交易综合费为' + litServiceCharge + '元，递延费为' + litDeferCharge + '元/天。';

        processHigh(money);
        processLow(money);
        $scope.chooseHigh(0, $scope.highMoneyList[0]);
        $scope.chooseLow(0, $scope.lowMoneyList[0]);
        processServiceCharge(money);
        processStockCount(money);
    };

    //选择止盈
    $scope.chooseHigh = function (index, money) {
        $scope.highIndex = index;
        $scope.highMoney = money;
    };

    //选择止损
    $scope.chooseLow = function (index, money) {
        $scope.lowIndex = index;
        $scope.lowMoney = money;
        $scope.principal = X.toInt($scope.money / lowRateList[index].value);
    };

    function initValidate() {
        if (!$scope.user['named']) {
            X.dialog.confirm('您还未实名认证，请先实名认证', {
                notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $location.url('/identification?goURL=/tradeBuy/' + stockCode);
                        });
                    }
                    if (nt == 0) {
                        $scope.$apply(function () {
                            window.history.back();
                            // $location.url('/trade');
                        });
                    }
                }
            });
        }
    }

    //交易发起
    function trade() {
        var postData = {
            token: token,
            money: $scope.money,
            lever: lowRateList[$scope.lowIndex].value,
            quitLoss: $scope.lowMoney,
            quitGain: $scope.highMoney,
            principal: $scope.principal,
            serviceCharge: $scope.serviceCharge,
            stockCode: stockCode,
            volumeOrder: $scope.stockCount,
            useTip: $scope.useTip
        };

        $scope.btn = {
            className: 'disabled',
            btnText: '数据处理中',
            disabled: true
        };

        X.loading.show();
        TradeService.createTrade(postData).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('策略发起成功');
                //埋点：交易-A股
                zhuge.track("交易",
                    {
                        "名称": "A股"
                    });
                $location.path('/tradeSell');

            } else {
                token = data.data.token;
                X.tip(data['resultMsg']);
                $scope.btn = {
                    className: 'orange',
                    btnText: '提交',
                    disabled: false
                };
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //判断是否是限制股
    function checkRiskStock() {
        for (var i = 0; i < riskStocks.length; i++) {
            var item = riskStocks[i];
            if (stockCode == item.stockCode) {
                return true;
            }
        }
        return false;
    }

    //根据点买金额重新计算服务费和
    function processServiceCharge(money) {
        /*$scope.serviceCharge = X.toFloat(money / 10000 * serviceCharge);*/
        if (money >= 10000) {
            $scope.serviceCharge = parseInt(Math.round(money / 10000 * serviceCharge * 10000) / 10000 * 100) / 100;
        } else {
            $scope.serviceCharge = parseInt(Math.round(littleServiceCharge / 10000 * money * 10000) / 100) / 100;
        }
        //使用红包金额
        $scope.usTipBalance = Math.min($scope.serviceCharge, $scope.tipBalance);
    }

    //根据点买金额重新计算服务费和
    function processStockCount(money) {
        //购买数量是点买金额除以理论股票价格， 理论股票价格=股票当前价格*滑点比率，而且购买数量必须是一手起，即100股
        var count = (money / ($scope.stock.stockPrice * tradingCountRatio) / 100) | 0;
        count = count * 100;
        //股票一手起卖为100股，如果不够100股则不能交易，如果超过配置最大购买数量则设置为最大购买数量
        //count = count < 100 ? 0 : count;
        //count = count > maxStockCount ? maxStockCount : count;
        $scope.stockCount = count;
        $scope.moneyUseRate = parseInt(Math.round(count * $scope.stock.stockPrice / money * 100 * 1000000) / 10000) / 100;
    }

    //根据点买金额重新解析止盈金额列表
    function processHigh(money) {
        $scope.highMoneyList = [];
        $.each(highRateList, function (i, item) {
            $scope.highMoneyList.push(X.toInt(money * item));
        });
    }

    //根据点买金额重新解析解析止损列表
    function processLow(money) {
        $scope.lowMoneyList = [];
        $.each(lowRateList, function (i, obj) {
            //此处计算错误，严重丢失了精度，后期要注意哦(┬＿┬)
            //此处的-money / obj.value不应该转换为int，但是后端是TM的这么做的，不转换数据校验不通过，你妹
            $scope.lowMoneyList.push(X.toInt(X.toInt(-money / obj.value) * obj.rote));
        });
    }

    //初始化股票信息
    function initStockData(data) {
        $scope.stock.stockCode = data['stockLabel'];
        $scope.stock.stockName = data['stockName'];
        $scope.stock.stockPrice = data['newPrice'];
        $scope.stock.stockClose = data['lastClosePrice'];
    }

    //初始化交易信息
    function initTradeData(data) {
        var buyCount = data['buyCount'];
        var balance = data['balance'];
        isHoliday = data['isHoliday'];
        var tradingDeferCharge = data['tradingDeferCharge'];
        var unHanldDeferCharge = data['unHanldDeferCharge'];
        var unHanldHoldDeferCharge = data['unHanldHoldDeferCharge'];

        var risk = JSON.parse(data['strRisk']);
        maxStockCount = risk['maxStockCount'].value;//"单次单股最大交易数量"
        serviceCharge = risk['serviceCharge'].value - 0;//服务费
        deferCharge = risk['deferCharge'].value;//递延费

        tradingCountRatio = risk['tradingCountRatio'].value;//交易购买股票数量系数
        maxMoneyOneStock = risk['maxMoneyOneStock'].value;//个股持仓累计金额的最大值
        priceRisk = risk['priceRisk'].value.split(',');
        token = data['token'];

        var maxCountOneDay = risk['maxCountOneDay'].value;//"当天最大交易次数"
        var tradingMoneyList = risk['tradingMoneyList'].value;//"配置的可点买金额列表"
        var quitGainRatioList = risk['quitGainRatioList'].value;//"配置的止盈列表"
        var levers = risk['levers']['levers'];//"配置的止损列表"

        $scope.risk = risk;
        $scope.balance = balance;
        $scope.isHoliday = isHoliday;
        $scope.canBuyCount = (maxCountOneDay - buyCount) > 0 ? (maxCountOneDay - buyCount) : 0;//可点买次数
        $scope.tradingDeferCharge = tradingDeferCharge || 0;//今日待缴纳递延费
        $scope.unHanldDeferCharge = unHanldDeferCharge || 0;//已结算未缴纳递延费
        $scope.unHanldHoldDeferCharge = unHanldHoldDeferCharge || 0;//持仓中未缴纳递延费金额

        isSignAgreement = data['signAgreement'];

        var holiday = SystemService.parseHoliday(data['holidays']);
        var tradeTime = SystemService.parsePeriod(risk['tradingTimeLimit'].value);
        // //配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
        isTrade = risk['bussmannSwitch'].value != '1';
        SystemService.setCurrentTime(data['nowTime']);
        SystemService.setCurrentCurrencyType('CNY');
        SystemService.setHoliday(holiday);
        SystemService.setTradePeriod(tradeTime);

        //初始化
        initTradeMoney(tradingMoneyList);
        initHighRate(quitGainRatioList);
        initLowRate(levers);

        $scope.chooseMoney($scope.currentIndex, $scope.tradeMoneyList[$scope.currentIndex].value);
        if ($scope.money < 10000) {
            littleServiceCharge = (risk['serviceChargeForLittleMoney'].value - 0);
            littleDeferCharge = risk['deferChargeForLittleMoney'].value - 0;

        }

        if ($scope.canBuyCount == 0) {
            $scope.btn = {
                className: 'disabled',
                btnText: '今日点买次数已用完',
                disabled: true
            };
        } else {
            $scope.btn = {
                className: 'orange',
                btnText: '提交',
                disabled: false
            };
        }
    }

    //初始化点买金额
    function initTradeMoney(tradingMoneyStr) {
        if (tradingMoneyStr) {
            $scope.tradeMoneyList = [];
            tradeMoneyList = tradingMoneyStr.split(',');
            $.each(tradeMoneyList, function (i, m) {
                $scope.tradeMoneyList.push({
                    value: m,
                    text: X.sketchNumber(m)
                });
            });
        }
    }

    //初始化止盈比率
    function initHighRate(quitGainRatioListStr) {
        if (quitGainRatioListStr) {
            $scope.highMoneyList = [];
            highRateList = quitGainRatioListStr.split(',');
        }
    }

    //初始化止损比率
    function initLowRate(levers) {
        lowRateList = [];
        $.each(levers, function (i, item) {
            var rote = item['quitLossLineRatio'].value, value = item['value'];
            lowRateList.push({
                rote: rote,
                value: value
            })
        });
    }
});
//点卖 DONE
myControllers.controller('TradeSellCtrl', function ($scope, $q, $interval, $location, TradeService, StockService, SystemService) {
    var timer, first = true, tradeData = null, quoteData = null, isOK = false;
    var DYTip = false, DYData;
    $scope.tradeState = {
        1: '等待接单',
        2: '正在委托买入',
        3: '正在委托买入',
        4: '点卖',
        5: '正在委托卖出',
        6: '正在委托卖出',
        7: '正在清算',
        8: '已清算'
    };
    $scope.dataList = [];
    $scope.dataMap = {};
    $scope.unHanldHoldDeferCharge = 0;//历史拖欠递延费
    $scope.tradingDeferCharge = 0;//应缴递延费
    $scope.dataIsLoad = false;
    $scope.isInTradeTime = false;
    $scope.isInJJPeriod = true;
    $scope.isInDYFShowTime = false;
    $scope.isHoliday = true;
    $scope.todayStartTime = 0;
    $scope.stockType = 'T+1';
    $scope.stockTypes = {
        trade: 'T+1',
        TDTrade: 'T+D'
    };
    $scope.showMenu = false;

    X.loading.show();
    //      初始化交易数据
    $q.all({
        trade: TradeService.getInitTrade(),
        DY: TradeService.getWaitPayDeferForRemind()
    }).then(function (res) {
        var tradeData = res.trade.data, DYData = res.DY.data;
        if (tradeData.code == 100 && DYData.code == 100) {
            var data = tradeData.data;
            var strRisk = JSON.parse(data['strRisk']);
            $scope.isHoliday = data['isHoliday'];
            var holiday = SystemService.parseHoliday(data['holidays']);
            var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
            //判断是否在交易时间
            SystemService.setCurrentTime(data['nowTime']);
            SystemService.setCurrentCurrencyType('CNY');
            SystemService.setHoliday(holiday);
            SystemService.setTradePeriod(tradeTime);
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            $scope.isInJJPeriod = SystemService.isInJJPeriod();

            if (DYData.data != 0)DYTip = true;

            initTodayStartTime(data['nowTime']);
            startTimer();
        } else {
            X.tip(tradeData['resultMsg']);
        }
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //点卖发起
    $scope.sale = function (trade) {
        var html = '<div class="mod-sale-confirm-wrap">';
        html += '<div class="item">股票名称:<span class="fr">' + trade.stockName + '</span></div>';
        html += '<div class="item">股票代码:<span class="fr">' + trade.stockCode.substr(-6) + '</span></div>';
        html += '<div class="item">委托价格:<span class="fr">市价</span></div>';
        html += '<div class="item">卖出数量:<span class="fr">' + trade.volumeHold + '股</span></div>';
        html += '<div class="item">持仓天数:<span class="fr">' + trade.holdDays + '天</span></div>';
        if (trade.profit > 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-red">+' + trade.profit.toFixed(2) + '元</span></div>';
        } else if (trade.profit < 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-green">' + trade.profit.toFixed(2) + '元</span></div>';
        } else {
            html += '<div class="item">浮动盈亏:<span class="fr">' + trade.profit.toFixed(2) + '元</span></div>';
        }

        html += '<div class="item"><label><input id="agreeDefer" type="checkbox" checked> 是否递延指令</label></div>';
        html += '<div class="txt-grey txt-s12">注：点卖指令可能因跌停导致无法成交，默认至下一个交易日挂单交易。浮动盈亏仅供参考，具体以实际成交为准。</div>';
        html += '</div>';
        X.dialog.confirm(html, {
            title: '点卖确认', notify: function (nt) {
                if (nt == 1) {
                    var agreeDefer = document.getElementById('agreeDefer');
                    sale(trade.id, agreeDefer.checked);
                }
            }
        })
    };

    //欠费提示
    $scope.showArrears = function (money) {
        var html = '已逾期递延费：' + money + '元。<br>请尽快补缴，以免策略被接管。';
        X.dialog.alert(html);
    };

    $scope.showPartDeal = function (trade) {
        var list = trade.tradingRecordList, volumeDeal = trade.volumeHold;
        var table = '';
        table += '<table>';
        table += '<tr><td>成交时间</td><td>数量</td><td class="txt-right">价格</td></tr>';
        for (var i = 0; i < list.length; i++) {
            var obj = list[i];
            table += '<tr><td>' + X.formatDate(new Date(obj.time), 'Y-M-D') + '</td><td>' + obj.amount + '</td><td class="txt-right">' + obj.price.toFixed(2) + '</td></tr>';
            volumeDeal += obj.amount;
        }
        table += '</table>';
        var tipHtml = '<div class="info">行情波动过大，造成部分成交，原持有数量' + volumeDeal + '股，现剩余' + trade.volumeHold + '股，请处理剩余数量，以便结算！</div>';
        X.dialog.alert('<div class="mod-part-deal-wrap">' + tipHtml + table + '</div>');
    };

    //初始化定时器启动方法
    function startTimer() {
        isOK = true;
        getData();
        timer = $interval(function () {
            X.log('点卖定时器运行中。。。');
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            $scope.isInJJPeriod = SystemService.isInJJPeriod();
            if (first || (!$scope.isHoliday && $scope.isInTradeTime && isOK)) {
                isOK = false;
                showOrHideDYFWrap();
                getData();
            }
        }, 1000);
    }

    //展示递延费
    function showOrHideDYFWrap() {
        $scope.isInDYFShowTime = SystemService.isInPeriod('DEFER', 'quote');
    }

    //初始化今天的开始时间
    function initTodayStartTime(serverTime) {
        serverTime = serverTime || Date.now();
        var now = new Date(serverTime);
        var yyyy = now.getFullYear(), MM = now.getMonth(), dd = now.getDate();
        var today = new Date(yyyy, MM, dd, 0, 0, 0);
        $scope.todayStartTime = today.getTime();
    }

    //获取数据
    function getData() {
        var http;
        if (first) {//                  策略
            http = TradeService.getSaleStrategyByPage();
        } else {
            http = TradeService.getSaleStrategyOfMemcache();
        }
        first = false;
        http.then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                tradeData = data.data;
                var stocks = getNeedStocks(tradeData['dataList']);
                if (stocks == '' || !stocks) {
                    X.loading.hide();
                    $scope.dataList = [];
                }
                StockService.getStockInfo(stocks).then(function (res) {
                    var data = res.data;
                    if (data.code == 100) {
                        quoteData = data.data;
                        processData();
                    } else {
                        initNoDataQuote();
                        //X.tip(data['resultMsg']);
                    }
                }).catch(function () {
                    X.tip('服务器请求异常');
                });
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //点卖
    function sale(tradeID, isAlwaysClose) {
        if (!$scope.isInTradeTime) {
            X.tip('非交易时间不能交易');
            return;
        }
        X.loading.show();
        TradeService.closeStrategy(tradeID, isAlwaysClose).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                //window.location.reload();
                X.tip('点卖策略成功');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //当没有行情时T+1
    function initNoDataQuote() {
        $scope.dataIsLoad = true;
        isOK = true;
        X.loading.hide();
        var dataList = tradeData['dataList'];
        $.each(dataList, function (i, item) {
            item.quotePrice = 0;
            item.lastClosePrice = 0;
            /*if (item['buyPriceDeal'] != 0 && item.quotePrice != 0 && item['volumeHold'] != 0) {
             item.profit = (item.quotePrice - item['buyPriceDeal']) * item['volumeHold'];
             } else {
             item.profit = 0;
             }*/
            item.profit = 0;
        });
        $scope.dataList = dataList;
    }

    //组合数据
    function processData() {
        $scope.dataIsLoad = true;
        isOK = true;
        X.loading.hide();
        if (tradeData == null || quoteData == null) {
            $scope.dataList = [];
            return;
        }
        $scope.unHanldHoldDeferCharge = tradeData['unHanldHoldDeferCharge'];//历史拖欠递延费
        $scope.tradingDeferCharge = tradeData['tradingDeferCharge'];//应缴递延费
        var dataList = tradeData['dataList'];
        $.each(dataList, function (i, item) {
            var quote = quoteData[item.stockCode];
            item.quotePrice = quote ? quote['newPrice'] : 0;
            item['lastClosePrice'] = quote['lastClosePrice'];
            if (item['buyPriceDeal'] != 0 && item.quotePrice != 0 && item['volumeHold'] != 0) {
                item.profit = (item.quotePrice - item['buyPriceDeal']) * item['volumeHold'];
            } else {
                item.profit = (item['lastClosePrice'] - item['buyPriceDeal']) * item['volumeHold'];
            }
        });
        $scope.dataList = dataList;
    }

    //设置需要查询的点买股票
    function getNeedStocks(dataList) {
        var stocksObj = {}, stocks = '', arr = [];
        $.each(dataList, function (i, item) {
            stocksObj[item.stockCode] = item.stockCode;
        });
        for (var key in stocksObj) {
            arr.push(key);
        }
        if (arr.length > 0) {
            stocks = arr.join(',');
        } else {
            stocks = '';
        }
        return stocks;
    }

    //买断
    $scope.showBuyOutMenu = false;
    $scope.showDBBG = false;
    $scope.buyOut = function (trade, type) {
        if (!trade || !type) {
            return;
        }

        if (DYTip && type == 2) {
            X.dialog.confirm('温馨提示：请您确认是否已经将今日递延<br/>费留在余额中等待扣款，如果继续操作可<br/>能会造成操盘中策略因递延费不足被平仓', {
                sureBtn: '确定', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $scope.showDBBG = true;
                            buyOutDialog(trade, type);
                        })
                    }
                }
            });
            return;
        }

        buyOutDialog(trade, type);
    };

    function buyOutDialog(trade, type) {
        TradeService.takeOverInitiate(trade.id).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.deferMoney = Math.round(data.data * 100) / 100;
                $scope.currentTrade = trade;
                $scope.showDBBG = true;
                $scope.holdStrategyMoney = trade.lastClosePrice * trade.volumeHold;
                $scope.stockName = trade.stockName;
                var lossPrincipal = trade.lossPrincipal || 0;//trade.lossPrincipal可能为null，需做特殊处理
                $scope.lossPrincipal = Math.round(lossPrincipal * 100) / 100;
                //2：买断  1：放弃
                if (type == 2) {
                    // X.log($scope.holdStrategyMoney , $scope.deferMoney);
                    /*$scope.paySum = parseInt(($scope.holdStrategyMoney + $scope.deferMoney) * 100) / 100;*/
                    /*if (trade.profit < 0) {
                     $scope.paySum = Math.round(((trade.buyPriceDeal * 2 - trade.lastClosePrice) * trade.volumeHold + $scope.deferMoney) * 100) / 100;
                     } else {
                     $scope.paySum = Math.round((trade.buyPriceDeal * trade.volumeHold + $scope.deferMoney) * 100) / 100;
                     }*/

                    //买断金额 = 买入价*数量+递延费（盈亏都是这个计算公式）
                    $scope.paySum = Math.round((trade.buyPriceDeal * trade.volumeHold + $scope.deferMoney) * 100) / 100;
                    $scope.showBuyOutMenu = true;
                    $scope.showQuitType = false;
                } else {
                    $scope.paySum = $scope.lossPrincipal;
                    $scope.showQuitType = true;
                    $scope.showBuyOutMenu = false;
                }
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器异常');
        });
    }

    $scope.confirmBuyOrQuit = function (takeOverType) {
        X.loading.show();
        TradeService.takeOverStrategy($scope.currentTrade.id, takeOverType, $scope.paySum).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                if (takeOverType == 1) {
                    X.tip('放弃策略成功');
                } else {
                    X.tip('买断策略成功');
                }
            } else {
                X.tip(data['resultMsg']);
            }
            $scope.cancelOperate();
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //取消弹窗
    $scope.cancelOperate = function () {
        $scope.showDBBG = false;
        $scope.showBuyOutMenu = false;
    };

    function clearTimer() {
        if (timer) {
            $interval.cancel(timer);
            timer = undefined;
        }
    }

    $scope.$on('$destroy', function () {
        clearTimer();
    });
});
//结算 DONE
myControllers.controller('TradeResultCtrl', function ($scope, $location, $q, TradeService) {
    var pageSize = 10;
    $scope.settleList = [];
    $scope.currPage = 1;
    $scope.totalPage = 1;
    $scope.stockType = 'T+1';
    $scope.stockTypes = {
        trade: 'T+1',
        TDTrade: 'T+D'
    };
    $scope.showMenu = false;

    $scope.getSettleList = function (page) {
        X.loading.show();
        TradeService.getSettleStrategyByPage(page, pageSize).then(function (res) {
            var settleListData = res.data;
            if (settleListData.code == 100) {
                var data = settleListData.data;
                $scope.currPage = data['pageIndex'];
                $scope.totalPage = data['totalPage'];
                var list = data['dataList'];
                if (page == 1) {
                    $scope.settleList = list;
                } else {
                    $scope.settleList = $scope.settleList.concat(list);
                }
            } else {
                X.tip(settleListData['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    $scope.getSettleList($scope.currPage);

    $scope.toDetail = function (tradeID) {
        $location.url('/tradeDetail/' + tradeID);
    }
});
//T+D点买
myControllers.controller('TDTradeCtrl', function ($scope, $q, $location, $sce, initData, TradeService, PacketService, StockService, SystemService) {
    if (initData == null) {
        X.tip('初始化信息加载错误，请重试');
        return;
    }
    //初始化风控参数
    var strRisk = JSON.parse(initData['strRisk']);
    var defaultStock = strRisk['defaultStock'] ? strRisk['defaultStock'].value : 0;

    var serviceCharge = strRisk['serviceCharge'].value;//服务费
    var maxStockCount = parseInt(strRisk['maxStockCount'].value);//"单次单股最大交易数量"
    //var maxMoneyOneStock = strRisk['maxMoneyOneStock'].value;//个股持仓累计金额的最大值
    var priceRisk = strRisk['priceRisk'].value.split(',');
    var balance = initData['balance'];
    //var unHanldDeferCharge = initData['unHanldDeferCharge'] || 0;//拖欠递延费
    var tradingCountRatio = strRisk['tradingCountRatio'].value;

    var holiday = SystemService.parseHoliday(initData['holidays']);
    var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
    // //配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
    var isTrade = strRisk['bussmannSwitch'] ? (strRisk['bussmannSwitch'].value != '1') : true;
    SystemService.setCurrentTime(initData['nowTime']);
    SystemService.setCurrentCurrencyType('CNY');
    SystemService.setHoliday(holiday);
    SystemService.setTradePeriod(tradeTime);

    //初始化业务变量
    var storage = window.localStorage, STOCKCODE = 'STOCKCODE', MINELIST = 'MINELIST';
    var stockCode = storage.getItem(STOCKCODE) || defaultStock || 'SH600570';
    var mineListStr = storage.getItem(MINELIST) || '';
    var isInTradeTime = false, isStopStock = false, newPrice = 0, dataIsLoad = true;
    var riskStocks = [];//限制股票
    /*var slineChart = null, klineChart = null, QUOTE_DATA, CACHE_KLINE;//分时K线图*/
    var slineChart = null, klineChart = null, QUOTE_DATA, CACHE_KLINE, CACHE_WEEKKLINE, CACHE_MONTHKLINE;//分时K线图
    /*var backURL = $location.search()['backURL'] || '/index';*/
    // var DYTip = false, DYData,inDYTipTime = false;

    $scope.stockType = 'T+D';
    $scope.stockTypes = {
        trade: 'T+1',
        TDTrade: 'T+D'
    };

    $scope.stock = {};
    $scope.uuid = SystemService.uuid();
    $scope.isRiskStock = false;
    $scope.showMenu = false;
    $scope.mineType = 'add';
    $scope.actType = 'sline';
    $scope.stopTimer = false;
    $scope.stock = {};
    $scope.btn = {
        className: 'disabled',
        btnText: '数据加载中',
        disabled: true
    };

    $scope.showSchemeLastDayTip = false;
    $scope.isLogin = false;
    $scope.scheme = null;
    $scope.serviceCharge = 0;//交易综合费
    $scope.totalStockMoney = 0;
    $scope.stockNumObj = {
        max: 100,
        curr: 100,
        min: 100,
        canMax: false,
        canMin: false
    };
    //红包抵扣交易综合费
    $scope.tipBalance = 0; //红包余额
    $scope.usTipBalance = 0; //使用红包金额
    // $scope.useTip = true;
    var vm = $scope.vm = {};
    vm.useTip = true;//是否使用红包

    //获取风控参数，获取方案信息
    X.loading.show();
    $q.all({
        trade: TradeService.getRiskStock(),
        info: StockService.getStockInfo(stockCode),
        scheme: TradeService.getHoldingScheme(),
        packet: PacketService.getPacketFundInfoData()
    }).then(function (res) {
        var infoData = res.info.data,
            tradeData = res.trade.data,
            schemeData = res.scheme.data,
            packetData = res.packet.data;
        if (schemeData.code == 100) {
            $scope.isLogin = true;
            $scope.scheme = schemeData.data;
            $scope.scheme.availableMoney = schemeData.data['availableMoney'];
            $scope.scheme.currentMarketValue = $scope.scheme.marketValue + $scope.scheme.suspendedValue;
        } else if (schemeData.code == 900) {
            $scope.isLogin = true;
            $scope.scheme = null;
        } else if (schemeData.code == 405) {
            $scope.isLogin = false;
            $scope.scheme = null;
        } else {
            X.tip(schemeData['resultMsg']);
        }

        if (tradeData.code == 100 && infoData.code == 100 && packetData.code == 100) {
            riskStocks = tradeData.data;
            /*红包*/
            $scope.tipBalance = packetData.data.tipBalance;
            if ($scope.tipBalance == 0) {
                vm.useTip = false;
            }
            // if (DYData.data != 0)DYTip = true;


            confirmMineType();
            checkRiskStock();
            processStockInfoData(infoData.data[stockCode]);
            init();
            $scope.changeTab('sline');
        } else {
            if (tradeData.code != 100) {
                X.tip(tradeData['resultMsg']);
            } else if (infoData.code != 100) {
                X.tip(infoData['resultMsg']);
            } else if (packetData.code != 100) {
                X.tip(packetData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    /* $scope.changeTab = function (current) {
     $scope.actType = current;
     if (current == 'kline' && !klineChart) {
     getStockKline();
     } else if (current == 'sline' && !slineChart) {
     getStockSline();
     } else if (current == 'monthKline' && !monthKlineChart) {

     }
     };*/
    $scope.changeTab = function (current) {
        $scope.actType = current;
        if (current == 'sline' && !slineChart) {
            getStockSline();
        } else if (current == 'kline' && !CACHE_KLINE) {
            getStockKline(current);
            // $scope.status = 0;
        } else if (current == 'weekKline' && !CACHE_WEEKKLINE) {
            getStockKline(current);
            // $scope.status = 1;
        } else if (current == 'monthKline' && !CACHE_MONTHKLINE) {
            getStockKline(current);
            // $scope.status = 2;
        }

        if (current == 'kline' && CACHE_KLINE) {
            drawKLine(CACHE_KLINE, current);
            // $scope.status = 0;
        } else if (current == 'weekKline' && CACHE_WEEKKLINE) {
            drawKLine(CACHE_WEEKKLINE, current);
            // $scope.status = 1;
        } else if (current == 'monthKline' && CACHE_MONTHKLINE) {
            drawKLine(CACHE_MONTHKLINE, current);
            // $scope.status = 2;
        }
    };

    //添加或者删除自选
    $scope.addOrDelMine = function (stockCode, stockName) {
        if (!stockCode || !stockName) {
            return false;
        }
        var maxLen = 20;
        var mineListStr = storage.getItem(MINELIST) || '', mineArr = [];
        if (mineListStr == '' || mineListStr.indexOf(stockCode) == -1) {
            if (mineListStr != '') {
                mineArr = mineListStr.split(';');
            }
            if (mineArr.length >= maxLen) {
                X.dialog.alert('自选最多添加' + maxLen + '条记录');
                return;
            }
            mineArr.push(stockCode + ',' + stockName);
            storage.setItem(MINELIST, mineArr.join(';'));
            $scope.mineType = 'delete';
        } else {
            mineArr = mineListStr.split(';');
            for (var i = 0; i < mineArr.length; i++) {
                if (mineArr[i].indexOf(stockCode) != -1) {
                    mineArr.splice(i, 1);
                }
            }
            storage.setItem(MINELIST, mineArr.join(';'));
            $scope.mineType = 'add';
        }
    };

    //股票买入数量
    $scope.changeStockNum = function (curr) {
        // var price = $scope.stock.price;
        curr = parseInt(curr / 100) * 100;
        if (isNaN(curr) || curr < 0) {
            curr = 0;
        }
        $scope.stockNumObj.curr = curr;
        $scope.stockNumObj.canMax = true;
        $scope.stockNumObj.canMin = true;

        if ($scope.stockNumObj.curr >= $scope.stockNumObj.max) {
            $scope.stockNumObj.curr = $scope.stockNumObj.max;
            $scope.stockNumObj.canMax = false;
        }

        if ($scope.stockNumObj.curr <= $scope.stockNumObj.min) {
            $scope.stockNumObj.curr = $scope.stockNumObj.min;
            $scope.stockNumObj.canMin = false;
        }

        var realPrice = $scope.stock.price * tradingCountRatio;
        // X.log(realPrice);
        if (realPrice > $scope.stock.limitUpPrice) {
            realPrice = $scope.stock.limitUpPrice;
        }

        $scope.totalStockMoney = Math.round(Math.floor(Math.round(realPrice * 10000) / 100) / 100 * $scope.stockNumObj.curr);


        /*$scope.totalStockMoney = Math.round($scope.stockNumObj.curr * price * 100) / 100;*/
        //占用金额：当前价*系数（乘积保留二位小数，抹小数）， 再乘以委托数量

        // X.log(realPrice,$scope.stock.limitUpPrice,$scope.totalStockMoney);

        var stockServiceUnit = $scope.totalStockMoney / 10000;
        if (stockServiceUnit < 1) {
            stockServiceUnit = 1;
        }

        $scope.serviceCharge = Math.floor(Math.round(stockServiceUnit * serviceCharge * 10000) / 100) / 100;
        // $scope.usTipBalance = Math.min($scope.serviceCharge, $scope.tipBalance);
    };


    //确认所选股票是否已经添加到自选，控制显示添加和删除
    function confirmMineType() {
        if (mineListStr == '') {
            $scope.mineType = 'add';
        } else {
            $scope.mineType = mineListStr.indexOf(stockCode) == -1 ? 'add' : 'delete';
        }
    }

    //判断是否是限制股
    function checkRiskStock() {
        for (var i = 0; i < riskStocks.length; i++) {
            var item = riskStocks[i];
            if (stockCode == item.stockCode) {
                $scope.isRiskStock = true;
                break;
            }
        }
    }

    //将数据绑定到页面scope,加载股票信息
    function processStockInfoData(data) {
        var newPrice = data.newPrice;
        var lastClosePrice = data.lastClosePrice;
        var isStop = isStopStock = (newPrice == 0);
        var style = '', dealNum = '', dealPrice = '';
        var diff = 0.00, rate = 0.00;
        if (!isStop) {
            diff = newPrice - lastClosePrice;
            rate = diff / lastClosePrice * 100;
            diff = diff.toFixed(2);
            rate = rate.toFixed(2);
            style = newPrice > lastClosePrice ? 'txt-red' : newPrice < lastClosePrice ? 'txt-green' : 'txt-white';
            dealNum = processNum(data, 'todayDealNum');
            dealPrice = processNum(data, 'todayDealPrice');
        }
        $scope.stock = {
            "stockLabel": data.stockLabel, //代码
            "stockName": data.stockName,//名称
            "price": parseInt(newPrice * 100) / 100,//当前价
            "lastClosePrice": lastClosePrice,//昨收
            isStop: isStop,
            diff: diff,//涨跌值
            rate: rate,//涨跌幅
            style: style,
            dealNum: dealNum,
            dealPrice: dealPrice,
            "openPrice": data.openPrice,//今开
            "highPrice": data.highPrice,//最高
            "lowPrice": data.lowPrice,//最低
            "limitDownPrice": parseFloat(data.limitDownPrice),//跌停
            "limitUpPrice": parseInt(data.limitUpPrice * 100) / 100,//涨停
            "amplitude": data.amplitude,//振幅
            "todayDealNum": data.todayDealNum,//成交量
            "todayDealPrice": data.todayDealPrice,//成交金额
            "buyPrice": isStop ? [0, 0, 0, 0, 0] : data.buyPrice,//买12345
            "buyNum": isStop ? [0, 0, 0, 0, 0] : data.buyNum,
            "sellPrice": isStop ? [0, 0, 0, 0, 0] : data.sellPrice,//卖12345
            "sellNum": isStop ? [0, 0, 0, 0, 0] : data.sellNum
        };

        /*var realPrice = $scope.stock.price * tradingCountRatio;
         if (realPrice > $scope.stock.limitUpPrice) {
         realPrice = $scope.stock.limitUpPrice;
         }

         $scope.totalStockMoney = Math.round(Math.floor(Math.round(realPrice * 10000) / 100) / 100 * $scope.stockNumObj.curr);*/
        // $scope.changeStockNum($scope.stockNumObj.curr);

        QUOTE_DATA = {
            commodityTitle: 'STOCK',
            contractNo: data.stockLabel,
            time: data['time'],
            openPrice: data['openPrice'],
            yesterdayPrice: data['lastClosePrice'],
            highPrice: data['highPrice'],
            lowPrice: data['lowPrice'],
            newPrice: data['newPrice'],
            limitDownPrice: X.toFloat(data['limitDownPrice']),
            limitUpPrice: X.toFloat(data['limitUpPrice'])
        };

        newSlineQuoteData(QUOTE_DATA);
        newKlineQuoteData(QUOTE_DATA);
    }

    //初始化获取股票实时信息，并将获取实时信息添加到定时器
    function init() {
        showLastDayTip();

        if ($scope.scheme != null) {
            //var num = Math.floor($scope.scheme.availableMoney / $scope.stock.limitUpPrice / 100) * 100;
            var tradingCount = Math.floor(Math.round($scope.stock.price * tradingCountRatio * 10000) / 100) / 100;
            var num = Math.floor($scope.scheme.availableMoney / tradingCount / 100) * 100;
            $scope.stockNumObj.max = num < 100 ? 100 : num > maxStockCount ? maxStockCount : num;
        }

        getStockInfo(true);
        X.engine.addTask(getStockInfo, 1000);
        X.engine.start();
    }

    function showLastDayTip() {
        if ($scope.scheme != null && $scope.scheme.availableDays < 3) {
            var schemeId = $scope.scheme.id, tipMsg = [], tipRecord = storage.getItem('SCHEME_LAST_DAY_TIP'), today = X.formatDate(new Date(), 'Y-M-D');
            var tipKey = '{{' + schemeId + ':' + today + '}}';
            if (tipRecord == null) {
                $scope.showSchemeLastDayTip = true;
                storage.setItem('SCHEME_LAST_DAY_TIP', tipKey);
            } else {
                tipMsg = tipRecord.split(';');
                if (tipMsg.indexOf(tipKey) == -1) {
                    $scope.showSchemeLastDayTip = true;
                    tipMsg.push(tipKey);
                    storage.setItem('SCHEME_LAST_DAY_TIP', tipMsg.join(';'));
                }
            }
        }
    }

    //获取股票分时信息
    function getStockSline() {
        StockService.getSLine(stockCode).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                drawSLine(data.data);
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //获取股票K线信息
    function getStockKline(current) {
        /*StockService.getKLine(stockCode).then(function (res) {
         var data = res.data;
         if (data.code == 100) {
         drawKLine(data.data);
         } else {
         X.tip(data['resultMsg']);
         }
         }).catch(function () {
         X.tip('服务器请求异常');
         });*/
        var http;

        if (current == 'kline') {
            http = StockService.getKLine(stockCode);
        } else if (current == 'weekKline') {
            http = StockService.getWMKline(stockCode, current);
        } else if (current == 'monthKline') {
            http = StockService.getWMKline(stockCode, current);
        }

        http.then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                drawKLine(data.data, current);
            } else {
                X.tip(data['resultMsg'])
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        })
    }

    //绘制分时图
    function drawSLine(slineData) {
        if (!QUOTE_DATA)return;
        slineData = slineData || [];
        var data = {}, lastTime;
        slineData.forEach(function (obj, i) {
            lastTime = X.formatDate(obj.time, 'hm') - 0;
            data[lastTime] = {
                current: X.toFloat(obj['price']),
                volume: X.toFloat(obj['volume']),
                time: lastTime
            };
        });

        slineChart = new X.Sline({wrap: 'sline-wrap-' + $scope.uuid});
        slineChart.draw({
            data: data,
            quoteTime: lastTime,
            close: QUOTE_DATA['yesterdayPrice'],
            high: QUOTE_DATA['highPrice'],
            low: QUOTE_DATA['lowPrice'],
            limitUp: QUOTE_DATA['limitUpPrice'],
            limitDown: QUOTE_DATA['limitDownPrice'],
            period: SystemService.getRealPeriod('STOCK', lastTime),
            isStock: true,
            isIntl: false,
            code: stockCode
        });
    }

    //绘制K线图
    /*function drawKLine(klineData) {
     klineData = klineData || [];
     var data = [];
     klineData.forEach(function (o, i) {
     data[i] = {
     time: X.formatDate(o['time'], 'YMD'),
     open: o['open'],
     close: o['last'],
     high: o['high'],
     low: o['low'],
     price: o['price']
     }
     });
     klineChart = new X.Kline({wrap: 'kline-wrap-' + $scope.uuid});
     klineChart.draw(data);
     CACHE_KLINE = data;
     }*/
    function drawKLine(klineData, type) {
        klineData = klineData || [];
        var data = [];
        klineData.forEach(function (o, i) {
            data[i] = {
                time: o['time'].length == 8 ? o['time'] : X.formatDate(o['time'], 'YMD'),
                open: o['open'],
                close: o['last'],
                high: o['high'],
                low: o['low'],
                price: o['price']
            };
        });


        if (!klineChart) {
            klineChart = new X.Kline({wrap: 'kline-wrap-' + $scope.uuid})
        }

        klineChart.draw(data);
        if (type == 'kline') {
            CACHE_KLINE = data;
        } else if (type == 'weekKline') {
            CACHE_WEEKKLINE = data;
        } else {
            CACHE_MONTHKLINE = data;
        }
        /*klineChart = new X.Kline({wrap: 'kline-wrap-' + $scope.uuid});
         klineChart.draw(data);
         CACHE_KLINE = data;*/
    }

    //获取股票信息
    function getStockInfo(flag) {
        X.log('行情定时器运行中。。。');
        //判断是否是在交易时间段内
        if (isTrade) {
            isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            if (isInTradeTime) {
                if ($scope.isRiskStock) {//风险股按钮控制
                    $scope.btn = {
                        className: 'disabled',
                        btnText: '立即点买',
                        disabled: true
                    };
                } else if (QUOTE_DATA && QUOTE_DATA['newPrice'] == 0) {//停牌股按钮控制
                    $scope.btn = {
                        className: 'disabled',
                        btnText: '立即点买',
                        disabled: true
                    };
                } else {
                    $scope.btn = {
                        className: 'orange',
                        btnText: '立即点买',
                        disabled: false
                    };
                }
            } else {
                $scope.btn = {
                    className: 'disabled',
                    btnText: '非点买时段',
                    disabled: true
                };
            }
        } else {
            isInTradeTime = false;
            $scope.btn = {
                className: 'disabled',
                btnText: '暂停交易',
                disabled: true
            };
        }

        var isInQuoteTime = SystemService.isInPeriod('STOCK', 'quote');

        if (!flag && !isInQuoteTime) {
            $scope.$apply();
        }

        //判断是否是在行情时间段内
        if (dataIsLoad && isInQuoteTime) {
            dataIsLoad = false;
            StockService.getStockInfo(stockCode).then(function (res) {
                dataIsLoad = true;
                var data = res.data;
                if (data.code == 100) {
                    processStockInfoData(data.data[stockCode]);
                } else {
                    X.tip(data['resultMsg']);
                }
            }).catch(function () {
                X.tip('服务器请求异常');
            });
        }
    }

    //解析数字格式
    function processNum(data, type) {
        var num = data[type], unit = type == 'todayDealNum' ? '手' : '元';
        if (num > 100000000) {
            return (num / 100000000).toFixed(2) + '亿' + unit;
        }
        if (num > 10000) {
            return (num / 10000).toFixed(2) + '万' + unit;
        }
        return num + unit;
    }

    //更新最新分时信息
    function newSlineQuoteData(quote) {
        var price = quote['newPrice'] == 0 ? quote['yesterdayPrice'] : quote['newPrice'];
        var o = {
            current: price,
            volume: 0,
            time: X.formatDate(quote.time, 'hm') - 0
        };

        slineChart && slineChart.perDraw(o, {
            quoteTime: o.time,
            close: quote['yesterdayPrice'],
            high: quote['highPrice'],
            low: quote['lowPrice'],
            limitUp: quote['limitUpPrice'],
            limitDown: quote['limitDownPrice'],
            period: SystemService.getRealPeriod('STOCK', o.time),
            isStock: true,
            code: stockCode
        });
    }

    //更新最新K线信息
    function newKlineQuoteData(quote) {
        // 累加和更新数据//如果股票停牌则不放到K线数据中PS：其实是可以看，接口数据错误所以先不加
        if (quote['newPrice'] == 0 || !CACHE_KLINE || !CACHE_KLINE.length) {
            return;
        }
        var o = {
            time: X.formatDate(quote.time, 'YMD'),
            open: quote['openPrice'],
            close: quote['yesterdayPrice'],
            high: quote['highPrice'],
            low: quote['lowPrice'],
            price: quote['newPrice']// 即时数据，使用当前价格
        };


        if ($scope.actType == 'kline') {
            var last = CACHE_KLINE[CACHE_KLINE.length - 1];

            if (last.time === o.time) {
                CACHE_KLINE[CACHE_KLINE.length - 1] = o;
            } else {
                CACHE_KLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_KLINE);
        } else if ($scope.actType == 'weekKline') {
            var last = CACHE_WEEKKLINE[CACHE_WEEKKLINE.length - 1];

            if (last.time === o.time) {
                CACHE_WEEKKLINE[CACHE_WEEKKLINE.length - 1] = o;
            } else {
                CACHE_WEEKKLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_WEEKKLINE);
        } else if ($scope.actType == 'monthKline') {
            var last = CACHE_MONTHKLINE[CACHE_MONTHKLINE.length - 1];

            if (last.time === o.time) {
                CACHE_MONTHKLINE[CACHE_MONTHKLINE.length - 1] = o;
            } else {
                CACHE_MONTHKLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_MONTHKLINE);
        }
    }

    //发起交易
    $scope.toTrade = function () {
        if (!isTrade) {
            X.dialog.alert('暂停交易');
            return false;
        }

        if (!SystemService.isInPeriod('STOCK', 'trade')) {
            X.dialog.alert('当前为非点买时段，无法发起策略');
            return false;
        }

        if (isStopStock) {
            X.dialog.alert('停牌股无法进行交易<br>请更换其他能够正常交易的股票');
            return false;
        }

        if (!$scope.isLogin) {
            $location.url('/login?goURL=/TDTrade');
            return false;
        }

        if ($scope.isRiskStock) {
            X.dialog.alert('【' + $scope.stock.stockName + '】今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }
        var currPrice = $scope.stock['price'], closePrice = $scope.stock['lastClosePrice'];
        var diff = currPrice - closePrice, rote = (diff / closePrice * 100).toFixed(2);
        //风险股票
        if (rote > X.toFloat(priceRisk[1]) || rote < X.toFloat(priceRisk[0])) {
            X.dialog.alert('该股今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }

        if ($scope.scheme == null) {
            $location.url('/TDApply');
            return false;
        }

        /*if ($scope.stockNumObj.curr > maxStockCount) {
         X.dialog.alert('单股最高可购买数量为' + maxStockCount + '股');
         return false;
         }*/
        // var needMoney = $scope.totalStockMoney;

        //红包
        /*if (vm.useTip) {
         $scope.usTipBalance = Math.min($scope.serviceCharge, $scope.tipBalance);
         // needMoney -= $scope.usTipBalance;
         }*/


        /*if ($scope.scheme.availableMoney < needMoney) {//方案余额不足
         X.dialog.alert('策略组余额不足，您可以到“个人中心-我的策略组”追加点买金额');
         return false;
         }*/

        /*if ($scope.scheme != null && $scope.scheme.availableDays == 0) {
         X.dialog.alert('您的T+D点买策略组即将到期，不允许买入');
         return false;
         }*/


        $location.url('/TDTradeBuy');

    };

    //交易发起
    function trade() {
        $scope.btn = {
            className: 'disabled',
            btnText: '数据处理中',
            disabled: true
        };

        X.loading.show();
        TradeService.strategyCreate($scope.scheme.id, $scope.totalStockMoney, $scope.serviceCharge, stockCode, $scope.stockNumObj.curr, vm.useTip).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('策略发起成功');
                //埋点：交易-A股
                zhuge.track("交易", {
                    "名称": "A股"
                });
                $location.path('/TDTradeSell');
            } else {
                X.tip(data['resultMsg']);
                $scope.btn = {
                    className: 'orange',
                    btnText: '提交',
                    disabled: false
                };
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    $scope.jumpToSG = function () {
        $location.url('/myStrategyGroup');
    };

    //controller卸载的时候清除定时器任务
    $scope.$on('$destroy', function () {
        X.engine.destroy();
    });
});
//T+D二级页面
myControllers.controller('TDTradeBuyCtrl', function ($scope, $q, $routeParams, $location, $sce, initData, TradeService, PacketService, StockService, SystemService) {
    if (initData == null) {
        X.tip('初始化信息加载错误，请重试');
        return;
    }
    $scope.stock = $routeParams.stock;
    $scope.scheme = $routeParams.scheme;
    //初始化风控参数
    var strRisk = JSON.parse(initData['strRisk']);
    var defaultStock = strRisk['defaultStock'] ? strRisk['defaultStock'].value : 0;

    var serviceCharge = strRisk['serviceCharge'].value;//服务费
    var maxStockCount = parseInt(strRisk['maxStockCount'].value);//"单次单股最大交易数量"
    //var maxMoneyOneStock = strRisk['maxMoneyOneStock'].value;//个股持仓累计金额的最大值
    var priceRisk = strRisk['priceRisk'].value.split(',');
    var balance = initData['balance'];
    //var unHanldDeferCharge = initData['unHanldDeferCharge'] || 0;//拖欠递延费
    var tradingCountRatio = strRisk['tradingCountRatio'].value;

    var holiday = SystemService.parseHoliday(initData['holidays']);
    var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
    // //配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
    var isTrade = strRisk['bussmannSwitch'] ? (strRisk['bussmannSwitch'].value != '1') : true;
    SystemService.setCurrentTime(initData['nowTime']);
    SystemService.setCurrentCurrencyType('CNY');
    SystemService.setHoliday(holiday);
    SystemService.setTradePeriod(tradeTime);

    //初始化业务变量
    var storage = window.localStorage, STOCKCODE = 'STOCKCODE', MINELIST = 'MINELIST';
    var stockCode = storage.getItem(STOCKCODE) || defaultStock || 'SH600570';
    var mineListStr = storage.getItem(MINELIST) || '';
    var isInTradeTime = false, isStopStock = false, newPrice = 0, dataIsLoad = true;
    var riskStocks = [];//限制股票
    /*var slineChart = null, klineChart = null, QUOTE_DATA, CACHE_KLINE;//分时K线图*/
    var QUOTE_DATA;
    /*var backURL = $location.search()['backURL'] || '/index';*/

    $scope.stockType = 'T+D';
    $scope.stockTypes = {
        trade: 'T+1',
        TDTrade: 'T+D'
    };

    $scope.stock = {};
    $scope.uuid = SystemService.uuid();
    $scope.isRiskStock = false,
        $scope.showMenu = false;
    $scope.mineType = 'add';
    $scope.stopTimer = false;
    $scope.stock = {};
    $scope.btn = {
        className: 'disabled',
        btnText: '数据加载中',
        disabled: true
    };

    $scope.showSchemeLastDayTip = false;
    $scope.isLogin = false;
    $scope.scheme = null;
    $scope.serviceCharge = 0;//交易综合费
    $scope.totalStockMoney = 0;
    $scope.stockNumObj = {
        max: 100,
        curr: 100,
        min: 100,
        canMax: false,
        canMin: false
    };
    //红包抵扣交易综合费
    $scope.tipBalance = 0; //红包余额
    $scope.usTipBalance = 0; //使用红包金额
    // $scope.useTip = true;
    var vm = $scope.vm = {};
    vm.useTip = true;//是否使用红包

    //获取风控参数，获取方案信息
    X.loading.show();
    $q.all({
        trade: TradeService.getRiskStock(),
        info: StockService.getStockInfo(stockCode),
        scheme: TradeService.getHoldingScheme(),
        packet: PacketService.getPacketFundInfoData()
    }).then(function (res) {
        var infoData = res.info.data,
            tradeData = res.trade.data,
            schemeData = res.scheme.data,
            packetData = res.packet.data;
        if (schemeData.code == 100) {
            $scope.isLogin = true;
            $scope.scheme = schemeData.data;
            $scope.scheme.availableMoney = schemeData.data['availableMoney'];
            $scope.scheme.currentMarketValue = $scope.scheme.marketValue + $scope.scheme.suspendedValue;
        } else if (schemeData.code == 900) {
            $scope.isLogin = true;
            $scope.scheme = null;
        } else if (schemeData.code == 405) {
            $scope.isLogin = false;
            $scope.scheme = null;
        } else {
            X.tip(schemeData['resultMsg']);
        }

        if (tradeData.code == 100 && infoData.code == 100 && packetData.code == 100) {
            riskStocks = tradeData.data;
            /*红包*/
            $scope.tipBalance = packetData.data.tipBalance;
            if ($scope.tipBalance == 0) {
                vm.useTip = false;
            }


            confirmMineType();
            checkRiskStock();
            processStockInfoData(infoData.data[stockCode]);
            init();
            $scope.changeStockNum($scope.stockNumObj.curr);
        } else {
            if (tradeData.code != 100) {
                X.tip(tradeData['resultMsg']);
            } else if (infoData.code != 100) {
                X.tip(infoData['resultMsg']);
            } else if (packetData.code != 100) {
                X.tip(packetData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //股票买入数量
    $scope.changeStockNum = function (curr) {
        // var price = $scope.stock.price;
        curr = parseInt(curr / 100) * 100;
        if (isNaN(curr) || curr < 0) {
            curr = 0;
        }
        $scope.stockNumObj.curr = curr;
        $scope.stockNumObj.canMax = true;
        $scope.stockNumObj.canMin = true;

        if ($scope.stockNumObj.curr >= $scope.stockNumObj.max) {
            $scope.stockNumObj.curr = $scope.stockNumObj.max;
            $scope.stockNumObj.canMax = false;
        }

        if ($scope.stockNumObj.curr <= $scope.stockNumObj.min) {
            $scope.stockNumObj.curr = $scope.stockNumObj.min;
            $scope.stockNumObj.canMin = false;
        }

        var realPrice = $scope.stock.price * tradingCountRatio;
        // X.log(realPrice);
        if (realPrice > $scope.stock.limitUpPrice) {
            realPrice = $scope.stock.limitUpPrice;
        }

        $scope.totalStockMoney = Math.round(Math.floor(Math.round(realPrice * 10000) / 100) / 100 * $scope.stockNumObj.curr);


        /*$scope.totalStockMoney = Math.round($scope.stockNumObj.curr * price * 100) / 100;*/
        //占用金额：当前价*系数（乘积保留二位小数，抹小数）， 再乘以委托数量

        // X.log(realPrice,$scope.stock.limitUpPrice,$scope.totalStockMoney);

        var stockServiceUnit = $scope.totalStockMoney / 10000;
        if (stockServiceUnit < 1) {
            stockServiceUnit = 1;
        }

        $scope.serviceCharge = Math.floor(Math.round(stockServiceUnit * serviceCharge * 10000) / 100) / 100;
        // $scope.usTipBalance = Math.min($scope.serviceCharge, $scope.tipBalance);
    };


    //确认所选股票是否已经添加到自选，控制显示添加和删除
    function confirmMineType() {
        if (mineListStr == '') {
            $scope.mineType = 'add';
        } else {
            $scope.mineType = mineListStr.indexOf(stockCode) == -1 ? 'add' : 'delete';
        }
    }

    //判断是否是限制股
    function checkRiskStock() {
        for (var i = 0; i < riskStocks.length; i++) {
            var item = riskStocks[i];
            if (stockCode == item.stockCode) {
                $scope.isRiskStock = true;
                break;
            }
        }
    }

    //将数据绑定到页面scope,加载股票信息
    function processStockInfoData(data) {
        var newPrice = data.newPrice;
        var lastClosePrice = data.lastClosePrice;
        var isStop = isStopStock = (newPrice == 0);
        var style = '', dealNum = '', dealPrice = '';
        var diff = 0.00, rate = 0.00;
        if (!isStop) {
            diff = newPrice - lastClosePrice;
            rate = diff / lastClosePrice * 100;
            diff = diff.toFixed(2);
            rate = rate.toFixed(2);
            style = newPrice > lastClosePrice ? 'txt-red' : newPrice < lastClosePrice ? 'txt-green' : 'txt-white';
            dealNum = processNum(data, 'todayDealNum');
            dealPrice = processNum(data, 'todayDealPrice');
        }
        $scope.stock = {
            "stockLabel": data.stockLabel, //代码
            "stockName": data.stockName,//名称
            "price": parseInt(newPrice * 100) / 100,//当前价
            "lastClosePrice": lastClosePrice,//昨收
            isStop: isStop,
            diff: diff,//涨跌值
            rate: rate,//涨跌幅
            style: style,
            dealNum: dealNum,
            dealPrice: dealPrice,
            "openPrice": data.openPrice,//今开
            "highPrice": data.highPrice,//最高
            "lowPrice": data.lowPrice,//最低
            "limitDownPrice": parseFloat(data.limitDownPrice),//跌停
            "limitUpPrice": parseInt(data.limitUpPrice * 100) / 100,//涨停
            "amplitude": data.amplitude,//振幅
            "todayDealNum": data.todayDealNum,//成交量
            "todayDealPrice": data.todayDealPrice,//成交金额
            "buyPrice": isStop ? [0, 0, 0, 0, 0] : data.buyPrice,//买12345
            "buyNum": isStop ? [0, 0, 0, 0, 0] : data.buyNum,
            "sellPrice": isStop ? [0, 0, 0, 0, 0] : data.sellPrice,//卖12345
            "sellNum": isStop ? [0, 0, 0, 0, 0] : data.sellNum
        };

        /*var realPrice = $scope.stock.price * tradingCountRatio;
         if (realPrice > $scope.stock.limitUpPrice) {
         realPrice = $scope.stock.limitUpPrice;
         }

         $scope.totalStockMoney = Math.round(Math.floor(Math.round(realPrice * 10000) / 100) / 100 * $scope.stockNumObj.curr);*/
        // $scope.changeStockNum($scope.stockNumObj.curr);

        QUOTE_DATA = {
            commodityTitle: 'STOCK',
            contractNo: data.stockLabel,
            time: data['time'],
            openPrice: data['openPrice'],
            yesterdayPrice: data['lastClosePrice'],
            highPrice: data['highPrice'],
            lowPrice: data['lowPrice'],
            newPrice: data['newPrice'],
            limitDownPrice: X.toFloat(data['limitDownPrice']),
            limitUpPrice: X.toFloat(data['limitUpPrice'])
        };
    }

    //初始化获取股票实时信息，并将获取实时信息添加到定时器
    function init() {
        showLastDayTip();

        if ($scope.scheme != null) {
            //var num = Math.floor($scope.scheme.availableMoney / $scope.stock.limitUpPrice / 100) * 100;
            var tradingCount = Math.floor(Math.round($scope.stock.price * tradingCountRatio * 10000) / 100) / 100;
            var num = Math.floor($scope.scheme.availableMoney / tradingCount / 100) * 100;
            $scope.stockNumObj.max = num < 100 ? 100 : num > maxStockCount ? maxStockCount : num;
        }

        getStockInfo(true);
        X.engine.addTask(getStockInfo, 1000);
        X.engine.start();
    }

    function showLastDayTip() {
        if ($scope.scheme != null && $scope.scheme.availableDays < 3) {
            var schemeId = $scope.scheme.id, tipMsg = [], tipRecord = storage.getItem('SCHEME_LAST_DAY_TIP'), today = X.formatDate(new Date(), 'Y-M-D');
            var tipKey = '{{' + schemeId + ':' + today + '}}';
            if (tipRecord == null) {
                $scope.showSchemeLastDayTip = true;
                storage.setItem('SCHEME_LAST_DAY_TIP', tipKey);
            } else {
                tipMsg = tipRecord.split(';');
                if (tipMsg.indexOf(tipKey) == -1) {
                    $scope.showSchemeLastDayTip = true;
                    tipMsg.push(tipKey);
                    storage.setItem('SCHEME_LAST_DAY_TIP', tipMsg.join(';'));
                }
            }
        }
    }


    //获取股票信息
    function getStockInfo(flag) {
        X.log('行情定时器运行中。。。');
        //判断是否是在交易时间段内
        if (isTrade) {
            isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            if (isInTradeTime) {
                if ($scope.isRiskStock) {//风险股按钮控制
                    $scope.btn = {
                        className: 'disabled',
                        btnText: '提交',
                        disabled: true
                    };
                } else if (QUOTE_DATA && QUOTE_DATA['newPrice'] == 0) {//停牌股按钮控制
                    $scope.btn = {
                        className: 'disabled',
                        btnText: '提交',
                        disabled: true
                    };
                } else {
                    $scope.btn = {
                        className: 'orange',
                        btnText: '提交',
                        disabled: false
                    };
                }
            } else {
                $scope.btn = {
                    className: 'disabled',
                    btnText: '非点买时段',
                    disabled: true
                };
            }
        } else {
            isInTradeTime = false;
            $scope.btn = {
                className: 'disabled',
                btnText: '暂停交易',
                disabled: true
            };
        }

        var isInQuoteTime = SystemService.isInPeriod('STOCK', 'quote');

        if (!flag && !isInQuoteTime) {
            $scope.$apply();
        }

        //判断是否是在行情时间段内
        if (dataIsLoad && isInQuoteTime) {
            dataIsLoad = false;
            StockService.getStockInfo(stockCode).then(function (res) {
                dataIsLoad = true;
                var data = res.data;
                if (data.code == 100) {
                    processStockInfoData(data.data[stockCode]);
                } else {
                    X.tip(data['resultMsg']);
                }
            }).catch(function () {
                X.tip('服务器请求异常');
            });
        }
    }

    //解析数字格式
    function processNum(data, type) {
        var num = data[type], unit = type == 'todayDealNum' ? '手' : '元';
        if (num > 100000000) {
            return (num / 100000000).toFixed(2) + '亿' + unit;
        }
        if (num > 10000) {
            return (num / 10000).toFixed(2) + '万' + unit;
        }
        return num + unit;
    }

    //发起交易
    $scope.toTrade = function () {
        if (!isTrade) {
            X.dialog.alert('暂停交易');
            return false;
        }

        if (!SystemService.isInPeriod('STOCK', 'trade')) {
            X.dialog.alert('当前为非点买时段，无法发起策略');
            return false;
        }

        if (isStopStock) {
            X.dialog.alert('停牌股无法进行交易<br>请更换其他能够正常交易的股票');
            return false;
        }

        if (!$scope.isLogin) {
            $location.url('/login?goURL=/TDTradeBuy');
            return false;
        }

        if ($scope.isRiskStock) {
            X.dialog.alert('【' + $scope.stock.stockName + '】今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }
        var currPrice = $scope.stock['price'], closePrice = $scope.stock['lastClosePrice'];
        var diff = currPrice - closePrice, rote = (diff / closePrice * 100).toFixed(2);
        //风险股票
        if (rote > X.toFloat(priceRisk[1]) || rote < X.toFloat(priceRisk[0])) {
            X.dialog.alert('该股今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }

        if ($scope.scheme == null) {
            $location.url('/TDApply');
            return false;
        }

        if ($scope.stockNumObj.curr > maxStockCount) {
            X.dialog.alert('单股最高可购买数量为' + maxStockCount + '股');
            return false;
        }
        var needMoney = $scope.totalStockMoney;

        //红包
        if (vm.useTip) {
            $scope.usTipBalance = Math.min($scope.serviceCharge, $scope.tipBalance);
            // needMoney -= $scope.usTipBalance;
        }


        if ($scope.scheme.availableMoney < needMoney) {//方案余额不足
            X.dialog.alert('策略组余额不足，您可以到“个人中心-我的策略组”追加点买金额');
            return false;
        }

        if ($scope.scheme != null && $scope.scheme.availableDays == 0) {
            X.dialog.alert('您的T+D点买策略组即将到期，不允许买入');
            return false;
        }

        trade();

    };

    //交易发起
    function trade() {
        $scope.btn = {
            className: 'disabled',
            btnText: '数据处理中',
            disabled: true
        };

        X.loading.show();
        TradeService.strategyCreate($scope.scheme.id, $scope.totalStockMoney, $scope.serviceCharge, stockCode, $scope.stockNumObj.curr, vm.useTip).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('策略发起成功');
                //埋点：交易-A股
                zhuge.track("交易", {
                    "名称": "A股"
                });
                $location.path('/TDTradeSell');
            } else {
                X.tip(data['resultMsg']);
                $scope.btn = {
                    className: 'orange',
                    btnText: '提交',
                    disabled: false
                };
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    $scope.jumpToSG = function () {
        $location.url('/myStrategyGroup');
    };

    //controller卸载的时候清除定时器任务
    $scope.$on('$destroy', function () {
        X.engine.destroy();
    });
});
//T+D点卖
myControllers.controller('TDTradeSellCtrl', function ($scope, $sce, $q, $interval, TradeService, StockService, SystemService) {
    var timer, first = true, tradeData = null, marketData = null, quoteData = null, isOK = false, page = 1, pageSize = 10;
    var DYTip = false, DYData;
    $scope.tradeState = {
        1: '等待接单',
        2: '正在委托买入',
        3: '正在委托买入',
        4: '点卖',
        5: '正在委托卖出',
        6: '正在委托卖出',
        7: '正在清算',
        8: '已清算'
    };
    $scope.dataList = [];
    $scope.dataIsLoad = false;
    $scope.isInTradeTime = false;
    $scope.isInJJPeriod = true;
    $scope.isHoliday = true;
    $scope.todayStartTime = 0;
    $scope.showCondition = false;
    $scope.stockType = 'T+D';
    $scope.allGain = 0;
    $scope.currMarketMoney = 0;
    $scope.suspendStockArr = [];
    $scope.showRemainDays = false;
    $scope.quiLossMoney = 0;
    $scope.showNoData = false;
    $scope.showSellBtn = false;
    $scope.hold = null;
    $scope.stockTypes = {
        trade: 'T+1',
        TDTrade: 'T+D'
    };
    $scope.showMenu = false;

    X.loading.show();
    //      初始化交易数据
    $q.all({
        trade: TradeService.initTDTrade(),
        hold: TradeService.getHoldingScheme(),
        market: TradeService.getStrategyMarketValue(),
        DY: TradeService.getWaitPayDeferForRemind()
    }).then(function (res) {
        var tradeData = res.trade.data,
            holdData = res.hold.data,
            marData = res.market.data,
            DYData = res.DY.data;
        $scope.hold = holdData.data;
        X.loading.hide();
        if (tradeData.code == 100 && holdData.code == 100 && marData.code == 100 && DYData.code == 100) {
            var data = tradeData.data;
            marketData = marData.data;
            var strRisk = JSON.parse(data['strRisk']);
            var holiday = SystemService.parseHoliday(data['holidays']);
            var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
            //判断是否在交易时间
            SystemService.setCurrentTime(data['nowTime']);
            SystemService.setCurrentCurrencyType('CNY');
            SystemService.setHoliday(holiday);
            SystemService.setTradePeriod(tradeTime);
            var holidays = data['holidays'];
            var today = X.formatDate(data['nowTime'], 'Y-M-D');
            if (holidays.indexOf(today) == -1) {
                $scope.isHoliday = false;
            }
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            $scope.isInJJPeriod = SystemService.isInJJPeriod();
            $scope.leverRatio = holdData.data['leverRatio'];

            var marketArr = marketData.split(';');
            $scope.currentMarketMoney = holdData.data['marketValue'] + holdData.data['suspendedValue'];
            $scope.canUseMoney = holdData.data['availableMoney'];

            var allMoney = holdData.data.money, quitLossRatio = strRisk.quitLossRatio.value - 0, deferConditionRatio = strRisk.deferConditionRatio.value - 0;
            $scope.quiLossMoney = (allMoney * quitLossRatio / 100).toFixed(0);
            $scope.canDeferMoney = (allMoney * deferConditionRatio / 100).toFixed(0);
            $scope.currMoney = (marketArr[0] - 0) + (marketArr[1] - 0) + (marketArr[2] - 0);

            if (DYData.data != 0)DYTip = true;

            initTodayStartTime(data['nowTime']);
            startTimer();
        } else {
            $scope.canUseMoney = 0;
            $scope.showNoData = true;
            if (tradeData.code != 100) {
                X.tip(tradeData['resultMsg']);
            } else if (holdData.code != 100) {
                X.tip(holdData['resultMsg']);
            } else if (marData.code != 100) {
                X.tip(marData['resultMsg']);
            }
        }
    }).catch(function () {
        X.tip('服务器请求异常');
    });
    //展示悬浮窗
    $scope.showDeferCondition = function () {
        $scope.showCondition = !$scope.showCondition;
    };

    //初始化所有参数

    //点卖发起
    $scope.sale = function (trade) {
        var html = '<div class="mod-sale-confirm-wrap">';
        html += '<div class="item">股票名称:<span class="fr">' + trade.stockName + '</span></div>';
        html += '<div class="item">股票代码:<span class="fr">' + trade.stockCode.substr(-6) + '</span></div>';
        html += '<div class="item">委托价格:<span class="fr">市价</span></div>';
        html += '<div class="item">卖出数量:<span class="fr">' + trade.volumeHold + '股</span></div>';
        html += '<div class="item">持仓天数:<span class="fr">' + trade.holdDays + '天</span></div>';
        if (trade.profit > 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-red">+' + trade.profit.toFixed(2) + '元</span></div>';
        } else if (trade.profit < 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-green">' + trade.profit.toFixed(2) + '元</span></div>';
        } else {
            html += '<div class="item">浮动盈亏:<span class="fr">' + trade.profit.toFixed(2) + '元</span></div>';
        }

        html += '<div class="item"><label><input id="agreeDefer" type="checkbox" checked> 是否递延指令</label></div>';
        html += '<div class="txt-grey txt-s12">注：点卖指令可能因跌停导致无法成交，默认至下一个交易日挂单交易。浮动盈亏仅供参考，具体以实际成交为准。</div>';
        html += '</div>';
        X.dialog.confirm(html, {
            title: '点卖确认', notify: function (nt) {
                if (nt == 1) {
                    var agreeDefer = document.getElementById('agreeDefer');
                    sale(trade.id, agreeDefer.checked);
                }
            }
        })
    };

    //初始化今天的开始时间
    function initTodayStartTime(serverTime) {
        serverTime = serverTime || Date.now();
        var now = new Date(serverTime);
        var yyyy = now.getFullYear(), MM = now.getMonth(), dd = now.getDate();
        var today = new Date(yyyy, MM, dd, 0, 0, 0);
        $scope.todayStartTime = today.getTime();
    }

    //获取数据
    function getData() {
        var http;
        if (first) {//                  策略
            http = TradeService.TDGetSaleStrategy();
        } else {
            http = TradeService.TDGetSaleStrategyOfMemcache();
        }
        first = false;
        $q.all({
            trade: http
        }).then(function (res) {
            var traData = res.trade.data;
            X.loading.hide();
            if (traData.code == 100) {
                tradeData = traData.data;
                if (!tradeData.length)$scope.showNoData = true;
                var stocks = getNeedStocks(tradeData);

                if (stocks == '' || !stocks) {
                    $scope.dataList = [];
                    $scope.dataIsLoad = true;
                    return;
                }
                StockService.getStockInfo(stocks).then(function (res) {
                    var data = res.data;
                    if (data.code == 100) {
                        quoteData = data.data;
                        processData();
                    } else {
                        initNoDataQuote(tradeData);
                        // X.tip(data['resultMsg']);
                    }
                }).catch(function () {
                    X.tip('服务器请求异常');
                });
            } else {
                $scope.showNoData = true;
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    var total = 0;//持仓盈亏

    function processData() {
        $scope.dataIsLoad = true;
        isOK = true;
        if (tradeData == null || quoteData == null) {
            $scope.dataList = [];
            $scope.showNoData = true;
            return;
        }
        var dataList = tradeData;
        total = 0;
        dataList.forEach(function (item) {
            var quote = quoteData[item.stockCode];
            item.quotePrice = quote['newPrice'];
            item['lastClosePrice'] = quote.lastClosePrice;
            /*item['link'] = '#/agreementTDInvestor?tradeID=' + item.id;*/
            if (item.dealTime > $scope.todayStartTime) {
                item['showSellBtn'] = false;
            } else {
                item['showSellBtn'] = true;
            }
            if (item['buyPriceDeal'] != 0 && item.quotePrice != 0 && item['volumeHold'] != 0) {
                item.profit = (item.quotePrice - item['buyPriceDeal']) * item['volumeHold'];
                item.quotePrice = quote['newPrice'];
            } else {
                item.profit = (item.lastClosePrice - item['buyPriceDeal']) * item['volumeHold'];
            }
            if (item.status > 3) {
                total = total + item.profit;
            }
            item.dealTime = X.formatDate(item.dealTime, 'Y-M-D h:m:s')
        });
        $scope.allGain = total;
        $scope.dataList = dataList;
    }

    //点卖，T+D的点卖接口调用T+1的
    function sale(tradeID, isAlwaysClose) {
        if (!$scope.isInTradeTime) {
            X.tip('非交易时间不能交易');
            return;
        }
        X.loading.show();
        TradeService.closeStrategy(tradeID, isAlwaysClose).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                // window.location.reload();
                getData();
                X.tip('点卖策略成功');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //当没有行情时T+D
    function initNoDataQuote(data) {
        $scope.dataIsLoad = true;
        isOK = true;
        X.loading.hide();
        var dataList = data;
        $.each(dataList, function (i, item) {
            item.quotePrice = 0;
            item.lastClosePrice = 0;
            /*if (item['buyPriceDeal'] != 0 && item.quotePrice != 0 && item['volumeHold'] != 0) {
             item.profit = (item.quotePrice - item['buyPriceDeal']) * item['volumeHold'];
             } else {
             item.profit = 0;
             }*/

            item.profit = 0;

            if (item.status > 3) {
                total = total + item.profit;
            }
            item.dealTime = X.formatDate(item.dealTime, 'Y-M-D h:m:s')
        });
        $scope.allGain = total;
        $scope.dataList = dataList;
    }

    //买断
    $scope.showBuyOutMenu = false;
    $scope.showDBBG = false;
    $scope.buyOut = function (trade, type) {
        if (!trade || !type) {
            return;
        }

        if (DYTip && type == 2) {
            X.dialog.confirm('温馨提示：请您确认是否已经将今日递延<br/>费留在余额中等待扣款，如果继续操作可<br/>能会造成操盘中策略因递延费不足被平仓', {
                sureBtn: '确定', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            buyOutDialog(trade, type);
                        })
                    }
                }
            });
            return;
        }

        buyOutDialog(trade, type);
    };

    function buyOutDialog(trade, type) {
        $scope.currentTrade = trade;
        $scope.showDBBG = true;
        var holdStrategyMoney = trade.lastClosePrice * trade.volumeHold;
        var costMoney = trade.money;
        $scope.holdStrategyMoney = (parseInt(Math.round(holdStrategyMoney * 10000) / 100)) / 100;
        $scope.costMoney = (parseInt(Math.round(costMoney * 10000) / 100)) / 100;
        $scope.stockName = trade.stockName;
        if (type == 2) {
            $scope.paySum = $scope.costMoney;
            $scope.showBuyOutMenu = true;
        } else {
            $scope.paySum = (parseInt(Math.round(costMoney / ($scope.leverRatio + 1) * 10000) / 100)) / 100;
            $scope.showQuitType = true;
        }
    }

    //确认买断
    $scope.confirmBuyOrQuit = function (takeOverType) {
        X.loading.show();
        TradeService.takeOverStrategy($scope.currentTrade.id, takeOverType, $scope.paySum).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                if (takeOverType == 1) {
                    X.tip('放弃策略成功');
                } else {
                    X.tip('买断策略成功');
                }
            } else {
                X.tip(data['resultMsg']);
            }
            $scope.cancelOperate();
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //关闭操作弹窗
    $scope.cancelOperate = function () {
        $scope.showBuyOutMenu = false;
        $scope.showDBBG = false;
        $scope.showQuitType = false;
        $scope.showRemainDays = false;
    };


    //设置需要查询的点买股票
    function getNeedStocks(dataList) {
        var stocksObj = {}, stocks = '', arr = [];
        $.each(dataList, function (i, item) {
            stocksObj[item.stockCode] = item.stockCode;
        });
        for (var key in stocksObj) {
            arr.push(key);
        }
        if (arr.length > 0) {
            stocks = arr.join(',');
        }
        return stocks;
    }

    //部分成交提示
    $scope.showPartDeal = function (trade) {
        var list = trade.tradingRecordList, volumeDeal = trade.volumeHold;
        var table = '';
        table += '<table>';
        table += '<tr><td>成交时间</td><td>数量</td><td class="txt-right">价格</td></tr>';
        for (var i = 0; i < list.length; i++) {
            var obj = list[i];
            table += '<tr><td>' + X.formatDate(new Date(obj.time), 'Y-M-D') + '</td><td>' + obj.amount + '</td><td class="txt-right">' + obj.price.toFixed(2) + '</td></tr>';
            volumeDeal += obj.amount;
        }
        table += '</table>';
        var tipHtml = '<div class="info">行情波动过大，造成部分成交，原持有数量' + volumeDeal + '股，现剩余' + trade.volumeHold + '股，请处理剩余数量，以便结算！</div>';
        X.dialog.alert('<div class="mod-part-deal-wrap">' + tipHtml + table + '</div>');
    };

    //初始化定时器启动方法
    function startTimer() {
        isOK = true;
        getData();
        timer = $interval(function () {
            X.log('点卖定时器运行中。。。');
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            $scope.isInJJPeriod = SystemService.isInJJPeriod();
            // X.log(first, !$scope.isHoliday, $scope.isInTradeTime, isOK);
            if (first || (!$scope.isHoliday && $scope.isInTradeTime && isOK)) {
                isOK = false;
                getData();
            }
        }, 1000);
    }


    function clearTimer() {
        if (timer) {
            $interval.cancel(timer);
            timer = undefined;
        }
    }

    $scope.$on('$destroy', function () {
        clearTimer();
    });
});
//T+D结算
myControllers.controller('TDTradeResultCtrl', function ($scope, $location, SystemService, $interval, $q, TradeService) {
    $scope.settleList = [];
    $scope.currPage = 1;
    $scope.totalPage = 1;
    $scope.stockType = 'T+D';
    $scope.hold = null;
    /* $scope.backURL = '/TDTradeResult';*/
    $scope.stockTypes = {
        trade: 'T+1',
        TDTrade: 'T+D'
    };
    $scope.showMenu = false;
    var pageSize = 10;
    $scope.getSettleList = function (page) {
        X.loading.show();
        TradeService.TDGetSettleStrategyByPage(page, pageSize).then(function (res) {
            var settleData = res.data;
            if (settleData.code == 100) {
                X.loading.hide();
                var data = settleData.data;
                if (data) {
                    $scope.currPage = data['pageIndex'];
                    $scope.totalPage = data['totalPage'];
                    var list = data['dataList'];
                    if (page == 1) {
                        $scope.settleList = list;
                    } else {
                        $scope.settleList = $scope.settleList.concat(list);
                    }
                }
            } else {
                X.tip(settleData['resultMsg']);
            }
            getData();
        }).catch(function () {
            X.tip('服务器请求异常');
        })
    };

    function getData() {
        TradeService.getHoldingScheme().then(function (res) {
            var data = res.data;
            $scope.hold = data.data;
            if (data.code == 100) {
                if (data.data) {
                    var currMarketMoney = data.data['marketValue'];
                    var suspendedValue = data.data['suspendedValue'];
                    $scope.currentMarketMoney = currMarketMoney + suspendedValue;
                    $scope.canUseMoney = data.data['availableMoney'].toFixed(2);
                }
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    $scope.getSettleList($scope.currPage);

    $scope.toDetail = function (tradeID) {
        $location.url('/TDTradeDetail/' + tradeID);
    }
});
//T+D我的停牌股
myControllers.controller('SuspendStocksCtrl', function ($scope, $q, $location, $interval, StockService, TradeService, SystemService) {
    var timer, suspendData = null, tradeData = null, TDTradeData = null, newPrice = 0, quoteData = null;
    $scope.showNoData = false;
    $scope.isInTradeTime = false;
    $scope.isHoliday = true;
    $scope.TDIsHoliday = true;
    $scope.todayStartTime = 0;
    $scope.suspendList = [];
    //schemeId 为策略id，为0的时候是T+1的策略，大于0为T+D的策略

    $scope.tradeState = {
        1: '等待接单',
        2: '正在委托买入',
        3: '正在委托买入',
        4: '点卖',
        5: '正在委托卖出',
        6: '正在委托卖出',
        7: '正在清算',
        8: '已清算'
    };

    X.loading.show();
    //初始化交易数据
    $q.all({
        trade: TradeService.getInitTrade(),
        TDTrade: TradeService.initTDTrade()
    }).then(function (res) {
        var traData = res.trade.data, TDTraData = res.TDTrade.data;
        if (traData.code == 100 && TDTraData.code == 100) {
            tradeData = traData.data,
                TDTradeData = TDTraData.data;
            var strRisk = JSON.parse(tradeData['strRisk']),
                TDStrRisk = JSON.parse(TDTradeData['strRisk']);
            $scope.isHoliday = tradeData['isHoliday'];
            var holiday = SystemService.parseHoliday(tradeData['holidays']);
            var TDHoliDay = SystemService.parseHoliday(TDTradeData['holidays']);
            var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
            var TDTradeTime = SystemService.parsePeriod(TDStrRisk['tradingTimeLimit'].value);
            var TDHoliDays = TDTradeData['holidays'];
            //判断T+1是否在交易时间
            SystemService.setCurrentTime(tradeData['nowTime']);
            SystemService.setCurrentCurrencyType('CNY');
            SystemService.setHoliday(holiday);
            SystemService.setTradePeriod(tradeTime);

            //判断T+D是否在交易时段
            SystemService.setCurrentTime(TDTradeData['nowTime']);
            SystemService.setCurrentCurrencyType('CNY');
            SystemService.setHoliday(TDHoliDay);
            SystemService.setTradePeriod(TDTradeTime);

            var today = X.formatDate(TDTradeData['nowTime'], 'Y-M-D');
            if (TDHoliDays.indexOf(today) == -1) {
                $scope.TDIsHoliday = false;
            }
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');


            initTodayStartTime(tradeData['nowTime']);
            getSusList();
        } else {
            if (traData.code != 100) {
                X.tip(traData['resultMsg']);
            } else if (TDTraData.code != 100) {
                X.tip(TDTraData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //获取股票信息
    //  有最近价的股票数组         最新价股票字符串        有最新价的股票代码对象季  关联
    var hasNewPriceStocks = [], newPriceStocks = '', hasNewPriceCode = {}, ref = {}, stocks = '';

    function getSusList() {
        X.loading.show();

        TradeService.getTakeOverStrategy().then(function (res) {
            var susData = res.data;
            if (susData.code == 100) {
                suspendData = susData.data;
                if (suspendData) {
                    stocks = getNeedStocks(suspendData);
                    if (stocks == '') {
                        $scope.suspendList = [];
                        return;
                    }
                    var dataList = suspendData, stocksArr = stocks.split(',');
                    stocksArr.forEach(function (stock) {
                        ref[stock] = [];
                        dataList.forEach(function (item) {
                            if (item.stockCode == stock) {
                                ref[stock].push(dataList.indexOf(item));
                            }
                        });
                    });
                } else {
                    $scope.showNoData = true;
                    return;
                }
                getStockInfo();
                X.loading.hide();
            } else {
                X.tip(susData['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常')
        });
    }

    function getStockInfo() {
        X.loading.show();
        StockService.getStockInfo(stocks).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                quoteData = data.data;
                if (suspendData == null) {
                    $scope.suspendList = [];
                    return;
                }

                //9点到9点15的时候行情接口返回的data为null
                suspendData.forEach(function (item) {
                    if (quoteData == null) {
                        item['quotePrice'] = 0;
                        item['lastClosePrice'] = 0;
                    } else {
                        var quote = quoteData[item.stockCode];
                        //防止newPrice等值不存在的情况
                        item['quotePrice'] = quote['newPrice'] || 0;
                        item['lastClosePrice'] = quote['lastClosePrice'] || 0;
                    }
                    item['holdMarketSum'] = item['quotePrice'] * item['volumeHold'];
                    item['profit'] = (item['quotePrice'] - item['buyPriceDeal']) * item['volumeHold'];
                    if (item['quotePrice'] != 0) {
                        hasNewPriceCode[item.stockCode] = item.stockCode;
                    } else {
                        item['holdMarketSum'] = item['lastClosePrice'] * item['volumeHold'];
                    }
                });

                if (hasNewPriceCode != {}) {
                    for (var key in hasNewPriceCode) {
                        hasNewPriceStocks.push(key);
                    }

                    if (hasNewPriceStocks.length > 0) {
                        newPriceStocks = hasNewPriceStocks.join(',')
                    }
                } else {
                    return;
                }
                startTimer();

                $scope.suspendList = suspendData;
            } else {
                initNoDataQuote(suspendData);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常')
        });
    }

    //停牌股可点卖股票无行情时
    function initNoDataQuote(data) {
        $scope.dataIsLoad = true;
        X.loading.hide();
        var dataList = data;
        $.each(dataList, function (i, item) {
            item['quotePrice'] = 0;
            item['holdMarketSum'] = 0;
            item['lastClosePrice'] = 0;
        });
        $scope.suspendList = dataList;
    }


    //获得有最新价的股票信息-->用于定时器
    function getNewPriceStockInfo() {
        var dataList = suspendData;
        if (newPriceStocks != '') {
            StockService.getStockInfo(newPriceStocks).then(function (res) {
                var data = res.data;
                if (data.code == 100) {
                    var quoteData = data.data;
                    if (ref != {}) {
                        for (var key in ref) {
                            var quote = quoteData[key];
                            if (quote) {
                                if (quote['stockLabel'] == key) {
                                    ref[key].forEach(function (index) {
                                        dataList[index].quotePrice = quote['newPrice'];
                                        dataList[index].holdMarketSum = quote['newPrice'] * dataList[index]['volumeHold'];
                                    });
                                }
                            }
                        }
                        $scope.suspendList = dataList;
                    }
                } else {
                    X.tip(data['resultMsg']);
                }
            }).catch(function () {
                    X.tip('服务器请求异常')
                }
            )
        }
    }


    //取得所有要查询的股票code
    function getNeedStocks(suspendData) {
        var stocks = '', stocksObj = {}, arr = [];
        suspendData.forEach(function (item) {
            stocksObj[item.stockCode] = item.stockCode;
        });
        for (var key in stocksObj) {
            arr.push(key);
        }
        if (arr.length > 0) {
            stocks = arr.join(',')
        }
        return stocks;
    }

    //点卖弹窗
    $scope.sale = function (trade) {
        var html = '<div class="mod-sale-confirm-wrap">';
        html += '<div class="item">股票名称:<span class="fr">' + trade.stockName + '</span></div>';
        html += '<div class="item">股票代码:<span class="fr">' + trade.stockCode.substr(-6) + '</span></div>';
        html += '<div class="item">委托价格:<span class="fr">市价</span></div>';
        html += '<div class="item">卖出数量:<span class="fr">' + trade.volumeHold + '股</span></div>';
        html += '<div class="item">持仓天数:<span class="fr">' + trade.holdDays + '天</span></div>';
        if (trade.profit > 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-red">+' + trade.profit.toFixed(2) + '元</span></div>';
        } else if (trade.profit < 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-green">' + trade.profit.toFixed(2) + '元</span></div>';
        } else {
            html += '<div class="item">浮动盈亏:<span class="fr">' + trade.profit.toFixed(2) + '元</span></div>';
        }

        html += '<div class="item"><label><input id="agreeDefer" type="checkbox" checked> 是否递延指令</label></div>';
        html += '<div class="txt-grey txt-s12">注：点卖指令可能因跌停导致无法成交，默认至下一个交易日挂单交易。浮动盈亏仅供参考，具体以实际成交为准。</div>';
        html += '</div>';
        X.dialog.confirm(html, {
            title: '点卖确认', notify: function (nt) {
                getSusList();
                if (nt == 1) {
                    var agreeDefer = document.getElementById('agreeDefer');
                    sale(trade.id, agreeDefer.checked);
                }
            }
        })
    };

    //确认点卖
    function sale(tradeID, isAlwaysClose) {
        if (!$scope.isInTradeTime) {
            X.tip('非交易时间不能交易');
            return;
        }
        X.loading.show();
        TradeService.closeStrategy(tradeID, isAlwaysClose).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('点卖策略成功');
                window.location.reload();
                /* clearTimer();
                 X.engine.destroy();
                 getSusList();*/
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //部分成交提示
    $scope.showPartDeal = function (trade) {
        var list = trade.tradingRecordList, volumeDeal = trade.volumeHold;
        var table = '';
        table += '<table>';
        table += '<tr><td>成交时间</td><td>数量</td><td class="txt-right">价格</td></tr>';
        for (var i = 0; i < list.length; i++) {
            var obj = list[i];
            table += '<tr><td>' + X.formatDate(new Date(obj.time), 'Y-M-D') + '</td><td>' + obj.amount + '</td><td class="txt-right">' + obj.price.toFixed(2) + '</td></tr>';
            volumeDeal += obj.amount;
        }
        table += '</table>';
        var tipHtml = '<div class="info">行情波动过大，造成部分成交，原持有数量' + volumeDeal + '股，现剩余' + trade.volumeHold + '股，请处理剩余数量，以便结算！</div>';
        X.dialog.alert('<div class="mod-part-deal-wrap">' + tipHtml + table + '</div>');
    };

    //刷新按钮
    $scope.reFresh = function () {
        window.location.reload();
    };

    $scope.toDetail = function (item) {
        if (item.status != 8) {
            return;
        } else {
            $location.url('/suspendDetail/' + item.id + '?schemeId=' + item.schemeId);
        }
    };

    //初始化今天的开始时间
    function initTodayStartTime(serverTime) {
        serverTime = serverTime || Date.now();
        var now = new Date(serverTime);
        var yyyy = now.getFullYear(), MM = now.getMonth(), dd = now.getDate();
        var today = new Date(yyyy, MM, dd, 0, 0, 0);
        $scope.todayStartTime = today.getTime();
    }

    //定时器
    function startTimer() {
        getNewPriceStockInfo();
        timer = $interval(function () {
            X.log('点卖定时器运行中。。。');
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');

            if (!$scope.isHoliday && $scope.isInTradeTime) {
                getNewPriceStockInfo();
            }
        }, 1000);
    }


    function clearTimer() {
        if (timer) {
            $interval.cancel(timer);
            timer = undefined;
        }
    }

    $scope.$on('$destroy', function () {
        clearTimer();
        X.engine.destroy();
    });
});
//策略详情 DONE
myControllers.controller('TradeDetailCtrl', function ($scope, $q, $routeParams, $location, TradeService) {
    var tradeId = $routeParams['tradeId'];
    $scope.schemeId = $location.search()['schemeId'];
    $scope.sort = $location.search()['sort']
    /*$scope.backURL = $location.search()['backURL'];*/
    if (!/^\d+$/.test(tradeId)) {
        $location.path('/index');
        return;
    }

    $scope.trade = {};

    X.loading.show();
    $q.all({tradeInfo: TradeService.getSettleStrategyById(tradeId)}).then(function (res) {
        var tradeInfoData = res.tradeInfo.data;
        if (tradeInfoData.code == 100) {
            $scope.trade = tradeInfoData.data;
        } else {
            X.tip(tradeInfoData['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

});
//协议签署 DONE
myControllers.controller('AgreementSignedCtrl', function ($scope, $location, UserService) {
    var storage = window.localStorage, stockCode = storage.getItem('STOCKCODE') || '';
    var goURL = $location.search()['goURL'];
    $scope.goURL = '/trade';
    if (stockCode && stockCode != '') {
        $scope.goURL = '/tradeBuy/' + stockCode;
    }
    if (goURL && goURL != '') {
        $scope.goURL = goURL;
    }
    //签署协议
    $scope.singAgreement = function () {
        var agree = document.getElementById('agreement');
        if (!agree.checked) {//若用户没有选择  同意协议
            X.tip('请先同意签署相关协议');
            return false;
        }
        X.loading.show();
        UserService.signAgreement().then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $location.url($scope.goURL);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };
});
//合作协议 DONE
myControllers.controller('AgreementInvestorCtrl', function ($scope, $q, $location, TradeService) {
    /*$scope.backURL = function () {
     history.back();
     };*/
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
    var tradeID = $location.search()['tradeID'];
    $scope.schemeId = $location.search()['schemeId'];

    $scope.tradeInfo = null;
    //
    function init() {
        if (!tradeID)return;
        X.loading.show();
        TradeService.getAgreementStrategyById(tradeID).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.tradeInfo = data.data;
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    init();
});
//交易协议 DONE
myControllers.controller('AgreementTradeCtrl', function ($scope, $location) {
    /*$scope.backURL = $location.search()['backURL'] || '/agreementSigned';*/
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
});
//资费协议 DONE
myControllers.controller('AgreementSaletorCtrl', function ($scope, $location) {
    /*$scope.backURL = $location.search()['backURL'] || '/agreementSigned';*/
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
});
//注册协议 DONE
myControllers.controller('AgreementRegister', function ($scope, $location) {
    /*$scope.backURL = $location.search()['backURL'] || '/register1';*/
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
});
//自选 DONE
myControllers.controller('MineCtrl', function ($scope, $q, $location, $interval, TradeService, StockService, SystemService) {
    var MINELIST = 'MINELIST', STOCKCODE = 'STOCKCODE', storage = window.localStorage;
    var mineListStr = storage.getItem(MINELIST) || '',//自选本地记录
        timer,//定时器
        stockCodes = [], //自选股票代码数组，默认有上证，深证，创业板
        isInQuoteTime = false,//是否在股票时间
        isHoliday = true,//节假日
        dataIsLoaded = true;//数据加载
    $scope.mineList = [];//自选列表
    $scope.defaultList = [];//
    $scope.dataLoaded = false;//是否已加载

    X.loading.show();
    $q.all({tradeInit: TradeService.getInitTrade()}).then(function (res) {
        var tradeInitData = res.tradeInit.data;
        if (tradeInitData.code == 100) {
            var initData = tradeInitData.data;
            isHoliday = initData['isHoliday'];
            SystemService.setCurrentTime(initData['nowTime']);
            process();
        } else {
            X.tip(tradeInitData['resultMsg']);
        }
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //确定结果
    $scope.sureStock = function (stockCode) {
        storage.setItem(STOCKCODE, stockCode);
        $location.url('/trade?backURL=/mine');
    };

    //解析自选
    function process() {
        stockCodes = ['SH000001', 'SZ399001', 'SZ399006'];
        var mineArr = mineListStr && mineListStr != '' ? mineListStr.split(';') : [];
        $.each(mineArr, function (i, item) {
            var itemArr = item.split(',');
            stockCodes.push(itemArr[0]);
        });

        query();
    }

    //查询方法
    function query() {
        getStockInfo();
        timer = $interval(function () {
            X.log('自选定时器运行中。。。');
            isInQuoteTime = SystemService.isInPeriod('STOCK', 'quote');
            if (!isHoliday && isInQuoteTime && dataIsLoaded) {
                dataIsLoaded = false;
                getStockInfo();
            }
        }, 1000);
    }

    //清空轮询任务
    function clearTimer() {
        if (timer) {
            $interval.cancel(timer);
        }
    }

    //获取股票信息
    function getStockInfo() {
        StockService.getStockInfo(stockCodes.join(',')).then(function (res) {
            dataIsLoaded = true;
            var infoData = res.data;
            if (infoData.code == 100) {
                processStockInfoData(infoData.data);
            } else {
                X.tip(infoData['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            dataIsLoaded = true;
            X.tip('服务器请求异常');
        });
    }

    //组装展示数据
    function processStockInfoData(data) {
        $scope.dataLoaded = true;
        //组装新数据前先清空原来数据
        $scope.mineList = [];
        $scope.defaultList = [];
        var dataList = [];
        $.each(stockCodes, function (i, item) {
            var obj = data[item], stockObj = {};
            //如果本地自选股票下架，将查询不到股票的相关信息，此处直接跳过
            if (!obj) {
                return;
            }
            stockObj['stockCode'] = obj['stockLabel'];
            stockObj['stockName'] = obj['stockName'];
            stockObj['stockClass'] = obj['stockLabel'].substr(0, 2);

            var lastClosePrice = obj['lastClosePrice'], price = obj['newPrice'];
            var diff = price - lastClosePrice,
                rote = (diff / lastClosePrice * 100);
            stockObj['closePrice'] = lastClosePrice.toFixed(2);
            stockObj['price'] = price.toFixed(2);
            stockObj['rote'] = rote.toFixed(2);
            stockObj['diff'] = diff.toFixed(2);
            dataList.push(stockObj);
        });

        $scope.mineList = dataList.splice(3);//切割后的数组
        $scope.defaultList = dataList;//完成数据数组
    }

    //controller卸载的时候清除定时器任务
    $scope.$on('$destroy', function () {
        clearTimer();
    });

});
//自选查询 DONE
myControllers.controller('MineSearchCtrl', function ($q, $scope, $location, dateFilter, StockService, SystemService, TradeService) {
    var storage = window.localStorage, STOCKLIST = 'STOCKLIST', STOCKCODE = 'STOCKCODE', STOCKHISTORY = 'STOCKHISTORY', MINELIST = 'MINELIST';
    //自选记录
    var mineList = [];
    //风险股数组             是否为风险股
    var riskStocks = [], isRiskStock = false;
    var serverTime = SystemService.getCurrentTime(),//获取服务器时间，保证数据正确。
        today = dateFilter(serverTime || Date.now(), 'yyyy-MM-dd'),//取到今天的日期
        timeFlag = new Date(today + ' 09:20:00').getTime();//时间戳，为时候加载新数据，重新请求的标示
    //  所有股票 的数据                                           历史记录                                     股票对象        格式化后的股票数组
    var stockListString = storage.getItem(STOCKLIST) || '', history = storage.getItem(STOCKHISTORY) || '', stockListObj, stockList;
    $scope.goURL = $location.search()['goURL'] || '/mine';
    $scope.stockList = [];//搜索时的下拉菜单中显示的股票列表(最多10条记录);
    $scope.stockCode = '';//输入的股票代码
    $scope.stockHistoryList = [];//历史记录的股票列表
    //查询股票
    $scope.searchStock = function () {
        search($scope.stockCode);
    };
    //添加或者删除自选stockList为当前操作的数组    股票列表    index
    $scope.addOrDelMine = function (stockList, index) {
        var stock = stockList[index];//当前股票
        var stockCode = stock['code'], stockName = stock['name'];//股票code/name
        var maxLen = 20;//自选最多允许添加的条数
        //当自选记录中没有要添加的该股票或者自选记录为空时：
        if (mineList.length == 0 || mineList.indexOf(stockCode + ',' + stockName) == -1) {//是否有必要判断mine.length == 0?? ---------  length为0直接存，不需在便利查询是否存在，为性能考虑;
            if (mineList.length >= maxLen) {
                X.dialog.alert('自选最多添加' + maxLen + '条记录');
                return;
            }
            mineList.push(stockCode + ',' + stockName);//添加到自选记录中
            storage.setItem(MINELIST, mineList.join(';'));//设置到本地自选记录缓存中
            stock['type'] = 'delete';
            X.tip('已添加');
        } else {
            for (var i = 0; i < mineList.length; i++) {
                if (mineList[i].indexOf(stockCode) != -1) {
                    mineList.splice(i, 1);
                }
            }
            storage.setItem(MINELIST, mineList.join(';'));
            stock['type'] = 'add';
            X.tip('已删除');
        }
    };

    //确定结果（点击下面菜单中的某一个股票时的操作）
    $scope.sureStock = function (stockCode, stockName, pinyin) {
        addHistory(stockCode, stockName, pinyin);
        storage.setItem(STOCKCODE, stockCode);//设置到当前股票code缓存中
        if ($scope.goURL == '/TDTrade') {
            $location.url('/TDTrade');
        } else if ($scope.goURL == '/oneYuanTrade') {
            $location.url('/oneYuanTrade');
        } else if ($scope.goURL == '/simulateTrade') {
            $location.url('/simulateTrade');
        } else {
            $location.url('/trade');
        }
    };

    //清空文本框内容（点击输入框的x号时）
    $scope.clear = function () {
        $scope.stockCode = '';//输入框为空
        $scope.stockList = [];//下面显示的股票菜单为空
    };

    //清空搜索历史
    $scope.clearHistory = function () {
        X.dialog.confirm('确认要清空历史记录么？', {
            notify: function (nt) {
                if (nt == 1) {//点击确认时
                    storage.removeItem(STOCKHISTORY);
                    history = '';
                    $scope.$apply(function () {
                        $scope.stockHistoryList = [];
                    });
                }
            }
        });
    };

    //返回
    $scope.back = function () {
        $location.url($scope.goURL);
    };

    //股票数据初始化
    function initStock() {
        if (stockListString) {
            stockListObj = JSON.parse(stockListString);
            var lastTime = X.toInt(stockListObj['version']);//version是刷新时服务器时间，也是版本
            //   时间已经过了今天更新时间而本地版本没到更新时间         或者 今天未到更新时间但是本地数据已经超过24小时
            if ((serverTime >= timeFlag && lastTime < timeFlag) || (serverTime < timeFlag && (timeFlag - lastTime) > (24 * 3600 * 1000))) {
                getAllStockList();
            } else {
                stockList = parseStockListStr(stockListObj['stocks']);
            }
        } else {
            getAllStockList();
        }
        initHistory();
    }

    //初始化风险股和自选股数据
    function init() {
        getRiskStock();//获取风险股列表
        processMineList();//初始化自选股数据
    }

    //初始化自选股数据
    function processMineList() {
        var mineListStr = storage.getItem(MINELIST) || '';//从本地缓存拿数据，没有则为''
        if (mineListStr) {
            mineList = mineListStr.split(';');//将本地缓存的自选股数据切割为数组
        }
    }

    //获取限制股票
    function getRiskStock() {
        X.loading.show();
        TradeService.getRiskStock().then(function (res) {
            if (res.data.code == 100) {
                riskStocks = res.data.data;
                initStock();
            } else {
                X.tip(res.data['resultMsg'])
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常')
        });
    }


    //判断是否是限制股
    function checkRiskStock(stockCode) {
        for (var i = 0; i < riskStocks.length; i++) {
            var item = riskStocks[i];
            if (stockCode == item.stockCode) {
                return true;
            }
        }
        return false;
    }

    //加载历史记录，最多20条
    function initHistory() {
        if (history == '')return;
        //得到历史数据列表
        var historyList = history.split(';'), stockHistoryList = [];
        $.each(historyList, function (i, item) {
            if (item) {
                isRiskStock = false;
                var itemArr = item.split(',');

                var obj = {
                    code: itemArr[0],
                    name: itemArr[1],
                    pinyin: itemArr[2],
                    isRisk: checkRiskStock(itemArr[0]),
                    type: confirmType(itemArr[0])
                };
                stockHistoryList.push(obj);
            }
        });
        $scope.stockHistoryList = stockHistoryList;
    }

    //判断该股票代码是否存在于自选
    function confirmType(stockCode) {
        if (!mineList.length)return 'add';
        var i, mineItem;
        //这里必须要用for循环，用forEach的话会产生作用域的问题，导致return的结果无法被其他变量接收到。
        for (i = 0; i < mineList.length; i++) {
            mineItem = mineList[i];
            if (mineItem.indexOf(stockCode) != -1) {
                return 'delete';
            }
        }
        return 'add';
    }

    //添加历史记录
    function addHistory(stockCode, stockName, pinyin) {
        var currStock = stockCode + ',' + stockName + ',' + pinyin;
        if (history == '') {
            storage.setItem(STOCKHISTORY, currStock);
        } else {
            var historyList = history.split(';'), findStock;
            for (var i = 0; i < historyList.length; i++) {
                var item = historyList[i];
                if (item == currStock) {
                    findStock = historyList.splice(i, 1);
                    i--;
                }
            }
            if (findStock) {
                historyList.unshift(findStock);
            } else {
                historyList.unshift(currStock);
            }
            //取最新20条
            if (historyList.length > 20) {
                historyList.splice(20);
            }
            storage.setItem(STOCKHISTORY, historyList.join(';'));
        }
    }

    //解析股票信息
    function parseStockListStr(stockListString) {
        var result = [], arr, itemArr;
        if (stockListString) {
            arr = stockListString.split(';');
            $.each(arr, function (i, item) {
                if (item) {
                    isRiskStock = false;
                    itemArr = item.split(',');
                    var obj = {
                        code: itemArr[0],
                        name: itemArr[1],
                        pinyin: itemArr[2],
                        isRisk: checkRiskStock(itemArr[0])
                    };
                    result.push(obj);
                }
            });
        }
        return result;
    }

    //获取所有股票并缓存本地
    function getAllStockList() {
        X.loading.show();
        StockService.getAllStockList().then(function (res) {
            var stockData = res.data;
            //如果获取不到服务器数据则继续使用本地缓存
            if (!stockData) {
                X.tip('服务器请求异常');
                return;
            }
            if (stockData.code == 100) {
                stockListObj = stockData.data;
                stockList = parseStockListStr(stockListObj['stocks']);
                storage.setItem(STOCKLIST, JSON.stringify(stockListObj));
            } else {
                X.tip(stockData['returnMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //确认查询类别
    function search(v) {
        var prop = '';
        if (/^[\d]*$/g.test(v)) {
            prop = 'code';
        } else if (/^[a-zA-Z]*$/g.test(v)) {
            prop = 'pinyin';
            v = v.toUpperCase();
        } else {
            prop = 'name';
        }
        process(v, prop);
    }

    //组装查询结果
    function process(val, prop) {
        //每次查询清空原来的查询记录
        $scope.stockList = [];
        if (val == '' || prop == '') {
            return;
        }
        var i, len = 10;
        for (i = 0; i < stockList.length; i++) {
            if ($scope.stockList.length >= len) {
                break;
            }
            var stock = stockList[i];
            if (stock[prop].indexOf(val) != -1) {
                stock['type'] = confirmType(stock['code']);
                $scope.stockList.push(stock);
            }
        }
    }

    init();
});
//自选修改 DONE
myControllers.controller('MineModifyCtrl', function ($scope) {
    var MINELIST = 'MINELIST', storage = window.localStorage;

    $scope.deleteArr = [];
    $scope.mineList = [];
    //删除
    $scope.delete = function () {
        var hasChecked = false, tempDeleteArr = [], tempMineList = [];
        for (var i in $scope.deleteArr) {
            if ($scope.deleteArr[i] == 'check') {
                hasChecked = true;
                break;
            }
        }

        if (!hasChecked) {
            X.tip('请至少选择一条记录');
            return;
        }

        X.dialog.confirm('确定要删除吗？', {
            notify: function (nt) {
                if (nt == 1) {
                    for (var i in $scope.deleteArr) {
                        if ($scope.deleteArr[i] == 'uncheck') {
                            tempDeleteArr.push('uncheck');
                            tempMineList.push($scope.mineList[i]);
                        }
                    }
                    $scope.$apply(function () {
                        $scope.deleteArr = tempDeleteArr;
                        $scope.mineList = tempMineList;
                        save();
                    });
                }
            }
        });
    };
    //置顶
    $scope.up = function (index) {
        index = index || 0;
        if ($scope.mineList.length < 1 || index == 0 || index > ($scope.mineList.length - 1)) {
            return;
        }
        var temp = $scope.mineList.splice(index, 1)[0];
        $scope.mineList.unshift(temp);
        save();
    };

    //复选
    $scope.check = function (index) {
        $scope.deleteArr[index] = $scope.deleteArr[index] == 'uncheck' ? 'check' : 'uncheck';
    };

    //解析自选
    function process() {
        var mineListStr = storage.getItem(MINELIST) || '';
        if (mineListStr == '')return;
        $scope.mineList = [];
        $scope.deleteArr = [];
        var mineArr = mineListStr.split(';');
        $.each(mineArr, function (i, item) {
            var itemArr = item.split(',');
            $scope.mineList.push({
                stockCode: itemArr[0],
                stockName: itemArr[1]
            });
            $scope.deleteArr.push('uncheck');
        });
    }

    //保存
    function save() {
        var arr = [];
        for (var i = 0; i < $scope.mineList.length; i++) {
            var item = $scope.mineList[i];
            if (item) {
                arr.push(item.stockCode + ',' + item.stockName);
            }
        }
        storage.setItem(MINELIST, arr.join(';'));
    }

    //初始化加载
    process();
});
//资金明细 DONE
myControllers.controller('FundCtrl', function ($scope, $q, $location, PayService) {
    var pageSize = 10;
    $scope.currType = $location.search()['type'] || 'all';//当前类别
    $scope.currFund = 0;//当前选择ID
    $scope.currPage = 1;//当前页
    $scope.totalPage = 1;//总页数
    //类别列表
    $scope.fundTypeList = {
        all: {
            value: 'chargeWithdraw',
            text: '全部',
            explain: 'all'
        },
        charge: {
            value: 'chargeWithdraw',
            text: '充值',
            explain: 'income'
        },
        withdraw: {
            value: 'chargeWithdraw',
            text: '提现',
            explain: 'outcome'
        },
        income: {
            value: 'loan',
            text: '收入',
            explain: 'income'
        },
        outcome: {
            value: 'loan',
            text: '支出',
            explain: 'outcome'
        }
    };

    //数据列表
    $scope.fundList = [];

    //根据条件获取数据列表
    $scope.getFundDetailList = function (action, explain, page) {
        var isNotTypeChanged = false;
        action = action || '';
        page = page || 1;

        if (action == $scope.fundTypeList[$scope.currType].value && explain == $scope.fundTypeList[$scope.currType].explain) {
            isNotTypeChanged = true;
        }

        X.loading.show();
        if (explain == 'all') {
            PayService.getFundAll(action, page, pageSize).then(function (res) {
                var data = res.data;
                if (data.code == 100) {
                    var list = data.data['items'];
                    $scope.currPage = data.data['pageIndex'];//当前页
                    $scope.totalPage = data.data['totalPage'];//总页数
                    if (isNotTypeChanged && page != 1) {
                        $scope.fundList = $scope.fundList.concat(list);
                    } else {
                        $scope.fundList = list;
                    }
                } else {
                    X.tip(data['resultMsg']);
                }
                X.loading.hide();
            }).catch(function () {
                X.tip('服务器请求异常');
            });
        } else {
            PayService.getFundDetail(action, explain, page, pageSize).then(function (res) {
                var data = res.data;
                if (data.code == 100) {
                    var list = data.data['items'];
                    $scope.currPage = data.data['pageIndex'];//当前页
                    $scope.totalPage = data.data['totalPage'];//总页数
                    if (isNotTypeChanged && page != 1) {
                        $scope.fundList = $scope.fundList.concat(list);
                    } else {
                        $scope.fundList = list;
                    }
                } else {
                    X.tip(data['resultMsg']);
                }
                X.loading.hide();
            }).catch(function () {
                X.tip('服务器请求异常');
            });
        }
    };

    //确认选择类别
    $scope.confirmFundType = function (currType, page) {
        page = page || 1;
        var type = $scope.fundTypeList[currType].value;
        var explain = $scope.fundTypeList[currType].explain;

        $scope.currType = currType;
        $scope.showTypeDialog = false;
        $scope.getFundDetailList(type, explain, page);
    };

    //显示当前选择的明细详情
    $scope.showCurrFundDetail = function (fundId) {
        if ($scope.currFund == fundId) {
            $scope.currFund = 0;
        } else {
            $scope.currFund = fundId;
        }
    };

    //取消提现
    $scope.cancelWithdraw = function (fundId) {
        X.dialog.confirm('取消提现后金额自动退还到账户余额', {
            notify: function (nt) {
                if (nt == 1) {
                    /*$scope.$apply(function () {
                     cancel(fundId);
                     });*/
                    cancel(fundId);
                }
            }
        })
    };

    function cancel(id) {
        X.loading.show();
        PayService.cancelWithdraw(id).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                var withDraw = $scope.fundTypeList['withdraw'];
                $scope.getFundDetailList(withDraw['value'], withDraw['explain']);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //初始化加载数据列表
    $scope.confirmFundType($scope.currType, $scope.currPage);
});
//充值方式 DONE
myControllers.controller('PayTypeCtrl', function ($scope, $q, $location) {
    $scope.goURL = $location.search()['goURL'] || '/myHome';
});
//充值银行卡 DONE
myControllers.controller('PayBankCtrl', function ($scope, $interval, $q, $location, UserService, PayService) {
    var payForm = document.getElementById('payForm');
    /*$scope.backURL = $location.search()['backURL'] || '/fund';*/
    $scope.balance = 0;
    $scope.userInfo = {};
    $scope.money = '';//充值金额
    var timer = null;
    $scope.btnState = 'disable';


    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            if ($scope.money == '' || $scope.money < 100) {
                $scope.btnState = 'disable';
            } else {
                $scope.btnState = 'orange';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();

    X.loading.show();
    $q.all({
        userInfo: UserService.getUserInfo(),
        balance: UserService.getBalance()
    }).then(function (res) {
        var userInfoData = res.userInfo.data;
        var balanceData = res.balance.data;

        if (userInfoData.code == 100 && balanceData.code == 100) {
            $scope.balance = balanceData.data.balance;
            $scope.userInfo = userInfoData.data;
            if (!$scope.userInfo.named) {
                toIdenty();
            } else {
                $scope.userInfo.maskName = X.maskName($scope.userInfo.name);
            }
        } else {
            if (userInfoData.code != 100) {
                X.tip(userInfoData['resultMsg']);
            } else if (balanceData.code != 100) {
                X.tip(balanceData['resultMsg']);
            }
        }
        payForm.removeAttribute('action');
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //跳转到联动的接口
    $scope.pay = function () {
        if (!$scope.userInfo.named) {
            toIdenty();
            return;
        }
        // if ($scope.bankCode == '') {
        //     X.tip('请选择充值银行');
        //     return;
        // }
        // if ($scope.cardNo == '') {
        //     X.tip('请输入银行卡号');
        //     return;
        // }
        // if (!X.isBankCard($scope.cardNo)) {
        //     X.tip('银行卡号不符合规范');
        //     return;
        // }
        /*if ($scope.money == '') {
         X.tip('请输入充值金额');
         return;
         }*/

        if ($scope.money == '')return;

        if (!X.isMoney($scope.money, true)) {
            X.tip('充值金额输入错误');
            return;
        }

        //最低100元，测试后添加
        if ($scope.money < 100) {
            X.tip('最低100元起充');
            return;
        }

        if ($scope.money > 5000) {
            X.tip('单次充值最高5000元');
            return;
        }

        X.loading.show();
        PayService.payGateway($scope.money).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                pay(data.data);
            } else {
                X.tip(data['resultMsg']);
                X.loading.hide();
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };


    function pay(payURL) {
        payForm.setAttribute('action', payURL);
        payForm.submit();
    }

    // function payConfirm() {
    //     X.dialog.confirm('充值是否成功', {
    //         sureBtn: '充值成功', cancelBtn: '充值失败', notify: function (nt) {
    //             if (nt == 1) {
    //                 $scope.$apply(function () {
    //                     $location.url($scope.backURL);
    //                 });
    //             }
    //         }
    //     })
    // }

    function toIdenty() {
        X.dialog.confirm('您还未实名认证，请先实名认证', {
            notify: function (nt) {
                if (nt == 1) {
                    $scope.$apply(function () {
                        $location.url('/identification?goURL=/payBank');
                    });
                }
                if (nt == 0) {
                    $scope.$apply(function () {
                        $location.url('/payType');
                    });
                }
            }
        });
    }

    // $scope.$watch('money', function (newValue) {
    //     var money = X.toFloat(newValue) || 0;
    //     if (money > 50000) {
    //         $scope.money = money = 50000;
    //     }
    //     $scope.charge = Math.ceil(money * 7 / 10.0) / 100.0;
    // });
});
//充值短信验证 DONE
myControllers.controller('PayMobileCtrl', function ($scope, $q, UserService, PasswordService) {
    // $scope.time = 0;
    // $scope.mobile = '' || 13588860745;//手机号
    // $scope.bankCard = [];
    //
    // X.loading.show();
    // $q.all({
    //     bankCard: UserService.getBankCardInfo()
    // }).then(function (res) {
    //     var bankCardInfo = res.bankCard.data;
    //     if (bankCardInfo.code == 100) {
    //         $scope.bankCard = bankCardInfo.data;
    //         //银行的图标未进行更改
    //     } else {
    //         X.tip(bankCardInfo['resultMsg']);
    //     }
    //     X.loading.hide();
    // }).catch(function () {
    //     X.tip('服务器请求异常');
    // });
    //
    // //验证手机号和验证码是否符合要求
    // $scope.check = function () {
    //     var myReg = /^((13[0-9])|(14[5|7])|(15([0-3]|[5-9]))|(17[0-1,6-8])|(18[0,2,3,5-9]))\d{8}$/;
    //     if ($scope.mobile == '' || !myReg.test($scope.mobile)) {
    //         X.tip('手机号输入有误！');
    //         return false;
    //     }
    //     if ($scope.checkCode.length < 4) {
    //         X.tip('请输入4位验证码！');
    //         return false;
    //     }
    // };
    //
    // //判断手机号是否为银行预留手机号
    // $scope.getCheckCode = function () {
    //     var myReg = /^((13[0-9])|(14[5|7])|(15([0-3]|[5-9]))|(17[0-1,6-8])|(18[0,2,3,5-9]))\d{8}$/;
    //     if (!myReg.test($scope.mobile)) {
    //         X.tip('请输入正确的手机号码');
    //         return false;
    //     }
    //     //发送验证码请求
    //     X.loading.show();
    //     PasswordService.sendForgetCode($scope.mobile).then(function (res) {
    //         var data = res.data;
    //         if (data.code == 100) {
    //             $scope.time = 60;
    //             timerFn();
    //         } else if (data.code == 101) {
    //             $scope.time = data.data.interval;
    //             timerFn();
    //         } else {
    //             X.tip(data['resultMsg']);
    //         }
    //         X.loading.hide();
    //     }).catch(function () {
    //         X.tip('服务器请求异常');
    //     });
    // };
    //
    // //设置定时器
    // var timer;
    //
    // function timerFn() {
    //     timer = setInterval(function () {
    //         if ($scope.time > 0) {
    //             $scope.$apply(function () {
    //                 $scope.time--;
    //             });
    //         } else {
    //             timer && clearTimeout(timer);
    //         }
    //     }, 1000);
    // }
    //
    // //卸载页面的定时器
    // $scope.$on('$destroy', function () {
    //     timer && clearTimeout(timer);
    // });
});
//充值成功
myControllers.controller('PaySuccessCtrl', function ($scope, $location) {
    var code = $location.search()['code'] || 505, money = $location.search()['money'] || 0;
    $scope.code = code;

    //埋点：充值
    if (code == 100 && money != 0) {
        zhuge.track('充值', {
            充值金额: money
        });
    }
});
//提现 DONE
myControllers.controller('WithdrawCtrl', function ($scope, $interval, $q, $location, UserService, PayService) {
    $scope.money = '';
    $scope.cardId = '';
    $scope.password = '';
    $scope.bankCardList = [];
    $scope.selectBankCard = null;
    $scope.balance = 0;
    $scope.delaybalance = 0;//冻结延迟费
    $scope.user = {};
    $scope.userName = '';
    $scope.showDialog = false;
    var timer = null;
    $scope.btnState = 'disable';

    X.loading.show();
    $q.all({
        balance: UserService.getBalance(),
        delaybalance: UserService.getDelayBalance(),
        bankCards: UserService.getBankCards(),
        userInfo: UserService.getUserInfo()
    }).then(function (res) {
        var balanceData = res.balance.data;
        var delaybalanceData = res.delaybalance.data;
        var bankCardData = res.bankCards.data;
        var userInfoData = res.userInfo.data;

        if (balanceData.code == 100 && bankCardData.code == 100 && userInfoData.code == 100 && delaybalanceData.code == 100) {
            $scope.bankCardList = bankCardData.data;
            $scope.balance = X.parse2(balanceData.data['balance']);
            $scope.delaybalance = delaybalanceData.data.toFixed(2);
            $scope.canWithDraw = X.parse2($scope.balance - $scope.delaybalance);
            $scope.user = userInfoData.data;
            initDefaultBankCard();
            initValidate();
        } else {
            if (balanceData.code != 100) {
                X.tip(balanceData['resultMsg']);
            } else if (delaybalanceData.code != 100) {
                X.tip(delaybalanceData['resultMsg']);
            } else if (bankCardData.code != 100) {
                X.tip(bankCardData['resultMsg']);
            } else if (userInfoData.code != 100) {
                X.tip(userInfoData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //页面提示
    $scope.tips = function (title, msg) {
        X.dialog.info(title, msg);
    };

    //确认选择银行卡
    $scope.sureChoose = function (index) {
        $scope.selectBankCard = $scope.bankCardList[index];
        $scope.showDialog = false;
    };

    //初始化默认卡
    function initDefaultBankCard() {
        if (!$scope.bankCardList.length) {
            $scope.selectBankCard = null;
            return;
        }
        $scope.selectBankCard = $scope.bankCardList[0];
        var i, bank;
        for (i = 0; i < $scope.bankCardList.length; i++) {
            bank = $scope.bankCardList[i];
            if (bank['defaultCard'] == 0) {
                $scope.selectBankCard = bank;
                break;
            }
        }
    }

    //校验信息是否合法
    function initValidate() {
        if (!$scope.user.named) {
            X.dialog.confirm('您还未实名认证，请先实名认证', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootTurn('/identification?goURL=/withdraw');
                    }
                    if (nt == 0) {
                        bootTurn('/myHome');
                    }
                }
            });
            return;
        }

        if ($scope.balance.balance == 0) {
            X.dialog.alert('您的账户没有可提金额', {
                notify: function () {
                    bootTurn('/myHome');
                }
            });
            return;
        }

        if (!$scope.bankCardList.length) {
            X.dialog.confirm('提款前请先添加提款银行卡', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootTurn('/addBankCard?goURL=/withdraw');
                    }
                    if (nt == 0) {
                        bootTurn('/myHome');
                    }
                }
            });
            return;
        }

        if ($scope.user.withdrawPw == '') {
            X.dialog.confirm('您还未设置提现密码', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootTurn('/tradePassSet?goURL=/withdraw');
                    }
                    if (nt == 0) {
                        bootTurn('/myHome');
                    }
                }
            });
            return;
        }

        if ($scope.selectBankCard == null || $scope.selectBankCard.province == '*' || $scope.selectBankCard.city == '*' || $scope.selectBankCard['subbranch'] == '*') {
            X.dialog.confirm('所选提款银行卡信息不完善<br>请先完善该银行卡信息', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootTurn('/bankInfo?goURL=/withdraw');
                    }
                    if (nt == 0) {
                        bootTurn('/myHome');
                    }
                }
            });
        }
    }

    //引导跳转
    function bootTurn(url) {
        $scope.$apply(function () {
            $location.url(url);
        });
    }

    //判断提现金额和提现密码的正确性
    $scope.checkMoney = function () {
        if ($scope.money == '') {
            X.tip('请输入提现金额');
            return false;
        }
        if (!X.isMoney($scope.money)) {
            X.tip('金额输入错误');
            return false;
        }
        if ($scope.money < 100) {
            X.tip('提现金额最低100元起提');
            return false;
        }
        if ($scope.money > $scope.canWithDraw) {
            X.tip('提现金额超出可提现余额');
            return false;
        }
        if ($scope.password == '') {
            X.tip('提现密码不为空！');
            return false;
        }
        if (!/^\d{6}$/.test($scope.password)) {
            X.tip('提现密码为6位数字');
            return false;
        }
        if ($scope.selectBankCard == null) {
            X.tip('未找到您的提现银行卡信息');
            return false;
        }
        X.loading.show();
        PayService.doWithdraw($scope.selectBankCard.id, $scope.money, $scope.password).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('提现发起成功，等待处理中');
                $location.url('/fund?type=withdraw');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            if ($scope.money != '' && $scope.password != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();
});
//添加银行卡
myControllers.controller('AddBankCardCtrl', function ($scope, $interval, $q, $location, UserService, PayService, SystemService) {
    var province = SystemService.getProvince();
    var cities = SystemService.getCities();
    $scope.goURL = $location.search()['goURL'] || '/bankCardList';
    $scope.bankList = {};
    $scope.user = {};
    $scope.showBankList = false;
    $scope.userName = '';
    $scope.bankCode = '';
    $scope.bankName = '请选择银行';
    $scope.showDialog = false;
    $scope.list = []; //保存省市支行的数组，通用数组
    $scope.provinceId = '';
    $scope.province = '请选择省';
    $scope.city = '请选择市';
    $scope.branch = '请选择开户支行';
    $scope.bankCard = '';
    $scope.sureBankCard = '';

    X.loading.show();
    $q.all({
        bankList: UserService.getBankInfo(),
        userInfo: UserService.getUserInfo()
    }).then(function (res) {
        var bankListData = res.bankList.data;
        var userData = res.userInfo.data;
        if (bankListData.code == 100 && userData.code == 100) {
            $scope.user = userData.data;
            $scope.userName = X.maskName($scope.user.name);
            parseBankList(bankListData.data);
            initValidate();
        } else {
            if (bankListData.code != 100) {
                X.tip(bankListData['resultMsg']);
            } else if (userData.code != 100) {
                X.tip(userData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //选择银行
    $scope.sureChooseBank = function (bankCode) {
        $scope.showBankList = false;
        $scope.bankCode = bankCode;
        $scope.bankName = $scope.bankList[bankCode].bankName;
        $scope.provinceId = '';
        $scope.province = '请选择省';
        $scope.city = '请选择市';
        $scope.branch = '请选择开户支行';
    };

    //选择省份
    $scope.chooseProvice = function () {
        $scope.title = '开户省份';
        $scope.list = [];
        if ($scope.bankName == '' || $scope.bankName == '请选择银行') {
            X.tip('请选择银行');
            return;
        }
        var i, len = province.length;
        for (i = 0; i < len; i++) {
            $scope.list.push(province[i]);
        }
        $scope.showDialog = true;
    };

    //选择城市
    $scope.chooseCity = function () {
        $scope.title = '开户城市';
        $scope.list = [];
        if ($scope.bankName == '' || $scope.bankName == '请选择银行') {
            X.tip('请选择银行');
            return;
        }
        if ($scope.province == '' || $scope.province == '请选择省' || $scope.provinceId == '') {
            X.tip('请选择开户省份');
            return;
        }
        var i, len = cities.length, city;
        for (i = 0; i < len; i++) {
            city = cities[i];
            if (city[0] == $scope.provinceId) {
                $scope.list.push([city[1], city[2]]);
            }
        }
        $scope.showDialog = true;
    };

    //选择支行
    $scope.chooseBranch = function () {
        $scope.title = '开户支行';
        $scope.list = [];
        if ($scope.bankName == '' || $scope.bankName == '请选择银行') {
            X.tip('请选择银行');
            return;
        }
        if ($scope.province == '' || $scope.province == '请选择省') {
            X.tip('请选择开户省份');
            return;
        }
        if ($scope.city == '' || $scope.city == '请选择市') {
            X.tip('请选择开户城市');
            return;
        }
        $scope.showDialog = true;
        X.loading.show();
        UserService.getSubBank($scope.bankName, $scope.province, $scope.city).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                var banks = data.data, i, len = banks.length;
                for (i = 0; i < len; i++) {
                    $scope.list.push([0, banks[i]]);
                }
                $scope.showDialog = true;
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //确认选择省市支行信息
    $scope.sureChoose = function (title, id, name) {
        switch (title) {
            case '开户省份':
                $scope.province = name;
                $scope.provinceId = id;
                $scope.city = '请选择市';
                $scope.branch = '请选择开户支行';
                break;
            case '开户城市':
                $scope.city = name;
                $scope.branch = '请选择开户支行';
                break;
            case '开户支行':
                $scope.branch = name;
                break;
        }
        $scope.showDialog = false;
    };

    //将数据保存下来
    $scope.save = function () {
        /*if ($scope.bankName == '' || $scope.bankName == '请选择银行') {
         X.tip('请选择银行');
         return;
         }
         if ($scope.province == '' || $scope.province == '请选择省') {
         X.tip('请选择开户省份');
         return;
         }
         if ($scope.city == '' || $scope.city == '请选择市') {
         X.tip('请选择开户城市');
         return;
         }
         if ($scope.branch == '' || $scope.branch == '请选择开户支行') {
         X.tip('请选择开户支行');
         return;
         }
         if ($scope.bankCard == '') {
         X.tip('请输入银行卡号');
         return;
         }*/
        if ($scope.bankName == '' || $scope.bankName == '请选择银行' || $scope.province == '' || $scope.province == '请选择省' || $scope.city == '' || $scope.city == '请选择市' || $scope.branch == '' || $scope.branch == '请选择开户支行' || $scope.bankCard == '')return;
        if (!X.isBankCard($scope.bankCard)) {
            X.tip('请输入正确的银行卡号');
            return;
        }
        if ($scope.sureBankCard == '') {
            X.tip('请输入确认卡号');
            return;
        }
        if ($scope.bankCard != $scope.sureBankCard) {
            X.tip('确认卡号与银行卡号不一致');
            return;
        }
        X.loading.show();
        //更新银行卡信息
        UserService.bindBankCard($scope.bankName, $scope.province, $scope.city, $scope.branch, $scope.bankCard).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('银行卡添加成功');
                //是否需要返回跳转
                $location.url($scope.goURL);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    var timer = null;
    $scope.btnState = 'disable';
    function timerFnc() {
        timer = $interval(function () {
            if ($scope.branch != '请选择开户支行' && $scope.city != '请选择市' && $scope.province != '请选择省' && $scope.bankName != '请选择银行' && $scope.bankName != '' && $scope.province != '' && $scope.city != '' && $scope.branch != '' && $scope.bankCard != '' && $scope.sureBankCard != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();

    //实名认证
    function initValidate() {
        if (!$scope.user.named) {
            X.dialog.confirm('您还未实名认证，请先实名认证', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootTurnURL('/identification?goURL=/bankCardList');
                    }
                    if (nt == 0) {
                        bootTurnURL('/myInfo');
                    }
                }
            });
        }
    }

    //跳转
    function bootTurnURL(url) {
        $scope.$apply(function () {
            $location.url(url);
        })
    }

    //组装银行列表
    function parseBankList(bankList) {
        if (!bankList || !bankList.length) return;
        bankList.forEach(function (item) {
            $scope.bankList[item.code] = item;
        });
    }

});
//修改银行卡
myControllers.controller('ModifyBankCardCtrl', function ($scope, $q, $routeParams, $location, UserService, SystemService) {
    var bankCardId = $routeParams['bankCardId'];
    var province = SystemService.getProvince();
    var cities = SystemService.getCities();
    var cardIndex = $location.search()['cardIndex'];
    $scope.cardColor = "card-list-bg" + cardIndex;
    $scope.goURL = $location.search()['goURL'] || '/bankCardList';
    $scope.bankCard = null;
    $scope.user = {};
    $scope.showDialog = false;
    $scope.list = []; //保存省市支行的数组，通用数组
    $scope.provinceId = '';
    $scope.province = '请选择省';
    $scope.city = '请选择市';
    $scope.branch = '请选择开户支行';
    $scope.sureBankCard = '';

    X.loading.show();
    $q.all({
        bankCard: UserService.getBankCardById(bankCardId),
        userInfo: UserService.getUserInfo()
    }).then(function (res) {
        var bankCardData = res.bankCard.data;
        var userData = res.userInfo.data;
        if (bankCardData.code == 100 && userData.code == 100) {
            $scope.user = userData.data;
            $scope.bankCard = bankCardData.data;
            if ($scope.user.name == '') {
                toIdenty();
            } else {
                initData();
            }
        } else {
            X.tip(bankCardData['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //选择省份
    $scope.chooseProvice = function () {
        $scope.title = '开户省份';
        $scope.list = [];
        var i, len = province.length;
        for (i = 0; i < len; i++) {
            $scope.list.push(province[i]);
        }
        $scope.showDialog = true;
    };

    //选择城市
    $scope.chooseCity = function () {
        $scope.title = '开户城市';
        $scope.list = [];
        if ($scope.province == '' || $scope.province == '请选择省' || $scope.provinceId == '') {
            X.tip('请选择开户省份');
            return;
        }
        var i, len = cities.length, city;
        for (i = 0; i < len; i++) {
            city = cities[i];
            if (city[0] == $scope.provinceId) {
                $scope.list.push([city[1], city[2]]);
            }
        }
        $scope.showDialog = true;
    };

    //选择支行
    $scope.chooseBranch = function () {
        $scope.title = '开户支行';
        $scope.list = [];
        if ($scope.province == '' || $scope.province == '请选择省') {
            X.tip('请选择开户省份');
            return;
        }
        if ($scope.city == '' || $scope.city == '请选择市') {
            X.tip('请选择开户城市');
            return;
        }
        $scope.showDialog = true;
        X.loading.show();
        UserService.getSubBank($scope.bankCard.bank, $scope.province, $scope.city).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                var banks = data.data, i, len = banks.length;
                for (i = 0; i < len; i++) {
                    $scope.list.push([0, banks[i]]);
                }
                $scope.showDialog = true;
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //确认选择省市支行信息
    $scope.sureChoose = function (title, id, name) {
        switch (title) {
            case '开户省份':
                $scope.province = name;
                $scope.provinceId = id;
                $scope.city = '请选择市';
                $scope.branch = '请选择开户支行';
                break;
            case '开户城市':
                $scope.city = name;
                $scope.branch = '请选择开户支行';
                break;
            case '开户支行':
                $scope.branch = name;
                break;
        }
        $scope.showDialog = false;
    };

    //将数据保存下来
    $scope.save = function () {
        if ($scope.province == '' || $scope.province == '请选择省') {
            X.tip('请选择开户省份');
            return;
        }
        if ($scope.city == '' || $scope.city == '请选择市') {
            X.tip('请选择开户城市');
            return;
        }
        if ($scope.branch == '' || $scope.branch == '请选择开户支行') {
            X.tip('请选择开户支行');
            return;
        }
        X.loading.show();
        //更新银行卡信息
        UserService.updateCardInfo($scope.bankCard.id, $scope.bankCard.bank, $scope.province, $scope.city, $scope.branch).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('银行卡信息保存成功');
                $location.url($scope.goURL);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //设置默认卡
    $scope.setDefaultBankCard = function () {
        X.loading.show();
        UserService.setDefaultBankCard(bankCardId).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('默认卡设置成功');
                $location.url('/bankCardList');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //删除卡
    $scope.deleteBankCard = function () {
        X.dialog.confirm('您确定要删除该银行卡吗？', {
            notify: function (nt) {
                if (nt == 1) {
                    delBankCard();
                }
            }
        });
    };

    //删除卡
    function delBankCard() {
        X.loading.show();
        UserService.delBankCard(bankCardId).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('银行卡删除成功');
                $location.url('/bankCardList');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    function toIdenty() {
        X.dialog.confirm('您还未实名认证，请先实名认证', {
            notify: function (nt) {
                if (nt == 1) {
                    bootTurnURL('/identification?goURL=/myInfo');
                }
                if (nt == 0) {
                    bootTurnURL('/myInfo');
                }
            }
        });
    }

    function initData() {
        var i, len = province.length;
        for (i = 0; i < len; i++) {
            if ($scope.bankCard.province == province[i][1]) {
                $scope.provinceId = province[i][0];
                break;
            }
        }
        $scope.province = $scope.bankCard.province;
        $scope.city = $scope.bankCard.city;
        $scope.branch = $scope.bankCard.subbranch;
    }

    function bootTurnURL(url) {
        $scope.$apply(function () {
            $location.url(url);
        })
    }

});
//银行卡列表 DONE
myControllers.controller('BankCardListCtrl', function ($scope, $q, $location, UserService) {
    $scope.bankCards = [];
    $scope.user = {};

    X.loading.show();
    $q.all({
        bankCards: UserService.getBankCards(),
        userInfo: UserService.getUserInfo()
    }).then(function (res) {
        var bankCardData = res.bankCards.data;
        var userData = res.userInfo.data;
        if (bankCardData.code == 100 && userData.code == 100) {
            $scope.user = userData.data;
            $scope.bankCards = bankCardData.data;
            initValidate();
        } else {
            X.tip(bankCardData['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    function initValidate() {
        if (!$scope.user.named) {
            X.dialog.confirm('您还未实名认证，请先实名认证', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootTurnURL('/identification?goURL=/bankCardList');
                    }
                    if (nt == 0) {
                        bootTurnURL('/myInfo');
                    }
                }
            });
        }
    }

    function bootTurnURL(url) {
        $scope.$apply(function () {
            $location.url(url);
        })
    }

});
//银行卡详情 DONE
myControllers.controller('BankInfoCtrl', function ($scope, $q, $location, UserService, SystemService) {
    $scope.goURL = $location.search()['goURL'] || '/myInfo';
    $scope.bank = {};
    $scope.user = {};
    $scope.userName = '';
    $scope.provinceId = '';
    $scope.province = '未设置';
    $scope.city = '未设置';
    $scope.branch = '未设置';
    $scope.showDialog = false;

    //设置省市
    var province = SystemService.getProvince();
    var cities = SystemService.getCities();

    X.loading.show();
    $q.all({
        bankCardInfo: UserService.getBankCardInfo(),
        userInfo: UserService.getUserInfo()
    }).then(function (res) {
        var bankCardData = res.bankCardInfo.data;
        var userData = res.userInfo.data;
        if (bankCardData.code == 100 && userData.code == 100) {
            $scope.user = userData.data;
            $scope.bank = bankCardData.data;
            initValidate();
        } else {
            X.tip(bankCardData['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    function initValidate() {
        if (!$scope.user.named) {
            X.dialog.confirm('您还未实名认证，请先实名认证', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootTurnURL('/identification?goURL=/bankInfo');
                    }
                    if (nt == 0) {
                        bootTurnURL('/myInfo');
                    }
                }
            });
            return;
        } else {
            $scope.user.maskName = X.maskName($scope.user.name);
        }

        if ($scope.bank == null) {
            X.dialog.alert('未找到您的银行卡信息', {
                notify: function () {
                    bootTurnURL('/myHome');
                }
            });
            return;
        }
        $scope.province = $scope.bank.province == '*' ? '未设置' : $scope.bank.province;
        $scope.city = $scope.bank.city == '*' ? '未设置' : $scope.bank.city;
        $scope.branch = $scope.bank['subbranch'] == '*' ? '未设置' : $scope.bank['subbranch'];
    }

    function bootTurnURL(url) {
        $scope.$apply(function () {
            $location.url(url);
        })
    }

    //遮罩层
    $scope.closeDialog = function () {
        $scope.showDialog = false;
    };

    //选择省份
    $scope.chooseProvice = function () {
        $scope.title = '开户省份';
        $scope.list = [];
        var i, len = province.length;
        for (i = 0; i < len; i++) {
            $scope.list.push(province[i]);
        }
        $scope.showDialog = true;
    };

    //选择城市
    $scope.chooseCity = function () {
        $scope.title = '开户城市';
        $scope.list = [];
        if ($scope.province == '' || $scope.province == '未设置' || $scope.provinceId == '') {
            X.tip('请选择开户省份');
            return;
        }
        var i, len = cities.length, city;
        for (i = 0; i < len; i++) {
            city = cities[i];
            if (city[0] == $scope.provinceId) {
                $scope.list.push([city[1], city[2]]);
            }
        }
        $scope.showDialog = true;
    };

    //选择支行
    $scope.chooseBranch = function () {
        $scope.title = '开户支行';
        $scope.list = [];
        if ($scope.province == '' || $scope.province == '未设置') {
            X.tip('请选择开户省份');
            return;
        }
        if ($scope.city == '' || $scope.city == '未设置') {
            X.tip('请选择开户城市');
            return;
        }
        $scope.showDialog = true;
        X.loading.show();
        UserService.getSubBank($scope.bank.bank, $scope.province, $scope.city).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                var banks = data.data, i, len = banks.length;
                for (i = 0; i < len; i++) {
                    $scope.list.push([0, banks[i]]);
                }
                $scope.showDialog = true;
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    $scope.sureChoose = function (title, id, name) {
        switch (title) {
            case '开户省份':
                $scope.province = name;
                $scope.provinceId = id;
                $scope.city = '未设置';
                $scope.branch = '未设置';
                break;
            case '开户城市':
                $scope.city = name;
                $scope.branch = '未设置';
                break;
            case '开户支行':
                $scope.branch = name;
                break;
        }
        $scope.showDialog = false;
    };

    //将数据保存下来
    $scope.save = function () {
        if ($scope.province == '' || $scope.province == '未设置') {
            X.tip('请选择开户省份');
            return;
        }
        if ($scope.city == '' || $scope.city == '未设置') {
            X.tip('请选择开户城市');
            return;
        }
        if ($scope.branch == '' || $scope.branch == '未设置') {
            X.tip('请选择开户支行');
            return;
        }
        X.loading.show();
        //更新银行卡信息
        UserService.updateCardInfo($scope.bank.bank, $scope.province, $scope.city, $scope.branch, $scope.bank.id).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('信息保存成功');
                //是否需要返回跳转
                $location.url($scope.goURL);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }
});
//支付宝充值页面
myControllers.controller('AlipayCtrl', function ($scope, $interval, $q, $location, UserService, PayService, SystemService) {
    $scope.account = '';
    $scope.money = '';
    $scope.balance = 0;
    $scope.user = {};
    $scope.name = '';
    $scope.param = {};
    $scope.cellPhone = '';

    var timer = null;
    $scope.btnState = 'disable';

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            if ($scope.param.account && $scope.param.money) {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    //timerFnc();

    X.loading.show();
    $q.all({
        balance: UserService.getBalance(),
        userInfo: UserService.getUserInfo()
    }).then(function (res) {
        var balance = res.balance.data;
        var userData = res.userInfo.data;
        X.clipboard.init('copy-tel');
        if (balance.code == 100 && userData.code == 100) {
            $scope.balance = balance.data;
            $scope.user = userData.data;
            $scope.param.account = userData.data.alipayAccount;
            $scope.cellPhone = SystemService.cellPhoneNumber();
            X.log($scope.cellPhone);
            if ($scope.user['name'] == '') {
                toIdenty();
            } else {
                $scope.name = X.maskName($scope.user['name']);
            }
        } else {
            if (balance.code != 100) {
                X.tip(balance['resultMsg']);
            } else if (userData.code != 100) {
                X.tip(userData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });
    $scope.edit = function () {
        X.dialog.alert('如需要更换或解绑支付宝账号，请 <br>联系客服电话 <a class="txt-blue" href=' + $scope.cellPhone.cellPhoneATag + '>' + $scope.cellPhone.cellPhone + '</a>');
    };

    $scope.pay = function () {
        var account = $scope.param.account ? $scope.param.account : $scope.user.alipayAccount;
        if (!account || !$scope.param.money) {
            return;
        }

        /*if ($scope.param.account == '') {
         X.tip('请输入支付宝账号');
         return;
         }*/
        //支付宝账号长度大于5，与6006类似
        if (account.length < 5) {
            X.tip('支付宝账号输入错误');
            return;
        }
        /*if ($scope.param.money == '') {
         X.tip('请输入充值金额');
         return;
         }*/
        if (!X.isMoney($scope.param.money, true)) {
            X.tip('充值金额输入错误');
            return;
        }
        //充值金额大于等于1元，上限10万  -------------------- 测试后加上去
        if ($scope.param.money < 1) {
            X.tip('充值金额最低1元');
            return;
        }
        if ($scope.param.money > 100000) {
            X.tip('充值金额最高10万元');
            return;
        }

        X.loading.show();
        PayService.alipay($scope.param.money, $scope.param.account).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                window.location.href = "/app/goAli.html";
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //实名认证
    function toIdenty() {
        X.dialog.confirm('您还未实名认证，请先实名认证', {
            notify: function (nt) {
                if (nt == 1) {
                    $scope.$apply(function () {
                        $location.url('/identification?goURL=/alipay');
                    });
                }
                if (nt == 0) {
                    $scope.$apply(function () {
                        // $location.url('/payType');
                        window.history.go(-1);
                    });
                }
            }
        });
    }
});
//支付宝充值二级页面
myControllers.controller('AlipayDetailCtrl', function () {
    X.clipboard.init();
});
//新手引导 DONE
myControllers.controller('GuideCtrl', function ($scope, $location) {
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
});
//文章
myControllers.controller('ArticleCtrl', function ($scope, $location) {
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }

    var btnLink = $location.search()['btnLink'];
    var btnText = $location.search()['btnText'];
    if (btnText && btnLink) {
        $scope.btnLink = decodeURIComponent(btnLink);
        $scope.btnText = decodeURIComponent(btnText);
    }

    $scope.to = function () {
        window.location.href = $scope.btnLink;
    }
});
//交易规则 DONE
myControllers.controller('TradeRuleCtrl', function ($scope, $location) {
    /*$scope.backURL = $location.search()['backURL'] || '/guide';*/
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
});
//安全保证 DONE
myControllers.controller('SafeCtrl', function ($scope, $location) {
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
});
//关于我们 DONE
myControllers.controller('AboutUsCtrl', function ($scope, $location) {
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
});
//1分钟了解微策略
myControllers.controller('IntroduceCtrl', function ($scope, $location) {
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }

    $scope.toTrade = function () {
        if ($scope.showHeader) {
            $location.path('/trade');
        } else {
            /*window.location = 'jumpCenter::suggestion';*/
            window.location.href = 'yztz://ycl.yztz.com/trade';
        }
    };
});
//T+D申请金额
myControllers.controller('TDApplyCtrl', function ($scope, $q, $location, TradeService, UserService) {
    var tradeMoneyList = [],
        holdDaysList = [];

    $scope.type = 'money';
    $scope.dayIndex = 0; //持仓时间的下标
    $scope.currentIndex = 0;//金额的下标
    $scope.money = 0;//所选点买金额
    $scope.otherMoney = '';//其他金额，可输入
    $scope.daies = 0;//所选持仓时间
    $scope.tradeMoneyList = [];
    $scope.holdDaysList = [];
    var DYTip = false, DYData, inDYTipTime = false;

    X.loading.show();
    $q.all({
        initTrade: TradeService.initTDTrade(),
        user: UserService.getUserInfo(),
        DY: TradeService.getWaitPayDeferForRemind()
    }).then(function (res) {
        var initTd = res.initTrade.data,
            userInfo = res.user.data,
            DYData = res.DY.data;
        if (initTd.code == 100 && userInfo.code == 100 && DYData.code == 100) {
            var initData = initTd.data;
            $scope.userData = userInfo.data;
            var risk = JSON.parse(initData['strRisk']);
            if (DYData.data != 0)DYTip = true;
            init(risk);
            //页面初始化完成以后，默认选择第一个点买金额
            $scope.chooseMoney($scope.currentIndex, $scope.tradeMoneyList[$scope.currentIndex].value);
            //页面初始化完成以后，默认选择第一个持仓时间
            $scope.chooseDay($scope.dayIndex, $scope.holdDaysList[$scope.dayIndex].value);
        } else {
            if (initTd.code != 100) {
                X.tip(initTd['resultMsg']);
            } else if (userInfo.code != 100) {
                X.tip(userInfo['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    function init(data) {
        var tradingMoneyList = data['tradingMoneyList'].value;//金额列表
        var deferCharge = data['deferCharge'].value;//递延费算法的：方案金额的万分之
        var leverValue = data['leverValue'].value;//杠杆
        var holdDayList = data['holdDayList'].value;//合作天数
        var deferConditionRatio = data['deferConditionRatio'].value;//递延条件，递延率
        var maxMoneyOneStock = data['maxMoneyOneStock'].value;//个股持仓累计金额的最大值
        var profitShare = data['profitShare'].value;//点买人盈利分成，为小数，例如0.9
        //策略总盈利 * 点买人收益分配比率 = 点买人获得收益
        var quitGainRatio = data['quitGainRatio'].value;//止盈率
        var quitLossRatio = data['quitLossRatio'].value;//止损率
        //初始化点买金额
        initTradeMoney(tradingMoneyList);
        //初始化持仓时间
        initHoldDay(holdDayList);
        profitShare = profitShare * 100;//点买人盈利分成
        var dealing = 100 - profitShare;//投资人盈利分成

        $scope.initData = {
            deferConditionRatio: deferConditionRatio,
            profitShare: profitShare,
            quitGainRatio: quitGainRatio,
            quitLossRatio: quitLossRatio,
            dealing: dealing,
            maxMoneyOneStock: X.sketchNumber(maxMoneyOneStock),
            deferCharge: deferCharge,
            leverValue: leverValue
        }
        $scope.maxMoney = tradeMoneyList[tradeMoneyList.length - 1] / 10000;
    }

    //点击按钮
    $scope.to = function () {
        //判断是否有实名认证
        if (!$scope.userData.named) {
            X.dialog.confirm('您还未实名认证，请先实名认证', {
                notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $location.url('/identification?goURL=/TDApply');
                        });
                    }
                }
            });
            return false;
        }
        if (DYTip) {
            X.dialog.confirm('温馨提示：请您确认是否已经将今日递延<br/>费留在余额中等待扣款，如果继续操作可<br/>能会造成操盘中策略因递延费不足被平仓', {
                sureBtn: '确定', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            getDYData()
                        })
                    }
                }
            });
            return;
        }

        getDYData();


    };

    function getDYData() {
        if ($scope.type == 'money') {
            var url = '/TDApplyConfirm?holdDays=' + $scope.daies + '&&money=' + $scope.money;
            $location.url(url);
        } else {
            var reg = /^[1-9]\d*$/;
            if (!$scope.otherMoney) {
                X.dialog.alert("请输入您的点买金额");
                return false;
            } else if (!reg.test($scope.otherMoney)) {
                X.dialog.alert("请输入正确的点买金额");
                return false;
            } else if ($scope.otherMoney > $scope.maxMoney || $scope.otherMoney < 1) {
                X.dialog.alert("点买金额最少1万，最多" + $scope.maxMoney + "万");
                return false;
            } else {
                var url = '/TDApplyConfirm?holdDays=' + $scope.daies + '&&money=' + $scope.otherMoney * 10000;
                $location.url(url);
            }
        }
    }


    //选择点买金额
    $scope.chooseMoney = function (index, money) {
        $scope.currentIndex = index;
        $scope.money = money;
    };

    //选择持仓时间
    $scope.chooseDay = function (index, day) {
        $scope.dayIndex = index;
        $scope.daies = day;
    };

    //页面提示
    $scope.tips = function (title, msg) {
        X.dialog.info(title, msg);
    };

    //持仓时间提示
    $scope.tipHoldDay = function () {
        var title = '持仓时间';
        var hold = $scope.holdDaysList;
        var len = hold.length;
        var msg = '持仓时间为' + hold[0].day + '~' + hold[len - 1].day + '个交易日，最短' + hold[0].day + '天，最长' + hold[len - 1].day + '天。';
        X.dialog.info(title, msg);
    }

    //盈利分成提示
    $scope.tipProfitSharing = function () {
        var title = '盈利分成';
        var msg = '点买人按盈利的' + $scope.initData.profitShare + '%进行分成，投资人按盈利的' + $scope.initData.dealing + '%进行分成。';
        X.dialog.info(title, msg);
    }

    /*//可输入点买金额
     $scope.judgeOtherMoney = function (money) {
     var reg = /^[1-9]\d*$/;
     if (!reg.test(money)) {
     $scope.otherMoney = 1;
     }
     };*/

    //初始化点买金额
    function initTradeMoney(list) {
        if (list) {
            tradeMoneyList = list.split(',');
            $.each(tradeMoneyList, function (i, m) {
                $scope.tradeMoneyList.push({
                    value: m,
                    text: X.sketchNumber(m)
                });
            });
        }
    }

    //初始化持仓天数
    function initHoldDay(list) {
        if (list) {
            holdDaysList = list.split(',');
            $.each(holdDaysList, function (i, m) {
                $scope.holdDaysList.push({
                    day: m,
                    value: m
                });
            });
        }
    }
});
//T+D确认申请金额
myControllers.controller('TDApplyConfirmCtrl', function ($scope, $location, $q, TradeService, UserService) {
    var holdDays = $location.search()['holdDays'],//从申请页面传入的持仓时间
        money = $location.search()['money'];//从申请页面传入的点买金额
    $scope.showBalance = false;//显示余额不足弹窗
    $scope.showUnHanldDeferCharge = false;//显示递延费,余额充足情况
    $scope.showUnHanldBalance = false;//显示递延费,余额不足情况

    //因为路径参数可以修改的原因，因此进入页面的时候先对参数进行判断
    var reg = /^[1-9]\d*$/;
    if (!holdDays || !money || !reg.test(holdDays) || !reg.test(money) || money % 10000 != 0 || money < 10000) {
        X.dialog.confirm('参数错误，请重新发起', {
            notify: function (nt) {
                if (nt == 1) {
                    bootURL('/TDApply');
                }
                if (nt == 0) {
                    bootURL('/TDTrade?backURL=/index');
                }
            }
        });
        return false;
    }

    X.loading.show();
    $q.all({
        initTrade: TradeService.initTDTrade(),
        user: UserService.getUserInfo()
    }).then(function (res) {
        var initTd = res.initTrade.data,
            userInfo = res.user.data;
        if (initTd.code == 100 && userInfo.code == 100) {
            var initData = initTd.data;
            $scope.userData = userInfo.data;
            init(initData);
        } else {
            if (initTd.code != 100) {
                X.tip(initTd['resultMsg']);
            } else if (userInfo.code != 100) {
                X.tip(userInfo['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    $scope.sub = function () {
        //判断点买金额是否小于最大限额
        if ($scope.initData.money > $scope.maxMoney) {
            X.dialog.alert("点买金额最少1万，最多" + $scope.maxMoney / 10000 + "万");
            return false;
        }

        //实名认证
        if (!$scope.userData.named) {
            X.dialog.confirm('您还未实名认证，请先实名认证', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootURL('/identification?goURL=/TDApply');
                    }
                }
            });
            return false;
        }

        //判断余额是否充足
        if ($scope.unHanldDeferCharge == 0 && $scope.initData.totalCharge > $scope.balance) {
            $scope.showBalance = true;
            return false;
        }

        //递延费存在并且余额不足
        //此处余额不足，应该与总点买金额和递延费之和相比
        var unHanldBalnance = $scope.initData.totalCharge + $scope.unHanldDeferCharge; //递延费和总支付金额之和
        $scope.unHanldneedMoney = X.parse2(unHanldBalnance - $scope.balance);//需缴纳的费用
        if ($scope.unHanldDeferCharge > 0 && unHanldBalnance > $scope.balance) {
            $scope.showUnHanldBalance = true;
            return false;
        }

        //递延费存在并且余额充足时，提示之后，点击确定就提交申请策略
        if ($scope.unHanldDeferCharge > 0 && $scope.balance >= $scope.unHanldDeferCharge) {
            $scope.showUnHanldDeferCharge = true;
            return false;
        }

        //上述条件都成立，则提交数据
        createTDTrade();
    }

    //递延费存在并且余额充足时，点击确定，提交数据，不用传递未缴纳递延费，后台会自己进行判断处理，只需要提醒用户有递延费需要扣除即可
    $scope.createT = function () {
        createTDTrade();
    };

    //初始化risk数据
    function init(data) {
        var risk = JSON.parse(data['strRisk']);//风控参数
        var balance = data['balance'];//余额
        var unHanldDeferCharge = data['unHanldDeferCharge'];//T+1未缴纳递延费
        var token = data['token'];
        var tradingMoneyList = risk['tradingMoneyList'].value;//金额列表
        var deferCharge = risk['deferCharge'].value,//递延费算法的：方案金额的万分之
            holdDayList = risk['holdDayList'].value,
            leverValue = risk['leverValue'].value,//杠杆
            deferConditionRatio = risk['deferConditionRatio'].value,//递延条件，递延率
            quitGainRatio = risk['quitGainRatio'].value,//止盈率
            quitLossRatio = risk['quitLossRatio'].value,//止损率
            principal = parseInt(money / leverValue),//履约保证金,向下取整
        /*Defer = (money / 10000).toFixed(2),*/
            deferredCharge = parseInt((money / 10000) * deferCharge * holdDays),//递延费，向下取整
            totalCharge = principal + deferredCharge;//总共需要支付的金额

        var tradeMoneyList = tradingMoneyList.split(',');

        $scope.initData = {
            deferConditionRatio: deferConditionRatio,
            quitGainRatio: quitGainRatio,
            quitLossRatio: quitLossRatio,
            deferCharge: deferCharge,
            leverValue: leverValue,
            holdDays: holdDays,
            money: parseInt(money),
            principal: principal,
            deferredCharge: deferredCharge,
            totalCharge: totalCharge
        }
        $scope.token = token;
        $scope.balance = X.parse2(balance);
        $scope.unHanldDeferCharge = unHanldDeferCharge || 0;
        $scope.unHanldDeferCharge = (Math.round($scope.unHanldDeferCharge * 100)) / 100;
        $scope.needMoney = ($scope.initData.totalCharge - $scope.balance).toFixed(2);
        $scope.maxMoney = parseInt(tradeMoneyList[tradeMoneyList.length - 1]);

        var holdDaysList = holdDayList.split(',');
        if (holdDaysList.indexOf($scope.initData.holdDays) == -1) {
            X.dialog.confirm('参数错误，请重新发起', {
                notify: function (nt) {
                    if (nt == 1) {
                        bootURL('/TDApply');
                    }
                    if (nt == 0) {
                        bootURL('/TDTrade?backURL=/index');
                    }
                }
            });
            return false;
        }
    }

    //提交数据
    function createTDTrade() {
        var postData = {
            token: $scope.token,
            money: $scope.initData.money,
            deferConditionRatio: $scope.initData.deferConditionRatio,
            quitGainRatio: $scope.initData.quitGainRatio,
            quitLossRatio: $scope.initData.quitLossRatio,
            principal: $scope.initData.principal,
            deferCharge: $scope.initData.deferredCharge,
            holdDays: $scope.initData.holdDays
        };
        X.loading.show();
        TradeService.createTDTrade(postData).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('策略组发起成功');
                $location.url('/TDTrade');
            } else if (data.code == 501) {
                X.tip(data['resultMsg']);
            } else {
                $scope.token = data.data.token;
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //引导跳转
    function bootURL(url) {
        $scope.$apply(function () {
            $location.url(url);
        });
    }
});
//我的策略组
myControllers.controller('MyStrategyGroupCtrl', function ($scope, $q, $sce, TradeService, $location, SystemService) {
    $scope.showAddMoney = false;
    $scope.showAddPrincipal = false;
    $scope.showApplyClean = false;
    $scope.showAddDay = false;
    $scope.extend = [];//期限续期需补交或退回的金额
    $scope.initData = {};//策略内容
    $scope.queryData = {};//风控参数
    $scope.days = [];//持仓时间列表
    $scope.principal = 0; //支付履约保证金（追加总点买金额）
    $scope.deferr = 0; // 递延费（追加总点买金额）
    $scope.addMoneynum = 1;//追加点买金默认1万元
    $scope.holdDays = 0;//持仓时间
    var reg = /^[1-9]\d*$/;
    var DYTip = false, DYData, inDYTipTime = false;

    X.loading.show();
    $q.all({
        initTrade: TradeService.initTDTrade(),
        hold: TradeService.getHoldingScheme(),
        DY: TradeService.getWaitPayDeferForRemind()
    }).then(function (res) {
        var initTd = res.initTrade.data;
        var holdScheme = res.hold.data, DYData = res.DY.data;
        if (initTd.code == 100 && holdScheme.code == 100 && DYData.code == 100) {
            var initData = initTd.data,
                holdData = holdScheme.data;
            init(holdData);
            query(initData);
            getRenewalA($scope.days[0], $scope.initData.id);
            if (DYData.data != 0)DYTip = true;
        } else {
            if (initTd.code != 100) {
                X.tip(initTd['resultMsg']);
            } else if (holdScheme.code == 900) {
                $scope.holdData = holdScheme.data;
                $scope.holdCode = holdScheme.code;
                $scope.holdTip = holdScheme['resultMsg'];
                init($scope.holdData);
            } else if (holdScheme.code != 100) {
                X.tip(holdScheme['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //获取当前策略组内容
    function holding() {
        TradeService.getHoldingScheme().then(function (res) {
            var holdingScheme = res.data;
            if (holdingScheme.code == 100) {
                var holdingData = holdingScheme.data;
                init(holdingData);
            } else {
                X.tip(holdingScheme['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //处理风控参数
    function query(data) {
        var risk = JSON.parse(data['strRisk']),//风控参数
            balance = data['balance'],//余额
            dayList = risk['holdDayList'].value,//合作天数
            tradingMoneyList = risk['tradingMoneyList'].value;//点买金额
        var tradeMoneyList = tradingMoneyList.split(',');//点买金额列表，为了取最后一个值，最后一个值为总点卖金额最大值

        $scope.queryData = {
            deferConditionRatio: risk['deferConditionRatio'].value,//递延条件，百分之
            deferCharge: risk['deferCharge'].value,//递延费算法的：方案金额的万分之
            leverValue: risk['leverValue'].value //期限续期用的是风控的杠杆参数
        };

        $scope.balance = balance;
        $scope.days = dayList.split(',');
        $scope.holdDays = $scope.days[0];
        $scope.maxMoney = tradeMoneyList[tradeMoneyList.length - 1];
    }

    //所有金额保留两位小数，本处是通过toFixed()四舍五入得到
    function init(data) {
        if (!data) {
            $scope.initData = {
                money: 0,
                deferCharge: 0,
                serviceCharge: 0,
                lossPrincipal: 0,
                marketValue: 0,
                suspendedValue: 0,
                /*currentProfit: 0,*/
                availableDays: 0,
                availableMoney: 0
            }
            return false;
        }
        var money = data['money'],//总点买金额
            deferCharge = data['deferCharge'],//递延费
            serviceCharge = data['serviceCharge'] || 0,     //服务费也就是交易综合费
            lossPrincipal = data['lossPrincipal'],          //履约保证金
            marketValue = data['marketValue'] || 0,         //当前市值
            suspendedValue = data['suspendedValue'] || 0,   //停牌市值
            currentProfit = data['currentProfit'] || 0,     //当前盈亏
            availableDays = data['availableDays'],          //剩余可用天数
            id = data['id'],
            availableMoney = data['availableMoney'],        //可用点买金额
            leverRatio = data['leverRatio'];//此处的杠杆是去方案里给的值，追加点买金和追加保证金用的是方案的

        $scope.initData = {
            id: id,
            money: money,
            deferCharge: deferCharge.toFixed(2),
            serviceCharge: serviceCharge.toFixed(2),
            lossPrincipal: lossPrincipal.toFixed(2),
            marketValue: marketValue.toFixed(2),
            suspendedValue: suspendedValue.toFixed(2),
            currentProfit: currentProfit.toFixed(2),
            availableDays: availableDays,
            availableMoney: availableMoney,
            leverRatio: leverRatio
        }
    }

    //初始化页面时，第一次获取补交或退回的金额
    function getRenewalA(day, id) {
        X.loading.show();
        TradeService.extendSchemeInitiate(id, day).then(function (res) {
            var add = res.data;
            if (add.code == 100) {
                $scope.extend[day] = add.data;
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //获取期限续期退回或补交的金额
    function getRenewal(days, id) {
        if ($scope.initData.availableDays < 3) {
            for (var i = 0; i < days.length; i++) {
                var day = days[i];
                getRenewalMoney(day, id);
            }
        }
    }

    //获取期限续期的补交或退回金额，页面进入时需要获取一次，点开期限续期弹窗时也需要获取一次
    function getRenewalMoney(day, id) {
        X.loading.show();
        TradeService.extendSchemeInitiate(id, day).then(function (res) {
            var add = res.data;
            if (add.code == 100) {
                $scope.extend[day] = add.data;
            } else {
                X.tip(add['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //获取期限续期的提示语
    function getTips(day) {
        $scope.diffBalance = $scope.extend[day] || 0;//补交或退回的值最多两位小数，不作处理
        if ($scope.diffBalance > 0) {
            $scope.tipsWord = $sce.trustAsHtml('续期需要履约保证金' + $scope.principalAddDay + '元，退回' + $scope.diffBalance + '元');
        } else if ($scope.diffBalance == 0) {
            $scope.tipsWord = $sce.trustAsHtml('');
        } else {
            $scope.tipsWord = $sce.trustAsHtml('续期需要履约保证金' + $scope.principalAddDay + '元，补交' + -($scope.diffBalance) + '元');
        }
    }

    //input标签失去焦点的时候对内容进行判断
    $scope.loseBlur = function (data) {
        if (!reg.test(data)) {
            $scope.addMon = 0;
        }
        if ($scope.addMon == 0) {
            $scope.showAddMoney = false;
            X.dialog.alert('金额错误');
        } else {
            $scope.addMon = $scope.addMoneynum * 10000;
            getDeferCharge($scope.addMon);
        }
    };

    //点击追加点买金按钮
    $scope.addMoney = function () {
        // inDYTipTime = SystemService.isInDYTipPeriod();
        if (!$scope.holdData && $scope.holdCode == 900) {
            X.tip($scope.holdTip);
            return false;
        }
        if (!reg.test($scope.addMoneynum)) {
            $scope.addMoneynum = 1;
        }
        $scope.showAddMoney = true;
        $scope.addMon = $scope.addMoneynum * 10000;

        if (DYTip) {
            $scope.showAddMoney = false;
            X.dialog.confirm('温馨提示：请您确认是否已经将今日递延<br/>费留在余额中等待扣款，如果继续操作可<br/>能会造成操盘中策略因递延费不足被平仓', {
                sureBtn: '确定', notify: function (nt) {
                    if (nt == 1) {
                        $scope.showAddMoney = true;
                        getDeferCharge($scope.addMon);
                    }
                }
            });
            return;
        }
        X.loading.show();
        getDeferCharge($scope.addMon);

        /*$scope.$watch('addMoneynum', function () {
         $scope.addMon = $scope.addMoneynum * 10000;
         $scope.addMoneyPrincipal = parseInt($scope.addMon / $scope.initData.leverRatio);
         $scope.addMoneyDefer = parseInt($scope.addMoneynum * $scope.queryData.deferCharge * $scope.initData.availableDays);
         })*/
    };

    function getDeferCharge(money) {
        TradeService.schemeAddMoneyInitiate($scope.initData.id, money).then(function (res) {
            var addMoneyInit = res.data;
            if (addMoneyInit.code == 100) {
                $scope.addMoneyPrincipal = parseInt(money / $scope.initData.leverRatio);//向下取整
                $scope.addMoneyDefer = parseInt(addMoneyInit.data);//向下取整
            } else {
                $scope.addMoneyPrincipal = 0;
                $scope.addMoneyDefer = 0;
                X.tip(addMoneyInit['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //点击追加保证金按钮
    $scope.addPrincipal = function () {
        // inDYTipTime = SystemService.isInDYTipPeriod();
        if (!$scope.holdData && $scope.holdCode == 900) {
            X.tip($scope.holdTip);
            return false;
        }

        //追加保证金算法：（递延费+1）/100*总点买金 -（当前市值 + 可用点买金额）
        var ratio = Number($scope.queryData.deferConditionRatio),//递延费率
            money = Number($scope.initData.money),//点买金额
            market = Number($scope.initData.marketValue),//当前市值
            availableMoney = Number($scope.initData.availableMoney);//剩余可用点买金额
        var addPrinc = parseInt(((ratio + 1) / 100 * money) - (market + availableMoney));
        if (addPrinc < 0) {
            addPrinc = 0;
        }
        $scope.addPrinc = addPrinc;
        if (DYTip) {
            X.dialog.confirm('温馨提示：请您确认是否已经将今日递延<br/>费留在余额中等待扣款，如果继续操作可<br/>能会造成操盘中策略因递延费不足被平仓', {
                sureBtn: '确定', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $scope.showAddPrincipal = true;
                        });
                    }
                }
            });
            return;
        }

        $scope.showAddPrincipal = true;
    };

    //点击申请清算按钮
    $scope.applyClean = function () {
        if (!$scope.holdData && $scope.holdCode == 900) {
            X.tip($scope.holdTip);
            return false;
        }
        $scope.showApplyClean = true;
    }

    //点击期限续期按钮
    $scope.addDays = function () {
        // inDYTipTime = SystemService.isInDYTipPeriod();
        //没有操盘方案
        if (!$scope.holdData && $scope.holdCode == 900) {
            X.tip($scope.holdTip);
            return false;
        }

        //策略组到期前3天才能续期
        if ($scope.initData.availableDays >= 3) {
            X.dialog.alert('策略组到期前3天才能续期');
            return false;
        }

        getRenewal($scope.days, $scope.initData.id);

        $scope.principalAddDay = parseInt(Math.round($scope.initData.money / $scope.queryData.leverValue * 100) / 100); //履约保证金(ˇˍˇ) 向下取整
        $scope.deferAddDay = Math.floor(Math.round($scope.initData.money / 10000 * $scope.queryData.deferCharge * $scope.holdDays * 10000) / 100) / 100;//递延费(ˇˍˇ) 向下取两位

        getTips($scope.holdDays);

        $scope.$watch('holdDays', function () {
            $scope.deferAddDay = Math.floor(Math.round($scope.initData.money / 10000 * $scope.queryData.deferCharge * $scope.holdDays * 10000) / 100) / 100;
            getTips($scope.holdDays);
        })

        if (DYTip) {
            X.dialog.confirm('温馨提示：请您确认是否已经将今日递延<br/>费留在余额中等待扣款，如果继续操作可<br/>能会造成操盘中策略因递延费不足被平仓', {
                sureBtn: '确定', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $scope.showAddDay = true;
                        })
                    }
                }
            });
            return;
        }

        $scope.showAddDay = true;
    };

    //点击当前持仓
    $scope.currentPosition = function () {
        if (!$scope.holdData && $scope.holdCode == 900) {
            X.tip($scope.holdTip);
            return false;
        }
        $location.url('/TDTradeSell');
    }

    //点击交易记录
    $scope.tradeRecode = function () {
        if (!$scope.holdData && $scope.holdCode == 900) {
            X.tip($scope.holdTip);
            return false;
        }
        $location.url('/TDTradeResult');
    }

    //确认点买金
    $scope.defineAddMoney = function () {
        var totalPrice = $scope.addMoneyPrincipal + $scope.addMoneyDefer,
            mon = Math.round($scope.initData.money),
            totalMoney = $scope.addMon + mon;

        if (!reg.test($scope.addMoneynum)) {
            $scope.showAddMoney = false;
            X.dialog.alert('金额错误');
            return false;
        }

        if (totalMoney > $scope.maxMoney) {
            $scope.showAddMoney = false;
            X.dialog.alert('您的点买金额已超出限制');
            return false;
        }

        if (totalPrice > $scope.balance) {
            $scope.showAddMoney = false;
            X.dialog.confirm('当前余额不足，<br>请充值后再发起追加履约保证金。', {
                sureBtn: '去充值', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $location.url('/payType');
                        })
                    }
                }
            });
            return false;
        }
        X.loading.show();
        TradeService.addMoney($scope.initData.id, $scope.addMoneyPrincipal, $scope.addMon, $scope.addMoneyDefer).then(function (res) {
            var addMoney = res.data;
            if (addMoney.code == 100) {
                holding();
                getRenewal($scope.days, $scope.initData.id);
                X.tip(addMoney['data']);
            } else {
                X.tip(addMoney['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });

        $scope.showAddMoney = false;
    };
    //确认保证金money
    $scope.defineAddPrincipal = function () {
        if (!reg.test($scope.addPrinc)) {
            X.dialog.alert('金额错误');
            $scope.showAddPrincipal = false;
            return false;
        }

        var addPrincipalPrinc = parseInt($scope.addPrinc);
        if (addPrincipalPrinc > $scope.balance) {
            $scope.showAddPrincipal = false;
            X.dialog.confirm('当前余额不足，<br>请充值后再发起追加履约保证金。', {
                sureBtn: '去充值', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $location.url('/payType');
                        })
                    }
                }
            });
            return false;
        }

        X.loading.show();
        TradeService.addPrincipal($scope.initData.id, addPrincipalPrinc).then(function (res) {
            var principal = res.data;
            if (principal.code == 100) {
                holding();
                getRenewal($scope.days, $scope.initData.id);
                X.tip(principal['data']);
            } else {
                X.tip(principal['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });

        $scope.showAddPrincipal = false;
    };
    //确认清算
    $scope.defineApplyClean = function () {
        X.loading.show();
        TradeService.applyFinish($scope.initData.id).then(function (res) {
            var applyFin = res.data;
            if (applyFin.code == 100) {
                holding();
                X.tip(applyFin['data']);
            } else {
                X.tip(applyFin['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
        $scope.showApplyClean = false;
    };
    //确认续期
    $scope.defineAddDay = function () {
        X.loading.show();
        TradeService.extendScheme($scope.initData.id, $scope.holdDays, $scope.principalAddDay, $scope.diffBalance, $scope.deferAddDay).then(function (res) {
            var extendScheme = res.data;
            if (extendScheme.code == 100) {
                X.tip(extendScheme['data']);
                holding();
                getRenewal($scope.days, $scope.initData.id);
            } else {
                X.tip(extendScheme['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
        $scope.showAddDay = false;
    };
});
//历史策略组
myControllers.controller('historyStrategiesCtrl', function ($scope, $q, $location, TradeService) {
    var page = 1,
        pageSize = 5;
    $scope.historySchemeList = [];
    $scope.showNoData = false;

    function getHistorySchemes(page) {
        X.loading.show();
        TradeService.getHistorySchemes(page, pageSize).then(function (res) {
            var historySchemes = res.data;
            if (historySchemes.code == 100) {
                var historyData = historySchemes.data;
                init(historyData);
            } else {
                X.tip(historySchemes['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }


    function init(data) {
        var list = data.dataList;
        $scope.pageIndex = data.pageIndex;
        $scope.totalPage = data.totalPage;
        if (list.length == 0) {
            $scope.showNoData = true;
        }
        if ($scope.pageIndex == 1) {
            $scope.historySchemeList = list;
        } else {
            $scope.historySchemeList = $scope.historySchemeList.concat(list);
        }
    }

    //获取数据列表
    $scope.getDetailList = function (page) {
        page = page || 1;

        getHistorySchemes(page);
    };

    getHistorySchemes(page);
});
//历史策略组 单条策略组详情
myControllers.controller('strategyDetailCtrl', function ($scope, $q, $location, TradeService) {
    var id = $location.search()['id'],
        page = 1,
        pageSize = 10;

    if (!id) {
        $scope.showNoData = true;
        return false;
    }

    function getStrategyByPage(page) {
        X.loading.show();
        TradeService.TDGetSettleStrategyByPage(page, pageSize, id).then(function (res) {
            var strategyDetail = res.data;
            if (strategyDetail.code == 100) {
                var strategyData = strategyDetail.data;
                init(strategyData);
            } else {
                X.tip(strategyDetail['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    function init(data) {
        var list = data.dataList;
        $scope.pageIndex = data.pageIndex;
        $scope.totalPage = data.totalPage;

        if (list.length == 0) {
            $scope.showNoData = true;
        }

        if ($scope.pageIndex == 1) {
            $scope.list = list;
        } else {
            $scope.list = $scope.list.concat(list);
        }
    }

    //获取数据列表
    $scope.getDetailList = function (page) {
        page = page || 1;

        getStrategyByPage(page);
    };

    getStrategyByPage(page);
});
//一元实盘------------------------------------------------
//一元实盘活动页
myControllers.controller('OneYuanIntroduceCtrl', function ($scope, $location, TradeService) {
    var userType;
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
    $scope.showDialog = false;

    var windowHeight = window.screen.height;
    if (windowHeight > (50 + 180 + 386)) {
        $('.mod-detail')[0].style.height = windowHeight - (50 + 180) + 'px';
    }

    if (source && source == 'IOSAPP') {
        if (windowHeight > (50 + 180 + 386)) {
            $('.mod-detail')[0].style.height = windowHeight - 180 + 'px';
        }
    }
    $scope.showCloseDialog = function () {
        $scope.showDialog = !$scope.showDialog;
    };

    TradeService.initOneyuan().then(function (res) {
        var initData = res.data;
        if (initData.code == 100) {
            var data = initData.data;
            userType = data.userType || null;
        } else {
            X.tip(initData['resultMsg']);
        }
    }).catch(function () {
        X.tip('服务器请求异常');
    });


    $scope.goBuy = function () {
        if (!$scope.showHeader) {
            window.location.href = 'yztz://ycl.yztz.com/actTrade';
        } else if (!userType) {
            $location.url('/login?goURL=/oneYuanIntroduce');
        } else {
            $location.url('/oneYuanTrade');
        }
    }
});
//一元实盘点买
myControllers.controller('OneYuanTradeCtrl', function ($scope, $q, $location, $sce, initData, UserService, TradeService, StockService, SystemService) {
    var userType = initData.userType;

    if (initData == null) {
        X.tip('初始化信息加载错误，请重试');
        return;
    }

    //初始化风控参数
    var strRisk = JSON.parse(initData['strRisk']);
    var token = initData.token;
    var defaultStock = strRisk['defaultStock'] ? strRisk['defaultStock'].value : 0;

    var maxStockCount = parseInt(strRisk['maxStockCount'].value);//"单次单股最大交易数量"
    var priceRisk = strRisk['priceRisk'].value.split(',');
    var balance = initData['balance'];
    var tradingCountRatio = strRisk['tradingCountRatio'].value;

    var holiday = initData.isHoliday;
    var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
    $scope.tradeTime = strRisk['tradingTimeLimit'].value;
    // //配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
    var isTrade = strRisk['bussmannSwitch'] ? (strRisk['bussmannSwitch'].value != '1') : true;
    SystemService.setCurrentTime(initData['nowTime']);
    SystemService.setCurrentCurrencyType('CNY');
    SystemService.setHoliday(holiday);
    SystemService.setTradePeriod(tradeTime);

    //初始化业务变量
    var storage = window.localStorage, STOCKCODE = 'STOCKCODE', MINELIST = 'MINELIST';
    var stockCode = storage.getItem(STOCKCODE) || defaultStock || 'SH600570';
    var mineListStr = storage.getItem(MINELIST) || '';
    var isInTradeTime = false, isStopStock = false, newPrice = 0, dataIsLoad = true;
    var riskStocks = [];//限制股票
    var userData;//分时K线图
    var slineChart = null, klineChart = null, QUOTE_DATA, CACHE_KLINE, CACHE_WEEKKLINE, CACHE_MONTHKLINE;//分时K线图

    /*var backURL = $location.search()['backURL'] || '/index';*/

    $scope.uuid = SystemService.uuid();
    $scope.isRiskStock = false;
    $scope.showMenu = false;
    $scope.mineType = 'add';
    $scope.actType = 'sline';
    $scope.stopTimer = false;
    $scope.stock = {};
    $scope.btn = {
        className: 'disabled',
        btnText: '数据加载中',
        disabled: true
    };

    //获取风控参数，获取方案信息
    X.loading.show();
    $q.all({
        trade: TradeService.getRiskStock(),
        info: StockService.getStockInfo(stockCode),
        userInfo: UserService.getUserInfo()
    }).then(function (res) {
        var infoData = res.info.data,
            tradeData = res.trade.data;
        userData = res.userInfo.data;

        if (tradeData.code == 100 && infoData.code == 100) {
            riskStocks = tradeData.data;
            confirmMineType();
            checkRiskStock();
            processStockInfoData(infoData.data[stockCode]);
            init();
            $scope.changeTab('sline');
        } else {
            if (tradeData.code != 100) {
                X.tip(tradeData['resultMsg']);
            } else if (infoData.code != 100) {
                X.tip(infoData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //页面提示
    $scope.tips = function (title, msg) {
        X.dialog.info(title, msg);
    };

    $scope.changeTab = function (current) {
        $scope.actType = current;
        /*if (current == 'kline' && !klineChart) {
         getStockKline();
         } else if (current == 'sline' && !slineChart) {
         getStockSline();
         }*/

        if (current == 'sline' && !slineChart) {
            getStockSline();
        } else if (current == 'kline' && !CACHE_KLINE) {
            getStockKline(current);
            // $scope.status = 0;
        } else if (current == 'weekKline' && !CACHE_WEEKKLINE) {
            getStockKline(current);
            // $scope.status = 1;
        } else if (current == 'monthKline' && !CACHE_MONTHKLINE) {
            getStockKline(current);
            // $scope.status = 2;
        }

        if (current == 'kline' && CACHE_KLINE) {
            drawKLine(CACHE_KLINE, current);
            // $scope.status = 0;
        } else if (current == 'weekKline' && CACHE_WEEKKLINE) {
            drawKLine(CACHE_WEEKKLINE, current);
            // $scope.status = 1;
        } else if (current == 'monthKline' && CACHE_MONTHKLINE) {
            drawKLine(CACHE_MONTHKLINE, current);
            // $scope.status = 2;
        }
    };

    //添加或者删除自选
    $scope.addOrDelMine = function (stockCode, stockName) {
        if (!stockCode || !stockName) {
            return false;
        }
        var maxLen = 20;
        var mineListStr = storage.getItem(MINELIST) || '', mineArr = [];
        if (mineListStr == '' || mineListStr.indexOf(stockCode) == -1) {
            if (mineListStr != '') {
                mineArr = mineListStr.split(';');
            }
            if (mineArr.length >= maxLen) {
                X.dialog.alert('自选最多添加' + maxLen + '条记录');
                return;
            }
            mineArr.push(stockCode + ',' + stockName);
            storage.setItem(MINELIST, mineArr.join(';'));
            $scope.mineType = 'delete';
        } else {
            mineArr = mineListStr.split(';');
            for (var i = 0; i < mineArr.length; i++) {
                if (mineArr[i].indexOf(stockCode) != -1) {
                    mineArr.splice(i, 1);
                }
            }
            storage.setItem(MINELIST, mineArr.join(';'));
            $scope.mineType = 'add';
        }
    };


    //确认所选股票是否已经添加到自选，控制显示添加和删除
    function confirmMineType() {
        if (mineListStr == '') {
            $scope.mineType = 'add';
        } else {
            $scope.mineType = mineListStr.indexOf(stockCode) == -1 ? 'add' : 'delete';
        }
    }

    //判断是否是限制股
    function checkRiskStock() {
        for (var i = 0; i < riskStocks.length; i++) {
            var item = riskStocks[i];
            if (stockCode == item.stockCode) {
                $scope.isRiskStock = true;
                break;
            }
        }
    }

    //将数据绑定到页面scope,加载股票信息
    function processStockInfoData(data) {
        var newPrice = data.newPrice;
        var canBuyNum = (2000 / (newPrice * tradingCountRatio) / 100) | 0;
        canBuyNum = canBuyNum * 100;
        var lastClosePrice = data.lastClosePrice;
        var isStop = isStopStock = (newPrice == 0);
        var style = '', dealNum = '', dealPrice = '';
        var diff = 0.00, rate = 0.00;
        if (!isStop) {
            diff = newPrice - lastClosePrice;
            rate = diff / lastClosePrice * 100;
            diff = diff.toFixed(2);
            rate = rate.toFixed(2);
            style = newPrice > lastClosePrice ? 'txt-red' : newPrice < lastClosePrice ? 'txt-green' : 'txt-white';
            dealNum = processNum(data, 'todayDealNum');
            dealPrice = processNum(data, 'todayDealPrice');
        }
        $scope.stock = {
            "stockLabel": data.stockLabel, //代码
            "stockName": data.stockName,//名称
            "price": newPrice,//当前价
            "lastClosePrice": lastClosePrice,//昨收
            isStop: isStop,
            diff: diff,//涨跌值
            rate: rate,//涨跌幅
            style: style,
            dealNum: dealNum,
            dealPrice: dealPrice,
            'canBuyNum': canBuyNum,
            "openPrice": data.openPrice,//今开
            "highPrice": data.highPrice,//最高
            "lowPrice": data.lowPrice,//最低
            "limitDownPrice": parseFloat(data.limitDownPrice),//跌停
            "limitUpPrice": parseFloat(data.limitUpPrice),//涨停
            "amplitude": data.amplitude,//振幅
            "todayDealNum": data.todayDealNum,//成交量
            "todayDealPrice": data.todayDealPrice,//成交金额
            "buyPrice": isStop ? [0, 0, 0, 0, 0] : data.buyPrice,//买12345
            "buyNum": isStop ? [0, 0, 0, 0, 0] : data.buyNum,
            "sellPrice": isStop ? [0, 0, 0, 0, 0] : data.sellPrice,//卖12345
            "sellNum": isStop ? [0, 0, 0, 0, 0] : data.sellNum
        };

        QUOTE_DATA = {
            commodityTitle: 'STOCK',
            contractNo: data.stockLabel,
            time: data['time'],
            openPrice: data['openPrice'],
            yesterdayPrice: data['lastClosePrice'],
            highPrice: data['highPrice'],
            lowPrice: data['lowPrice'],
            newPrice: data['newPrice'],
            limitDownPrice: X.toFloat(data['limitDownPrice']),
            limitUpPrice: X.toFloat(data['limitUpPrice'])
        };

        newSlineQuoteData(QUOTE_DATA);
        newKlineQuoteData(QUOTE_DATA);
    }

    //初始化获取股票实时信息，并将获取实时信息添加到定时器
    function init() {

        getStockInfo(true);
        X.engine.addTask(getStockInfo, 1000);
        X.engine.start();
    }

    //获取股票分时信息
    function getStockSline() {
        StockService.getSLine(stockCode).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                drawSLine(data.data);
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //获取股票K线信息
    function getStockKline(current) {
        /*StockService.getKLine(stockCode).then(function (res) {
         var data = res.data;
         if (data.code == 100) {
         drawKLine(data.data);
         } else {
         X.tip(data['resultMsg']);
         }
         }).catch(function () {
         X.tip('服务器请求异常');
         });*/

        var http;

        if (current == 'kline') {
            http = StockService.getKLine(stockCode);
        } else if (current == 'weekKline') {
            http = StockService.getWMKline(stockCode, current);
        } else if (current == 'monthKline') {
            http = StockService.getWMKline(stockCode, current);
        }

        http.then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                drawKLine(data.data, current);
            } else {
                X.tip(data['resultMsg'])
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        })
    }

    //绘制分时图
    function drawSLine(slineData) {
        if (!QUOTE_DATA)return;
        slineData = slineData || [];
        var data = {}, lastTime;
        slineData.forEach(function (obj, i) {
            lastTime = X.formatDate(obj.time, 'hm') - 0;
            data[lastTime] = {
                current: X.toFloat(obj['price']),
                volume: X.toFloat(obj['volume']),
                time: lastTime
            };
        });

        slineChart = new X.Sline({wrap: 'sline-wrap-' + $scope.uuid});
        slineChart.draw({
            data: data,
            quoteTime: lastTime,
            close: QUOTE_DATA['yesterdayPrice'],
            high: QUOTE_DATA['highPrice'],
            low: QUOTE_DATA['lowPrice'],
            limitUp: QUOTE_DATA['limitUpPrice'],
            limitDown: QUOTE_DATA['limitDownPrice'],
            period: SystemService.getRealPeriod('STOCK', lastTime),
            isStock: true,
            isIntl: false,
            code: stockCode
        });
    }

    //绘制K线图
    function drawKLine(klineData, type) {
        klineData = klineData || [];
        var data = [];
        klineData.forEach(function (o, i) {
            data[i] = {
                time: o['time'].length == 8 ? o['time'] : X.formatDate(o['time'], 'YMD'),
                open: o['open'],
                close: o['last'],
                high: o['high'],
                low: o['low'],
                price: o['price']
            }
        });
        /*klineChart = new X.Kline({wrap: 'kline-wrap-' + $scope.uuid});
         klineChart.draw(data);
         CACHE_KLINE = data;*/

        if (!klineChart) {
            klineChart = new X.Kline({wrap: 'kline-wrap-' + $scope.uuid})
        }

        klineChart.draw(data);
        if (type == 'kline') {
            CACHE_KLINE = data;
        } else if (type == 'weekKline') {
            CACHE_WEEKKLINE = data;
        } else {
            CACHE_MONTHKLINE = data;
        }
    }

    //获取股票信息
    function getStockInfo(flag) {
        X.log('行情定时器运行中。。。');
        //判断是否是在交易时间段内
        if (isTrade) {
            isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            if (isInTradeTime) {
                if ($scope.isRiskStock) {//风险股按钮控制
                    $scope.btn = {
                        className: 'disabled',
                        btnText: '立即点买',
                        disabled: true
                    };
                } else if (QUOTE_DATA && QUOTE_DATA['newPrice'] == 0) {//停牌股按钮控制
                    $scope.btn = {
                        className: 'disabled',
                        btnText: '立即点买',
                        disabled: true
                    };
                } else {
                    $scope.btn = {
                        className: 'orange',
                        btnText: '立即点买',
                        disabled: false
                    };
                }
            } else {
                $scope.btn = {
                    className: 'disabled',
                    btnText: '非点买时段',
                    disabled: true
                };
            }
        } else {
            isInTradeTime = false;
            $scope.btn = {
                className: 'disabled',
                btnText: '暂停交易',
                disabled: true
            };
        }

        var isInQuoteTime = SystemService.isInPeriod('STOCK', 'quote');

        if (!flag && !isInQuoteTime) {
            $scope.$apply();
        }

        //判断是否是在行情时间段内
        if (dataIsLoad && isInQuoteTime) {
            dataIsLoad = false;
            StockService.getStockInfo(stockCode).then(function (res) {
                dataIsLoad = true;
                var data = res.data;
                if (data.code == 100) {
                    processStockInfoData(data.data[stockCode]);
                } else {
                    X.tip(data['resultMsg']);
                }
            }).catch(function () {
                X.tip('服务器请求异常');
            });
        }
    }

    //解析数字格式
    function processNum(data, type) {
        var num = data[type], unit = type == 'todayDealNum' ? '手' : '元';
        if (num > 100000000) {
            return (num / 100000000).toFixed(2) + '亿' + unit;
        }
        if (num > 10000) {
            return (num / 10000).toFixed(2) + '万' + unit;
        }
        return num + unit;
    }

    //更新最新分时信息
    function newSlineQuoteData(quote) {
        var price = quote['newPrice'] == 0 ? quote['yesterdayPrice'] : quote['newPrice'];
        var o = {
            current: price,
            volume: 0,
            time: X.formatDate(quote.time, 'hm') - 0
        };

        slineChart && slineChart.perDraw(o, {
            quoteTime: o.time,
            close: quote['yesterdayPrice'],
            high: quote['highPrice'],
            low: quote['lowPrice'],
            limitUp: quote['limitUpPrice'],
            limitDown: quote['limitDownPrice'],
            period: SystemService.getRealPeriod('STOCK', o.time),
            isStock: true,
            code: stockCode
        });
    }

    //更新最新K线信息
    function newKlineQuoteData(quote) {
        // 累加和更新数据//如果股票停牌则不放到K线数据中PS：其实是可以看，接口数据错误所以先不加
        if (quote['newPrice'] == 0 || !CACHE_KLINE || !CACHE_KLINE.length) {
            return;
        }
        var o = {
            time: X.formatDate(quote.time, 'YMD'),
            open: quote['openPrice'],
            close: quote['yesterdayPrice'],
            high: quote['highPrice'],
            low: quote['lowPrice'],
            price: quote['newPrice']// 即时数据，使用当前价格
        };
        if ($scope.actType == 'kline') {
            var last = CACHE_KLINE[CACHE_KLINE.length - 1];

            if (last.time === o.time) {
                CACHE_KLINE[CACHE_KLINE.length - 1] = o;
            } else {
                CACHE_KLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_KLINE);
        } else if ($scope.actType == 'weekKline') {
            var last = CACHE_WEEKKLINE[CACHE_WEEKKLINE.length - 1];

            if (last.time === o.time) {
                CACHE_WEEKKLINE[CACHE_WEEKKLINE.length - 1] = o;
            } else {
                CACHE_WEEKKLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_WEEKKLINE);
        } else if ($scope.actType == 'monthKline') {
            var last = CACHE_MONTHKLINE[CACHE_MONTHKLINE.length - 1];

            if (last.time === o.time) {
                CACHE_MONTHKLINE[CACHE_MONTHKLINE.length - 1] = o;
            } else {
                CACHE_MONTHKLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_MONTHKLINE);
        }
    }

    //发起交易
    $scope.toTrade = function () {
        if (userType == null) {
            $location.url('/login?goURL=/oneYuanTrade');
            return false;
        }
        if (!SystemService.isInPeriod('STOCK', 'trade')) {
            X.dialog.alert('当前为非点买时段，无法发起策略');
            return false;
        }

        if ($scope.isRiskStock) {
            X.dialog.alert('【' + $scope.stock.stockName + '】今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }

        var currPrice = $scope.stock['price'], closePrice = $scope.stock['lastClosePrice'];
        var diff = currPrice - closePrice, rote = (diff / closePrice * 100).toFixed(2);
        //风险股票
        if (rote > X.toFloat(priceRisk[1]) || rote < X.toFloat(priceRisk[0])) {
            X.dialog.alert('该股今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }

        if (isStopStock) {
            X.dialog.alert('停牌股无法进行交易<br>请更换其他能够正常交易的股票');
            return false;
        }
        /*if (userType == 2) {
         X.dialog.alert('该活动只限新用户(2016.xx.xx日起新注册用户)');
         return false;
         }*/
        if (userType == 3) {
            X.dialog.alert('您已参加过此活动');
            return false;
        }
        if (userType == 4) {
            X.dialog.alert('您已经参与过A股实盘交易，无法体验');
            return false;
        }

        if (userData.data.named == false) {
            X.dialog.confirm('您还未实名认证，请先实名认证', {
                notify: function (nt) {
                    if (nt == 1) {
                        $location.url('/identification?goURL=/oneYuanTrade/');
                    }
                }
            });
            return false;
        }

        if (balance < 1) {
            X.dialog.confirm('当前余额不足，<br>请充值后再发起策略。', {
                sureBtn: '去充值', notify: function (nt) {
                    if (nt == 1) {
                        $scope.$apply(function () {
                            $location.url('/payType?goURL=/oneYuanTrade');
                        })
                    }
                }
            });
            return false;
        }

        if (!isTrade) {
            X.dialog.alert('暂停交易');
            return false;
        }


        trade();

    };

    //交易发起
    function trade() {
        $scope.btn = {
            className: 'disabled',
            btnText: '数据处理中',
            disabled: true
        };

        X.loading.show();
        TradeService.oneYuanCreate($scope.stock['stockLabel'], $scope.stock['canBuyNum'], token).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('策略发起成功');
                //埋点：交易-A股
                zhuge.track("交易", {
                    "名称": "A股"
                });
                $location.url('/oneYuanTradeSell');
            } else {
                X.dialog.alert(data['resultMsg']);
                token = data.data.token;
                $scope.btn = {
                    className: 'orange',
                    btnText: '提交',
                    disabled: false
                };
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //controller卸载的时候清除定时器任务
    $scope.$on('$destroy', function () {
        X.engine.destroy();
    });
});
//一元实盘点卖
myControllers.controller('OneYuanTradeSellCtrl', function ($scope, $q, $interval, TradeService, StockService, SystemService) {
    var timer, first = true, tradeData = null, quoteData = null, isOK = false;
    $scope.tradeState = {
        1: '等待接单',
        2: '正在委托买入',
        3: '正在委托买入',
        4: '点卖',
        5: '正在委托卖出',
        6: '正在委托卖出',
        7: '正在清算',
        8: '已清算'
    };
    $scope.dataList = [];
    $scope.dataMap = {};
    // $scope.unHanldHoldDeferCharge = 0;//历史拖欠递延费
    // $scope.tradingDeferCharge = 0;//应缴递延费
    $scope.dataIsLoad = false;
    $scope.isInTradeTime = false;
    // $scope.isInJJPeriod = true;
    // $scope.isInDYFShowTime = false;
    $scope.isHoliday = true;
    $scope.todayStartTime = 0;
    $scope.showMenu = false;

    X.loading.show();
    //      初始化交易数据
    $q.all({trade: TradeService.initOneyuan()}).then(function (res) {
        var tradeData = res.trade.data;
        if (tradeData.code == 100) {
            var data = tradeData.data;
            var strRisk = JSON.parse(data['strRisk']);
            $scope.isHoliday = data['isHoliday'];
            // var holiday = SystemService.parseHoliday(data['holidays']);
            var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
            //判断是否在交易时间
            SystemService.setCurrentTime(data['nowTime']);
            SystemService.setCurrentCurrencyType('CNY');
            // SystemService.setHoliday(holiday);
            SystemService.setTradePeriod(tradeTime);
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            $scope.isInJJPeriod = SystemService.isInJJPeriod();

            initTodayStartTime(data['nowTime']);
            startTimer();
        } else {
            X.tip(tradeData['resultMsg']);
        }
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //点卖发起
    $scope.sale = function (trade) {
        var html = '<div class="mod-sale-confirm-wrap">';
        html += '<div class="item">股票名称:<span class="fr">' + trade.stockName + '</span></div>';
        html += '<div class="item">股票代码:<span class="fr">' + trade.stockCode.substr(-6) + '</span></div>';
        html += '<div class="item">委托价格:<span class="fr">市价</span></div>';
        html += '<div class="item">卖出数量:<span class="fr">' + trade.volumeHold + '股</span></div>';
        html += '<div class="item">持仓天数:<span class="fr">' + trade.holdDays + '天</span></div>';
        if (trade.profit > 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-red">+' + trade.profit.toFixed(2) + '元</span></div>';
        } else if (trade.profit < 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-green">' + trade.profit.toFixed(2) + '元</span></div>';
        } else {
            html += '<div class="item">浮动盈亏:<span class="fr">' + trade.profit.toFixed(2) + '元</span></div>';
        }

        /*html += '<div class="item"><label><input id="agreeDefer" type="checkbox" checked> 是否递延指令</label></div>';
         html += '<div class="txt-grey txt-s12">注：点卖指令可能因跌停导致无法成交，默认至下一个交易日挂单交易。浮动盈亏仅供参考，具体以实际成交为准。</div>';*/
        html += '</div>';
        X.dialog.confirm(html, {
            title: '点卖确认', notify: function (nt) {
                if (nt == 1) {
                    var agreeDefer = document.getElementById('agreeDefer');
                    sale(trade.id, false);
                }
            }
        })
    };
    //部分成交
    $scope.showPartDeal = function (trade) {
        var list = trade.tradingRecordList, volumeDeal = trade.volumeHold;
        var table = '';
        table += '<table>';
        table += '<tr><td>成交时间</td><td>数量</td><td class="txt-right">价格</td></tr>';
        for (var i = 0; i < list.length; i++) {
            var obj = list[i];
            table += '<tr><td>' + X.formatDate(new Date(obj.time), 'Y-M-D') + '</td><td>' + obj.amount + '</td><td class="txt-right">' + obj.price.toFixed(2) + '</td></tr>';
            volumeDeal += obj.amount;
        }
        table += '</table>';
        var tipHtml = '<div class="info">行情波动过大，造成部分成交，原持有数量' + volumeDeal + '股，现剩余' + trade.volumeHold + '股，请处理剩余数量，以便结算！</div>';
        X.dialog.alert('<div class="mod-part-deal-wrap">' + tipHtml + table + '</div>');
    };

    //初始化定时器启动方法
    function startTimer() {
        isOK = true;
        getData();
        timer = $interval(function () {
            X.log('点卖定时器运行中。。。');
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            $scope.isInJJPeriod = SystemService.isInJJPeriod();
            if (first || (!$scope.isHoliday && $scope.isInTradeTime && isOK)) {
                isOK = false;
                getData();
            }
        }, 1000);
    }

    //初始化今天的开始时间
    function initTodayStartTime(serverTime) {
        serverTime = serverTime || Date.now();
        var now = new Date(serverTime);
        var yyyy = now.getFullYear(), MM = now.getMonth(), dd = now.getDate();
        var today = new Date(yyyy, MM, dd, 0, 0, 0);
        $scope.todayStartTime = today.getTime();
    }

    //获取数据
    function getData() {
        var http;
        if (first) {//                  策略
            http = TradeService.oneYuanGetSaleStrategy();
        } else {
            http = TradeService.oneYuanGetSaleStrategyByMemca();
        }
        first = false;
        http.then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                tradeData = data.data;
                X.loading.hide();
                if (tradeData['dataList'].length > 0) {
                    var stocks = tradeData['dataList'][0].stockCode || '';
                    if (stocks == '' || !stocks) {
                        $scope.dataList = [];
                    }
                    StockService.getStockInfo(stocks).then(function (res) {
                        var data = res.data;
                        if (data.code == 100) {
                            quoteData = data.data;
                            processData();
                        } else {
                            initNoDataQuote();
                            //X.tip(data['resultMsg']);
                        }
                    }).catch(function () {
                        X.tip('服务器请求异常');
                    });
                } else {
                    $scope.dataList = [];
                }
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //组合数据
    function processData() {
        $scope.dataIsLoad = true;
        isOK = true;
        X.loading.hide();
        if (tradeData == null || quoteData == null) {
            $scope.dataList = [];
            return;
        }
        var dataList = tradeData.dataList;
        $.each(dataList, function (i, item) {
            var quote = quoteData[item.stockCode];
            item.quotePrice = quote ? quote['newPrice'] : 0;
            item['lastClosePrice'] = quote['lastClosePrice'];
            if (item['buyPriceDeal'] != 0 && item.quotePrice != 0 && item['volumeHold'] != 0) {
                item.profit = (item.quotePrice - item['buyPriceDeal']) * item['volumeHold'];
            } else {
                item.profit = (item['lastClosePrice'] - item['buyPriceDeal']) * item['volumeHold'];
            }
        });
        $scope.dataList = dataList;
    }

    //点卖
    function sale(tradeID, isAlwaysClose) {
        if (!$scope.isInTradeTime) {
            X.tip('非交易时间不能交易');
            return;
        }
        X.loading.show();
        TradeService.oneYuanCloseStrategy(tradeID, isAlwaysClose).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                //window.location.reload();
                X.tip('点卖策略成功');
                first = true;
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //当没有行情时
    function initNoDataQuote() {
        $scope.dataIsLoad = true;
        isOK = true;
        X.loading.hide();
        var dataList = tradeData['dataList'];
        if (tradeData.length > 0) {
            $.each(dataList, function (i, item) {
                item.quotePrice = 0;
                /*if (item['buyPriceDeal'] != 0 && item.quotePrice != 0 && item['volumeHold'] != 0) {
                 item.profit = (item.quotePrice - item['buyPriceDeal']) * item['volumeHold'];
                 } else {
                 item.profit = 0;
                 }*/
                item.profit = 0;
            });
        }
        $scope.dataList = dataList;
    }


    function clearTimer() {
        if (timer) {
            $interval.cancel(timer);
            timer = undefined;
        }
    }

    $scope.$on('$destroy', function () {
        clearTimer();
    });
});
//一元实盘结算
myControllers.controller('OneYuanTradeResultCtrl', function ($scope, $location, $q, TradeService) {
    $scope.settleList = [];
    $scope.showMenu = false;

    $scope.getSettleList = function () {
        X.loading.show();
        TradeService.oneYuanGetSettleStrategy().then(function (res) {
            var settleListData = res.data;
            if (settleListData.code == 100) {
                var data = settleListData.data;
                $scope.settleList = data;
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    $scope.getSettleList();

    $scope.toDetail = function (tradeID) {
        $location.url('/tradeDetail/' + tradeID + '?sort=oneYuan');
    }
});
//-------------------------------------------------------
//支付宝认证
myControllers.controller('AliPayIdentificationCtrl', function ($scope, $interval, $location, $q, UserService) {
    $scope.alipayAccount = '';
    $scope.tradeAmount = '';
    $scope.tradeNo = '';
    $scope.btnState = 'disable';
    var timer = null;

    function isMoney(data, isPositive) {
        return isPositive ? /^\d+(\.\d{0,2})?$/.test(data) && parseFloat(data) > 0 : /^(-)?\d+(\.\d{1,2})?$/.test(data);
    }

    $scope.submitAliPay = function () {
        if ($scope.alipayAccount == '' || $scope.tradeAmount == '' || $scope.tradeNo == '')return;

        if (!$scope.tradeAmount && $scope.tradeAmount != '') {
            $scope.tradeAmount = '';
        }

        /* if ($scope.alipayAccount == '') {
         X.tip('请输入支付宝账号');
         return;
         } else*/
        if (!X.isMobile($scope.alipayAccount) && !X.isEmail($scope.alipayAccount)) {
            X.tip('支付宝账号输入错误');
            return;
        } /*else if ($scope.tradeAmount == '') {
         X.tip('请输入充值金额');
         return;
         }*/ else if ($scope.tradeAmount < 1) {
            X.tip('充值金额最低1元');
            return;
        } else if (!isMoney($scope.tradeAmount, true)) {
            X.tip('充值金额错误');
            return;
        } else if ($scope.tradeAmount > 100000) {
            X.tip('充值金额最高10万元');
            return;
        } /*else if ($scope.tradeNo == '') {
         X.tip('请输入支付宝订单号');
         return;
         }*/ else if ($scope.tradeNo.length < 12) {
            X.tip('支付宝订单号错误');
            return;
        }

        UserService.bindingAlipayAccount($scope.alipayAccount, $scope.tradeAmount, $scope.tradeNo).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('认证成功');
                $location.url('/myInfo');
            } else if (data.code == 501) {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function timerFnc() {
        timer = $interval(function () {
            if ($scope.alipayAccount != '' && $scope.tradeAmount != '' && $scope.tradeNo != '') {
                $scope.btnState = 'orange';
            } else {
                $scope.btnState = 'disable';
            }
        }, 100);
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        timer && $interval.cancel(timer)
    });

    timerFnc();
});
//模拟活动页
myControllers.controller('SimulateStockCtrl', function ($scope, $q, $location, $interval, SimulateService) {
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }

    var _timer;
    $scope.rankIndex = 0;//Top榜单下标
    $scope.userDetailList = [];
    $scope.NoMatchData = false;
    $scope.showRule = false;
    $scope.showUserDetail = false;
    $scope.NoUserDetail = false;
    $scope.btn = {
        className: 'disable',
        btnText: '立即报名',
        disabled: true
    };

    X.loading.show();
    $q.all({
        matchInfo: SimulateService.getMatchInfo(),
        simSpecial: SimulateService.simSpecial(),
        userRanks: SimulateService.getUserRanks()
    }).then(function (res) {
        var matchInfo = res.matchInfo.data,
            simInfo = res.simSpecial.data,
            ranksInfo = res.userRanks.data;
        if (matchInfo.code == 100 && simInfo.code == 100 && ranksInfo.code == 100) {
            var matchData = matchInfo.data,
                simData = simInfo.data,
                ranksData = ranksInfo.data;
            initMatchData(matchData);
            initSimData(simData);
            initRanksData(ranksData);
            $scope.showRank($scope.rankIndex);
        } else {
            if (matchInfo.code != 100) {
                X.tip(matchInfo['resultMsg']);
            } else if (simInfo.code != 100) {
                X.tip(simInfo['resultMsg']);
            } else if (ranksInfo.code != 100) {
                X.tip(ranksInfo['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    $scope.showRank = function (index) {
        var rank = $scope.ranks[index],
            rankList = [];
        $scope.rankIndex = index;
        $scope.count = rank.count;
        rankList[0] = rank.userRankDOs[1];
        rankList[1] = rank.userRankDOs[0];
        rankList[2] = rank.userRankDOs[2];
        $scope.rankList = rankList;
    }

    $scope.showDetail = function (id) {
        SimulateService.getUserDetailInfo(id).then(function (res) {
            var userDetailData = res.data;
            if (userDetailData.code == 100) {
                var userDetail = userDetailData.data;
                initUserDetail(userDetail);
            } else {
                //501无数据的时候需要处理
                $scope.showUserDetail = true;
                $scope.NoUserDetail = true;
                /*X.tip(userDetailData['resultMsg']);*/
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    $scope.to = function () {
        if (!$scope.showHeader) {
            window.location.href = 'yztz://ycl.yztz.com/simTrade';
        } else {
            //未登陆
            if (!$scope.simData.isLogin) {
                $location.url('/login?goURL=/simulateStock');
                return false;
            }

            //未实名认证
            if (!$scope.simData.authenFlag) {
                X.dialog.confirm('您还未实名认证，请先实名认证', {
                    notify: function (nt) {
                        if (nt == 1) {
                            $scope.$apply(function () {
                                $location.url('/identification?goURL=/simulateStock');
                            });
                        }
                    }
                });
                return false;
            }

            //未报名
            if (!$scope.simData.strategyUserFlag) {
                X.loading.show();
                SimulateService.joinStrategyComp().then(function (res) {
                    var strategyData = res.data;
                    if (strategyData.code == 100) {
                        X.dialog.alert('报名成功');
                        getSimSpecial();
                    } else {
                        X.tip(strategyData['resultMsg']);
                    }
                    X.loading.hide();
                }).catch(function () {
                    X.tip('服务器请求异常');
                });
                return false;
            }

            //已登录，已报名，已实名认证
            $location.url('/simulateTrade');
        }
    }

    function getSimSpecial() {
        SimulateService.simSpecial().then(function (res) {
            var simInfo = res.data;
            if (simInfo.code == 100) {
                var simData = simInfo.data;
                initSimData(simData);
            } else {
                X.tip(simInfo['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    function initMatchData(data) {
        if (!data) {
            $scope.NoMatchData = true;
            return false;
        }
        var match = data;
        $scope.match = match.slice(0, 3);
        $scope.matchNoTop3 = match.slice(3);
    }

    function initSimData(data) {
        var isLogin = data['authenticatedFlag'],//是否登录
            strategyUserFlag = data['strategyUserFlag'],//是否报名
            authenFlag = data['authenFlag'],//是否实名认证
            gameStatus = data['gameStatus'],//比赛情况1、未开始；2、进行中；3、已结束
            gameTime = data['gameTime'],//比赛时间
            resultReleaseTime = data['resultReleaseTime'],//发放奖金日期
            rowNum = data['rowNum'],//比赛名次
            sysdate = data['sysdate'],//系统时间
            gameOverDate = data['gameOverDate'],//比赛结束时间
            userCount = data['userCount'] || 0,//参赛总人数
            simAsset = data['simAsset'];//模拟资金

        var timeList = gameTime.split(':'),
            gameTime = timeList[1];
        $scope.season = timeList[0];//百强榜单赛季

        $scope.simData = {
            isLogin: isLogin,
            strategyUserFlag: strategyUserFlag,
            authenFlag: authenFlag,
            gameStatus: gameStatus,
            gameTime: gameTime,
            userCount: userCount,
            rowNum: rowNum,
            releaseDate: getDate(resultReleaseTime),
            simAsset: X.formatNumber(simAsset),
            sysdate: sysdate,
            gameOverDate: gameOverDate
        };

        //未报名以及比赛未开始
        if (!strategyUserFlag && gameStatus == 1) {
            $scope.btn = {
                className: 'red',
                btnText: '立即报名',
                disabled: false
            };
            //报名以及比赛还未开始
        } else if (strategyUserFlag && gameStatus == 1) {
            $scope.btn = {
                className: 'disable',
                btnText: '您已报名',
                disabled: true
            };
            //未报名以及比赛开始
        } else if (!strategyUserFlag && gameStatus == 2) {
            $scope.btn = {
                className: 'red',
                btnText: '立即报名',
                disabled: false
            };
            //报名以及比赛开始
        } else if (strategyUserFlag && gameStatus == 2) {
            $scope.btn = {
                className: 'red',
                btnText: '立即参赛',
                disabled: false
            };
            //未登录，未报名以及比赛结束 可点击
        } else if (!isLogin && !strategyUserFlag && gameStatus == 3) {
            $scope.btn = {
                className: 'red',
                btnText: '比赛已经结束',
                disabled: false
            };
            //未报名以及比赛结束
        } else if (!strategyUserFlag && gameStatus == 3) {
            $scope.btn = {
                className: 'disable',
                btnText: '比赛已经结束',
                disabled: true
            };
            //已报名以及比赛结束
        } else if (strategyUserFlag && gameStatus == 3) {
            $scope.btn = {
                className: 'red',
                btnText: '比赛已经结束',
                disabled: false
            };
        }

        getTime(gameTime);
        getTimeNoYear(gameTime);
        timer();
    }

    function initRanksData(data) {
        $scope.rankLen = data.length;
        $scope.ranks = data;
    }

    function initUserDetail(data) {
        var len = data.length;
        if (len == 0) {
            $scope.showUserDetail = true;
            $scope.NoUserDetail = true;
            return false;
        }

        $scope.userDetailList = data;
        $scope.NoUserDetail = false;
        $scope.showUserDetail = true;
    }

    function getTime(time) {
        var timeList = time.split('—');
        var startTime = timeList[0],
            endTime = timeList[1];
        $scope.startDate = getDate(startTime);
        $scope.endDate = getDate(endTime);
    }

    function getTimeNoYear(time) {
        var timeList = time.split('—');
        var startTime = timeList[0].split('.'),
            endTime = timeList[1].split('.');
        $scope.timeNoYear = startTime[1] + '.' + startTime[2] + '—' + endTime[1] + '.' + endTime[2];
    }

    function getDate(d) {
        var time = d.split('.'), len = time.length;
        var date = time[len - 2] + '月' + time[len - 1] + '日';
        return date;
    }

    function timer() {
        $scope.simData.gameOverDate = new Date($scope.simData.gameOverDate);
        var d = new Date($scope.simData.sysdate);
        var ts = $scope.simData.gameOverDate - d;

        if (ts <= 0) {
            ts = 0;
            clearTimer();
        }
        var dd = parseInt(ts / 1000 / 60 / 60 / 24, 10);
        var hh = parseInt(ts / 1000 / 60 / 60 % 24, 10);
        var mm = parseInt(ts / 1000 / 60 % 60, 10);
        var ss = parseInt(ts / 1000 % 60, 10);
        dd = checkTime(dd);
        hh = checkTime(hh);
        mm = checkTime(mm);
        ss = checkTime(ss);

        var time = dd + '' + hh + mm + ss;
        var iSpan = $('#timer span');
        for (var i = 0; i < iSpan.length; i++) {
            iSpan[i].innerHTML = time[i];
        }
        var year = d.getFullYear();
        var month = d.getMonth();
        var day = d.getDate();
        var hour = d.getHours();
        var min = d.getMinutes();
        var s = d.getSeconds();
        $scope.simData.sysdate = new Date(year, month, day, hour, min, s + 1);
    }

    _timer = $interval(timer, 1000);

    function checkTime(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    function clearTimer() {
        if (_timer) {
            $interval.cancel(_timer);
            _timer = undefined;
        }
    }

    $scope.$on('$destroy', function () {
        clearTimer();
    });
});
//模拟炒股点买行情页面
myControllers.controller('SimulateTradeCtrl', function ($scope, $q, $sce, $location, $routeParams, $interval, initData, StockService, TradeService, SystemService, SimulateService) {
    if (initData == '您未报名') {
        X.dialog.alert(initData, {
            notify: function () {
                $scope.$apply(function () {
                    $location.url('/index');
                });
            }
        });
        return;
    }
    if (initData == null) {
        X.tip('初始化信息加载错误，请重试');
        return;
    }
    var gameTimeStatus = initData['gameTimeStatus'];
    var strRisk = JSON.parse(initData['strategyRisk']);
    var defaultStock = strRisk['defaultStock'].value;
    var priceRisk = strRisk['priceRisk'].value.split(',');

    var holiday = SystemService.parseHoliday(initData['holidays']);
    var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
    //配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
    var isTrade = strRisk['bussmannSwitch'].value != '1';
    SystemService.setCurrentTime(initData['nowTime']);
    SystemService.setCurrentCurrencyType('CNY');
    SystemService.setHoliday(holiday);
    SystemService.setTradePeriod(tradeTime);

    var storage = window.localStorage, STOCKCODE = 'STOCKCODE', MINELIST = 'MINELIST';
    var stockCodeFromIndex = $location.search()['stock'];
    var stockCode = stockCodeFromIndex || storage.getItem(STOCKCODE) || defaultStock || 'SH600570';
    var mineListStr = storage.getItem(MINELIST) || '';
    var isInTradeTime = false, newPrice = 0, dataIsLoad = true;
    var riskStocks = [];//限制股票
    // var slineChart = null, klineChart = null, QUOTE_DATA, CACHE_KLINE;//分时K线图
    var slineChart = null, klineChart = null, QUOTE_DATA, CACHE_KLINE, CACHE_WEEKKLINE, CACHE_MONTHKLINE;//分时K线图

    /*var goURL = $location.search()['goURL'] || '/index';*/

    $scope.uuid = SystemService.uuid();
    $scope.isRiskStock = false;
    $scope.showMenu = false;
    $scope.mineType = 'add';
    $scope.actType = 'sline';
    $scope.stopTimer = false;
    $scope.stock = {};
    $scope.btn = {
        className: 'disabled',
        btnText: '数据加载中',
        disabled: true
    };
    X.loading.show();
    $q.all({
        trade: TradeService.getRiskStock(),
        info: StockService.getStockInfo(stockCode),
        simSpecial: SimulateService.simSpecial()
    }).then(function (res) {
        var infoData = res.info.data, tradeData = res.trade.data, simSpecialData = res.simSpecial.data;
        if (tradeData.code == 100 && infoData.code == 100 && simSpecialData.code == 100) {
            riskStocks = tradeData.data;
            $scope.simSpecial = simSpecialData.data;
            confirmMineType();
            checkRiskStock();
            processStockInfoData(infoData.data[stockCode]);
            init();
            $scope.changeTab('sline');
        } else {
            if (tradeData.code != 100) {
                X.tip(tradeData['resultMsg']);
            } else if (infoData.code != 100) {
                X.tip(infoData['resultMsg']);
            } else if (simSpecialData.code != 100) {
                X.tip(simSpecialData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    initSimAsset();

    $scope.changeTab = function (current) {
        $scope.actType = current;
        /*if (current == 'kline' && !klineChart) {
         getStockKline();
         } else if (current == 'sline' && !slineChart) {
         getStockSline();
         }*/
        if (current == 'sline' && !slineChart) {
            getStockSline();
        } else if (current == 'kline' && !CACHE_KLINE) {
            getStockKline(current);
            // $scope.status = 0;
        } else if (current == 'weekKline' && !CACHE_WEEKKLINE) {
            getStockKline(current);
            // $scope.status = 1;
        } else if (current == 'monthKline' && !CACHE_MONTHKLINE) {
            getStockKline(current);
            // $scope.status = 2;
        }

        if (current == 'kline' && CACHE_KLINE) {
            drawKLine(CACHE_KLINE, current);
            // $scope.status = 0;
        } else if (current == 'weekKline' && CACHE_WEEKKLINE) {
            drawKLine(CACHE_WEEKKLINE, current);
            // $scope.status = 1;
        } else if (current == 'monthKline' && CACHE_MONTHKLINE) {
            drawKLine(CACHE_MONTHKLINE, current);
            // $scope.status = 2;
        }
    };

    //发起点买
    $scope.toTrade = function () {
        if ($scope.simSpecial['gameStatus'] == 1) {
            X.dialog.alert('比赛未开始');
            return false;
        }

        if ($scope.simSpecial['gameStatus'] == 3) {
            X.dialog.alert('比赛已结束');
            return false;
        }
        /*不用判断是否报名，因为页面进入的时候没有报名，风控接口返回为900，您未报名*/
        /*if (!$scope.simSpecial['strategyUserFlag']) {
         X.dialog.confirm('您还未报名模拟炒股，请先报名', {
         notify: function (nt) {
         if (nt == 1) {
         $scope.$apply(function () {
         $location.url('/simulateStock?goURL=/simulateTrade');
         });
         }
         }
         });
         return false;
         }*/

        if (!QUOTE_DATA) {
            return false;
        }
        //停牌股票
        if (QUOTE_DATA['newPrice'] == 0) {
            X.dialog.alert('停牌股暂时无法进行买卖');
            return false;
        }
        //限制股票
        if ($scope.isRiskStock) {
            X.dialog.alert('该股今日为禁买股，请选择其他股票交易');
            return false;
        }
        var currPrice = QUOTE_DATA['newPrice'], closePrice = QUOTE_DATA['yesterdayPrice'];
        var diff = currPrice - closePrice, rote = (diff / closePrice * 100).toFixed(2);
        //风险股票
        if (rote > X.toFloat(priceRisk[1]) || rote < X.toFloat(priceRisk[0])) {
            X.dialog.alert('该股今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }
        $location.path('/simulateTradeBuy/' + stockCode);
    };

    //添加或者删除自选
    $scope.addOrDelMine = function (stockCode, stockName) {
        if (!stockCode || !stockName) {
            return false;
        }
        var maxLen = 20;
        var mineListStr = storage.getItem(MINELIST) || '', mineArr = [];
        if (mineListStr == '' || mineListStr.indexOf(stockCode) == -1) {
            if (mineListStr != '') {
                mineArr = mineListStr.split(';');
            }
            if (mineArr.length >= maxLen) {
                X.dialog.alert('自选最多添加' + maxLen + '条记录');
                return;
            }
            mineArr.push(stockCode + ',' + stockName);
            storage.setItem(MINELIST, mineArr.join(';'));
            $scope.mineType = 'delete';
        } else {
            mineArr = mineListStr.split(';');
            for (var i = 0; i < mineArr.length; i++) {
                if (mineArr[i].indexOf(stockCode) != -1) {
                    mineArr.splice(i, 1);
                }
            }
            storage.setItem(MINELIST, mineArr.join(';'));
            $scope.mineType = 'add';
        }
    };

    /*//返回
     $scope.back = function () {
     $location.url(goURL);
     };*/

    function init() {
        getStockInfo(true);
        X.engine.addTask(getStockInfo, 1000);
        X.engine.start();
    }

    //体验总金额和持仓盈亏在没有行情数据的时候也应该展示，所有拆出来
    function initSimAsset() {
        SimulateService.getSimAsset().then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.simAsset = data.data.split(';');
                if ($scope.simAsset[1] == 'null') {
                    $scope.simAsset[1] = 0;
                }
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //判断是否是限制股
    function checkRiskStock() {
        for (var i = 0; i < riskStocks.length; i++) {
            var item = riskStocks[i];
            if (stockCode == item.stockCode) {
                $scope.isRiskStock = true;
                break;
            }
        }
    }

    //确认所选股票是否已经添加到自选，控制显示添加和删除
    function confirmMineType() {
        if (mineListStr == '') {
            $scope.mineType = 'add';
        } else {
            $scope.mineType = mineListStr.indexOf(stockCode) == -1 ? 'add' : 'delete';
        }
    }

    //绘制分时图
    function drawSLine(slineData) {
        if (!QUOTE_DATA)return;
        slineData = slineData || [];
        var data = {}, lastTime;
        slineData.forEach(function (obj, i) {
            lastTime = X.formatDate(obj.time, 'hm') - 0;
            data[lastTime] = {
                current: X.toFloat(obj['price']),
                volume: X.toFloat(obj['volume']),
                time: lastTime
            };
        });

        slineChart = new X.Sline({wrap: 'sline-wrap-' + $scope.uuid});
        slineChart.draw({
            data: data,
            quoteTime: lastTime,
            close: QUOTE_DATA['yesterdayPrice'],
            high: QUOTE_DATA['highPrice'],
            low: QUOTE_DATA['lowPrice'],
            limitUp: QUOTE_DATA['limitUpPrice'],
            limitDown: QUOTE_DATA['limitDownPrice'],
            period: SystemService.getRealPeriod('STOCK', lastTime),
            isStock: true,
            isIntl: false,
            code: stockCode
        });
    }

    //绘制K线图
    function drawKLine(klineData, type) {
        klineData = klineData || [];
        var data = [];
        klineData.forEach(function (o, i) {
            data[i] = {
                time: o['time'].length == 8 ? o['time'] : X.formatDate(o['time'], 'YMD'),
                open: o['open'],
                close: o['last'],
                high: o['high'],
                low: o['low'],
                price: o['price']
            }
        });
        /*klineChart = new X.Kline({wrap: 'kline-wrap-' + $scope.uuid});
         klineChart.draw(data);
         CACHE_KLINE = data;*/

        if (!klineChart) {
            klineChart = new X.Kline({wrap: 'kline-wrap-' + $scope.uuid})
        }

        klineChart.draw(data);
        if (type == 'kline') {
            CACHE_KLINE = data;
        } else if (type == 'weekKline') {
            CACHE_WEEKKLINE = data;
        } else {
            CACHE_MONTHKLINE = data;
        }
    }

    //更新最新分时信息
    function newSlineQuoteData(quote) {
        var price = quote['newPrice'] == 0 ? quote['yesterdayPrice'] : quote['newPrice'];
        var o = {
            current: price,
            volume: 0,
            time: X.formatDate(quote.time, 'hm') - 0
        };

        slineChart && slineChart.perDraw(o, {
            quoteTime: o.time,
            close: quote['yesterdayPrice'],
            high: quote['highPrice'],
            low: quote['lowPrice'],
            limitUp: quote['limitUpPrice'],
            limitDown: quote['limitDownPrice'],
            period: SystemService.getRealPeriod('STOCK', o.time),
            isStock: true,
            code: stockCode
        });
    }

    //更新最新K线信息
    function newKlineQuoteData(quote) {
        // 累加和更新数据//如果股票停牌则不放到K线数据中PS：其实是可以看，接口数据错误所以先不加
        if (quote['newPrice'] == 0 || !CACHE_KLINE || !CACHE_KLINE.length) {
            return;
        }
        var o = {
            time: X.formatDate(quote.time, 'YMD'),
            open: quote['openPrice'],
            close: quote['yesterdayPrice'],
            high: quote['highPrice'],
            low: quote['lowPrice'],
            price: quote['newPrice']// 即时数据，使用当前价格
        };
        if ($scope.actType == 'kline') {
            var last = CACHE_KLINE[CACHE_KLINE.length - 1];

            if (last.time === o.time) {
                CACHE_KLINE[CACHE_KLINE.length - 1] = o;
            } else {
                CACHE_KLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_KLINE);
        } else if ($scope.actType == 'weekKline') {
            var last = CACHE_WEEKKLINE[CACHE_WEEKKLINE.length - 1];

            if (last.time === o.time) {
                CACHE_WEEKKLINE[CACHE_WEEKKLINE.length - 1] = o;
            } else {
                CACHE_WEEKKLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_WEEKKLINE);
        } else if ($scope.actType == 'monthKline') {
            var last = CACHE_MONTHKLINE[CACHE_MONTHKLINE.length - 1];

            if (last.time === o.time) {
                CACHE_MONTHKLINE[CACHE_MONTHKLINE.length - 1] = o;
            } else {
                CACHE_MONTHKLINE.push(o);
            }
            klineChart && klineChart.draw(CACHE_MONTHKLINE);
        }
    }

    function getStockSline() {
        StockService.getSLine(stockCode).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                drawSLine(data.data);
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    function getStockKline(current) {
        /*StockService.getKLine(stockCode).then(function (res) {
         var data = res.data;
         if (data.code == 100) {
         drawKLine(data.data);
         } else {
         X.tip(data['resultMsg']);
         }
         }).catch(function () {
         X.tip('服务器请求异常');
         });*/

        var http;

        if (current == 'kline') {
            http = StockService.getKLine(stockCode);
        } else if (current == 'weekKline') {
            http = StockService.getWMKline(stockCode, current);
        } else if (current == 'monthKline') {
            http = StockService.getWMKline(stockCode, current);
        }

        http.then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                drawKLine(data.data, current);
            } else {
                X.tip(data['resultMsg'])
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        })
    }

    //获取股票信息
    function getStockInfo(flag) {
        X.log('行情定时器运行中。。。');
        //判断是否是在交易时间段内
        if (gameTimeStatus == 1) {
            if (isTrade) {
                isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
                if (isInTradeTime) {
                    if ($scope.isRiskStock) {
                        $scope.btn = {
                            className: 'disabled',
                            btnText: '立即点买',
                            disabled: true
                        };
                    } else if (QUOTE_DATA && QUOTE_DATA['newPrice'] == 0) {
                        $scope.btn = {
                            className: 'disabled',
                            btnText: '立即点买',
                            disabled: true
                        };
                    } else {
                        $scope.btn = {
                            className: 'orange',
                            btnText: '立即点买',
                            disabled: false
                        };
                    }
                } else {
                    $scope.btn = {
                        className: 'disabled',
                        btnText: '非点买时段',
                        disabled: true
                    };
                }
            } else {
                isInTradeTime = false;
                $scope.btn = {
                    className: 'disabled',
                    btnText: '暂停交易',
                    disabled: true
                };
            }
        } else {
            $scope.btn = {
                className: 'disabled',
                btnText: '立即点买',
                disabled: true
            };
        }


        var isInQuoteTime = SystemService.isInPeriod('STOCK', 'quote');

        if (!flag && !isInQuoteTime) {
            $scope.$apply();
        }

        //判断是否是在行情时间段内
        if (dataIsLoad && isInQuoteTime) {
            dataIsLoad = false;
            StockService.getStockInfo(stockCode).then(function (res) {
                dataIsLoad = true;
                var data = res.data;
                if (data.code == 100) {
                    processStockInfoData(data.data[stockCode]);
                } else {
                    X.tip(data['resultMsg']);
                }
            }).catch(function () {
                X.tip('服务器请求异常');
            });
        }
    }

    //将数据绑定到页面scope,加载股票信息
    function processStockInfoData(data) {
        var newPrice = data.newPrice;
        var lastClosePrice = data.lastClosePrice;
        var isStop = newPrice == 0;
        var style = '', dealNum = '', dealPrice = '';
        var diff = 0.00, rate = 0.00;
        if (!isStop) {
            diff = newPrice - lastClosePrice;
            rate = diff / lastClosePrice * 100;
            diff = diff.toFixed(2);
            rate = rate.toFixed(2);
            style = newPrice > lastClosePrice ? 'txt-red' : newPrice < lastClosePrice ? 'txt-green' : 'txt-white';
            dealNum = processNum(data, 'todayDealNum');
            dealPrice = processNum(data, 'todayDealPrice');
        }
        $scope.stock = {
            "stockLabel": data.stockLabel, //代码
            "stockName": data.stockName,//名称
            "price": newPrice,//当前价
            "lastClosePrice": lastClosePrice,//昨收
            isStop: isStop,
            diff: diff,//涨跌值
            rate: rate,//涨跌幅
            style: style,
            dealNum: dealNum,
            dealPrice: dealPrice,
            "openPrice": data.openPrice,//今开
            "highPrice": data.highPrice,//最高
            "lowPrice": data.lowPrice,//最低
            "limitDownPrice": parseFloat(data.limitDownPrice),//跌停
            "limitUpPrice": parseFloat(data.limitUpPrice),//涨停
            "amplitude": data.amplitude,//振幅
            "todayDealNum": data.todayDealNum,//成交量
            "todayDealPrice": data.todayDealPrice,//成交金额
            "buyPrice": isStop ? [0, 0, 0, 0, 0] : data.buyPrice,//买12345
            "buyNum": isStop ? [0, 0, 0, 0, 0] : data.buyNum,
            "sellPrice": isStop ? [0, 0, 0, 0, 0] : data.sellPrice,//卖12345
            "sellNum": isStop ? [0, 0, 0, 0, 0] : data.sellNum
        };

        QUOTE_DATA = {
            commodityTitle: 'STOCK',
            contractNo: data.stockLabel,
            time: data['time'],
            openPrice: data['openPrice'],
            yesterdayPrice: data['lastClosePrice'],
            highPrice: data['highPrice'],
            lowPrice: data['lowPrice'],
            newPrice: data['newPrice'],
            limitDownPrice: X.toFloat(data['limitDownPrice']),
            limitUpPrice: X.toFloat(data['limitUpPrice'])
        };

        newSlineQuoteData(QUOTE_DATA);
        newKlineQuoteData(QUOTE_DATA);
    }

    //转换html
    function htm(text) {
        //noinspection JSUnresolvedFunction
        return $sce.trustAsHtml(text);
    }

    //解析数字格式
    function processNum(data, type) {
        var num = data[type], unit = type == 'todayDealNum' ? '手' : '元';
        if (num > 100000000) {
            return (num / 100000000).toFixed(2) + '亿' + unit;
        }
        if (num > 10000) {
            return (num / 10000).toFixed(2) + '万' + unit;
        }
        return num + unit;
    }

    //controller卸载的时候清除定时器任务
    $scope.$on('$destroy', function () {
        X.engine.destroy();
    });
});
//模拟炒股点买页面
myControllers.controller('SimulateTradeBuyCtrl', function ($scope, $q, $routeParams, $location, TradeService, StockService, UserService, SystemService, SimulateService) {
    var stockCode = $routeParams.stockCode;
    var stockCodeReg = /^(SZ|SH)\d{6,}$/;
    if (!stockCode || !stockCodeReg.test(stockCode)) {
        $location.path('/simulateTrade');
        return;
    }

    //可选点买金额，止盈比率，止损比率，单位服务费，单位递延费，单股最大购买数量，限制股,交易时间段，当前加载时间戳;
    var token = '', tradeMoneyList = [], highRateList = [], lowRateList = [], serviceCharge = 0, deferCharge = 0, stockBuyMoney, priceRisk = [-8, 8],
        maxMoneyOneStock = 100000, maxStockCount = 10000, tradingCountRatio = 1, riskStocks = [], tradingTimeLimit, initTime = Date.now();
    var isHoliday = true, isTrade;
    $scope.stock = {};
    $scope.trade = {};
    $scope.risk = {};
    $scope.currentIndex = 0;//点买金额索引
    $scope.highIndex = 0;//止盈索引
    $scope.lowIndex = 0;//止损索引
    $scope.money = 0;//所选点买金额
    $scope.highMoney = 0;//所选止盈金额
    $scope.lowMoney = 0;//所选止损金额
    $scope.tradeMoneyList = [];
    $scope.highMoneyList = [];
    $scope.lowMoneyList = [];
    $scope.principal = 0;//保证金
    $scope.serviceCharge = 0;//服务费
    $scope.stockCount = 0;//可购买股数
    $scope.canBuyCount = 0;//可点买次数
    $scope.isHoliday = true;
    $scope.btn = {
        className: 'disabled',
        btnText: '数据加载中',
        disabled: true
    };

    X.loading.show();
    $q.all({
        simSpecial: SimulateService.simSpecial(),
        stock: StockService.getStockInfo(stockCode),
        trade: SimulateService.initSimTrade(),
        stockStatisticsInfo: SimulateService.getSimStockStatisticsInfo(stockCode),
        tradeRisk: TradeService.getRiskStock()
    }).then(function (res) {
        var simSpecialData = res.simSpecial.data, stockData = res.stock.data, stockStatisticsInfoData = res.stockStatisticsInfo.data, tradeData = res.trade.data, tradeRiskData = res.tradeRisk.data;
        if (simSpecialData.code == 100 && stockData.code == 100 && tradeData.code == 100 && stockStatisticsInfoData.code == 100 && tradeRiskData.code == 100) {
            $scope.simSpecial = simSpecialData.data;
            riskStocks = tradeRiskData.data;
            stockBuyMoney = stockStatisticsInfoData.data.money || 0;
            initStockData(stockData.data[stockCode]);
            initTradeData(tradeData.data);
            //页面初始化完成以后，默认选择第一个点买金额
            $scope.chooseMoney($scope.currentIndex, $scope.tradeMoneyList[$scope.currentIndex].value);
            /*initValidate();*/
        } else {
            if (tradeData.code == 900) {
                X.dialog.alert(tradeData['resultMsg'], {
                    notify: function () {
                        $scope.$apply(function () {
                            $location.url('/index');
                        });
                    }
                });
            } else if (simSpecialData.code != 100) {
                X.tip(simSpecialData['resultMsg']);
            } else if (stockData.code != 100) {
                X.tip(stockData['resultMsg']);
            } else if (tradeData.code != 100) {
                X.tip(tradeData['resultMsg']);
            } else if (stockStatisticsInfoData.code != 100) {
                X.tip(stockStatisticsInfoData['resultMsg']);
            } else if (tradeRiskData.code != 100) {
                X.tip(tradeRiskData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //发起交易
    $scope.toTrade = function () {
        if ($scope.simSpecial['gameStatus'] == 1) {
            X.dialog.alert('比赛未开始');
            return false;
        }

        if ($scope.simSpecial['gameStatus'] == 3) {
            X.dialog.alert('比赛已结束');
            return false;
        }

        if (!isTrade) {
            X.dialog.alert('暂停交易');
            return false;
        }
        if (!SystemService.isInPeriod('STOCK', 'trade')) {
            X.dialog.alert('当前为非点买时段，无法发起策略');
            return false;
        }

        if ($scope.stock.stockPrice == 0) {
            X.dialog.alert('停牌股无法进行交易<br>请更换其他能够正常交易的股票');
            return false;
        }
        if (checkRiskStock()) {
            X.dialog.alert('【' + $scope.stock.stockName + '】今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }
        var currPrice = $scope.stock['stockPrice'], closePrice = $scope.stock['stockClose'];
        var diff = currPrice - closePrice, rote = (diff / closePrice * 100).toFixed(2);
        //风险股票
        if (rote > X.toFloat(priceRisk[1]) || rote < X.toFloat(priceRisk[0])) {
            X.dialog.alert('该股今日点买风险较高，暂无投资人接收交易合作');
            return false;
        }
        var canBuyMoney = maxMoneyOneStock - stockBuyMoney;
        if (canBuyMoney < 0) {
            canBuyMoney = 0;
        }
        if ($scope.money > canBuyMoney) {
            X.dialog.alert('个股持仓累计金额最多' + maxMoneyOneStock + '元，当前还可点买' + canBuyMoney + '元');
            return false;
        }
        var now = Date.now(), min = 1;
        if (now - initTime > (min * 60 * 1000)) {
            X.dialog.alert('由于股票价格实时变化，您未在' + (min * 60) + '秒内发起策略，这将导致数据波动较大，请重新获取数据，尽快提交', {
                title: '系统提示', notify: function () {
                    window.location.reload();
                }
            });
            return false;
        }
        if ($scope.stockCount > maxStockCount) {
            X.dialog.alert('单股最高可购买数量为' + maxStockCount + '股');
            return false;
        }

        var needMoney = $scope.principal + $scope.serviceCharge;
        if ($scope.balance < needMoney) {//余额不足
            X.dialog.alert('您的模拟点买余额不足');
            return false;
        }
        trade();
    };

    //页面提示
    $scope.tips = function (title, msg) {
        X.dialog.info(title, msg);
    };

    //选择点买金额
    $scope.chooseMoney = function (index, money) {
        $scope.currentIndex = index;
        $scope.money = money;
        processHigh(money);
        processLow(money);
        $scope.chooseHigh(0, $scope.highMoneyList[0]);
        $scope.chooseLow(0, $scope.lowMoneyList[0]);
        processServiceCharge(money);
        processStockCount(money);
    };

    //选择止盈
    $scope.chooseHigh = function (index, money) {
        $scope.highIndex = index;
        $scope.highMoney = money;
    };

    //选择止损
    $scope.chooseLow = function (index, money) {
        $scope.lowIndex = index;
        $scope.lowMoney = money;
        $scope.principal = X.toInt($scope.money / lowRateList[index].value);
    };

    /*function initValidate() {
     if (!$scope.simSpecial['authenFlag']) {
     X.dialog.confirm('您还未实名认证，请先实名认证', {
     notify: function (nt) {
     if (nt == 1) {
     $scope.$apply(function () {
     $location.url('/identification?goURL=/simulateTradeBuy/' + stockCode);
     });
     }
     if (nt == 0) {
     $scope.$apply(function () {
     $location.url('/simulateTrade');
     });
     }
     }
     });
     }
     }*/

    //交易发起
    function trade() {
        var postData = {
            token: token,
            money: $scope.money,
            lever: lowRateList[$scope.lowIndex].value,
            quitLoss: $scope.lowMoney,
            quitGain: $scope.highMoney,
            principal: $scope.principal,
            serviceCharge: $scope.serviceCharge,
            stockCode: stockCode,
            volumeOrder: $scope.stockCount
        };

        $scope.btn = {
            className: 'disabled',
            btnText: '数据处理中',
            disabled: true
        };

        X.loading.show();
        SimulateService.createSimTrade(postData).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('策略发起成功');
                $location.path('/simulateTradeSell');
            } else {
                token = data.data.token;
                X.tip(data['resultMsg']);
                $scope.btn = {
                    className: 'orange',
                    btnText: '提交',
                    disabled: false
                };
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //判断是否是限制股
    function checkRiskStock() {
        for (var i = 0; i < riskStocks.length; i++) {
            var item = riskStocks[i];
            if (stockCode == item.stockCode) {
                return true;
            }
        }
        return false;
    }

    //根据点买金额重新计算服务费和
    function processServiceCharge(money) {
        $scope.serviceCharge = X.toFloat(money / 10000 * serviceCharge);
    }

    //根据点买金额重新计算服务费和
    function processStockCount(money) {
        //购买数量是点买金额除以理论股票价格， 理论股票价格=股票当前价格*滑点比率，而且购买数量必须是一手起，即100股
        var count = (money / ($scope.stock.stockPrice * tradingCountRatio) / 100) | 0;
        count = count * 100;
        //股票一手起卖为100股，如果不够100股则不能交易，如果超过配置最大购买数量则设置为最大购买数量
        //count = count < 100 ? 0 : count;
        //count = count > maxStockCount ? maxStockCount : count;
        $scope.stockCount = count;
    }

    //根据点买金额重新解析止盈金额列表
    function processHigh(money) {
        $scope.highMoneyList = [];
        $.each(highRateList, function (i, item) {
            $scope.highMoneyList.push(X.toInt(money * item));
        });
    }

    //根据点买金额重新解析解析止损列表
    function processLow(money) {
        $scope.lowMoneyList = [];
        $.each(lowRateList, function (i, obj) {
            //此处计算错误，严重丢失了精度，后期要注意哦(┬＿┬)
            //此处的-money / obj.value不应该转换为int，但是后端是TM的这么做的，不转换数据校验不通过，你妹
            $scope.lowMoneyList.push(X.toInt(X.toInt(-money / obj.value) * obj.rote));
        });
    }

    //初始化股票信息
    function initStockData(data) {
        $scope.stock.stockCode = data['stockLabel'];
        $scope.stock.stockName = data['stockName'];
        $scope.stock.stockPrice = data['newPrice'];
        $scope.stock.stockClose = data['lastClosePrice'];
    }

    //初始化交易信息
    function initTradeData(data) {
        var buyCount = data['buyCount'];
        var balance = data['balance'];
        isHoliday = data['isHoliday'];
        var gameTimeStatus = data['gameTimeStatus'];

        var risk = JSON.parse(data['strategyRisk']);
        maxStockCount = risk['maxStockCount'].value;//"单次单股最大交易数量"
        serviceCharge = risk['serviceCharge'].value;//服务费
        deferCharge = risk['deferCharge'].value;//递延费
        tradingCountRatio = risk['tradingCountRatio'].value;//交易购买股票数量系数
        maxMoneyOneStock = risk['maxMoneyOneStock'].value;//个股持仓累计金额的最大值
        priceRisk = risk['priceRisk'].value.split(',');
        token = data['token'];

        var maxCountOneDay = risk['maxCountOneDay'].value;//"当天最大交易次数"
        var tradingMoneyList = risk['tradingMoneyList'].value;//"配置的可点买金额列表"
        var quitGainRatioList = risk['quitGainRatioList'].value;//"配置的止盈列表"
        var levers = risk['levers']['levers'];//"配置的止损列表"

        $scope.risk = risk;
        $scope.balance = balance;
        $scope.isHoliday = isHoliday;
        $scope.canBuyCount = (maxCountOneDay - buyCount) > 0 ? (maxCountOneDay - buyCount) : 0;//可点买次数
        $scope.serviceChargeTips = '交易综合费包含第一天的交易费，第二天的递延费，每万元点买金的交易综合费为' + serviceCharge + '元，每万元点买金的递延费' + deferCharge + '元/天。';

        var holiday = SystemService.parseHoliday(data['holidays']);
        var tradeTime = SystemService.parsePeriod(risk['tradingTimeLimit'].value);
        // //配置参数要优先设置，否则所有的方法都会有问题，因为所有的计算都是依赖于基础的参数配置的
        isTrade = risk['bussmannSwitch'].value != '1';
        SystemService.setCurrentTime(data['nowTime']);
        SystemService.setCurrentCurrencyType('CNY');
        SystemService.setHoliday(holiday);
        SystemService.setTradePeriod(tradeTime);

        //初始化
        initTradeMoney(tradingMoneyList);
        initHighRate(quitGainRatioList);
        initLowRate(levers);

        if (gameTimeStatus == 1) {
            if ($scope.canBuyCount == 0) {
                $scope.btn = {
                    className: 'disabled',
                    btnText: '今日点买次数已用完',
                    disabled: true
                };
            } else {
                $scope.btn = {
                    className: 'orange',
                    btnText: '提交',
                    disabled: false
                };
            }
        } else {
            $scope.btn = {
                className: 'disabled',
                btnText: '提交',
                disabled: true
            };
        }
    }

    //初始化点买金额
    function initTradeMoney(tradingMoneyStr) {
        if (tradingMoneyStr) {
            $scope.tradeMoneyList = [];
            tradeMoneyList = tradingMoneyStr.split(',');
            $.each(tradeMoneyList, function (i, m) {
                $scope.tradeMoneyList.push({
                    value: m,
                    text: X.sketchNumber(m)
                });
            });
        }
    }

    //初始化止盈比率
    function initHighRate(quitGainRatioListStr) {
        if (quitGainRatioListStr) {
            $scope.highMoneyList = [];
            highRateList = quitGainRatioListStr.split(',');
        }
    }

    //初始化止损比率
    function initLowRate(levers) {
        lowRateList = [];
        $.each(levers, function (i, item) {
            var rote = item['quitLossLineRatio'].value, value = item['value'];
            lowRateList.push({
                rote: rote,
                value: value
            })
        });
    }
});
//模拟炒股点卖页面
myControllers.controller('SimulateTradeSellCtrl', function ($scope, $q, $interval, $location, StockService, SimulateService, SystemService) {
    var timer, first = true, tradeData = null, quoteData = null, isOK = false;
    $scope.tradeState = {
        1: '等待接单',
        2: '正在委托买入',
        3: '正在委托买入',
        4: '点卖',
        5: '正在委托卖出',
        6: '正在委托卖出',
        7: '正在清算',
        8: '已清算'
    };
    $scope.dataList = [];
    $scope.dataMap = {};
    $scope.unHanldHoldDeferCharge = 0;//历史拖欠递延费
    $scope.tradingDeferCharge = 0;//应缴递延费
    $scope.dataIsLoad = false;
    $scope.isInTradeTime = false;
    $scope.isInJJPeriod = true;
    $scope.isInDYFShowTime = false;
    $scope.isHoliday = true;
    $scope.todayStartTime = 0;
    $scope.showMenu = false;

    X.loading.show();
    //      初始化交易数据
    $q.all({
        trade: SimulateService.initSimTrade(),
        simAsset: SimulateService.getSimAsset()
    }).then(function (res) {
        var tradeData = res.trade.data,
            simAssetData = res.simAsset.data;
        if (tradeData.code == 100 && simAssetData.code == 100) {
            var data = tradeData.data;
            $scope.simAsset = simAssetData.data.split(';');
            if ($scope.simAsset[1] == 'null') {
                $scope.simAsset[1] = 0;
            }

            var strRisk = JSON.parse(data['strategyRisk']);
            $scope.isHoliday = data['isHoliday'];
            var holiday = SystemService.parseHoliday(data['holidays']);
            var tradeTime = SystemService.parsePeriod(strRisk['tradingTimeLimit'].value);
            //判断是否在交易时间
            SystemService.setCurrentTime(data['nowTime']);
            SystemService.setCurrentCurrencyType('CNY');
            SystemService.setHoliday(holiday);
            SystemService.setTradePeriod(tradeTime);
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            $scope.isInJJPeriod = SystemService.isInJJPeriod();

            initTodayStartTime(data['nowTime']);
            startTimer();
        } else {
            if (tradeData.code == 900) {
                X.dialog.alert(tradeData['resultMsg'], {
                    notify: function () {
                        $scope.$apply(function () {
                            $location.url('/index');
                        });
                    }
                });
            } else if (tradeData.code != 100) {
                X.tip(tradeData['resultMsg']);
            } else if (simAssetData.code != 100) {
                X.tip(simAssetData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //点卖发起
    $scope.sale = function (trade) {
        var html = '<div class="mod-sale-confirm-wrap">';
        html += '<div class="item">股票名称:<span class="fr">' + trade.stockName + '</span></div>';
        html += '<div class="item">股票代码:<span class="fr">' + trade.stockCode.substr(-6) + '</span></div>';
        html += '<div class="item">委托价格:<span class="fr">市价</span></div>';
        html += '<div class="item">卖出数量:<span class="fr">' + trade.volumeHold + '股</span></div>';
        html += '<div class="item">持仓天数:<span class="fr">' + trade.holdDays + '天</span></div>';
        if (trade.profit > 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-red">+' + trade.profit.toFixed(2) + '元</span></div>';
        } else if (trade.profit < 0) {
            html += '<div class="item">浮动盈亏:<span class="fr txt-green">' + trade.profit.toFixed(2) + '元</span></div>';
        } else {
            html += '<div class="item">浮动盈亏:<span class="fr">' + trade.profit.toFixed(2) + '元</span></div>';
        }

        html += '<div class="item"><label><input id="agreeDefer" type="checkbox" checked> 是否递延指令</label></div>';
        html += '<div class="txt-grey txt-s12">注：点卖指令可能因跌停导致无法成交，默认至下一个交易日挂单交易。浮动盈亏仅供参考，具体以实际成交为准。</div>';
        html += '</div>';
        X.dialog.confirm(html, {
            title: '点卖确认', notify: function (nt) {
                if (nt == 1) {
                    /*var agreeDefer = document.getElementById('agreeDefer');*/
                    sale(trade.id);
                }
            }
        })
    };

    /*//欠费提示
     $scope.showArrears = function (money) {
     var html = '已逾期递延费：' + money + '元。<br>请尽快补缴，以免策略被接管。';
     X.dialog.alert(html);
     };*/

    $scope.showPartDeal = function (trade) {
        var list = trade.tradingRecordList, volumeDeal = trade.volumeHold;
        var table = '';
        table += '<table>';
        table += '<tr><td>成交时间</td><td>数量</td><td class="txt-right">价格</td></tr>';
        for (var i = 0; i < list.length; i++) {
            var obj = list[i];
            table += '<tr><td>' + X.formatDate(new Date(obj.time), 'Y-M-D') + '</td><td>' + obj.amount + '</td><td class="txt-right">' + obj.price.toFixed(2) + '</td></tr>';
            volumeDeal += obj.amount;
        }
        table += '</table>';
        var tipHtml = '<div class="info">行情波动过大，造成部分成交，原持有数量' + volumeDeal + '股，现剩余' + trade.volumeHold + '股，请处理剩余数量，以便结算！</div>';
        X.dialog.alert('<div class="mod-part-deal-wrap">' + tipHtml + table + '</div>');
    };

    //初始化定时器启动方法
    function startTimer() {
        isOK = true;
        getData();
        timer = $interval(function () {
            X.log('点卖定时器运行中。。。');
            $scope.isInTradeTime = SystemService.isInPeriod('STOCK', 'trade');
            $scope.isInJJPeriod = SystemService.isInJJPeriod();
            if (first || (!$scope.isHoliday && $scope.isInTradeTime && isOK)) {
                isOK = false;
                /*showOrHideDYFWrap();*/
                getData();
            }
        }, 1000);
    }

    /*//展示递延费
     function showOrHideDYFWrap() {
     $scope.isInDYFShowTime = SystemService.isInPeriod('DEFER', 'quote');
     }*/

    //初始化今天的开始时间
    function initTodayStartTime(serverTime) {
        serverTime = serverTime || Date.now();
        var now = new Date(serverTime);
        var yyyy = now.getFullYear(), MM = now.getMonth(), dd = now.getDate();
        var today = new Date(yyyy, MM, dd, 0, 0, 0);
        $scope.todayStartTime = today.getTime();
    }

    //获取数据
    function getData() {
        var http;
        if (first) {//                  策略
            http = SimulateService.getSimSaleStrategy();
        } else {
            http = SimulateService.getSimSaleStrategyOfMemcache();
        }
        first = false;
        http.then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                tradeData = data.data;
                var stocks = getNeedStocks(tradeData);
                if (stocks == '' || !stocks) {
                    X.loading.hide();
                    $scope.dataList = [];
                }
                StockService.getStockInfo(stocks).then(function (res) {
                    var data = res.data;
                    if (data.code == 100) {
                        quoteData = data.data;
                        processData();
                    } else {
                        initNoDataQuote();
                        //X.tip(data['resultMsg']);
                    }
                }).catch(function () {
                    X.tip('服务器请求异常');
                });
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //点卖
    function sale(tradeID) {
        if (!$scope.isInTradeTime) {
            X.tip('非交易时间不能交易');
            return;
        }
        X.loading.show();
        SimulateService.closeSimStrategy(tradeID).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                //window.location.reload();
                X.tip('点卖策略成功');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    //当没有行情时T+1
    function initNoDataQuote() {
        $scope.dataIsLoad = true;
        isOK = true;
        X.loading.hide();
        var dataList = tradeData;
        $.each(dataList, function (i, item) {
            item.quotePrice = 0;
            item.lastClosePrice = 0;
            /*if (item['buyPriceDeal'] != 0 && item.quotePrice != 0 && item['volumeHold'] != 0) {
             item.profit = (item.quotePrice - item['buyPriceDeal']) * item['volumeHold'];
             } else {
             item.profit = 0;
             }*/
            item.profit = 0;
        });
        $scope.dataList = dataList;
    }

    //组合数据
    function processData() {
        $scope.dataIsLoad = true;
        isOK = true;
        X.loading.hide();
        if (tradeData == null || quoteData == null) {
            $scope.dataList = [];
            return;
        }
        var dataList = tradeData;
        $.each(dataList, function (i, item) {
            var quote = quoteData[item.stockCode];
            item.quotePrice = quote ? quote['newPrice'] : 0;
            item['lastClosePrice'] = quote['lastClosePrice'];
            if (item['buyPriceDeal'] != 0 && item.quotePrice != 0 && item['volumeHold'] != 0) {
                item.profit = (item.quotePrice - item['buyPriceDeal']) * item['volumeHold'];
            } else {
                item.profit = (item['lastClosePrice'] - item['buyPriceDeal']) * item['volumeHold'];
            }
        });
        $scope.dataList = dataList;
    }

    //设置需要查询的点买股票
    function getNeedStocks(dataList) {
        var stocksObj = {}, stocks = '', arr = [];
        $.each(dataList, function (i, item) {
            stocksObj[item.stockCode] = item.stockCode;
        });
        for (var key in stocksObj) {
            arr.push(key);
        }
        if (arr.length > 0) {
            stocks = arr.join(',');
        } else {
            stocks = '';
        }
        return stocks;
    }

    /*//买断
     $scope.showBuyOutMenu = false;
     $scope.showDBBG = false;
     $scope.buyOut = function (trade, type) {
     if (!trade || !type) {
     return;
     }

     TradeService.takeOverInitiate(trade.id).then(function (res) {
     var data = res.data;
     if (data.code == 100) {
     $scope.deferMoney = data.data;
     $scope.currentTrade = trade;
     $scope.showDBBG = true;
     $scope.holdStrategyMoney = trade.lastClosePrice * trade.volumeHold;
     $scope.stockName = trade.stockName;
     var lossPrincipal = trade.lossPrincipal || 0;//trade.lossPrincipal可能为null，需做特殊处理
     if (type == 2) {
     // X.log($scope.holdStrategyMoney , $scope.deferMoney);
     $scope.paySum = parseInt(($scope.holdStrategyMoney + $scope.deferMoney) * 100) / 100;
     $scope.showBuyOutMenu = true;
     $scope.showQuitType = false;
     } else {
     $scope.paySum = lossPrincipal.toFixed(2);
     $scope.showQuitType = true;
     $scope.showBuyOutMenu = false;
     }
     } else {
     X.tip(data['resultMsg']);
     }
     }).catch(function () {
     X.tip('服务器异常');
     });
     };*/

    /*$scope.confirmBuyOrQuit = function (takeOverType) {
     if (!$scope.isInTradeTime) {
     X.tip('非交易时间不能交易');
     $scope.cancelOperate();
     return;
     }
     X.loading.show();
     TradeService.takeOverStrategy($scope.currentTrade.id, takeOverType, $scope.paySum).then(function (res) {
     var data = res.data;
     if (data.code == 100) {
     if (takeOverType == 1) {
     X.tip('放弃策略成功');
     } else {
     X.tip('买断策略成功');
     }
     } else {
     X.tip(data['resultMsg']);
     }
     $scope.cancelOperate();
     X.loading.hide();
     }).catch(function () {
     X.tip('服务器请求异常');
     });
     };*/

    /*//取消弹窗
     $scope.cancelOperate = function () {
     $scope.showDBBG = false;
     $scope.showBuyOutMenu = false;
     };*/

    function clearTimer() {
        if (timer) {
            $interval.cancel(timer);
            timer = undefined;
        }
    }

    $scope.$on('$destroy', function () {
        clearTimer();
    });
});
//模拟炒股结算页面
myControllers.controller('SimulateTradeResultCtrl', function ($scope, $location, $q, SimulateService) {
    $scope.settleList = [];

    X.loading.show();
    //      初始化交易数据
    $q.all({
        simSettleStrategy: SimulateService.getSimSettleStrategy(),
        simAsset: SimulateService.getSimAsset()
    }).then(function (res) {
        var simSettleStrategyData = res.simSettleStrategy.data,
            simAssetData = res.simAsset.data;
        if (simSettleStrategyData.code == 100 && simAssetData.code == 100) {
            $scope.settleList = simSettleStrategyData.data;
            //split()出来的数组为string类型
            $scope.simAsset = simAssetData.data.split(';');
            if ($scope.simAsset[1] == 'null') {
                $scope.simAsset[1] = 0;
            }
        } else {
            if (simAssetData.code == 900) {
                X.dialog.alert(simAssetData['resultMsg'], {
                    notify: function () {
                        $scope.$apply(function () {
                            $location.url('/index');
                        });
                    }
                });
            } else if (simSettleStrategyData.code != 100) {
                X.tip(simSettleStrategyData['resultMsg']);
            } else if (simAssetData.code != 100) {
                X.tip(simAssetData['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    $scope.toDetail = function (tradeID) {
        $location.url('/simulateTradeDetail/' + tradeID);
    }
});
//模拟炒股策略详情
myControllers.controller('SimulateTradeDetailCtrl', function ($scope, $q, $routeParams, $location, SimulateService) {
    var tradeId = $routeParams['tradeId'];
    /*$scope.schemeId = $location.search()['schemeId'];
     $scope.sort = $location.search()['sort']*/
    if (!/^\d+$/.test(tradeId)) {
        $location.path('/index');
        return;
    }

    $scope.trade = {};

    X.loading.show();
    $q.all({tradeInfo: SimulateService.getSimAgreementStrategyById(tradeId)}).then(function (res) {
        var tradeInfoData = res.tradeInfo.data;
        if (tradeInfoData.code == 100) {
            $scope.trade = tradeInfoData.data;
        } else {
            X.tip(tradeInfoData['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

});
//关注微信
myControllers.controller('AttentionCtrl', function ($scope, $location) {
    $scope.showHeader = true;
    var source = $location.search()['source'];
    if (source && source == 'IOSAPP') {
        $scope.showHeader = false;
    }
});
//推广赚钱
myControllers.controller('ExtensionCtrl', function ($scope, $q, $location, $anchorScroll, UserService) {
    var page = 1,
        pageSize = 10;
    $scope.type = 'detail';
    $scope.showNoData = false;
    var ratio = 0;

    X.loading.show();
    $q.all({
        getGeneralizeInfo: UserService.getGeneralizeInfo()
    }).then(function (res) {
        var extenData = res.getGeneralizeInfo.data;
        if (extenData.code == 100) {
            $scope.extenInfo = extenData.data;
            ratio = $scope.extenInfo['ratio'];
            $scope.codeInfo = '/home/generalize/getQRcode.json?device=1';
            X.clipboard.init();
        } else {
            X.tip(extenData['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    $scope.getUsers = function (page) {
        $scope.type = 'user';
        if (ratio == 0) {
            $location.url('/login?goURL=/extension');
            return;
        }
        X.loading.show();
        UserService.getGeneralizeUsers(page, pageSize).then(function (res) {
            var users = res.data;
            if (users.code == 100) {
                var usersData = users.data;
                init(usersData);
            } else {
                X.tip(users['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    function init(data) {
        var list = data.dataList;
        $scope.pageIndex = data.pageIndex;
        $scope.totalPage = data.totalPage;
        $scope.tradeCount = data.tradeCount;
        $scope.totalUserCount = data.totalUserCount;

        if ($scope.totalPage == 0) {
            $scope.showNoData = true;
            return false;
        }

        for (var i in list) {
            list[i].registerTime = X.formatDate(list[i].registerTime);
        }

        if ($scope.pageIndex == 1) {
            $scope.list = list;
        } else {
            $scope.list = $scope.list.concat(list);
        }
    }


    //获取数据列表
    $scope.getList = function (page) {
        page = page || 1;
        getUsers(page);
    };

    /* 跳转至锚点，还是用原生的js写好
     $scope.toBottom = function(){
     $location.hash('rate');
     $anchorScroll();
     }*/

    // getUsers(page);
});
//手机绑定
myControllers.controller('PhoneBind1Ctrl', function ($scope, $q, $location, $interval, UserService, SystemService) {
    var timer = null, changeTimer = null;

    $scope.user = {};
    $scope.time = 0;
    $scope.temptimes = Date.now();
    $scope.checkCode = '';//验证码
    $scope.imgCode = '';
    $scope.showCodeDialog = false;

    X.loading.show();
    $q.all({userInfo: UserService.getUserInfo()}).then(function (res) {
        var userInfoData = res.userInfo.data;
        if (userInfoData.code == 100) {
            $scope.user = userInfoData.data;
        } else {
            X.tip(userInfoData['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    $scope.clickNumber = function () {
        $scope.cellPhone = SystemService.cellPhoneNumber();
    };

    //下一步
    $scope.toNext = function () {
        if (!/^\d{6}$/.test($scope.checkCode)) {
            X.dialog.alert('验证码输入错误');
            return false;
        }
        //手机号解绑
        X.loading.show();
        UserService.unbindMobile($scope.checkCode).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $location.path('/phoneBind2');
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //显示图片验证码
    $scope.getImgCode = function () {
        $scope.showCodeDialog = true;
    };

    //原手机号短信验证
    $scope.sendCode = function () {
        if ($scope.imgCode == '') {
            X.tip('请输入图片验证码');
            return false;
        }
        if (!/^\d{4}$/.test($scope.imgCode)) {
            X.tip('图片验证码输入错误');
            if($scope.imgCode == 4)$scope.refreshCode();
            return false;
        }
        //发送验证码请求
        X.loading.show();
        UserService.mobileUnbindCode($scope.imgCode).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.dialog.alert('验证码发送成功，请注意查收短信');
                $scope.closeDialog()
                $scope.time = 60;
                timerFn();
            } else if (data.code == 101) {
                X.dialog.alert('验证码发送成功，请注意查收短信');
                $scope.time = data.data.interval;
                $scope.closeDialog()
                timerFn();
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //刷新验证码
    $scope.refreshCode = function () {
        $scope.temptimes = Date.now();
    };


    // 关闭弹出框
     $scope.closeDialog = function () {
     $scope.showCodeDialog = false;
     };

    //倒计时方法
    function timerFn() {
        timer = setInterval(function () {
            if ($scope.time > 0) {
                $scope.$apply(function () {
                    $scope.time--;
                });
            } else {
                timer && clearTimeout(timer);
            }
        }, 1000);
    }

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function changeBtnTimer() {
        changeTimer = $interval(function () {
            $scope.btnState = 'disable';
            $scope.btnDisabled = true;
            if ($scope.checkCode.length == 6) {
                $scope.btnState = 'orange';
                $scope.btnDisabled = false;
            } else {
                $scope.btnState = 'disable';
                $scope.btnDisabled = true;
            }
        }, 100);
    }

    //清空定时器
    function clearTimer() {
        $scope.time = 0;
        timer && clearTimeout(timer);
        changeTimer && $interval.cancel(changeTimer);
        changeTimer = timer = null;
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        clearTimer();
    });

    changeBtnTimer();
});
myControllers.controller('PhoneBind2Ctrl', function ($scope, $q, $routeParams, $location, $interval, UserService) {
    var timer = null, changeTimer = null;
    $scope.mobile = '';
    $scope.time = 0;
    $scope.checkCode = '';//验证码
    $scope.oldMobile = '';
    $scope.temptimes = Date.now();
    $scope.imgCode = '';
    $scope.showCodeDialog = false;

    X.loading.show();
    $q.all({userInfo: UserService.getUserInfo()}).then(function (res) {
        var userInfoData = res.userInfo.data;
        if (userInfoData.code == 100) {
            $scope.oldMobile = userInfoData.data.loginMobileNoHidden;
        } else {
            X.tip(userInfoData['resultMsg']);
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    //绑定手机号
    $scope.bind = function () {
        if (!X.isMobile($scope.mobile)) {
            X.dialog.alert('手机号码输入错误');
            return false;
        }
        if (!/^\d{6}$/.test($scope.checkCode)) {
            X.dialog.alert('验证码输入错误');
            return false;
        }
        //绑定手机号
        X.loading.show();
        UserService.bindMobile($scope.checkCode, $scope.mobile).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.dialog.alert('手机绑定成功', {
                    notify: function () {
                        $location.path('myHome');
                    }
                });
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //显示图片验证码
    $scope.getImgCode = function () {
        if ($scope.mobile == '') {
            X.tip('请输入手机号码');
            return false;
        }
        if (!X.isMobile($scope.mobile)) {
            X.tip('手机号码输入错误');
            /*$scope.refreshCode();*/
            return false;
        }
        $scope.showCodeDialog = true;
    };

    //获取验证码
    $scope.sendCode = function () {
        if ($scope.mobile == '') {
            X.tip('请输入手机号码');
            return false;
        }
        if (!X.isMobile($scope.mobile)) {
            X.tip('手机号码输入错误');
            return false;
        }
        if ($scope.imgCode == '') {
            X.tip('请输入图片验证码');
            return false;
        }
        if (!/^\d{4}$/.test($scope.imgCode)) {
            X.tip('图片验证码输入错误');
            if($scope.imgCode == 4)$scope.refreshCode();
            return false;
        }
        if ($scope.mobile == $scope.oldMobile) {
            X.tip('新手机号码不能和旧手机号相同');
            $scope.closeDialog();
            $scope.refreshCode();
            return false;
        }
        //发送短信验证码请求
        X.loading.show();
        UserService.mobileBindCode($scope.imgCode, $scope.mobile).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.closeDialog();
                X.tip('验证码已发送至手机，请注意查收');
                $scope.time = 60;
                timerFn();
            } else if (data.code == 101) {
                $scope.closeDialog();
                X.tip('验证码已发送至手机，请注意查收');
                $scope.time = data.data.interval;
                timerFn();
            } else {
                X.tip(data['resultMsg']);
                $scope.closeDialog();
                $scope.refreshCode();
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    // 关闭弹出框
    $scope.closeDialog = function () {
        $scope.showCodeDialog = false;
        $scope.imgCode = '';
    };

    //刷新验证码
    $scope.refreshCode = function () {
        $scope.temptimes = Date.now();
    };

    //获取验证码
    $scope.sendCode = function () {
        if ($scope.mobile == '') {
            X.tip('请输入手机号码');
            return false;
        }
        if (!X.isMobile($scope.mobile)) {
            X.tip('手机号码输入错误');
            return false;
        }
        if ($scope.imgCode == '') {
            X.tip('请输入图片验证码');
            return false;
        }
        if (!/^\d{4}$/.test($scope.imgCode)) {
            X.tip('图片验证码输入错误');
            if($scope.imgCode == 4)$scope.refreshCode();
            return false;
        }
        if ($scope.mobile == $scope.oldMobile) {
            X.tip('新手机号码不能和旧手机号相同');
            $scope.closeDialog();
            $scope.refreshCode();
            return false;
        }
        //发送短信验证码请求
        X.loading.show();
        UserService.mobileBindCode($scope.imgCode, $scope.mobile).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.dialog.alert('验证码发送成功，请注意查收短信');
                $scope.closeDialog();
                $scope.time = 60;
                timerFn();
            } else if (data.code == 101) {
                X.dialog.alert('验证码发送成功，请注意查收短信');
                $scope.closeDialog();
                $scope.time = data.data.interval;
                timerFn();
            } else {
                X.dialog.alert(data['resultMsg']);
                $scope.closeDialog();
                $scope.refreshCode();
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    //倒计时方法
    function timerFn() {
        timer = setInterval(function () {
            if ($scope.time > 0) {
                $scope.$apply(function () {
                    $scope.time--;
                });
            } else {
                timer && clearTimeout(timer);
            }
        }, 1000);
    }

    //定时器，用来检测输入框是否有内容 ，并来修改样式
    function changeBtnTimer() {
        changeTimer = $interval(function () {
            $scope.btnState = 'disable';
            $scope.btnDisabled = true;

            if ($scope.mobile.length == 11 && $scope.checkCode.length == 6) {
                $scope.btnState = 'orange';
                $scope.btnDisabled = false;
            } else {
                $scope.btnState = 'disable';
                $scope.btnDisabled = true;
            }
        }, 100);
    }

    //清空定时器
    function clearTimer() {
        $scope.time = 0;
        timer && clearTimeout(timer);
        changeTimer && $interval.cancel(changeTimer);
        changeTimer = timer = null;
    }

    //卸载页面的定时器
    $scope.$on('$destroy', function () {
        clearTimer();
    });

    changeBtnTimer();
});
//发现
myControllers.controller('DiscoverCtrl', function ($scope, $sce, NoticeService) {
    var page, pageSize = 10, id = 0;
    $scope.currPage = 1;
    $scope.totalPage = 1;
    $scope.currNoticeIndex = 0;

    $scope.getNoticeList = function (page) {
        NoticeService.getNotices(page, pageSize).then(function (res) {
            var data = res.data,
                noticeList,
                noticeData;
            noticeData = data.data;
            $scope.currPage = data.data['pageIndex'];
            $scope.totalPage = data.data['totalPage'];
            if (data.code == 100) {
                noticeList = data.data['items'];
                if (page == 1) {
                    $scope.noticeList = noticeList;
                } else {
                    $scope.noticeList = $scope.noticeList.concat(noticeList);
                }
            } else {
                X.tip(data['resultMsg']);
            }
            for (var i in $scope.noticeList) {
                $scope.noticeList[i]['noticeContent'] = $sce.trustAsHtml('<p style="word-break: break-all">' + $scope.noticeList[i].noticeContent + '</p>')
                $scope.noticeList[i]['id'] = id;
                id++;
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };

    $scope.getNoticeList($scope.currPage);

    //展示公告详情
    $scope.showCurrNotice = function (currId) {
        if ($scope.currNoticeIndex == currId) {
            $scope.currNoticeIndex = -1;
        } else {
            $scope.currNoticeIndex = currId;
        }
    }
});
//排行榜(昨日/上月)
myControllers.controller('DayGainListCtrl', function ($scope, $sce, $location, RankService) {
    var type = $location.search()['type'] || 'month';
    $scope.type = type;
    $scope.txtObj = {
        day: {
            title: '昨日盈利榜',
            gainTxt: '盈利(元)'
        },
        month: {
            title: '佣金收入榜',
            gainTxt: '总收入(元)'
        }
    };
    $scope.rankList = [];
    if (type == 'day') {
        getRankData(type);
    } else if (type == 'month') {
        getRankData(type);
    }

    function getRankData(type) {
        RankService.getRank(type).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.rankList = data.data;
            } else {
                X.tip(data['resultMsg']);
            }
        }).catch(function () {
            X.tip('服务器请求异常');
        })
    }
});

//活动中心
myControllers.controller('ActivityCenterCtrl', function ($scope, $q, $location, $anchorScroll, ActivityService) {
    $scope.activityList = [];
    ActivityService.getActivityListData().then(function (res) {
        var data = res.data;
        if (data.code == 100) {
            if (data.data) {
                data.data.forEach(function (item) {
                    item.bannerUrl = item.bannerUrl.split(',');
                });
                $scope.activityList = data.data;
            } else {
                $scope.activityList = [];
            }
        } else {
            $scope.activityList = [];
        }
    }).catch(function () {
        X.tip('服务器请求异常');
    });

    $scope.goURL = function (id) {
        $location.url('/actPacket' + '?activityId=' + id);
    }

});

//红包 act
myControllers.controller('ActPacketCtrl', function ($scope, $location, $swipe, StockService, PacketService) {
    var activityId = $location.search()['activityId'];
    $scope.TipInfo = {};

    function TipInfo(id) {
        X.loading.show();
        PacketService.getPacketInfoData(id).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                actPacketData(data.data);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

    function actPacketData(data) {
        data.forEach(function (item) {
            $scope.TipInfo[item.title] = item;
        });
    }

    $scope.receivePacket = function receivePacket(item) {
        if (item.status != 1) return false;
        X.loading.show();
        var params = {
            title: item.title,
            money: item.value,
            awardLogId: item.awardLogId
        };
        PacketService.receivePacketData(params).then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                X.tip('领取成功');
                TipInfo(activityId);
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    };
    $scope.goURL = function (name, status) {
        if (name == 'ZCHB' && status == 0) {
            $location.url('/register1?backURL=#/actPacket?activityId=' + activityId);
        } else if (name == 'MNJY' && status == 0) {
            $location.url('/simulateStock?backURL=#/actPacket?activityId=' + activityId);
        } else if (name == 'SCCZ' && status == 0) {
            $location.url('/payType?backURL=#/actPacket?activityId=' + activityId);
        } else if (name == 'SPJY' && status == 0) {
            $location.url('/trade?backURL=#/actPacket?activityId=' + activityId);
        } else if (name == 'SMRZ' && status == 0) {
            $location.url('/identification?backURL=#/actPacket?activityId=' + activityId)
        } else {
            return;
        }
    };
    TipInfo(activityId);
});
//我的红包
myControllers.controller('MyPacketCtrl', function ($scope, $rootScope, $q, $location, LoginService, UserService, AuthService, PacketService) {
    $scope.packetFund = {};
    $scope.packetRecord = [];
    $scope.packetTitle = {
        'ZCHB': ['新注册用户送红包'],
        'MNJY': ['完成模拟交易5次送红包'],
        'SCCZ': ['首次充值送红包'],
        'SPJY': ['实盘交易送红包'],
        'SMRZ': ['完成实名认证送红包'],
        'JYZHF': ['实盘交易综合费返还', '实盘交易综合费抵扣']
    };
    $scope.pageIndex = 1;
    $scope.totalPage = 1;
    X.loading.show();
    $q.all({packetFund: PacketService.getPacketFundInfoData()}).then(function (res) {
        var packetFund = res.packetFund.data;
        if (packetFund.code == 100) {
            $scope.packetFund = packetFund.data;
            $scope.getPacketRecordList($scope.pageIndex);
        } else {
            if (packetFund.code != 100) {
                X.tip(packetFund['resultMsg']);
            }
        }
        X.loading.hide();
    }).catch(function () {
        X.tip('服务器请求异常');
    });
    $scope.getPacketRecordList = function () {
        // var pageSize = 10;
        X.loading.show();
        PacketService.getPacketRecordListData().then(function (res) {
            var data = res.data;
            if (data.code == 100) {
                $scope.items = data.data.items;
                /*$scope.pageIndex = packetData['pageIndex'];
                 $scope.totalPage = packetData['totalPage'];*/
                /*if (page == 1) {
                 $scope.items = packetData.items;
                 } else {
                 $scope.items = $scope.items.concat(packetData.items);
                 }*/
            } else {
                X.tip(data['resultMsg']);
            }
            X.loading.hide();
        }).catch(function () {
            X.tip('服务器请求异常');
        });
    }

});

























