const got = require('@/utils/got');
const {TimeoutError} = require("got");

module.exports = async (ctx) => {
    const baseURL = "https://huntr.dev";

    const response = await got({
        method: 'get',
        url: baseURL + "/bounties/hacktivity/",
    });

    const data = response.data;

    // console.log(data)
    const reg = /<script src="(\/_nuxt\/.*?)" defer><\/script>/g;

    const res = data.matchAll(reg);

    let graphqlEndpoint, apiKey;

    let urls = [];
    for (const i of res) {
        let tmpURL = baseURL + i[1];
        urls.push(tmpURL)
    }

    await Promise.all(
        urls.map(async (url) => {
            let tmpres = await got.get(url, {
                beforeRetry: [
                    (options, error, retryCount) => {
                        if (graphqlEndpoint !== null && apiKey !== null) {
                            retryCount = 0
                        }
                    }
                ]
            });

            let a = tmpres.data.match(/aws_appsync_graphqlEndpoint:"(.*?)"/);
            let b = tmpres.data.match(/aws_appsync_apiKey:"(.*?)"/);
            if (a !== null) {
                graphqlEndpoint = a[1];
            }
            if (b !== null) {
                apiKey = b[1];
            }
        })
    );

    const response1 = await got.post(graphqlEndpoint, {
        headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
        },
        json: {
            "operationName": "fetchValidDisclosures",
            "variables": {
                "nextToken": null
            },
            "query": "query fetchValidDisclosures($nextToken: String) {\n  query: listValidVulnerabilities(nextToken: $nextToken) {\n    nextToken\n    items {\n      id\n      title\n      visible\n      createdAt\n      validation_at\n      patched_at\n      patch_commit_sha\n      status\n      cve_id\n      cvss {\n        attack_complexity\n        confidentiality\n        integrity\n        availability\n        attack_vector\n        privileges_required\n        scope\n        user_interaction\n        __typename\n      }\n      maintainer_severity\n      _author {\n        id\n        preferred_username\n        __typename\n      }\n      cwe {\n        id\n        description\n        title\n        __typename\n      }\n      repository {\n        id\n        owner\n        name\n        language\n        __typename\n      }\n      disclosure {\n        id\n        amount\n        activity {\n          id\n          user {\n            id\n            preferred_username\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      new_permalinks {\n        items {\n          id\n          status\n          bounty {\n            id\n            amount\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      fix {\n        items {\n          id\n          status\n          payout_id\n          __typename\n        }\n        __typename\n      }\n      published_at\n      __typename\n    }\n    __typename\n  }\n}"
        }
    });

    const items = response1.data.data.query.items;

    ctx.state.data = {
        title: `huntr - Hacktivity`,
        link: 'https://huntr.dev/bounties/hacktivity/',
        item: items.map((item) => ({
                title: item.title,
                description: `author: ${item._author.preferred_username} | repository: ${item.repository.owner}/${item.repository.name} | CVE: ${item.cve_id} | CVSS: ${item.cvss.scope} | CWE: ${item.cwe.description}`,
                pubDate: item.published_at,
                link: `https://huntr.dev/bounties/${item.id}`,
            })
        ),
    };
};
