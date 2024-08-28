const cron = require("node-cron");
const BlackListedToken = require("../models/token.model");

const clearOutdatedBlackListedTokens = () => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const oneHourAgo = Math.floor(new Date().getTime() / 1000) - 3600;

      await BlackListedToken.deleteMany({
        iat: { $lt: oneHourAgo },
      });
      console.log(
        "Outdated blacklisted tokens cleared from database successfully."
      );
    } catch (error) {
      console.error("Error clearing outdated blacklisted tokens", error);
    }
  });
};

module.exports = clearOutdatedBlackListedTokens;
