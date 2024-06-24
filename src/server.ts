import app from "./app";
import env from "./util/validateEnv";
import mongoose from "mongoose";
const  emailScheduler = require("./Schedule/emailScheduler") ;

const port = env.PORT || 3000;

// 初始化并启动定时任务
emailScheduler.start();

mongoose.connect(env.MONGO_CONNECTION_STRING)
    .then(() => {
        console.log("Mongoose connected");
        app.listen(port, () => {
            console.log("Server running on port: " + port);
        });
    })
    .catch(console.error);
