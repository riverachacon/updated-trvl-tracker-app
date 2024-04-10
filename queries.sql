CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(15),
    color VARCHAR (15)
)

CREATE TABLE visited_countries (
	id SERIAL PRIMARY KEY,
	country_code CHAR(2),
    user_id INTEGER REFERENCES users(id) --here is to make relationship from one user to many countries
)

--to join
SELECT name, country_code
FROM visited_countries
JOIN users
ON user_id = users.id