// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, RequestQueue, Configuration } from 'crawlee';
import express from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());

const requestSchema = z.object({
    urls: z.array(z.string().url()),
    selectors: z.array(z.object({
        name: z.string(),
        query: z.string(),
        type: z.enum(['text', 'html', 'attribute']).optional(),
        multiple: z.boolean().optional(),
        attribute: z.string().optional()
    })).optional()
});

const createCrawler = async (urls, selectors = []) => {
    const results = [];
    let requestQueue = null;
    let crawler = null;

    try {
        requestQueue = await RequestQueue.open();
        crawler = new PlaywrightCrawler({
            requestQueue,
            async requestHandler({ request, page, log }) {
                try {
                    await page.goto(request.url, { timeout: 30000 });
                    await page.waitForLoadState('networkidle', { timeout: 10000 });

                    const data = {
                        url: request.url,
                        timestamp: new Date().toISOString()
                    };

                    for (const selector of selectors) {
                        try {
                            const { name, query, type = 'text', multiple = false } = selector;
                            if (!name || !query) continue;

                            await page.waitForSelector(query, { timeout: 5000 });
                            const elements = page.locator(query);
                            const element = multiple ? elements : elements.first();
                            
                            switch(type) {
                                case 'text':
                                    data[name] = multiple ? await elements.allTextContents() : await element.textContent();
                                    break;
                                case 'html':
                                    data[name] = multiple ? await elements.evaluateAll(els => els.map(el => el.innerHTML)) : await element.innerHTML();
                                    break;
                                case 'attribute':
                                    if (selector.attribute) {
                                        data[name] = multiple ? 
                                            await elements.evaluateAll((els, attr) => els.map(el => el.getAttribute(attr)), selector.attribute) : 
                                            await element.getAttribute(selector.attribute);
                                    }
                                    break;
                            }
                        } catch (error) {
                            log.debug(`Failed to get selector ${selector.name}: ${error.message}`);
                            data[selector.name] = null;
                        }
                    }

                    results.push(data);
                    return data;
                } catch (error) {
                    log.error(`Error processing request ${request.url}: ${error.message}`);
                    return null;
                }
            },
            headless: true,
            maxRequestRetries: 3,
            requestHandlerTimeoutSecs: 60,
            maxConcurrency: 1,
            minConcurrency: 1,
            maxRequestsPerCrawl: 1000,
            maxRequestsPerMinute: 60,
            browserPoolOptions: {
                useFingerprints: false,
                preLaunchHooks: [(pageId, launchContext) => {
                    launchContext.launchOptions.args = [
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ];
                }]
            }
        });

        for (const url of urls) {
            await requestQueue.addRequest({ url });
        }
        
        await crawler.run();
        return results;
    } catch (error) {
        console.error('Error during crawler run:', error);
        throw error;
    } finally {
        if (crawler) await crawler.teardown();
        if (requestQueue) await requestQueue.drop();
    }
};

app.post('/crawl', async (req, res) => {
    try {
        const validatedData = requestSchema.parse(req.body);
        const results = await createCrawler(validatedData.urls, validatedData.selectors);

        res.json({
            status: 'success',
            results
        });
    } catch (error) {
        console.error('Error in /crawl endpoint:', error);
        res.status(error instanceof z.ZodError ? 400 : 500).json({
            status: 'error',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
