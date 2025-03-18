# Crawlee REST API

A powerful RESTful API for web scraping using Crawlee and Playwright. This API allows you to scrape web pages with custom selectors and extract data in various formats.

## Features

- 🔍 Web scraping with custom selectors
- 🎯 Support for text, HTML, and attribute extraction
- 🔄 Multiple element selection
- ⚡ Fast and efficient crawling
- 🛡️ Input validation with Zod
- 🔒 Rate limiting and request management
- 🎨 Clean and modern API design

## Prerequisites

- Node.js (v20 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/muzafferkadir/crawlee-api.git
cd crawlee-api
```

2. Install dependencies:
```bash
yarn install
```

3. Start the server:
```bash
# Development mode with auto-reload
yarn dev

# Production mode
yarn start
```

## API Usage

### Endpoint: POST /crawl

Scrape data from specified URLs using custom selectors.

#### Request Body

```json
{
    "urls": [
        "https://example.com/page1",
        "https://example.com/page2"
    ],
    "selectors": [
        {
            "name": "title",
            "query": "h1.title",
            "type": "text"
        },
        {
            "name": "links",
            "query": "a.link",
            "type": "attribute",
            "attribute": "href",
            "multiple": true
        }
    ]
}
```

#### Selector Types

1. **text**: Extract text content
   ```json
   {
       "name": "title",
       "query": "h1.title",
       "type": "text"
   }
   ```

2. **html**: Extract HTML content
   ```json
   {
       "name": "content",
       "query": "div.content",
       "type": "html"
   }
   ```

3. **attribute**: Extract attribute values
   ```json
   {
       "name": "images",
       "query": "img",
       "type": "attribute",
       "attribute": "src",
       "multiple": true
   }
   ```

#### Response

```json
{
    "status": "success",
    "results": [
        {
            "url": "https://example.com/page1",
            "timestamp": "2024-03-18T12:00:00.000Z",
            "title": "Page Title",
            "links": ["/link1", "/link2"]
        }
    ]
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid input data
- `500 Internal Server Error`: Server-side errors

## Rate Limiting

- Maximum 1000 requests per crawl
- Maximum 60 requests per minute
- Concurrent requests limited to 1

## Author

Muzaffer Kadir YILMAZ

## License

MIT
