
var redis = require("redis");
var sub = redis.createClient('6379', '127.0.0.1',{});

var log4js = require('log4js');
log4js.configure({

    appenders: [
        {
            type: 'console',
            category: "console"

        }, //控制台输出
        {
            type: "file",
            filename: './logs/WebSocketLog.log',
            pattern: "_yyyy-MM-dd",
            maxLogSize: 20480,
            backups: 3,
            category: 'dateFileLog'

        }//日期文件格式
    ],
    replaceConsole: true,   //替换console.log
    levels:{
        dateFileLog: 'debug',
        console: 'debug'
    }
});
//Redis 链接错误
sub.on("error", function(error) {
    console.log("Redis错误 "+error);
	dateFileLog.error("Redis错误 "+error);
});


var dateFileLog = log4js.getLogger('dateFileLog');
var consoleLog = log4js.getLogger('console');
exports.logger = consoleLog;


exports.use = function(app) {app.use(log4js.connectLogger(consoleLog, {level:'INFO', format:':method :url'}))};

sub.on("ready", function() {
	console.log("Redis初始化成功");
	dateFileLog.info("Redis初始化成功");
});

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


//-----------------------------------------启动一个httpServer
app.get('/',
function(req, res) {
    res.send('<h1 style="text-align:center;">Socket与WebSocket服务器</h1>');
});
//-----------------------------------------建立WebSocket服务器开始
//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;
// 订阅chat频道

sub.on("error",function(err){  
    console.log("err"+err);  
});
var index;

var info={};
io.on('connection',function(socket) {
    console.log('客户端与WebSocket服务端已建立连接');
	dateFileLog.info("客户端与WebSocket服务端已建立连接");

    //监听新用户加入
    socket.on('login',function(obj) {
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        socket.name = obj.userid;
		if(obj.subscribe){
			for(var i=0;i<obj.subscribe.length;i++){
				sub.subscribe(obj.subscribe[i]); 
			}
		}
        //检查在线列表，如果不在里面就加入
        if (!onlineUsers.hasOwnProperty(obj.userid)) {
            onlineUsers[obj.userid] = obj.username;
            //在线人数+1
            onlineCount++;
        }

        //向所有客户端广播用户加入
        io.emit('login', {
            onlineUsers: onlineUsers,
            onlineCount: onlineCount,
            user: obj
        });
        console.log(obj.username + " 加入连接");
		dateFileLog.info(obj.username + " 加入连接");
    });

    //监听用户退出
    socket.on('disconnect',function() {
        //将退出的用户从在线列表中删除
        if (onlineUsers.hasOwnProperty(socket.name)) {
            //退出用户的信息
            var obj = {
                userid: socket.name,
                username: onlineUsers[socket.name]
            };
            //删除
            delete onlineUsers[socket.name];
            //在线人数-1
            onlineCount--;

            //向所有客户端广播用户退出
            io.emit('logout', {
                onlineUsers: onlineUsers,
                onlineCount: onlineCount,
                user: obj
            });
            console.log(obj.username + ' 断开连接');
			dateFileLog.info(obj.username + ' 断开连接');
        }
    });

    //监听用户发布聊天内容
    socket.on('message',function(obj) {
        //向所有客户端广播发布的消息
        io.emit('message', obj);
        console.log(obj.username + '说：' + obj.content);
		dateFileLog.info(obj.username + '说：' + obj.content);
    });
	sub.on("message", function(channle, msg){ // chat频道一旦接收到消息msg,则立即向socket.io连接中发送该msg数据.
			info.userid=0;
			info.username="服务器";
			info.content=msg;
			io.emit('message', info);
			
			console.log("频道:",channle," 内容：", msg);   
			dateFileLog.info("频道:"+channle+" 内容："+ msg);         
			//socket.emit("msgReceived", msg);
	});
});
var WebSocketPort=3000;
http.listen(3000,
function() {
    console.log("WebSocket服务器"+WebSocketPort+"端口监听中...");
	dateFileLog.info("WebSocket服务器"+WebSocketPort+"端口监听中...");
});
