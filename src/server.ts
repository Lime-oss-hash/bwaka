import app from "./app"; // Import the Express application instance from app.ts
import env from "./util/validateEnv"; // Import environment variables from validateEnv.ts
import mongoose from "mongoose"; // Import mongoose for MongoDB interactions
const emailScheduler = require("./Schedule/emailScheduler"); // Import the emailScheduler module

const port = env.PORT || 3000; // Get the port from environment variables or default to 3000

// Initialize and start the email scheduling task
emailScheduler.start();

// Connect to MongoDB using the connection string from environment variables
mongoose.connect(env.MONGO_CONNECTION_STRING)
    .then(() => {
        console.log("Mongoose connected"); // Log a successful MongoDB connection
        // Start the Express server and listen on the specified port
        app.listen(port, () => {
            console.log("Server running on port: " + port); // Log that the server is running
        });
    })
    .catch(console.error); // Catch any errors during MongoDB connection or server startup
