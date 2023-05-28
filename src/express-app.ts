import express from 'express';
import path from 'path';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import http from 'http';
import createError from 'http-errors';
import process from 'process';
import Database from 'better-sqlite3';
import { keyboard, Key } from '@nut-tree/nut-js';
import axios from 'axios';
console.log('ini', __dirname);
const app = express();
const router = express.Router();

const db = new Database(path.join(__dirname, '../data.db'));

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
    handler: async (req: any, res: any) => {
      const smt = db.prepare('select * from Password where id=1');
      const value: any = smt.all();

      if (value.length === 0) {
        res.redirect('/password');
      } else {
        if (req.query.event_type === 'payment_success') {
          const uri = `${url}${COMMAND.EXIT_LOCKSCREEN}${value[0].password}`;
          await axios.get(uri);

          await keyboard.pressKey(Key.LeftControl, Key.LeftWin);
          await keyboard.pressKey(Key.Right);
          await keyboard.releaseKey(Key.LeftControl, Key.LeftWin);
          await keyboard.releaseKey(Key.Right);
          res.send('Good');
        } else if (req.query.event_type === 'session_end') {
          const uri = `${url}${COMMAND.SHOW_LOCKSCREEN}${value[0].password}`;
          await axios.get(uri);

          await keyboard.pressKey(Key.LeftControl, Key.LeftWin);
          await keyboard.pressKey(Key.Left);
          await keyboard.releaseKey(Key.LeftControl, Key.LeftWin);
          await keyboard.releaseKey(Key.Left);
          res.send('Good');
        } else {
          res.render('index', { title: 'Home' });
        }
      }
    },
  },
  {
    path: '/password',
    handler: async (req: any, res: any) => {
      res.render('inputPassword', { title: 'Home' });
    },
  },
  {
    path: '/start',
    handler: async (req: any, res: any) => {
      res.render('index', { title: 'Home' });
    },
  },
  {
    path: '/input',
    handler: async (req: any, res: any) => {
      if (req.query.password === 'delete') {
        const smt = db.prepare(`DELETE FROM password`);
        smt.run();
        res.json({
          ok: true,
          message: 'Deleted all password',
        });
      } else if (req.query.password) {
        const smt = db.prepare(
          `INSERT INTO password (id,password) VALUES ('1','${req.query.password}')`
        );
        smt.run();
        res.json({
          ok: true,
          message: 'Password created',
        });
      } else {
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
app.set('views', path.join(__dirname, path.join('..', 'views')));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, path.join('..', 'public'))));
app.use('/', router);

app.use(function (req, res, next) {
  next(createError(404));
});
app.use((err: any, req: any, res: any, _next: any) => {
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

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

let server = http.createServer(app);
server.listen(expressPort);
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind =
    typeof expressPort === 'string'
      ? 'Pipe ' + expressPort
      : 'Port ' + expressPort;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
});
server.on('listening', () => console.log(`Listening on: ${expressPort}`));
