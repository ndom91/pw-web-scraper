const Apify = require('apify')
const fs = require('fs/promises')

const SEARCH_TERM = 'berlin'

// Apify.main is a helper function, you don't need to use it.
Apify.main(async () => {
  const file = await fs.readFile('sites.txt', 'utf8')
  const sites = file.split('\n')
  const sitesArray = sites
    .map((site) => {
      if (!site.length) return
      return {
        url: site,
      }
    })
    .filter(Boolean)

  const requestList = await Apify.openRequestList('start-urls', sitesArray)
  const requestQueue = await Apify.openRequestQueue()

  const crawler = new Apify.PlaywrightCrawler({
    requestList,
    requestQueue,
    launchContext: {
      launchOptions: {
        headless: true,
      },
    },
    handlePageFunction: async ({ request, page }) => {
      console.log(`Processing ${request.url}...`)
      const html = await page.content()

      // Check if 'SEARCH_TERM' is found in rendered HTML
      if (html.match(new RegExp(SEARCH_TERM, 'gi'))) {
        console.log(`**** ${SEARCH_TERM} found in`, request.url)
        fs.appendFile('./output.txt', `${request.url}\n`)
        await Apify.pushData({ url: request.url })
      }

      // Enqueue other internal links found on initial page
      if (!request.userData.detailPage) {
        await Apify.utils.enqueueLinks({
          page,
          requestQueue,
          selector: 'a',
          pseudoUrls: [`${request.url}/[.*]`],
          transformRequestFunction: (req) => {
            req.userData.detailPage = true
            return req
          },
        })
      }
    },
    handleFailedRequestFunction: async ({ request }) => {
      console.log(`Request ${request.url} failed too many times.`)
    },
  })

  await crawler.run()
  console.log('Crawler Finished!')
})
