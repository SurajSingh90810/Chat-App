const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
            next();
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user) {
            res.redirect("/dashboard");
        } else {     
            next();
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = { isLogin, isLogout };