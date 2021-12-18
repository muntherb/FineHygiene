const jwt = require("jsonwebtoken");

module.exports = async function isAuthenticated(req, res, next) {
    //Bearer token, in [0] the bearer exists and in [1] the token exists
    const token = req.headers["authorization"].split(" ")[1];

    jwt.verify(token, "secret", (err, user) => {
        if (err) return res.json({ message: err});
        else {
            req.user = user;
            next();
        }
    })
}