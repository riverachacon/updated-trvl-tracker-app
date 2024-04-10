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

db.query("SELECT id, name, color FROM users", (err, res) => {
  if(err){
    console.log("Error executing query", err.stack)
  } else{
    users = res.rows
  }

})

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

  return dataArray
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
      let totalCountries =  await getData()
      console.log("TOTAL: ", totalCountries) 
      console.log("E R R O R: ",err)
      res.render("index.ejs", {error: "country already exists", total:  totalCountries.length, countries: totalCountries})
      
    }
    
  } catch (err) {
    let totalCountries =  await getData()
    console.log("TOTAL: ", totalCountries) 
    console.log("E R R O R: ",err)
    res.render("index.ejs", {error: "Please specify the country again", total:  totalCountries.length, countries: totalCountries})

  }

});



/* CHANGING USERS */
app.post("/user", async (req, res) => {

  const selectedUser = req.body.user
  let dataArray = []// creating array to store data from DB from selected user
  let userArray = [] // crating array to store info from selected user 
  

  if (req.body.add === "new") {
    
    res.render("new.ejs")

  } else {
    try {
      let data = await db.query(
        "SELECT vc.user_id, vc.country_code, u.color FROM visited_countries vc JOIN users u ON vc.user_id = u.id WHERE vc.user_id = $1", 
        [selectedUser]
      )
      dataArray = data.rows
  
      let countryCodes = []// to store only the country codes
      for(let i = 0; i< dataArray.length; i ++){// loop to get all codes from selected member from DB
        countryCodes.push(dataArray[i].country_code)
      }
  
      let member = await db.query(
        "SELECT id, name, color FROM users WHERE id = $1",
        [selectedUser]
      )
      userArray = member.rows // info from selected member
      currentUserId = userArray[0].id // updating page for current member
  
  
      // console.log("COUNTRIES OF SELECTED MEMBER: ", countryCodes)
      // console.log("COLOR OF SELECTED MEMBER: ", dataArray[0].color)
      // console.log("USER ARRAY: ", userArray)
      // console.log("CURRENT USER ID: ", currentUserId)
  
      res.render("index.ejs", {countries: countryCodes, users: users, total: countryCodes.length, color: userArray[0].color})
    } catch (err) {
      let totalCountries =  await getData()
      console.log("TOTAL: ", totalCountries) 
      console.log("E R R O R /USER: ",err)
      res.render("index.ejs", {error: "/user ERROR", total:  totalCountries.length, countries: totalCountries})
  
      
    }
  }
  
});


/* ADD NEW MEMBER */
app.post("/new", async (req, res) => {





});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
