const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a course title"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  weeks: {
    type: String,
    required: [true, "Please add number of weeks"],
  },
  tuition: {
    type: Number,
    required: [true, "Please add a tuition cost"],
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add a minimum skill"],
    enum: ["beginner", "intermediate", "advanced"],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // This basically says that the bootcamp is a reference to another object based on the ID and it is used to tie a course to a specific bootcamp. This is also necessary if we want to use populate().
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
});

// Static method (that we call directly on the model) to get average cost of course tuitions
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  console.log(`Calculating avg cost...`);

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
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);

  // Put those fields in the database
  // We are grabbing our bootcamp model, updating that specific bootcamp by the ID and we are adding the result of the aggregation, the averageCost into the averageCost field
  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageCost:
        arr.length > 0 ? Math.ceil(arr[0].averageCost / 10) * 10 : null,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call the method getAverageCost after save, because if we add a course or remove it we want re-calculate the average cost
CourseSchema.post("save", async function () {
  // "this" keyword point to the model.
  // On save, we save the id of the bootcamp inside the bootcamp field sothis.bootcamp points to that id.
  await this.constructor.getAverageCost(this.bootcamp);
});

// Call the method getAverageCost after remove
CourseSchema.post("deleteOne", { document: true }, async function () {
  await this.constructor.getAverageCost(this.bootcamp);
});

module.exports = mongoose.model("Course", CourseSchema);
