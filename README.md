### Hexlet tests and linter status:
[![Actions Status](https://github.com/dven-dev/backend-project-4/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/dven-dev/backend-project-4/actions)

# Page Loader

[![Node.js CI](https://github.com/dven-dev/backend-project-4/actions/workflows/nodejs.yml/badge.svg)](https://github.com/dven-dev/backend-project-4/actions/workflows/nodejs.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=dven-dev_backend-project-4&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=dven-dev_backend-project-4)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=dven-dev_backend-project-4&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=dven-dev_backend-project-4)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=dven-dev_backend-project-4&metric=coverage)](https://sonarcloud.io/summary/new_code?id=dven-dev_backend-project-4)

Page loader utility — CLI tool that downloads a web page and saves it locally.

## Install

```bash
npm install
npm link
```

## Usage

```bash
page-loader --output /tmp https://ru.hexlet.io/courses
```

Download a page and save it:

[![asciicast](https://asciinema.org/a/0sRDPwXjPDQpbOfK.svg)](https://asciinema.org/a/0sRDPwXjPDQpbOfK)

Download a page with images:

[![asciicast](https://asciinema.org/a/jYQ1ZWbbmWLjBaTj.svg)](https://asciinema.org/a/jYQ1ZWbbmWLjBaTj)

Download a page with all local resources (styles, scripts, images):

[![asciicast](https://asciinema.org/a/fYJQUsTt9BzDb6NF.svg)](https://asciinema.org/a/fYJQUsTt9BzDb6NF)

Download a page with debug logging enabled:

[![asciicast](https://asciinema.org/a/hjrkybqWDjCeVafY.svg)](https://asciinema.org/a/hjrkybqWDjCeVafY)

Error handling example:

[![asciicast](https://asciinema.org/a/iktPVFfHqsh1PdZu.svg)](https://asciinema.org/a/iktPVFfHqsh1PdZu)

Download a page with progress:
[![asciicast](https://asciinema.org/a/3WsOxxSlKe8h2vwq.svg)](https://asciinema.org/a/3WsOxxSlKe8h2vwq)
