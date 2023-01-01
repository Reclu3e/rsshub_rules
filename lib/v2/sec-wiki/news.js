const got = require('@/utils/got');
const cheerio = require('cheerio');
const timezone = require("@/utils/timezone");
const {parseDate} = require("@/utils/parse-date");


module.exports = async (ctx) => {
    const URL = "https://www.sec-wiki.com/news";
    const res = await got({
        method: "GET",
        url: URL
    });

    const $ = cheerio.load(res.data);

    ctx.set('Access-Control-Allow-Origin', '*');

    const list = $('div.grid-view[id=yw0] table tbody tr')

    ctx.state.data = {
        title: 'Sec Wiki - news',
        link: "https://www.sec-wiki.com/news",
        item: list.map(
            (i, item) => {
                item = $(item).find('td')
                return {
                    title: item.next().find('a').text(),
                    description: `作者：${item.next().next().find('a').text()}`,
                    link: item.next().find('a').attr('href'),
                    pubDate: item.first().text()
                };
            }).get()
    };
}
;
