const got = require('@/utils/got');

module.exports = async (ctx) => {
    const response1 = await got.get("https://hackerone.com/hacktivity");
    const cookie = response1.headers["set-cookie"][1];
    const csrf_token = response1.body.match("<meta name=\"csrf-token\" content=\"(.*)\" />")[1];

    const response = await got.post('https://hackerone.com/graphql', {
        headers: {
            "Cookie": cookie,
            "X-Csrf-Token": csrf_token
        },
        json: {
            operationName: 'HacktivityPageQuery',
            variables: {
                where: {
                    report: {
                        disclosed_at: {
                            _is_null: false,
                        },
                    },
                },
                orderBy: null,
                secureOrderBy: {
                    latest_disclosable_activity_at: {
                        _direction: 'DESC',
                    },
                },
                count: 25,
                maxShownVoters: 0,
            },
            query: 'query HacktivityPageQuery($querystring: String, $orderBy: HacktivityItemOrderInput, $secureOrderBy: FiltersHacktivityItemFilterOrder, $where: FiltersHacktivityItemFilterInput, $count: Int, $cursor: String, $maxShownVoters: Int) {\n  me {\n    id\n    __typename\n  }\n  hacktivity_items(\n    first: $count\n    after: $cursor\n    query: $querystring\n    order_by: $orderBy\n    secure_order_by: $secureOrderBy\n    where: $where\n  ) {\n    ...HacktivityList\n    __typename\n  }\n}\n\nfragment HacktivityList on HacktivityItemConnection {\n  pageInfo {\n    endCursor\n    hasNextPage\n    __typename\n  }\n  edges {\n    node {\n      ... on HacktivityItemInterface {\n        id\n        databaseId: _id\n        __typename\n      }\n      __typename\n    }\n    ...HacktivityItem\n    __typename\n  }\n  __typename\n}\n\nfragment HacktivityItem on HacktivityItemUnionEdge {\n  node {\n    ... on HacktivityItemInterface {\n      id\n      type: __typename\n    }\n    ... on Undisclosed {\n      id\n      ...HacktivityItemUndisclosed\n      __typename\n    }\n    ... on Disclosed {\n      id\n      ...HacktivityItemDisclosed\n      __typename\n    }\n    ... on HackerPublished {\n      id\n      ...HacktivityItemHackerPublished\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment HacktivityItemUndisclosed on Undisclosed {\n  id\n  votes {\n    total_count\n    __typename\n  }\n  voters: votes(last: $maxShownVoters) {\n    edges {\n      node {\n        id\n        user {\n          id\n          username\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  upvoted: upvoted_by_current_user\n  reporter {\n    id\n    username\n    ...UserLinkWithMiniProfile\n    __typename\n  }\n  team {\n    handle\n    name\n    medium_profile_picture: profile_picture(size: medium)\n    url\n    id\n    ...TeamLinkWithMiniProfile\n    __typename\n  }\n  latest_disclosable_action\n  latest_disclosable_activity_at\n  requires_view_privilege\n  total_awarded_amount\n  currency\n  __typename\n}\n\nfragment TeamLinkWithMiniProfile on Team {\n  id\n  handle\n  name\n  __typename\n}\n\nfragment UserLinkWithMiniProfile on User {\n  id\n  username\n  __typename\n}\n\nfragment HacktivityItemDisclosed on Disclosed {\n  id\n  reporter {\n    id\n    username\n    ...UserLinkWithMiniProfile\n    __typename\n  }\n  votes {\n    total_count\n    __typename\n  }\n  voters: votes(last: $maxShownVoters) {\n    edges {\n      node {\n        id\n        user {\n          id\n          username\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  upvoted: upvoted_by_current_user\n  team {\n    handle\n    name\n    medium_profile_picture: profile_picture(size: medium)\n    url\n    id\n    ...TeamLinkWithMiniProfile\n    __typename\n  }\n  report {\n    id\n    databaseId: _id\n    title\n    substate\n    url\n    __typename\n  }\n  latest_disclosable_action\n  latest_disclosable_activity_at\n  total_awarded_amount\n  severity_rating\n  currency\n  __typename\n}\n\nfragment HacktivityItemHackerPublished on HackerPublished {\n  id\n  reporter {\n    id\n    username\n    ...UserLinkWithMiniProfile\n    __typename\n  }\n  votes {\n    total_count\n    __typename\n  }\n  voters: votes(last: $maxShownVoters) {\n    edges {\n      node {\n        id\n        user {\n          id\n          username\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  upvoted: upvoted_by_current_user\n  team {\n    id\n    handle\n    name\n    medium_profile_picture: profile_picture(size: medium)\n    url\n    ...TeamLinkWithMiniProfile\n    __typename\n  }\n  report {\n    id\n    url\n    title\n    substate\n    __typename\n  }\n  latest_disclosable_activity_at\n  severity_rating\n  __typename\n}\n',
        },
        responseType: 'json',
    });
    ctx.state.data = {
        title: 'HackerOne Hacker Activity',
        link: 'https://hackerone.com/hacktivity',
        item: response.data.data.hacktivity_items.edges
            .filter((item) => item.node.type === 'Disclosed')
            .map((item) => {
                const author = item.node.reporter ? item.node.reporter.username : 'Someone';
                const vendor = item.node.team.name;
                const state = item.node.report.substate.replace(/^[a-z]/g, (L) => L.toUpperCase());
                const severity = item.node.severity_rating ? item.node.severity_rating.replace(/^[a-z]/g, (L) => L.toUpperCase()) : 'No Rating';
                const awarded = item.node.total_awarded_amount ? item.node.total_awarded_amount : 0;
                return {
                    title: item.node.report.title,
                    description: `By ${author} to ${vendor} | ${state} | ${severity} | $${awarded}`,
                    author,
                    pubDate: new Date(item.node.latest_disclosable_activity_at).toUTCString(),
                    link: `https://hackerone.com/reports/${item.node.databaseId}`,
                };
            }),
    };
};
