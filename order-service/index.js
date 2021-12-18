const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 9090;
const mongoose = require("mongoose");
const Order = require("./Order");
const amqp = require("amqplib");
const {orderUrl} = require("../_shared/db.config")
var channel, connection;


//Connect Mongo
mongoose.connect(
    orderUrl,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log(`Order-Service DB Connected`);
    }
);
app.use(express.json());


//Recieved buy order from product-serivce/buy

function createOrder(products, userEmail) {
    let total = 0;
    let totalPackageSize = 0;
    for (let t = 0; t < products.length; ++t) {
        let {length, width, height, price} = products[t]
        total += price;

        //Function as per the standarized shipping terms, could be encapsulated into a changing variable
        totalPackageSize += (( length * width * height)/5000) 
    }
    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total,
        package_size: totalPackageSize,
    });
    newOrder.save();
    return newOrder;
}


//Connect to RabbitMQ
async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");
}
connect().then(() => {
    //Consume pending products
    channel.consume("ORDER", (data) => {
        console.log("Consuming ORDER service");
        const { products, userEmail } = JSON.parse(data.content);
        console.log(products, userEmail);
        const newOrder = createOrder(products, userEmail);
        channel.ack(data);
        channel.sendToQueue(
            "PRODUCT",
            Buffer.from(JSON.stringify({ newOrder }))
        );
    });
});

app.listen(PORT, () => {
    console.log(`Order-Service at ${PORT}`);
});