"use strict";

const express = require("express");
require("dotenv").config();
const superagent = require("superagent");
const pg = require('pg');

const PORT = process.env.PORT || 3000;
const app = express();

// for database 
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });

// to access all the files in public
app.use(express.static("./public"));

// it convert POST from dataForm to req.body
app.use(express.urlencoded({ extended: true }));

// to tell the express, we want to use ejs template engine
app.set("view engine", "ejs");

app.get("/" , homePage) ; 
app.get("/new", newSearch);
app.post("/searches" , searchHandler);
// app.use(errorHandler);
app.get("/books/:id", showDetails) ;
app.post("/books" , saveBook) ;

function homePage (req, res) {
  let SQL = `SELECT * FROM books;` ;

  client.query(SQL)
  .then(bookData => {
    //  console.log(bookData) ; 

     res.render('pages/index', { booksItems : bookData.rows , rowCount : bookData.rowCount}  )

  }).catch((error)=> {
    errorHandler(error , req, res) ;
  }) 

  // res.render("pages/index");
};

function newSearch(req, res) {
  res.render("pages/searches/new");
}


function searchHandler(req, res) {
  let bookData = req.body;
  //   https://www.googleapis.com/books/v1/volumes?q=search+terms
  let url = `https://www.googleapis.com/books/v1/volumes?q=+${bookData.search}:${bookData.bookNameOrAuthor}`  ;
  // console.log(url);
  superagent.get(url)
  .then(bookResult => {
    //  res.send(bookResult.body);
     let booksItems = bookResult.body.items; 
     let booksArr = booksItems.map(val => new Books(val)) ; 
      // console.log(booksItems) ; 
    //  res.send(booksArr) ;
    res.render("pages/searches/show" , {bookDivs: booksArr}) ; 
    
  }).catch((error)=> {
      errorHandler(error , req, res) ;
  }) 
}

function showDetails (req, res) {
  let bookID = req.params.id ; 

  let SQL = `SELECT * FROM books WHERE id=${bookID};` ;
  client.query(SQL)
  .then(book=>{
      
    res.render("pages/books/show" , { oneBook : book.rows[0]}) 

  })

   
  //  console.log(bookID) ; 
}

function saveBook(req, res) {
  let image = req.body.image ;
  let title = req.body.title ;
  let description = req.body.description ;
  let author = req.body.author ; 
  let isbn = req.body.isbn ;
  let bookShelf = req.body.bookShelf ;

  let SQL = `INSERT INTO books(title, author ,isbn ,image_url , description , bookShelf) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id;`;
  let values = [title, author, isbn, image, description, bookShelf] ; 
  client.query(SQL, values)
      .then((result) => {
          //  console.log(result) ;
          let bookID = result.rows[0].id ;
          res.redirect(`/books/${bookID}`) ; 
          
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
     this.description =  data.searchInfo ? data.searchInfo.textSnippet : 'Description not found';
     this.isbn = data.volumeInfo.industryIdentifiers[0].type ?  data.volumeInfo.industryIdentifiers[0].type : 'ISPN not found' ; 
     this.bookShelf = data.volumeInfo.categories ? data.volumeInfo.categories : 'Bookshelf not found' ;
}



client.connect()
.then(() => {
  app.listen(PORT, () => {
    console.log(`Listning on PORT${PORT}`);
   }) 
  })
