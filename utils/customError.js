// To make a custom error class, We need to inherit the built-in error class of JS, that's why we use "extends".
// This class is used to create a new error instance/object
class customError extends Error {
  constructor(message, statusCode) {
    // We call the constructor of the base "Error" class by using the super keyword and then pass it a message. This allows the customError instance to have a message property (ex. this.message = message)
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = customError;
