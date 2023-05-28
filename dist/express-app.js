"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = __importDefault(require("http"));
const http_errors_1 = __importDefault(require("http-errors"));
const process_1 = __importDefault(require("process"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const nut_js_1 = require("@nut-tree/nut-js");
const axios_1 = __importDefault(require("axios"));
console.log('ini', __dirname);
const app = (0, express_1.default)();
const router = express_1.default.Router();
const db = new better_sqlite3_1.default(path_1.default.join(__dirname, '../data.db'));
const url = 'http://127.0.0.1:1500/api/';
const expressPort = 3000;
const COMMAND = {
    START: 'start?mode=print&&',
    EXIT_LOCKSCREEN: 'lockscreen/exit?',
    SHOW_LOCKSCREEN: 'lockscreen/show?',
};
const routes = [
    {
        path: '/',
        handler: async (req, res) => {
            if (req.query.anjing === 'babi') {
                const smt = db.prepare('select * from Password where id=1');
                const value = smt.all();
                if (value.length === 0) {
                    res.redirect('/password');
                }
                else {
                    if (req.query.event_type === 'payment_success') {
                        const uri = `${url}${COMMAND.EXIT_LOCKSCREEN}${value[0].password}`;
                        await axios_1.default.get(uri);
                        await nut_js_1.keyboard.pressKey(nut_js_1.Key.LeftControl, nut_js_1.Key.LeftWin);
                        await nut_js_1.keyboard.pressKey(nut_js_1.Key.Right);
                        await nut_js_1.keyboard.releaseKey(nut_js_1.Key.LeftControl, nut_js_1.Key.LeftWin);
                        await nut_js_1.keyboard.releaseKey(nut_js_1.Key.Right);
                        res.send('Good');
                    }
                    else if (req.query.event_type === 'session_end') {
                        const uri = `${url}${COMMAND.SHOW_LOCKSCREEN}${value[0].password}`;
                        await axios_1.default.get(uri);
                        await nut_js_1.keyboard.pressKey(nut_js_1.Key.LeftControl, nut_js_1.Key.LeftWin);
                        await nut_js_1.keyboard.pressKey(nut_js_1.Key.Left);
                        await nut_js_1.keyboard.releaseKey(nut_js_1.Key.LeftControl, nut_js_1.Key.LeftWin);
                        await nut_js_1.keyboard.releaseKey(nut_js_1.Key.Left);
                        res.send('Good');
                    }
                    else {
                        res.render('index', { title: 'Home' });
                    }
                }
            }
            else {
                res.send('GUOBLOG');
            }
        },
    },
    {
        path: '/password',
        handler: async (req, res) => {
            res.render('inputPassword', { title: 'Home' });
        },
    },
    {
        path: '/start',
        handler: async (req, res) => {
            res.render('index', { title: 'Home' });
        },
    },
    {
        path: '/input',
        handler: async (req, res) => {
            if (req.query.password === 'delete') {
                const smt = db.prepare(`DELETE FROM password`);
                smt.run();
                res.json({
                    ok: true,
                    message: 'Deleted all password',
                });
            }
            else if (req.query.password) {
                const smt = db.prepare(`INSERT INTO password (id,password) VALUES ('1','${req.query.password}')`);
                smt.run();
                res.json({
                    ok: true,
                    message: 'Password created',
                });
            }
            else {
                res.json({
                    ok: false,
                });
            }
        },
    },
];
routes.forEach((route) => {
    router.get(route.path, route.handler);
});
app.set('port', expressPort);
app.set('views', path_1.default.join(__dirname, path_1.default.join('..', 'views')));
app.set('view engine', 'ejs');
app.use((0, morgan_1.default)('dev'));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, path_1.default.join('..', 'public'))));
app.use('/', router);
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
app.use((err, req, res, _next) => {
    res.locals.title = 'error';
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});
function shutdown() {
    console.log('Shutting down Express server...');
    db.close();
    server.close();
}
process_1.default.on('SIGTERM', shutdown);
process_1.default.on('SIGINT', shutdown);
let server = http_1.default.createServer(app);
server.listen(expressPort);
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof expressPort === 'string'
        ? 'Pipe ' + expressPort
        : 'Port ' + expressPort;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process_1.default.exit(1);
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process_1.default.exit(1);
        default:
            throw error;
    }
});
server.on('listening', () => console.log(`Listening on: ${expressPort}`));
