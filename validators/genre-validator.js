const { body } = require("express-validator");

exports.genre_create = [
  // Validate and santise the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),
];
