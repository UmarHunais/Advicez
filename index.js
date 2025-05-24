import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import session from "express-session";

const app = express();
const port = 3000;

// Required for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data path for storing user advice
const dataFilePath = path.join(__dirname, "data", "advices.json");

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Load and Save Functions
function loadAdvices() {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
  }
  return [];
}

function saveAdvice(adviceList) {
  fs.writeFileSync(dataFilePath, JSON.stringify(adviceList, null, 2));
}

// Home route
app.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://api.adviceslip.com/advice");
    const advice = response.data.slip.advice;
    res.render("index", { advice });
  } catch (err) {
    res.render("index", { advice: "Oops! Couldn't fetch advice." });
  }
});

// Refresh advice on form submit
app.post("/", async (req, res) => {
  try {
    const response = await axios.get("https://api.adviceslip.com/advice");
    const advice = response.data.slip.advice;
    res.render("index", { advice });
  } catch (err) {
    res.render("index", { advice: "Oops! Something went wrong." });
  }
});

// About page
app.get("/about.ejs", (req, res) => {
  res.render("about.ejs");
});

// Contact page
app.get("/contact.ejs", (req, res) => {
  res.render("contact.ejs");
});

// Submit page (GET)
app.get("/submit.ejs", (req, res) => {
  res.render("submit.ejs");
});

// Handle submitted advice (POST)
app.post("/submit", (req, res) => {
  const { username, advice } = req.body;
  if (username && advice) {
    const advices = loadAdvices();
    advices.push({ username, advice });
    saveAdvice(advices);
  }
  res.redirect("/public.ejs");
});

// Public advice page
app.get("/public.ejs", (req, res) => {
  const advices = loadAdvices();
  res.render("public.ejs", { advices });
});



app.use(session({
  secret: "superSecretAdminKey", // change this to something strong
  resave: false,
  saveUninitialized: true,
}));


app.post("/delete/:index", (req, res) => {
  const index = parseInt(req.params.index);
  if (isNaN(index)) return res.redirect("/public.ejs");

  let advices = loadAdvices(); // ✅ Use correct function to load
  if (index >= 0 && index < advices.length) {
    advices.splice(index, 1);
    saveAdvice(advices); // ✅ Use correct function to save
  }

  res.redirect("/public.ejs");
});


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});