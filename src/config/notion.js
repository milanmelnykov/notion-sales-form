const { Client } = require('@notionhq/client');

const notion = new Client({ 
    auth: process.env.NOTION_TOKEN 
});

const DATABASES = {
    PRODUCTS: '2a8686ba-9410-80aa-b724-f14d08478ecc',
    ORDER_CANDIDATES: '62ef3fc0-ccf4-491a-ae14-b0359e58227a',
    ORDER_ITEMS: '88a092ce-387e-4616-b86e-7ec93ac3f3e9'
};

module.exports = {
    notion,
    DATABASES
};
