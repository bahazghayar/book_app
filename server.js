"use strict";

const express = require("express");
require("dotenv").config();
const superagent = require("superagent");

const PORT = process.env.PORT || 3000;
const app = express();

// to access all the files in public
app.use(express.static("./public"));

// it convert POST from dataForm to req.body
app.use(express.urlencoded({ extended: true }));

// to tell the express, we want to use ejs template engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("pages/index");
});

app.get("/new", newSearch);
app.post("/searches" , searchHandler);
app.use(errorHandler);

function newSearch(req, res) {
  res.render("pages/searches/new");
}


function searchHandler(req, res) {
  let bookData = req.body;

  
  //   https://www.googleapis.com/books/v1/volumes?q=search+terms
  let url = `https://www.googleapis.com/books/v1/volumes?q=${bookData.bookNameOrAuthor}+${bookData.search}`  ;
 
  superagent.get(url)
  .then(bookResult => {
    //  res.send(bookResult.body);
     let booksItems = bookResult.body.items; 
     let booksArr = booksItems.map(val => new Books(val)) ; 
    //  res.send(booksArr) ;
    res.render("pages/searches/show" , {bookDivs: booksArr}) ; 
    
  }).catch(()=> {
      errorHandler(error) ;
  }) 

  
}

function errorHandler(error, req, res) {
  res.render('pages/error');
}

// Cosntructor
function Books (data) {
     this.image = data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail : `https://i.imgur.com/J5LVHEL.jpg` ;
     this.title = data.volumeInfo.title ? data.volumeInfo.title : 'Title not found';
     this.author = data.volumeInfo.authors ? data.volumeInfo.authors : 'Authors not found' ;
     this.description =  data.searchInfo ? data.searchInfo.textSnippet : 'Description not found'
}

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
