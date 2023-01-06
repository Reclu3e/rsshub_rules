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
                item = $(item).find('td');

                const pub_time = item.first().text();
                const title = item.first().next().find('a').first().text();
                const link = item.first().next().find('a').attr('href');
                const author = item.first().next().next().find('a').text();
                const click_rate = item.first().next().next().next().text();

                return {
                    title: title,
                    description: `作者：${author} | 点击率：${click_rate}`,
                    link: link,
                    author: author,
                    pubDate: pub_time
                };
            }).get()
    };
}
;
