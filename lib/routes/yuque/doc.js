const got = require('@/utils/got');
const config = require('@/config').value;
// token通过process.env.YUQUE_TOKEN或者在config.js 配置
const { token = '' } = config.yuque;

module.exports = async (ctx) => {
    const { repo_id } = ctx.params;
    const baseUrl = 'https://www.yuque.com';
    const repoUrl = `${baseUrl}/api/v2/repos/${repo_id}`;
    // const docsUrl = `${repoUrl}/docs`;
    const docsUrl = `${baseUrl}/api/books/${repo_id}/docs`;

    const fetchData = (url) =>
        got({
            url,
            method: 'get',
            headers: {
                'X-Auth-Token': token,
            },
        });

    const repoDetail = await fetchData(repoUrl);
    const {
        name: repo,
        user: { name },
        description,
    } = repoDetail.data.data;
    const docsDetail = await fetchData(docsUrl);

    const docs = docsDetail.data.data;
    // tmp = tmp.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    // const docs = tmp.slice(0, 15);
    // 过滤掉草稿类型
    const publicDocs = docs.filter(({ status }) => status === 1);

    ctx.state.data = {
        title: `${name} / ${repo}`,
        link: repoUrl,
        description,
        item: publicDocs.map((doc) => ({
                    title: doc.title,
                    description: doc.description,
                    pubDate: doc.published_at,
                    updated: doc.updated_at,
                    link: `${baseUrl}${doc.url}`,
                }))
    };

    // ctx.state.data = {
    //     title: `${name} / ${repo}`,
    //     link: repoUrl,
    //     description,
    //     item: await Promise.all(
    //         publicDocs.map(async (doc) => {
    //             const item = {
    //                 title: doc.title,
    //                 description: doc.description,
    //                 pubDate: doc.published_at,
    //                 updated: doc.updated_at,
    //                 link: `${baseUrl}/${namespace}/${doc.id}`,
    //             };
    //             const key = `yuque${doc.id}`;
    //             const value = await ctx.cache.get(key);
    //
    //             if (value) {
    //                 item.description = value;
    //             } else if (token) {
    //                 const docDetail = await fetchData(`${docsUrl}/${doc.id}`);
    //                 item.description = docDetail.data.data.description;
    //                 ctx.cache.set(key, item.description);
    //             }
    //             return item;
    //         })
    //     ),
    // };
};
