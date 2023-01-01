const got = require('@/utils/got');

module.exports = async (ctx) => {
    const apiUrl = 'https://www.infoq.cn/public/v1/my/recommond';
    const pageUrl = 'https://www.infoq.cn';

    const resp = await got.post(apiUrl, {
        headers: {
            Referer: pageUrl,
        },
        json: {
            size: 15,
        },
    });

    const data = resp.data.data;

    // const items = await utils.ProcessFeed(data, ctx.cache);

    ctx.state.data = {
        title: 'InfoQ 推荐',
        link: pageUrl,
        item: data.map((item) => ({
                title: item.article_title,
                description: item.article_summary,
                pubDate: new Date(item.publish_time).toUTCString(),
                link: `https://www.infoq.cn/article/${item.uuid}`,
            })),
    };
};
