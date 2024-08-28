const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const dbURI =
      process.env.NODE_ENV === "test"
        ? process.env.MONGO_URI_TEST
        : process.env.MONGO_URI;

    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(
      `Connected to MongoDB successfully (${process.env.NODE_ENV} environment)`
    );
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
