import nock from 'nock';
import fs from 'fs';
import path from 'path';
import os from 'os';
import pageLoader from '../src/index.js';

let tmpDir;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'page-loader-'),
  );
});

test('скачивает страницу и возвращает путь', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, '<html>Hello</html>');

  const filePath = await pageLoader(
    'https://ru.hexlet.io/courses',
    tmpDir,
  );

  const exists = await fs.promises.access(filePath)
    .then(() => true)
    .catch(() => false);

  expect(exists).toBe(true);
  expect(path.basename(filePath)).toBe('ru-hexlet-io-courses.html');

  const content = await fs.promises.readFile(filePath, 'utf-8');
  expect(content).toContain('Hello');
});

test('скачивает изображения и меняет ссылки в HTML', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, '<html><img src="/assets/professions/nodejs.png" /></html>');

  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, Buffer.from('fakepng'), { 'Content-Type': 'image/png' });

  const filePath = await pageLoader('https://ru.hexlet.io/courses', tmpDir);

  const content = await fs.promises.readFile(filePath, 'utf-8');
  expect(content).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png');

  const imgPath = path.join(
    tmpDir,
    'ru-hexlet-io-courses_files',
    'ru-hexlet-io-assets-professions-nodejs.png',
  );
  const imgExists = await fs.promises.access(imgPath)
    .then(() => true)
    .catch(() => false);

  expect(imgExists).toBe(true);
});