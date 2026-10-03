First for the database i used SQLlite it is a ecommerce assigment so realtional database is needed , it handles contraints and transactions since it is a simnple application we used sqllite , postgres is better for heavier and bigger scale system .

there are 7 main tables in the database :

1. users :

columns :

- id (primary key)
- email (unique)
- password_hash
- name
- created_at

2. products :

columns :

- id (primary key)
- title
- description
- price_cents
- variant_type
- image_url
- created_at

3. product_variants :

columns :

- id (primary key)
- product_id (foreign key -> products.id)
- label
- stock

4. cart_items :

columns :

- id (primary key)
- user_id (foreign key -> users.id)
- variant_id (foreign key -> product_variants.id)
- quantity

5. wishlist_items :

columns :

- user_id (foreign key -> users.id)
- product_id (foreign key -> products.id)

6. orders :

columns :

- id (primary key)
- user_id (foreign key -> users.id)
- total_cents
- status
- created_at

7. order_items :

columns :

- id (primary key)
- order_id (foreign key -> orders.id)
- variant_id (foreign key -> product_variants.id)
- product_title
- variant_label
- unit_price_cents
- quantity

we used produts and product_variants because each variant has her own stock even if it is the same prodcut , example shirt with 3 sizes -> s m l each size has its own stock count and when there are no variant it is set to null and label standard and these does not sho in the frontend, this is why cart and stock , checkourt works with variant_id

Regarding the prices i treated it as an integer cents so i wont have problems with rounding so technically every price like 24 is actually stored as 2400 this way we keep the calcualtion exact

now for the cart it does not touch the stock , the stock is checked during the checkout
User clicks Place Order
↓
Start database transaction
↓
Read the user's current cart
↓
Read current product prices and variant stock
↓
Check that enough stock still exists
↓
Calculate the total on the server
↓
Decrease stock
↓
Create the order
↓
Create order item snapshots
↓
Clear the cart
↓
COMMIT

At any step any of thes fails a rollback is triggered so error is returned and the stock stays as is .
if two chekcout requests happening the same time when the first finish the second checks the updated database so we dont have duplicate orders.
