import axios from 'axios';
import fs from 'fs';
import path from 'path';

const buildFileName = (url) => {
  const { hostname, pathname } = new URL(url);
  const raw = `${hostname}${pathname}`;
  const name = raw.replace(/[^a-zA-Z0-9]/g, '-');
  return `${name}.html`;
};

const pageLoader = (url, outputDir = process.cwd()) => {
  const fileName = buildFileName(url);
  const filePath = path.join(outputDir, fileName);

  return axios.get(url)
    .then((response) => fs.promises.writeFile(filePath, response.data))
    .then(() => filePath);
};

export default pageLoader;
