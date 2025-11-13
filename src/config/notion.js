const { Client } = require('@notionhq/client');

const notion = new Client({ 
    auth: process.env.NOTION_TOKEN 
});

const DATABASES = {
    PRODUCTS: '2a8686ba-9410-80aa-b724-f14d08478ecc',
    ORDERS: '298686ba-9410-81e9-a91f-d3b636f32122',
    ORDER_ITEMS: '88a092ce-387e-4616-b86e-7ec93ac3f3e9',
    CLIENTS: '2aa686ba-9410-8052-90ac-cf577095533b'
};

module.exports = {
    notion,
    DATABASES
};
