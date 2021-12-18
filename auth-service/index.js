const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT1 || 7071;
const authRouter = require("./routes/authRouter")
const {authUrl} = require("../_shared/db.config")

app.use(express.json());


mongoose.connect(authUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, () => {
    console.log(`DB is connected successfully.`)
})

//Login & Register
app.use("/auth", authRouter)

app.listen(PORT, () => {
    console.log(`Auth at ${PORT}`);
})