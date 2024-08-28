Group Chat Application
This is a Node.js-based group chat application that provides web services for managing users, groups, and messages. It is built using MongoDB as the database and includes features like user authentication, group management, message posting, and more. The application also includes a cron job to clear blacklisted tokens every 15 minutes.

Features
Admin APIs
Manage Users: Admins can create and edit users.
User APIs (for Normal Users and Admins)
Authentication: Login and logout functionalities.
Group Management: Create, delete, search, add and delete members to groups. All users are visible to all other users.
Group Messages: Send messages within groups, delete, fetch and like messages.

Testing
Simple end-to-end functional tests to ensure that the APIs are working correctly.

Technologies Used
Node.js
Express.js
MongoDB with Mongoose
JWT (JSON Web Tokens) for Authentication
Bcrypt.js for Password Hashing
Jest and Supertest for E2E Testing
Node-cron for Scheduled Tasks
Dotenv for Environment Variables Management

Setup and Installation
Clone the repository:

git clone https://github.com/SayakDe98/group-chat.git

cd group-chat

Install dependencies:

npm install
Set up environment variables:

Create a .env file in the root directory and add the following:

MONGO_URI
MONGO_URI_TEST
JWT_SECRET
PORT
Run the application:

For production:

npm start
For development with auto-restart (using nodemon):

npm run dev
Run tests:

To run individual test files:

npm run test-auth
npm run test-group
npm run test-message
npm run test-user

Additional Notes
Cron Job: A cron job is set up to clear blacklisted JWT tokens every 15 minutes.
Database: MongoDB is used for storing all data related to users, groups, and messages.

Author
Sayak De(SayakDe98)

