const got = require('@/utils/got');
const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (ctx) => {
    const URL = ctx.request.query.url;
    const res = await got({
        method: "GET",
        url: URL
    });

    const data = res.data;

    const rss_data = (await parser.parseString(data));
    const items = rss_data.items;

    ctx.set('Access-Control-Allow-Origin', '*');

    ctx.state.data = {
        title: rss_data.title,
        link: rss_data.link,
        item: items.map((item) => ({
            title: item.title,
            description: item.contentSnippet,
            pubDate: item.pubDate,
            author: item.author,
            link: item.link,
        }))
    };
}
;
