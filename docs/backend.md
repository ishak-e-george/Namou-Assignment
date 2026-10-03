For the backened Express, typescript , zod, jwt, bcrypt, rate limiting
we used express for http api requests

this is how it is strucured :
Routes
middlewares
controllers
services
db

frontend sends requests -> routes -> middlewares checks auth -> controllers for input and output -> services buisness logic -> repositories where sql connects to sqlite -> db for the data and returns back

for the backend :
it gets the user from the verified jwt and uses the user id in the database

for auth :
login goes into a post/api/auth/login checks email and pass find the user compar hash password if match create jwt then it gets authenticated .

for zod:
checks if email is valid , password format is correct, positvie quantities,ids, safe integers..

also added a clean understandable statues :

- 200 success
- 201 created
- 204 success with no body
- 400 invalid request
- 401 unauthenticated
- 404 missing or hidden resource
- 409 stock conflict
- 413 payload too large
- 429 too many login attempts
- 500 unexpected server error

so the eroor handler handles the stautus and the service layer has the buisness logic :
Cart service decides:

- whether stock is enough
- whether a variant belongs to the same product
- whether two cart lines should merge
- whether a quantity is valid
  Order service decides:
- whether cart is empty
- whether stock is still available
- what the current price is
- how totals are calculated
- when stock decreases
- when cart is cleared

Regarding the security :
bycrypt to hash passwords
rate limiting to prevent brute force attacks
jwt verification
zod validation
