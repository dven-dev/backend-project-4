import nock from 'nock';
import fs from 'fs';
import path from 'path';
import os from 'os';
import pageLoader from '../src/index.js';

let tmpDir;

const htmlFixture = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <title>Курсы по программированию Хекслет</title>
    <link rel="stylesheet" media="all" href="https://cdn2.hexlet.io/assets/menu.css">
    <link rel="stylesheet" media="all" href="/assets/application.css" />
    <link href="/courses" rel="canonical">
  </head>
  <body>
    <img src="/assets/professions/nodejs.png" alt="Иконка профессии Node.js-программист" />
    <h3>
      <a href="/professions/nodejs">Node.js-программист</a>
    </h3>
    <script src="https://js.stripe.com/v3/"></script>
    <script src="https://ru.hexlet.io/packs/js/runtime.js"></script>
  </body>
</html>`;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'page-loader-'),
  );
});

test('скачивает страницу и возвращает путь', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, '<html>Hello</html>');

  const filePath = await pageLoader('https://ru.hexlet.io/courses', tmpDir);

  const exists = await fs.promises.access(filePath)
    .then(() => true)
    .catch(() => false);

  expect(exists).toBe(true);
  expect(path.basename(filePath)).toBe('ru-hexlet-io-courses.html');

  const content = await fs.promises.readFile(filePath, 'utf-8');
  expect(content).toContain('Hello');
});

test('скачивает все локальные ресурсы и обновляет HTML', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, htmlFixture);

  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, Buffer.from('fakepng'), { 'Content-Type': 'image/png' });

  nock('https://ru.hexlet.io')
    .get('/assets/application.css')
    .reply(200, 'body {}', { 'Content-Type': 'text/css' });

  nock('https://ru.hexlet.io')
    .get('/packs/js/runtime.js')
    .reply(200, 'console.log(1)', { 'Content-Type': 'application/javascript' });

  const filePath = await pageLoader('https://ru.hexlet.io/courses', tmpDir);
  const content = await fs.promises.readFile(filePath, 'utf-8');

  expect(content).toContain(
    'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png',
  );

  expect(content).toContain(
    'ru-hexlet-io-courses_files/ru-hexlet-io-assets-application.css',
  );

  expect(content).toContain(
    'ru-hexlet-io-courses_files/ru-hexlet-io-courses.html',
  );

  expect(content).toContain(
    'ru-hexlet-io-courses_files/ru-hexlet-io-packs-js-runtime.js',
  );

  expect(content).toContain('https://cdn2.hexlet.io/assets/menu.css');
  expect(content).toContain('https://js.stripe.com/v3/');

  const filesDir = path.join(tmpDir, 'ru-hexlet-io-courses_files');

  const imgExists = await fs.promises.access(
    path.join(filesDir, 'ru-hexlet-io-assets-professions-nodejs.png'),
  ).then(() => true).catch(() => false);
  expect(imgExists).toBe(true);

  const cssExists = await fs.promises.access(
    path.join(filesDir, 'ru-hexlet-io-assets-application.css'),
  ).then(() => true).catch(() => false);
  expect(cssExists).toBe(true);

  const jsExists = await fs.promises.access(
    path.join(filesDir, 'ru-hexlet-io-packs-js-runtime.js'),
  ).then(() => true).catch(() => false);
  expect(jsExists).toBe(true);
});
