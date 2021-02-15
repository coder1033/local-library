// npm packages
const async = require("async");
const { validationResult } = require("express-validator");

// local imports
const Book = require("../models/book");
const Genre = require("../models/genre");

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
  Genre.find()
    .sort([["name", "ascending"]])
    .exec(function (err, list_genres) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("genre_list", {
        title: "Genre List",
        genre_list: list_genres,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
  const { id } = req.params;
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(id).exec(callback);
      },

      genre_books: function (callback) {
        Book.find({ genre: id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        //No results.
        let err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res) {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = function (req, res, next) {
  const { name } = req.body;
  // Extract the validation errors from a request.
  const errors = validationResult(req);

  // Create a genre object with escaped and trimmed data.
  const genre = new Genre({ name });

  if (!errors.isEmpty()) {
    // There are errors. Render the form again with sanitized values/error messages.
    res.render("genre_form", {
      title: "Create Genre",
      genre: genre,
      errors: errors.array(),
    });
  } else {
    // Data from form is valid
    // Check if Genre with same name already exists.
    Genre.findOne({ name }).exec(function (err, found_genre) {
      if (err) {
        return next(err);
      }

      if (found_genre) {
        // Genre exists, redirect to its detail page.
        res.redirect(found_genre.url);
      } else {
        genre.save(function (err) {
          if (err) {
            return next(err);
          }
          // Genre saved. Redirect to genre detail page.
          res.redirect(genre.url);
        });
      }
    });
  }
};

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
  const { id } = req.params;
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        res.redirect("/catalog/genres");
      }
      // Successful, so render.
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
  const { genreid } = req.body;
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(genreid).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: genreid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.genre_books.length > 0) {
        // Genre has books. Render in same way as for GET route.
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genre_books,
        });
        return;
      } else {
        // Genre has no books. Delete object and redirect to the list of genres.
        Genre.findByIdAndRemove(genreid, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          // Success - go to author list
          res.redirect("/catalog/genres");
        });
      }
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
  const { id } = req.params;
  Genre.findById(id).exec(function (err, result) {
    if (err) {
      return next(err);
    }
    if (result == null) {
      // No results.
      const err = new Error("Book not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("genre_form", { title: "Update Genre", genre: result });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = function (req, res, next) {
  const { id } = req.params;
  const { name } = req.name;
  // Extract the validation errors from a request.
  const errors = validationResult(req);

  // Create a genre object with escaped and trimmed data.
  const genre = new Genre({ name: name, _id: id });

  if (!errors.isEmpty()) {
    // There are errors. Render the form again with sanitized values/error messages.
    res.render("genre_form", {
      title: "Update Genre",
      genre: genre,
      errors: errors.array(),
    });
  } else {
    // Data from form is valid
    // Check if Genre with same name already exists.
    Genre.findOne({ name: name }).exec(function (err, found_genre) {
      if (err) {
        return next(err);
      }

      if (found_genre) {
        // Genre exists, redirect to its detail page.
        res.render("genre_form", {
          title: "Update Genre",
          genre: genre,
          errors: [{ msg: "This genre already exists" }],
        });
      } else {
        // Data from form is valid. Update the record.
        Genre.findByIdAndUpdate(id, genre, {}, function (err, thegenre) {
          if (err) {
            return next(err);
          }
          // Genre saved. Redirect to genre detail page.
          res.redirect(thegenre.url);
        });
      }
    });
  }
};
