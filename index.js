import fs from 'fs/promises'
import dns from 'dns/promises'
import { chromium } from "playwright"
import PQueue from 'p-queue'

const seenURLs = new Set()
const queue = new PQueue({ concurrency: 5 })

const crawlPage = async (site, page) => {
  try {
    if (!site.length) {
      return
    }
    if (seenURLs.has(site)) {
      return
    }
    const hostname = new URL(site).hostname
    const dnsResults = await dns.resolve(hostname)
    if (!dnsResults.length) {
      console.log(`Skipping ${site} [COULD_NOT_RESOLVE]`)
      return
    }
    console.log('URL', site)

    seenURLs.add(site)
    await page.goto(site);
    const pageContent = await page.content()
    if (pageContent.match(/berlin/ig)) {
      console.log('**** Berlin found in', site)
      fs.appendFile('./output.txt', `${site}\n`)
    } else {
      const allUrls = await page.$$eval("a", (el) => el.map(e => e.href))
      const localUrls = Array.isArray(allUrls)
        ? allUrls
          .filter(url => url.match(hostname))
          .filter(url => !url.match(/^mailto:.*/i))
        : [allUrls]
      for (const url of localUrls) {
        await queue.add(() => crawlPage(url, page))
      }
    }
  } catch (e) {
    console.log('ERROR 0', e)
  }
}

(async function() {
  const file = await fs.readFile('sites.txt', 'utf8')
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromium.executablePath(),
  });

  const context = await browser.newContext();
  context.setDefaultTimeout(5000)
  const page = await context.newPage();

  const sites = file.split('\n')

  for (const site of sites) {
    await queue.add(() => crawlPage(site, page))
  }
  queue.on('completed', async result => {
    console.log('queue completed', result)
    await browser.close()
    process.exit(0)
  })
})();