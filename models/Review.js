const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a title for the review"],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, "Please add some text"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, "Please add a rating between 1 and 10"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // This basically says that the bootcamp is a reference to another document based on the ID and it is used to tie a review to a specific bootcamp. Same goes for the user field. This is also necessary if we want to use populate().
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

// Prevent user from submitting more than one review per bootcamp
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Static method (that we call directly on the model) to get average rating of bootcamp
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  // aggregate is a mongoDB feature which allows us to aggregate data, for example, calculating averages, min and max values, sum etc., mongoose gives us access to the aggregate framework and feature through the aggregate() function
  // the method aggregate() return a promise, that's why we use await. Since we are already inside of the model we use the "this" keyword that, in this case,points to the model itself. When using "this", we get a reference to the current model. If we'd like to switch to a different model, we could do this.model('Bootcamp') to move our reference to the Bootcamp model.
  const arr = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    // we will get an object with this fields
    {
      $group: {
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  // Put those fields in the database
  // We are grabbing our bootcamp model, updating that specific bootcamp by the ID and we are adding the result of the aggregation, the averageRating into the averageRating field
  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageRating: arr.length > 0 ? arr[0].averageRating.toFixed(1) : null,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call the method getAverageRating after save, because if a review is added or removed then we want to re-calculate the average rating
ReviewSchema.post("save", async function () {
  // "this" keyword point to the model.
  // On save, we save the id of the bootcamp inside the bootcamp field so this.bootcamp points to that id.
  await this.constructor.getAverageRating(this.bootcamp);
});

// Call the method getAverageRating after remove
ReviewSchema.post("deleteOne", { document: true }, async function () {
  await this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model("Review", ReviewSchema);
