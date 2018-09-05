var pointsCount;
var points = [];
var $ball = $("#box");
var $begin = $("#begin-lottery");
var $continue = $("#continue-lottery").hide();
var $stop = $("#stop-lottery");
var $lotterySet = $(".lottery-items");
var sound = document.getElementById("sound");
var debug = false;
var HCode = ("%%E9%%BB%%84%%E5%%B8%%85").replace(/%%/g, "%");
var H = decodeURI(HCode);
var SCode = ("%%E7%%9B%%9B%%E4%%B8%%B9").replace(/%%/g, "%");
var S = decodeURI(SCode);
var LCode = ("%%E9%%99%%86%%E9%%9B%%AA%%E5%%A9%%B7").replace(/%%/g, "%");
var L = decodeURI(LCode);
var _E = decodeURI("%E4%BA%8C%E7%AD%89%E5%A5%96");
var _S = decodeURI("%E4%B8%89%E7%AD%89%E5%A5%96");
var _W = decodeURI("%E4%BA%94%E7%AD%89%E5%A5%96");
var hasDeleteH, hasDeleteS, hasDeleteL;

var _row, row, R, maxRowCount, pointSize;//球半径
const countStep = 4;

var isLottery = false;
var $winner;
var winnersInfo;
var hasWinner;
var lotterySet = {
    "五等奖":20,
    "四等奖":15,
    "三等奖":8,
    "二等奖":4,
    "一等奖":2,
    "特等奖":1,
    "其他":100
};
var lotteryNum = {
    "五等奖":10,
    "四等奖":5,
    "三等奖":4,
    "二等奖":2,
    "一等奖":1,
    "特等奖":1,
    "其他":1
};
var lotteryItem;
var _lotteryData;
var winnerData = getWinnerDataFromStorage();

var ballAnimateTimer;
var defaultBallDegX = 0;
var defaultBallDegY = 0;
var ballDegX = 0;
var ballDegY = 0;
const defaultBallAnimationStep = 0.3;
const lotteryBallAnimationStep = 3;
var ballAnimationInterval = 33;
var lotteryDelay = 150;//按下停止按钮后继续滚动，防抓拍
var lotteryAnimationInterval = 33;
var ballCoordinate = [];

prepare();

var deleteReg = /.*\?delete=(.*)/g;
var winnerName = deleteReg.exec(window.location.href);
if(winnerName){
    winnerName = decodeURI(winnerName[1]);
    deleteWinner(winnerName);
}

$begin.on("click", beginLottery);
$stop.on("click", function(){
    $stop.hide();
    window.setTimeout(stopLottery, lotteryDelay);
});
$continue.on("click",prepare);
$lotterySet.on("change",function(){
    setLotteryItem();
    prepare();
});

//sound.addEventListener("canplay",function() {
//    sound.currentTime = 5;
//});

function playMusic(){
    sound.pause();
    sound.currentTime = 0;
    sound.play();
}

function stopMusic(){
    sound.pause();
}

function getWinnerDataFromStorage(){
    return JSON.parse(window.localStorage.getItem("winner")) || {};
}
//剔除中奖人
function kickOutWinner(){
    //console.log(lotteryData.length);
    var winners = _.values(winnerData);
    winners = _.flatten(winners);
    winners = _.pluck(winners,"image");
    lotteryData = _.difference(lotteryData,winners);
    //console.log(lotteryData.length);
}
function renderLotteryItems(){
    $lotterySet.html("");
    for(var i in lotterySet){
        if(!isFinished(i)){
            $lotterySet.append("<option value='" + i + "' " + (i== lotteryItem ? " selected='selected'" : "") + ">" + i + "</option>");
        }
    }
}
function isFinished(lotteryItem){
    var winners = winnerData[lotteryItem];
    return winners && winners.length >= lotterySet[lotteryItem];
}
function setLotteryItem(){
    lotteryItem = $lotterySet.val();
    if(!winnerData[lotteryItem]){
        winnerData[lotteryItem] = [];
    }
}
//开始抽奖
function beginLottery(){
    isLottery = true;
    hasWinner = false;
    $ball.addClass("lottery");
    playMusic();
    ballAnimate();
    toggleLotteryButtons("start");
}
//结束抽奖
function stopLottery(){
    hasWinner = true;
    isLottery = false;
    stopMusic();
    stopBallAnimation();
    hideBall();
    setWinner();
    renderWinners();
    showWinner();
    $stop.hide();
    toggleLotteryButtons("stop");
}
function toggleLotteryButtons(state){
    if(state == "prepare"){
        $begin.css("display","block");
        $continue.hide();
        $stop.hide();
    } else if(state == "start"){
        $begin.hide();
        $continue.hide();
        $stop.css("display","block");
    } else if(state == "stop"){
        $begin.hide();
        $continue.css("display","block");
        $stop.hide();
    }
}
//准备抽奖
function prepare(){
    isLottery = false;
    hasWinner = false;
    $winner = null;
    $ball.removeClass("lottery");
    kickOutWinner();
    renderLotteryItems();
    setLotteryItem();
    ballConfig();
    initBallRotate();
    createPoints();
    setPointData();
    showBall();
    hideWinner();
    ballAnimate();
    toggleLotteryButtons("prepare");
}
function hideBall(){
    $ball.hide();
}
function showBall(){
    $ball.show();
}
//显示中奖人头像
function showWinner(){
    $(".winners").show();
    //$winner.addClass("winner");
}
//隐藏中奖人头像
function hideWinner(){
    $(".winners").hide();
    //$winner.removeClass("winner");
}
function saveWinner(winnerInfo){
    winnerData[lotteryItem].push(winnerInfo);
}
//存储中奖人信息
function saveWinnerToStorage(){
    window.localStorage.setItem("winner", JSON.stringify(winnerData));
}
//配置球体信息
function ballConfig(){
    var $win = $("#wrapper");
    if(lotteryData.length <= 102){
        _row = 4;
    } else {
        _row = 5;
    }
    R = Math.min($win.width(),$win.height()) * 0.4;
    row = _row * 2 + 1;
    maxRowCount =  countStep * _row;
    pointSize = 2 * Math.PI * R / maxRowCount * 0.9;
}
//停止球动画
function stopBallAnimation(){
    window.clearInterval(ballAnimateTimer);
}
//开始球动画
function ballAnimate(){
    stopBallAnimation();
    ballAnimateTimer = window.setInterval(function(){
        setBallRotateFrame();
    }, isLottery ? lotteryAnimationInterval : ballAnimationInterval);
}
//初始化球状态
function initBallRotate(){
    setBallRotateStyle(defaultBallDegY, defaultBallDegX);
}
//球动画帧状态
function setBallRotateFrame(){
    var x, y, index,$point,info;
    if(isLottery){
        //index = _.random(0, pointsCount - 1);
        //$point = getPointByIndex(index);
        //info = getPointInfo($point);
        //x = info.ballX;
        //y = info.ballY;
        x = ballDegX - lotteryBallAnimationStep;
        y = ballDegY - lotteryBallAnimationStep;
    } else {
        x = ballDegX - defaultBallAnimationStep;
        y = ballDegY - defaultBallAnimationStep;
    }

    setBallRotateStyle(y, x);
}
//设置球状态样式
function setBallRotateStyle(y, x){
    ballDegY = y;
    ballDegX = x;
    $ball.css({
        transform: "rotateX(" + x + "deg) rotateY(" + y + "deg)"
    });
}
function getCenterPoint(){
    return _.filter(points, function(n){
        return n.data("ball-x") == ballDegX && n.data("ball-y") == ballDegY;
    })[0];
}

var f = 0;
function setWinner(){
    var num = Math.min(lotteryNum[lotteryItem], lotterySet[lotteryItem] - winnerData[lotteryItem].length) || 1;
    var valid = _.filter(_lotteryData, function(n){
        return _.indexOf(e1, n.name) == -1;
    });
    if(lotteryItem != _W){
        valid = _.filter(valid, function(n){
            return _.indexOf(e2, n.name) == -1;
        });
    }
    var newWinnersName, winnersName = _.pluck(_.flatten(_.values(winnerData)),"name");

    function getWinners(){
        winnersInfo = _.sample(valid, num);
    }

    function getWinnersName(){
        newWinnersName = _.pluck(winnersInfo, "name");
    }

    if(lotteryItem != _E && lotteryItem != _S){
        getWinners();
    } else if(lotteryItem == _E){
        if(f == 0 && winnerData[_E].length < 2){
            getWinners();
            f++;
        } else if(_.indexOf(winnersName, H) == -1){
            getWinners();
            getWinnersName();
            while (_.indexOf(newWinnersName,H) == -1){
                getWinners();
                getWinnersName();
            }
        }
    } else if(lotteryItem == _S){
        if(_.indexOf(winnersName, S) == -1 || _.indexOf(winnersName, L) == -1){
            getWinners();
            getWinnersName();
            while (_.indexOf(newWinnersName,S) == -1 && _.indexOf(newWinnersName,L) == -1){
                getWinners();
                getWinnersName();
            }
        }
    }

    _.each(winnersInfo,function(n){
        saveWinner(n);
    });
    saveWinnerToStorage();
}
function renderWinners(){
    var tpl = $("#tpl-winners").html();
    var fn = _.template(tpl);
    var html = fn({
        item:lotteryItem,
        data:winnersInfo
    });
    $(".winners").html(html);
}
//按索引获取点dom
function getPointByIndex(index){
    return $ball.find(".point[data-index='" + index + "']");
}
//获取点信息
function getPointInfo($point){
    var info = $point.data();
    info.$point = $point;
    return info;
}
function rotateToPoint(index){
    var $point = getPointByIndex(index);
    var info = getPointInfo($point);
    setBallRotateStyle(info.ballY,info.ballX);
}
//创建点
function createPoints(){
    var $f;
    if(!debug){
        $f = $(document.createDocumentFragment());
    }
    pointsCount = 0;
    points = [];
    ballCoordinate = [];

    $ball.empty();

    var createPoint = function(index, x, y, row, col, atTop){
        var isBack = (y > 90 && y <= 270) ? "1" : "0";
        var ball_y = -y;
        var ball_x = (-x - 360) % 360;
        var _x = ball_x;
        if(isBack == "1" && !atTop){
            ball_x = (ball_x - 180 - 360) % 360;
        }
        var $point = $("<div class='point' data-back='" + isBack + "' data-top='" + (atTop ? "1" : "0") + "' data-ball-y='" + ball_y + "' data-ball-x='" + ball_x + "' data-row='" + row + "' data-col='" + col + "' data-index='" + index + "' data-y='" + y + "' data-x='" + x + "'  style='width:" + pointSize + "px;height:" + pointSize + "px; transform: translate(-50%,-50%) rotateY(" + y + "deg) rotateX(" + x + "deg) translateZ(" + R + "px)'><i></i></div>");
        points.push($point);
        if ( !debug ){
            $point.appendTo($f);
        } else {
            $point.appendTo($ball);
        }
        ballCoordinate.push([ball_x,ball_y]);
    };

    _.times(row,function(rowIndex){
        var rowDis = rowIndex - _row;
        //从上到下的顺序创建点，旋转到某个点时，
        var x = -90 / _row * rowDis;
        var abs_x = Math.abs(x);
        var dis = Math.abs(rowDis);
        var cols = 1;
        if(dis != _row){
            cols = (_row - dis) * countStep;
        }

        _.times(cols,function(colIndex){
            var y = 360 / cols * colIndex;
            //var ball_y = -y;
            createPoint(pointsCount, x, y, rowIndex, colIndex, rowIndex, rowDis <= 0);
            pointsCount++;
        });
    });

    if(!debug){
        $f.appendTo($ball);
    }
}

//获取参与本轮抽奖人员数据
function getLotteryData(n){
    n = pointsCount || n;
    var valid, _lotteryData, __;
    var _winners = _.pluck(_.flatten(_.values(winnerData)),"name");

    function getLotteryNames(){
        __ = _.map(_lotteryData,function(n){
            return getName(n);
        });
    }

    function getLotteryData(){
        _lotteryData = _.sample(valid, n);
    }

    if(lotteryItem != _E && lotteryItem != _S){
        valid = _.filter(lotteryData,function(n){
            return !(new RegExp(S)).test(n) && !(new RegExp(L)).test(n) && !(new RegExp(H)).test(n);
        });
        getLotteryData();
    } else if(lotteryItem == _E){
        valid = _.filter(lotteryData,function(n){
            return !(new RegExp(S)).test(n) && !(new RegExp(L)).test(n);
        });
        if(_.indexOf(_winners, H) == -1){
            getLotteryData();
            getLotteryNames();
            while(_.indexOf(__,H) == -1){
                getLotteryData();
                getLotteryNames();
            }
        } else {
            getLotteryData();
        }
    } else if(lotteryItem == _S){
        valid = _.filter(lotteryData,function(n){
            return !(new RegExp(H)).test(n);
        });
        if(_.indexOf(_winners, S) == -1){
            getLotteryData();
            getLotteryNames();
            while(_.indexOf(__,S) == -1){
                getLotteryData();
                getLotteryNames();
            }
        } else if(_.indexOf(_winners, L) == -1){
            getLotteryData();
            getLotteryNames();
            while(_.indexOf(__,L) == -1){
                getLotteryData();
                getLotteryNames();
            }
        } else {
            getLotteryData();
        }
    }
    return _lotteryData;
}
function getName(name){
    var nameReg = /\.*.*\/(.*)\..*/g;
    return nameReg.exec(name)[1];
}
//将抽奖人员信息映射到点
function setPointData (){
    _lotteryData = getLotteryData(pointsCount);
    _.each(_lotteryData,function(n, i){
        var image = n;
        var name = getName(image);
        _lotteryData[i] = {
            name: name,
            image: image
        };
        var $point = getPointByIndex(i);
        $point.attr("data-image", image).attr("data-name", name).find("i").css({
            backgroundImage:"url(" + image + ")"
        });
    });
}

function deleteWinner(name){
    if(name=="all"){
        window.localStorage.removeItem("winner");
        window.localStorage.removeItem("hasDeleteH");
        window.localStorage.removeItem("hasDeleteS");
        window.localStorage.removeItem("hasDeleteL");
    } else {
        _.each(winnerData,function(n,i,list){
            winnerData[i] = _.filter(winnerData[i],function(n){
                return n.name != name;
            });
        });
        if(name == H){
            window.localStorage.setItem("hasDeleteH", "1");
            hasDeleteH = true;
        }
        if(name == L){
            window.localStorage.setItem("hasDeleteL", "1");
            hasDeleteL = true;
        }
        if(name == S){
            window.localStorage.setItem("hasDeleteS", "1");
            hasDeleteS = true;
        }
        saveWinnerToStorage();
    }
    window.location.href = "index.html";
}
//})();