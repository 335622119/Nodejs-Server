var redis = require("redis");
var client = redis.createClient('6379', '127.0.0.1',{});
var log4js = require('log4js');

log4js.configure({

    appenders: [
        {
            type: 'console',
            category: "console"

        }, //控制台输出
        {
            type: "file",
            filename: './logs/TcpLog.log',
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


var dateFileLog = log4js.getLogger('dateFileLog');
var consoleLog = log4js.getLogger('console');
exports.logger = consoleLog;
//Redis 链接错误
client.on("error", function(error) {
    console.log("Redis错误 "+error);
	dateFileLog.error("Redis错误 "+error);
});

exports.use = function(app) {
	app.use(log4js.connectLogger(consoleLog, {level:'INFO', format:':method :url'}))
};

//-----------------------------------------建立socket服务器开始
var net = require('net');
var server = net.createServer();
server.on("connection",function(socket){
	console.log("客户端与Socket服务端已建立连接");
	dateFileLog.info("客户端与Socket服务端已建立连接");
	//socket.setEncoding("utf8");
	socket.on("data",function(data){
		var tt;
		tt=Bytes2Str(data);
		console.log("已接收到的数据："+tt);
		
		dateFileLog.info("已接收到的数据："+tt);
		socket.write("确认数据"+tt);
		dateFileLog.info('发送数据：'+tt);
		client.publish('chat',tt);
		dateFileLog.info("频道：chat,发送信息："+tt);
	})
	socket.on('end', function(data) {
		console.log("客户端与Socket服务端已断开连接");
		dateFileLog.info("客户端与Socket服务端已断开连接");
	})
	socket.on("error", function (err) {
        console.log("客户端与Socket服务端连接出错"+err);
		dateFileLog.error("客户端与Socket服务端连接出错"+err);
    });
});
//Socket服务器端口
var SocketPort=8431;
server.listen(SocketPort,'10.168.17.42',function(){
	console.log("Socket服务器"+SocketPort+"端口监听中...");
		dateFileLog.info("Socket服务器"+SocketPort+"端口监听中...");
})
server.on('close', function() {
    console.log('服务器现在关闭了！');
	dateFileLog.error('服务器现在关闭了！');
});
server.on("error",function(){
    console.log('客户端断开连接！');
	dateFileLog.error('客户端断开连接！');
})



//-----------------------------------------建立socket服务器结束

function Bytes2Str(arr)
{
    var str = "";
    for(var i=0; i<arr.length; i++)
    {
       var tmp = arr[i].toString(16);
       if(tmp.length == 1)
       {
           tmp = "0" + tmp;
       }
       str += tmp;
    }
    return str;
}
