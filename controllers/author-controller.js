// npm packages
const async = require("async");
const { validationResult } = require("express-validator");

// local imports
const Author = require("../models/author");
const Book = require("../models/book");

// Display list of all Authors.
exports.author_list = function (req, res, next) {
  Author.find()
    .sort([["family_name", "ascending"]])
    .exec(function (err, list_authors) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("author_list", {
        title: "Author List",
        author_list: list_authors,
      });
    });
};

// Display detail page for a specific Author.
exports.author_detail = function (req, res, next) {
  const { id } = req.params;
  async.parallel(
    {
      author: function (callback) {
        Author.findById(id).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: id }, "title summary").exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      } // Error in API usage.
      if (results.author == null) {
        // No results.
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("author_detail", {
        title: "Author Detail",
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

// Display Author create form on GET.
exports.author_create_get = function (req, res) {
  res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = function (req, res, next) {
  const { first_name, family_name, date_of_birth, date_of_death } = req.body;

  // Extract the validation errors from a request.
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // There are errors. Render form again with sanitized values/errors messages.
    res.render("author_form", {
      title: "Create Author",
      author: req.body,
      errors: errors.array(),
    });
    return;
  } else {
    // Data from form is valid.

    // Create an Author object with escaped and trimmed data.
    const author = new Author({
      first_name,
      family_name,
      date_of_birth,
      date_of_death,
    });
    author.save(function (err) {
      if (err) {
        return next(err);
      }

      // Successful - redirect to new author record.
      res.redirect(author.url);
    });
  }
};

// Display Author delete form on GET.
exports.author_delete_get = function (req, res, next) {
  const { id } = req.params;
  async.parallel(
    {
      author: function (callback) {
        Author.findById(id).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        // No results.
        res.redirect("/catalog/authors");
      }
      // Successful, so render.
      res.render("author_delete", {
        title: "Delete Author",
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res, next) {
  const { authorid } = req.body;
  async.parallel(
    {
      author: function (callback) {
        Author.findById(authorid).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: authorid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.authors_books.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render("author_delete", {
          title: "Delete Author",
          author: results.author,
          author_books: results.authors_books,
        });
        return;
      } else {
        // Author has no books. Delete object and redirect to the list of authors.
        Author.findByIdAndRemove(authorid, function deleteAuthor(err) {
          if (err) {
            return next(err);
          }
          // Success - go to author list
          res.redirect("/catalog/authors");
        });
      }
    }
  );
};

// Display Author update form on GET.
exports.author_update_get = function (req, res, next) {
  const { id } = req.params;
  Author.findById(id, function (err, author) {
    if (err) {
      return next(err);
    }
    if (author == null) {
      // No results.
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("author_form", { title: "Update Author", author: author });
  });
};

// Handle Author update on POST.
exports.author_update_post = function (req, res, next) {
  const { id } = req.params;
  const { first_name, family_name, date_of_birth, date_of_death } = req.body;

  // Extract the validation errors from a request.
  const errors = validationResult(req);

  // Create Author object with escaped and trimmed data (and the old id!)
  const author = new Author({
    first_name,
    family_name,
    date_of_birth,
    date_of_death,
    _id: id,
  });

  if (!errors.isEmpty()) {
    // There are errors. Render the form again with sanitized values and error messages.
    res.render("author_form", {
      title: "Update Author",
      author: author,
      errors: errors.array(),
    });
    return;
  } else {
    // Data from form is valid. Update the record.
    Author.findByIdAndUpdate(
      id,
      author,
      {},
      function (err, theauthor) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to genre detail page.
        res.redirect(theauthor.url);
      }
    );
  }
};
