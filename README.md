# 🌐 Web Scraper

Basic [`playwright`](https://playwright.dev)/[`apify`](https://sdk.apify.com/) based web-scraper!

## 🕹️ Setup

1. Clone repository and install dependencies

```
$ git clone git@github.com:ndom91/web-scraper-berlin.git
$ cd web-scraper-berlin
$ npm install
```

2. Paste your list of URLs to be scraped into `sites.txt`

3. Double check the `SEARCH_TERM` variable towards the top of `index.js`. This is the term which will trigger sites to be written to `output.txt` during the scraping process.

4. Run `npm run scrape` :tada:

## 📝 License

MIT
