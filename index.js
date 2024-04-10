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

let currentUserId ;

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



async function getData(){
  let dataArray = []

  let data = await db.query("SELECT user_id, country_code, color FROM visited_countries JOIN users ON user_id = users.id")
  dataArray = data.rows


  return dataArray

}

app.get("/", async (req, res) => {

  try {
    let data = await getData()

    // console.log("DATA: ", data)
    // console.log("USERS: ", users)
    

    res.render("index.ejs", {users: users, color: users[1].color, total: data.length, countries: data[2].country_code})
    
  } catch (error) {
    console.error("Error executing query", err.stack);
    res.status(500).send("Internal Server Error");
    
  }


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
    currentUserId = userArray[0].id


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
  
});


/* ADD NEW MEMBER */
app.post("/new", async (req, res) => {



  res.render("new.ejs")

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
