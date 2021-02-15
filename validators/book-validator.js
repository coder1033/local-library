const { body } = require("express-validator");

exports.book_create = [
  // Convert the genre to an array.
  (req, res, next) => {
      const {genre} = req.body;
    if (!(genre instanceof Array)) {
      if (typeof genre === "undefined") genre = [];
      else genre = new Array(genre);
    }
    next();
  },
  // Validate and sanitise fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
];
