// npm packages
const async = require("async");
const { validationResult } = require("express-validator");

// local imports
const Author = require("../models/author");
const Book = require("../models/book");
const BookInstance = require("../models/bookinstance");
const Genre = require("../models/genre");

exports.index = function (req, res) {
  async.parallel(
    {
      book_count: function (callback) {
        Book.countDocuments({}, callback);
      },
      book_instance_count: function (callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count: function (callback) {
        BookInstance.countDocuments({ status: "Available" }, callback);
      },
      author_count: function (callback) {
        Author.countDocuments({}, callback);
      },
      genre_count: function (callback) {
        Genre.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render("index", {
        title: "Local Library Home",
        error: err,
        data: results,
      });
    }
  );
};

// Display list of all books.
exports.book_list = function (req, res, next) {
  Book.find({}, "title author")
    .populate("author")
    .exec(function (err, list_books) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("book_list", { title: "Book List", book_list: list_books });
    });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
  const { id } = req.params;
  async.parallel(
    {
      book: function (callback) {
        Book.findById(id).populate("author").populate("genre").exec(callback);
      },
      book_instance: function (callback) {
        BookInstance.find({ book: id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results.
        let err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("book_detail", {
        title: results.book.title,
        book: results.book,
        book_instances: results.book_instance,
      });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
  // Get all authors and genres, which we can use for adding to our book.
  async.parallel(
    {
      authors: function (callback) {
        Author.find(callback);
      },
      genres: function (callback) {
        Genre.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("book_form", {
        title: "Create Book",
        authors: results.authors,
        genres: results.genres,
      });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = function (req, res, next) {
  const { title, author, summary, isbn, genre } = req.body;
  // Extract the validation errors from a request.
  const errors = validationResult(req);

  // Create a Book object with escaped and trimmed data.
  const book = new Book({
    title,
    author,
    summary,
    isbn,
    genre,
  });

  if (!errors.isEmpty()) {
    // There are errors. Render form again with sanitized values/error messages.

    // Get all authors and genres for form.
    async.parallel(
      {
        authors: function (callback) {
          Author.find(callback);
        },
        genres: function (callback) {
          Genre.find(callback);
        },
      },
      function (err, results) {
        if (err) {
          return next(err);
        }

        // Mark our selected genres as checked.
        for (let i = 0; i < results.genres.length; i++) {
          if (book.genre.indexOf(results.genres[i]._id) > -1) {
            results.genres[i].checked = "true";
          }
        }
        res.render("book_form", {
          title: "Create Book",
          authors: results.authors,
          genres: results.genres,
          book: book,
          errors: errors.array(),
        });
      }
    );
    return;
  } else {
    // Data from form is valid. Save book.
    book.save(function (err) {
      if (err) {
        return next(err);
      }
      //successful - redirect to new book record.
      res.redirect(book.url);
    });
  }
};

// Display book delete form on GET.
exports.book_delete_get = function (req, res, next) {
  const { id } = req.params;
  async.parallel(
    {
      book: function (callback) {
        Book.findById(id).exec(callback);
      },
      book_instances: function (callback) {
        BookInstance.find({ book: id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results.
        res.redirect("/catalog/books");
      }
      // Successful, so render.
      res.render("book_delete", {
        title: "Delete Book",
        book: results.book,
        book_instances: results.book_instances,
      });
    }
  );
};

// Handle book delete on POST.
exports.book_delete_post = function (req, res, next) {
  const { bookid } = req.body;
  async.parallel(
    {
      book: function (callback) {
        Book.findById(bookid).exec(callback);
      },
      book_instances: function (callback) {
        BookInstance.find({ book: bookid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.book_instances.length > 0) {
        // Books has book instances. Render in same way as for GET route.
        res.render("book_delete", {
          title: "Delete Book",
          book: results.book,
          book_instances: results.book_instances,
        });
        return;
      } else {
        // Books has no book instances. Delete object and redirect to the list of books.
        Book.findByIdAndRemove(bookid, function deleteBook(err) {
          if (err) {
            return next(err);
          }
          // Success - go to book list
          res.redirect("/catalog/books");
        });
      }
    }
  );
};

// Display book update form on GET.
exports.book_update_get = function (req, res, next) {
  const { id } = req.params;
  // Get book, authors and genres for form.
  async.parallel(
    {
      book: function (callback) {
        Book.findById(id).populate("author").populate("genre").exec(callback);
      },
      authors: function (callback) {
        Author.find(callback);
      },
      genres: function (callback) {
        Genre.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results.
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      // Mark our selected genres as checked.
      for (
        let all_g_iter = 0;
        all_g_iter < results.genres.length;
        all_g_iter++
      ) {
        for (
          let book_g_iter = 0;
          book_g_iter < results.book.genre.length;
          book_g_iter++
        ) {
          if (
            results.genres[all_g_iter]._id.toString() ===
            results.book.genre[book_g_iter]._id.toString()
          ) {
            results.genres[all_g_iter].checked = "true";
          }
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: results.authors,
        genres: results.genres,
        book: results.book,
      });
    }
  );
};

// Handle book update on POST.
exports.book_update_post = function (req, res, next) {
  const { id } = req.params;
  const { title, author, summary, isbn, genre } = req.body;
  // Extract the validation errors from a request.
  const errors = validationResult(req);

  // Create a Book object with escaped/trimmed data and old id.
  const book = new Book({
    title,
    author,
    summary,
    isbn,
    genre: typeof genre === "undefined" ? [] : genre,
    _id: id, //This is required, or a new ID will be assigned!
  });

  if (!errors.isEmpty()) {
    // There are errors. Render form again with sanitized values/error messages.

    // Get all authors and genres for form.
    async.parallel(
      {
        authors: function (callback) {
          Author.find(callback);
        },
        genres: function (callback) {
          Genre.find(callback);
        },
      },
      function (err, results) {
        if (err) {
          return next(err);
        }

        // Mark our selected genres as checked.
        for (let i = 0; i < results.genres.length; i++) {
          if (book.genre.indexOf(results.genres[i]._id) > -1) {
            results.genres[i].checked = "true";
          }
        }
        res.render("book_form", {
          title: "Update Book",
          authors: results.authors,
          genres: results.genres,
          book: book,
          errors: errors.array(),
        });
      }
    );
    return;
  } else {
    // Data from form is valid. Update the record.
    Book.findByIdAndUpdate(id, book, {}, function (err, thebook) {
      if (err) {
        return next(err);
      }
      // Successful - redirect to book detail page.
      res.redirect(thebook.url);
    });
  }
};
