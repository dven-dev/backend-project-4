import nock from 'nock'
import fs from 'fs'
import path from 'path'
import os from 'os'
import pageLoader from '../src/index.js'

const getFixturePath = filename => path.join('__fixtures__', filename)

let tmpDir

beforeEach(() => fs.promises.mkdtemp(
  path.join(os.tmpdir(), 'page-loader-'),
).then((dir) => {
  tmpDir = dir
}))

test('скачивает страницу и возвращает путь', () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, '<html>Hello</html>')

  return pageLoader('https://ru.hexlet.io/courses', tmpDir)
    .then((filePath) => {
      expect(path.basename(filePath)).toBe('ru-hexlet-io-courses.html')
      return fs.promises.readFile(filePath, 'utf-8')
    })
    .then((content) => {
      expect(content).toContain('Hello')
    })
})

test('скачивает все локальные ресурсы и обновляет HTML', () => {
  return fs.promises.readFile(getFixturePath('index.html'), 'utf-8')
    .then((htmlFixture) => {
      nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, htmlFixture)

      nock('https://ru.hexlet.io')
        .get('/assets/professions/nodejs.png')
        .reply(200, Buffer.from('fakepng'), { 'Content-Type': 'image/png' })

      nock('https://ru.hexlet.io')
        .get('/assets/application.css')
        .reply(200, 'body {}', { 'Content-Type': 'text/css' })

      nock('https://ru.hexlet.io')
        .get('/packs/js/runtime.js')
        .reply(200, 'console.log(1)', { 'Content-Type': 'application/javascript' })

      return pageLoader('https://ru.hexlet.io/courses', tmpDir)
    })
    .then(filePath => fs.promises.readFile(filePath, 'utf-8'))
    .then((content) => {
      expect(content).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png')
      expect(content).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-assets-application.css')
      expect(content).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-courses.html')
      expect(content).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-packs-js-runtime.js')
      expect(content).toContain('https://cdn2.hexlet.io/assets/menu.css')
      expect(content).toContain('https://js.stripe.com/v3/')

      const filesDir = path.join(tmpDir, 'ru-hexlet-io-courses_files')
      return Promise.all([
        fs.promises.access(path.join(filesDir, 'ru-hexlet-io-assets-professions-nodejs.png')),
        fs.promises.access(path.join(filesDir, 'ru-hexlet-io-assets-application.css')),
        fs.promises.access(path.join(filesDir, 'ru-hexlet-io-packs-js-runtime.js')),
      ])
    })
})

test('выбрасывает ошибку при HTTP 404', () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(404)

  return expect(
    pageLoader('https://ru.hexlet.io/courses', tmpDir),
  ).rejects.toThrow('Failed to load https://ru.hexlet.io/courses (HTTP 404)')
})

test('выбрасывает ошибку при HTTP 500', () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(500)

  return expect(
    pageLoader('https://ru.hexlet.io/courses', tmpDir),
  ).rejects.toThrow('Failed to load https://ru.hexlet.io/courses (HTTP 500)')
})

test('выбрасывает ошибку при сетевом сбое', () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .replyWithError('Connection reset')

  return expect(
    pageLoader('https://ru.hexlet.io/courses', tmpDir),
  ).rejects.toThrow('Failed to load https://ru.hexlet.io/courses')
})

test('выбрасывает ошибку при HTTP 404 для ресурса', () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, '<html><img src="/assets/missing.png" /></html>')

  nock('https://ru.hexlet.io')
    .get('/assets/missing.png')
    .reply(404)

  return expect(
    pageLoader('https://ru.hexlet.io/courses', tmpDir),
  ).rejects.toThrow('Failed to load https://ru.hexlet.io/assets/missing.png (HTTP 404)')
})

test('выбрасывает ошибку если директория назначения не существует', () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, '<html>Hello</html>')

  return expect(
    pageLoader('https://ru.hexlet.io/courses', '/nonexistent/dir'),
  ).rejects.toThrow('Output directory does not exist: /nonexistent/dir')
})

test('выбрасывает ошибку при ошибке записи файла', () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, '<html>Hello</html>')

  return expect(
    pageLoader('https://ru.hexlet.io/courses', '/'),
  ).rejects.toThrow('Failed to save')
})
