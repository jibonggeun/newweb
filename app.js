/**
 * SoulMatchClient Server
 * For API
 * 
 *   @date 2020-12-11
 *   @author SoulMatch
 * */

// 환경변수 값 불러오기
require('dotenv').config();
// Express 기본 모듈 불러오기
var express = require('express'),
    http = require('http'),
    path = require('path');
const https = require('https');
const fs = require('fs');
// Express의 미들웨어 불러오기
var bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    static = require('serve-static'),
    errorHandler = require('errorhandler');

// 에러 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');
// Session 미들웨어 불러오기
var expressSession = require('express-session');
var flash = require('connect-flash');

//===============Redis==================//
const IoRedis = require("ioredis");

var cluster = new IoRedis.Cluster(
    [{
            port: 6300,
            host: "192.168.0.5"
        },
        {
            port: 6400,
            host: "192.168.0.5"
        },
        {
            port: 6302,
            host: "192.168.0.6"
        },
        {
            port: 6301,
            host: "192.168.0.5"
        },
        {
            port: 6401,
            host: "192.168.0.5"
        },
        {
            port: 6303,
            host: "192.168.0.6"
        }
    ], {
        //Reading은 Slave에서만;
        scaleReads: "slave"
    }
);

cluster.on('connect', function() {
    console.log("REDIS CLUSTER CONNECT");
});

// 모듈로 분리한 설정 파일 불러오기
var config = require('./config/config');

// 라우터 객체 참조
var route_loader = require('./route/route_loader')

// 익스프레스 객체 생성
var app = express();

// 설정 파일에 들어있는 port 정보 사용하여 포트 설정
app.set('port', 5583);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);


// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }));

// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json());

// cookie-parser 설정
app.use(cookieParser());

app.use(express.static('plugins'));
app.use(express.static('pages'));
app.use(express.static('dist'));
app.use(express.static('public'));
app.use(express.static('vendor'));
//app.use(express.static('EventBds'));

//Session
const connectRedis = require('connect-redis');
const SoulMatchRedisStore = connectRedis(expressSession);
app.use(expressSession({
    secret: 'soulmatchMain',
    resave: true,
    saveUninitialized: true,
    store: new SoulMatchRedisStore({ client: cluster }),
    cookie: {
        maxAge: 1000 * 60 * 60 // 60분후 폭파
    }
}));

app.use(flash());


// 라우팅 정보를 읽어들여 라우팅 설정
route_loader.init(app, express.Router());

//다중 환경 설정(HttpClient)
const cors = require('cors');
app.use(cors());

// 프로세스 종료 시에 데이터베이스 연결 해제
process.on('SIGTERM', function() {
    console.log("프로세스가 종료됩니다.");
    app.close();
});

app.on('close', function() {
    console.log("Express 서버 객체가 종료됩니다.");

});

app.all('/', function(req, res) {
    // console.log('RESPONSE');
    res.writeHead("200", { "Content-Type": "text/html;charset=utf8" });
    res.write("<html>");
    res.write("<title>Test</title>");
    res.write("<body>Test NodeJs 5583</body>");
    res.write("</html>")
    res.end();
});


http.createServer(app).listen(5583, function() {
    console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
});