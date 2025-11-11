# Notion Order Form

Custom form to create orders with multiple products in Notion.

## Setup

### Quick Start
```bash
cd /Users/mmelnykov.appwell/Documents/my-projects/notion-sales-form
npm install
npm start
```

Open http://localhost:3000

## Your Notion Setup

Already configured with:
- **Clothing Products** database (products)
- **Orders** database
- **Order Items** database

## How It Works

1. Form loads products from "Clothing Products"
2. User selects products and enters color, size, quantity
3. On submit:
   - Creates new order in "Orders" table
   - Creates order items in "Order Items" table
   - Links everything together

## Database Property Mapping

### Orders Table
- Name (Title) ← Customer Name
- Telegram ID (Text) ← Customer Email/Contact

### Order Items Table
- Item (Title) ← Auto-generated description
- Order (Relation) ← Links to created order
- Product (Relation) ← Links to selected product
- Color (Select)
- Size (Select)
- Quantity (Number)

## Notes
- Token and database IDs are already configured in server.js
- Color and Size must match existing options in your Order Items database

