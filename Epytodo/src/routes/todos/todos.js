const db = require('../../config/db');
const auth_middleware = require('../../middleware/auth');
const is_found = require('../../middleware/notFound');

async function is_datetime(value, res) {
    let datetime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

    if (datetime.test(value) === false) {
        console.error("due_time must be a time string: YYYY-MM-DD HH:MM:SS");
        res.status(400).json({
            "msg": 'Bad parameter'
        });
        return false;
    }

    let date_sep = datetime.exec(value);

    if (date_sep !== null) {
        var month = parseInt(date_sep[2], 10);
        var day = parseInt(date_sep[3], 10);
        var hour = parseInt(date_sep[4], 10);
        var min = parseInt(date_sep[5], 10);
        var sec = parseInt(date_sep[6], 10);
    }
    if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) {
        console.error("due_time value are incorrect");
        res.status(400).json({
            "msg": 'Bad parameter'
        });
        return false;
    }
    return true;
}

async function get_all_user_todo(connection, req, res, user_info) {
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

async function get_todo_from_id(connection, req, res, user_info) {
    if (await auth_middleware.verify_token(req, res, user_info[1]) === false) {
        return;
    }

    const id = req.params.id;

    try {
        if (await is_found.is_in_database(connection, res, "SELECT id FROM todo WHERE id = ? AND user_id = ?;", [id, user_info[0]]) === false) {
            return;
        }

        const todo = await db.query_database(connection, "SELECT * FROM todo WHERE id = ?;", [id]);
        console.log("Todo found");
        res.status(200).send(JSON.stringify(todo[0], null, 4));
    } catch (err) {
        console.error('Error while searching user todo');
        res.status(500).json({
            "msg": 'Internal server error'
        });
        return;
    }
}

async function create_todo(connection, req, res, user_info) {
    if (await auth_middleware.verify_token(req, res, user_info[1]) === false) {
        return;
    }

    const {title, description, due_time, user_id, status} = req.body;

    if ("title" in req.body === false || "description" in req.body === false || "due_time" in req.body === false || "user_id" in req.body === false || "status" in req.body === false) {
        console.log('Todo creation parameter dont exist');
        res.status(400).json({
            "msg": 'Bad parameter'
        });
        return;
    }

    if (user_id !== user_info[0]) {
        console.log('User id dont exist');
        res.status(400).json({
            "msg": 'Not found'
        });
        return;
    }

    if (status !== "todo") {
        console.log('Status must be todo');
        res.status(400).json({
            "msg": 'Bad parameter'
        });
        return;
    }

    if (await is_datetime(due_time, res) === false) {
        return;
    }

    try {
        await db.query_database(connection, "INSERT INTO todo (title, description, due_time, user_id, status) VALUE (?, ?, ?, ?, ?);", [title, description, due_time, user_id, status]);
        const get_todo_id = await db.query_database(connection, "SELECT id FROM todo WHERE title = ? AND description = ? AND due_time = ? AND user_id = ? AND status = ?;", [title, description, due_time, user_id, status]);
        const id = JSON.stringify(get_todo_id[0]);
        const real_id = id.substring(6, id.length - 1);
        const get_todo_info = await db.query_database(connection, "SELECT * FROM todo WHERE id = ?;", [real_id]);

        console.log("Todo created");
        res.status(201).send(JSON.stringify(get_todo_info[0], null, 4));
        return;
    } catch (err) {
        console.error('Error while creating user todo');
        res.status(500).json({
            "msg": 'Internal server error'
        });
    }
}

async function change_todo(connection, req, res, user_info) {
    if (await auth_middleware.verify_token(req, res, user_info[1]) === false) {
        return;
    }

    const todo_id = req.params.id;

    if (await is_found.is_in_database(connection, res, "SELECT id FROM todo WHERE id = ? AND user_id = ?;", [todo_id, user_info[0]]) === false) {
        return;
    }

    const {title, description, due_time, user_id, status} = req.body;

    if ("title" in req.body === false || "description" in req.body === false || "due_time" in req.body === false || "user_id" in req.body === false || "status" in req.body === false) {
        console.log('Todo parameter dont exist');
        res.status(400).json({
            "msg": 'Bad parameter'
        });
        return;
    }

    if (user_id !== user_info[0]) {
        console.log('User id dont exist');
        res.status(400).json({
            "msg": 'Not found'
        });
        return;
    }

    if (status !== "todo" && status !== "in progress" && status !== "done") {
        console.log('Status must be todo');
        res.status(400).json({
            "msg": 'Bad parameter'
        });
        return;
    }

    if (await is_datetime(due_time, res) === false) {
        return;
    }

    try {
        await db.query_database(connection, "UPDATE todo SET title = ?, description = ?, due_time = ?, user_id = ?, status = ? WHERE id = ?;", [title, description, due_time, user_id, status, todo_id]);
        const get_updated_todo = await db.query_database(connection, "SELECT * FROM todo WHERE id = ?;", [todo_id]);
        console.log("Todo updated");
        res.status(200).send(JSON.stringify(get_updated_todo[0], null, 4));
        return;
    } catch (err) {
        console.error('Error while creating user todo');
        res.status(500).json({
            "msg": 'Internal server error'
        });
    }
}

async function delete_todo(connection, req, res, user_info) {
    if (await auth_middleware.verify_token(req, res, user_info[1]) === false) {
        return;
    }

    const todo_id = req.params.id;

    if (await is_found.is_in_database(connection, res, "SELECT id FROM todo WHERE id = ? AND user_id = ?;", [todo_id, user_info[0]]) === false) {
        return;
    }

    try {
        await db.query_database(connection, "DELETE FROM todo WHERE id = ?;", [todo_id]);
        console.log("Todo deleted");
        res.status(200).json({
            "msg": `Successfully deleted record number : ${todo_id}`
        });
    } catch (err) {
        console.error('Error while deleting user todo');
        res.status(500).json({
            "msg": 'Internal server error'
        });
    }
}

module.exports = {
    get_all_user_todo,
    get_todo_from_id,
    create_todo,
    change_todo,
    delete_todo,
}
