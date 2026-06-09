import axios from 'axios'
import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import debug from 'debug'
import axiosDebugLog from 'axios-debug-log'
import Listr from 'listr'

axiosDebugLog.addLogger(axios)

const log = debug('page-loader')

export class PageLoaderError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PageLoaderError'
  }
}

const buildPageName = (url) => {
  const { hostname, pathname } = new URL(url)
  const raw = `${hostname}${pathname}`
  return raw.replace(/[^a-zA-Z0-9]/g, '-')
}

const buildResourceName = (pageUrl, resourceSrc) => {
  const resourceUrl = new URL(resourceSrc, pageUrl)
  const ext = path.extname(resourceUrl.pathname)
  const pathnameWithoutExt = ext
    ? resourceUrl.pathname.slice(0, resourceUrl.pathname.length - ext.length)
    : resourceUrl.pathname
  const finalExt = ext || '.html'
  const raw = `${resourceUrl.hostname}${pathnameWithoutExt}`
  const name = raw.replace(/[^a-zA-Z0-9]/g, '-')
  return `${name.slice(0, 150)}${finalExt}`
}

const isLocalResource = (src, pageUrl) => {
  if (!src) return false
  const resourceHostname = new URL(src, pageUrl).hostname
  const pageHostname = new URL(pageUrl).hostname
  return resourceHostname === pageHostname
}

const isSamePage = (src, pageUrl) => {
  const resourceUrl = new URL(src, pageUrl)
  const page = new URL(pageUrl)
  return resourceUrl.hostname === page.hostname
    && resourceUrl.pathname === page.pathname
}

const fetchUrl = url => axios.get(url, { responseType: 'arraybuffer' })
  .catch((err) => {
    const status = err.response ? ` (HTTP ${err.response.status})` : ''
    throw new PageLoaderError(`Failed to load ${url}${status}: ${err.message}`)
  })

const downloadResource = (src, pageUrl, filesDirPath, filesDir, pageContent) => {
  const resourceName = buildResourceName(pageUrl, src)
  const localSrc = `${filesDir}/${resourceName}`

  if (isSamePage(src, pageUrl)) {
    const resourcePath = path.join(filesDirPath, resourceName)
    return fs.promises.writeFile(resourcePath, pageContent)
      .then(() => ({ src, localSrc }))
  }

  const resourceUrl = new URL(src, pageUrl).toString()
  const resourcePath = path.join(filesDirPath, resourceName)
  log('downloading %s', resourceUrl)
  return fetchUrl(resourceUrl)
    .then(response => fs.promises.writeFile(resourcePath, response.data))
    .then(() => {
      log('saved %s', resourcePath)
      return { src, localSrc }
    })
}

const RESOURCE_SELECTORS = [
  { tag: 'img', attr: 'src' },
  { tag: 'link', attr: 'href' },
  { tag: 'script', attr: 'src' },
]

const pageLoader = (url, outputDir = process.cwd()) => {
  log('loading page %s into %s', url, outputDir)

  const baseName = buildPageName(url)
  const htmlFile = path.join(outputDir, `${baseName}.html`)
  const filesDir = `${baseName}_files`
  const filesDirPath = path.join(outputDir, filesDir)

  return fs.promises.access(outputDir)
    .catch(() => {
      throw new PageLoaderError(`Output directory does not exist: ${outputDir}`)
    })
    .then(() => fetchUrl(url))
    .then((response) => {
      const $ = cheerio.load(response.data)

      const resources = []
      RESOURCE_SELECTORS.forEach(({ tag, attr }) => {
        $(tag).each((_i, el) => {
          const src = $(el).attr(attr)
          if (isLocalResource(src, url)) {
            resources.push({ src, attr, tag })
          }
        })
      })

      log('found %d local resources', resources.length)

      const mkdirPromise = resources.length > 0
        ? fs.promises.mkdir(filesDirPath, { recursive: true })
        : Promise.resolve()

      return mkdirPromise.then(() => ({ $, resources, pageContent: response.data }))
    })
    .then(({ $, resources, pageContent }) => {
      const results = []

      const tasks = new Listr(
        resources.map(({ src }) => ({
          title: src,
          task: () => downloadResource(src, url, filesDirPath, filesDir, pageContent)
            .then(result => results.push(result)),
        })),
        { concurrent: true },
      )

      return tasks.run().then(() => ({ $, results }))
    })
    .then(({ $, results }) => {
      results.forEach(({ src, localSrc }) => {
        RESOURCE_SELECTORS.forEach(({ tag, attr }) => {
          $(`${tag}[${attr}="${src}"]`).attr(attr, localSrc)
        })
      })

      return fs.promises.writeFile(htmlFile, $.html())
        .catch((err) => {
          throw new PageLoaderError(`Failed to save ${htmlFile}: ${err.message}`)
        })
    })
    .then(() => {
      log('page saved to %s', htmlFile)
      return htmlFile
    })
}

export default pageLoader
