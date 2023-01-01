const got = require('@/utils/got');

module.exports = async (ctx) => {
    const baseURL = "https://bugcrowd.com";

    const response = await got({
        method: 'get',
        url: baseURL + "/crowdstream.json?page=1&filter_by=disclosures",
    });

    const items = response.data.results;

    ctx.state.data = {
        title: `bugcrowd - crowdstream`,
        link: 'https://huntr.dev/bounties/hacktivity/',
        item: items.map((item) => ({
                title: item.title,
                description: `researcher_username: ${item.researcher_username} | program: ${item.program_name}/${item.program_code} | target: ${item.target} | amount: ${item.amount}`,
                pubDate: item.disclosed_at,
                link: baseURL + item.disclosure_report_url,
            })
        ),
    };
};
