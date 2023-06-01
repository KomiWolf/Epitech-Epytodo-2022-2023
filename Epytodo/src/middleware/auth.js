async function verify_token(req, res, user_token) {
    const given_token = req.header('Authorization');

    if (!given_token) {
        res.status(401).json({
            "msg": 'No token, authorization denied'
        });
        console.error("Token error");
        return false;
    }

    const bearer = 'Bearer '
    const result = bearer.concat(user_token);

    if (given_token !== result && given_token !== user_token) {
        res.status(401).json({
            "msg": 'Token is not valid'
        });
        console.error("Token error");
        return false;
    }
    return true;
}

module.exports = {
    verify_token,
}
