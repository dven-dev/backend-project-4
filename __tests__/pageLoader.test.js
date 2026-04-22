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
  expect(content).toBe('<html>Hello</html>');
});
