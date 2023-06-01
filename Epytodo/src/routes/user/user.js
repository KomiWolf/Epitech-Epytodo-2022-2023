const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const auth_middleware = require('../../middleware/auth');
const is_found = require('../../middleware/notFound');

async function get_user_info(connection, req, res, user_info) {
    let user = null;

    if (await auth_middleware.verify_token(req, res, user_info[1]) === false)
        return;

    try {
        user = await db.query_database(connection, "SELECT * FROM user WHERE id = ?;", [user_info[0]]);
    } catch (err) {
        console.error('Error while searching user information');
        res.status(500).json({
            "msg": 'Internal server error'
        });
        return;
    }

    console.log("User info found");
    res.status(200).send(JSON.stringify(user[0], null, 4));
}

async function get_user_todos(connection, req, res, user_info) {
    if (await auth_middleware.verify_token(req, res, user_info[1]) === false) {
        return;
    }

    try {
        todos = await db.query_database(connection, "SELECT * FROM todo WHERE user_id = ?;", [user_info[0]]);
        console.log("Todos found");
        res.status(200).send(JSON.stringify(todos, null, 4));
        return;
    } catch (err) {
        console.error('Error while searching user todos');
        res.status(500).json({
            "msg": 'Internal server error'
        });
        return;
    }
}

async function get_info_from_id(connection, req, res, user_info) {
    if (await auth_middleware.verify_token(req, res, user_info[1]) === false) {
        return;
    }

    const user_id = req.params.params;

    if (await is_found.is_in_database(connection, res, "SELECT id FROM user WHERE id = ?;", [user_id]) === false) {
        return;
    }

    if (user_id !== user_info[0]) {
        console.log('User id dont exist');
        res.status(400).json({
            "msg": 'Not found'
        });
        return;
    }

    try {
        const user = await db.query_database(connection, "SELECT * FROM user WHERE id = ?;", [user_id]);
        console.log("User found");
        res.status(200).send(JSON.stringify(user[0], null, 4));
    } catch (err) {
        console.error('Error while searching user todo');
        res.status(500).json({
            "msg": 'Internal server error'
        });
    }
}
async function get_info_from_email(connection, req, res, user_info) {
    if (await auth_middleware.verify_token(req, res, user_info[1]) === false) {
        return;
    }

    const user_email = req.params.params;

    if (await is_found.is_in_database(connection, res, "SELECT id FROM user WHERE id = ? AND email = ?;", [user_info[0], user_email]) === false) {
        return;
    }

    try {
        const user = await db.query_database(connection, "SELECT * FROM user WHERE email = ?;", [user_email]);
        console.log("User found");
        res.status(200).send(JSON.stringify(user[0], null, 4));
    } catch (err) {
        console.error('Error while searching user todo');
        res.status(500).json({
            "msg": 'Internal server error'
        });
    }
}

async function update_user(connection, req, res, user_info) {
    if (await auth_middleware.verify_token(req, res, user_info[1]) === false) {
        return;
    }

    const user_id = req.params.id;

    if (await is_found.is_in_database(connection, res, "SELECT id FROM user WHERE id = ?;", [user_id]) === false) {
        return;
    }

    if (user_id !== user_info[0]) {
        console.log('User id dont exist');
        res.status(400).json({
            "msg": 'Not found'
        });
        return;
    }

    const {email, password, firstname, name} = req.body;

    if ("email" in req.body === false || "password" in req.body === false || "firstname" in req.body === false || "name" in req.body === false) {
        console.log('User parameter dont exist');
        res.status(400).json({
            "msg": 'Bad parameter'
        });
        return;
    }

    const hash_password = await bcrypt.hash(password, 10);

    try {
        await db.query_database(connection, "UPDATE user SET email = ?, password = ?, firstname = ?, name = ? WHERE id = ?;", [email, hash_password, firstname, name, user_info[0]]);
        const updated_user = await db.query_database(connection, "SELECT * FROM user WHERE id = ?;", [user_id]);
        console.log("User updated");
        res.status(200).send(JSON.stringify(updated_user[0], null, 4));
        return;
    } catch (err) {
        console.error('Error while updating user');
        res.status(500).json({
            "msg": 'Internal server error'
        });
    }
}

async function deleted_user(connection, req, res, user_info) {
    if (await auth_middleware.verify_token(req, res, user_info[1]) === false) {
        return;
    }

    const user_id = req.params.id;

    if (await is_found.is_in_database(connection, res, "SELECT id FROM user WHERE id = ?;", [user_id]) === false) {
        return;
    }

    try {
        const if_exist = await db.query_database(connection, "SELECT * FROM todo WHERE user_id = ?;", [user_id]);
        if (if_exist.length !== 0) {
            console.log("Delete all todo before deleting user");
            res.status(409).json({
                "msg": 'Internal server error'
            });
            return;
        }
    } catch (err) {
        console.error('Error while deleting user');
        res.status(500).json({
            "msg": 'Internal server error'
        });
        return;
    }

    try {
        await db.query_database(connection, "DELETE FROM user WHERE id = ?;", [user_id]);
        console.log("User deleted");
        res.status(200).json({
            "msg": `Successfully deleted record number : ${user_id}`
        });
    } catch (err) {
        console.error('Error while deleting user');
        res.status(500).json({
            "msg": 'Internal server error'
        });
    }
}

module.exports = {
    get_user_info,
    get_user_todos,
    get_info_from_id,
    get_info_from_email,
    update_user,
    deleted_user,
}
