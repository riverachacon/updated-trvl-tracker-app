import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "hola987",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function getCurrentUser(){
  const data = await db.query(
    "SELECT * FROM users"
  )
  users = data.rows
  return users.find((user) => user.id == currentUserId)

}


async function visitedCountries(){
  let dataArray = []

  let data = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1", 
    [currentUserId]
  )
  dataArray = data.rows
  
  let countryCodes = []
  for(let i = 0; i < dataArray.length; i ++){
    countryCodes.push(dataArray[i].country_code)
  }

  return countryCodes
}

app.get("/", async (req, res) => {

  let user = await getCurrentUser()
  let countries = await visitedCountries()

  console.log("/ USER: ", user)
  console.log("/ COUNTRIES: ", countries)

  res.render("index.ejs", {users: users, countries: countries, total: countries.length, color: user.color})


})



/* ADD COUNTRY */
app.post("/add", async (req, res) => {

  console.log("/ADD CURRENTUSERID: ", currentUserId)

  let newCountry = req.body.country.slice(0, 1).toUpperCase() + req.body.country.slice(1, req.body.country.length).toLowerCase()

  console.log("NEW COUNTRY: ", newCountry)


  try {
    let data= await db.query("SELECT country_code FROM countries WHERE country_name LIKE '%' || $1 || '%'", [newCountry])
    let inputCountryCode = data.rows[0].country_code

    try {
      await db.query("INSERT INTO visited_countries (country_code, user_id) VALUES($1, $2)", [inputCountryCode, currentUserId])
      res.redirect("/")

    } catch (err) {
      console.log("INSERT country ERROR: ", err)
    }
  } catch (err) {
    console.log("SELECT country ERROR: ",err)

  }

});



/* CHANGING USERS */
app.post("/user", async (req, res) => {
  let memberId = req.body.user
  // console.log(memberId)
  if (req.body.add === "new") {// redirect to new.ejs for adding new member
    res.render("new.ejs")
    
  } else {
    currentUserId = memberId
    res.redirect("/")
    
  }

  
  
});


/* ADD NEW MEMBER */
app.post("/new", async (req, res) => {

  let newMemberName = req.body.name
  let newMemberColor = req.body.color


  await db.query("INSERT INTO users (name, color) VALUES ($1, $2) RETURNING *", [newMemberName, newMemberColor])// using RETURNING to get the id from the new added member
  
  res.redirect("/")

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
