import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const buildName = (url) => {
  const { hostname, pathname } = new URL(url);
  const raw = `${hostname}${pathname}`;
  return raw.replace(/[^a-zA-Z0-9]/g, '-');
};

const buildImageName = (pageUrl, src) => {
  const { hostname } = new URL(pageUrl);
  const ext = path.extname(src);
  const nameWithoutExt = src.replace(ext, '');
  const raw = `${hostname}${nameWithoutExt}`;
  const name = raw.replace(/[^a-zA-Z0-9]/g, '-');
  return `${name.slice(0, 150)}${ext}`;
};

const pageLoader = async (url, outputDir = process.cwd()) => {
  const baseName = buildName(url);
  const htmlFile = path.join(outputDir, `${baseName}.html`);
  const filesDir = `${baseName}_files`;
  const filesDirPath = path.join(outputDir, filesDir);

  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const images = [];
  $('img').each((i, el) => {
    const src = $(el).attr('src');
    if (src && src.startsWith('/')) {
      images.push({ el, src });
    }
  });

  await fs.promises.mkdir(filesDirPath, { recursive: true });

  for (const { el, src } of images) {
    const imgUrl = new URL(src, url).toString();
    const imgName = buildImageName(url, src);
    const imgPath = path.join(filesDirPath, imgName);
    const imgResponse = await axios.get(imgUrl, { responseType: 'arraybuffer' });
    await fs.promises.writeFile(imgPath, imgResponse.data);
    $(el).attr('src', `${filesDir}/${imgName}`);
  }

  await fs.promises.writeFile(htmlFile, $.html());
  return htmlFile;
};

export default pageLoader;