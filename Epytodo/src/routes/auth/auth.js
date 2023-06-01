const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

async function set_register(connection, req, res) {
    const {firstname, name, email, password} = req.body;

    if ("firstname" in req.body === false || "name" in req.body === false || "password" in req.body === false || "email" in req.body === false) {
        console.error('Register parameter dont exist');
        res.status(400).json({
            "msg": 'Bad parameter'
        });
        return;
    }

    try {
        const [user_email] = await connection.execute("SELECT email FROM user WHERE email = ?;", [email]);

        if (user_email.length === 1) {
            console.error('User already exists');
            res.status(409).json({
                "msg": 'Account already exists'
            });
            return;
        }

        const hash_password = await bcrypt.hash(password, 10);

        await db.query_database(connection, "INSERT INTO user (firstname, name, email, password) VALUES (?, ?, ?, ?);", [firstname, name, email, hash_password]);
    } catch {
        console.error('Error while registering new user');
        res.status(500).json({
            "msg": 'Internal server error'
        });
        return;
    }

    const token = jwt.sign({"email":email}, process.env.SECRET);

    console.log('User registered successfully');
    res.status(201).json({
        "token": token
    });
}

async function set_login(connection, req, res) {
    const {email, password} = req.body;
    let i = 0;
    let occurence = 0;
    let user_info = [];

    if ("password" in req.body === false || "email" in req.body === false) {
        console.error('Login parameter dont exist');
        res.status(400).json({
            "msg": 'Bad parameter'
        })
        return;
    }

    const user_email = await db.query_database(connection, "SELECT email FROM user WHERE email = ?;", [email]);
    if (user_email.length === 0) {
        console.error('Unknow email');
        res.status(401).json({
            "msg": 'Invalid Credentials'
        });
        return;
    }

    const user_password = await db.query_database(connection, "SELECT password FROM user WHERE email = ?;", [email]);
    const password_string = JSON.stringify(user_password);

    for (i = 0; i < password_string.length; i++) {
        if (occurence === 3)
            break;
        if (password_string[i] === '"')
            occurence++;
    }

    const real_password = password_string.substring(i, password_string.length - 3);
    const cmp_password = await bcrypt.compare(password, real_password);

    if (cmp_password === false) {
        console.error('Wrong Password');
        res.status(401).json({
            "msg": 'Invalid Credentials'
        });
        return;
    }

    const id = await db.query_database(connection, "SELECT id FROM user WHERE email = ?;", [email]);
    const user_id = JSON.stringify(id);
    const real_user_id = user_id.substring(7, 8);

    user_info.push(real_user_id);
    console.log('Good Password');

    const token = jwt.sign({"email":email}, process.env.SECRET);

    console.log('User logged successfully');
    res.status(200).json({
        "token": token
    });
    user_info.push(token);
    return user_info;
}

module.exports = {
    set_register,
    set_login,
}
