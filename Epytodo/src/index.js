const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db');
const auth = require('./routes/auth/auth');
const user = require('./routes/user/user');
const todo = require('./routes/todos/todos');
const app = express();

var connection = null;
const port = 3000;
let user_info = [];

async function is_digit(str) {
    return /^\d+$/.test(str);
}

app.use(bodyParser.json());

//Just a simply server test
app.get('/', (req, res) => {
    res.send({'msg':"Hello World\n"});
});

//Authentification routes
app.post('/register', async (req, res) => {
    console.log("Registering user ...");
    await auth.set_register(connection, req, res);
    console.log("Task finished");
});

app.post('/login', async (req, res) => {
    console.log("Connecting user...");
    user_info = await auth.set_login(connection, req, res);
    console.log("Task finished");
});

//User routes
app.get('/user', async (req, res) => {
    console.log("Searching user information...");
    await user.get_user_info(connection, req, res, user_info);
    console.log("Task finished");
});

app.get('/user/todos', async (req, res) => {
    console.log("Searching user todos...");
    await user.get_user_todos(connection, req, res, user_info);
    console.log("Task finished");
});

app.get('/users/:params', async (req, res) => {
    if (await is_digit(req.params.params) === true) {
        console.log("Searching user info from id");
        await user.get_info_from_id(connection, req, res, user_info);
        console.log("Task finished");
    } else {
        console.log("Searching user info from email");
        await user.get_info_from_email(connection, req, res, user_info);
        console.log("Task finished");
    }
});

app.put('/users/:id', async (req, res) => {
    console.log("Updating user...");
    await user.update_user(connection, req, res, user_info);
    console.log("Task finished");
});

app.delete('/users/:id', async (req, res) => {
    console.log("Deleting user...");
    await user.deleted_user(connection, req, res, user_info);
    console.log("Task finished");
});

//Todo routes
app.get('/todos', async(req, res) => {
    console.log("Searching user's todos...");
    await todo.get_all_user_todo(connection, req, res, user_info);
    console.log("Task finished");
});

app.get('/todos/:id', async(req, res) => {
    console.log("Searching user's todos from id...");
    await todo.get_todo_from_id(connection, req, res, user_info);
    console.log("Task finished");
});

app.post('/todos', async(req, res) => {
    console.log("Creating todo for user...");
    await todo.create_todo(connection, req, res, user_info);
    console.log("Task finished");
});

app.put('/todos/:id', async(req, res) => {
    console.log("Changing todo...");
    await todo.change_todo(connection, req, res, user_info);
    console.log("Task finished");
});

app.delete('/todos/:id', async(req, res) => {
    console.log("Deleting todo...");
    await todo.delete_todo(connection, req, res, user_info);
    console.log("Task finished");
});

//Stop the server
app.get('/stop', (req, res) => {
    res.send("Stopping server ...");
    process.exit(0);
});

//If any task is found
app.use((req, res) => {
    res.status(404).send({
        "msg": 'Not found'
    });
    console.log("Task dont exist");
});

//The connection to database
app.listen(port, async () => {
    console.log(`Server running on port ${port} at http://localhost:${port}`);
    connection = await db.connect_to_database();
    console.log(`connection id: ${connection.threadId}`);
});
