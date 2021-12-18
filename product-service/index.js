const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.NODE_DOCKER_PORT || 8080;
const mongoose = require("mongoose");
const Product = require("./Product");
const amqp = require("amqplib");
const isAuthenticated = require("../_shared/isAuthenticated");
const { productUrl } = require("../_shared/db.config")
var order;

var channel, connection;

app.use(express.json());
mongoose.connect(
    productUrl,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log(`Product-Service DB Connected`);
    }
);

async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");
}
connect();



app.post("/product/buy", isAuthenticated, async (req, res) => {

// List of product IDs sent to buy, create order with such products with total
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });
    channel.sendToQueue(
        "ORDER",
        Buffer.from(
            JSON.stringify({
                products,
                userEmail: req.user.email,
            })
        )
    );
    channel.consume("PRODUCT", (data) => {
        order = JSON.parse(data.content);
    });
    return res.json(order);
});

app.post("/product/create", isAuthenticated, async (req, res) => {
    const { name, description, price, height, width, length } = req.body;
    const newProduct = new Product({
        name,
        description,
        price,
        height,
        width,
        length
    });
    newProduct.save();
    return res.json(newProduct);
});


app.listen(PORT, () => {
    console.log(`Product-Service at ${PORT}`);
});