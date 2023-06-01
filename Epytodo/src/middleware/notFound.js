const db = require('../config/db');

async function is_in_database(connection, res, query, data)
{
    const value = await db.query_database(connection, query, data);

    if (value.length === 0) {
        res.status(404).json({
            "msg": 'Not found'
        });
        console.error("Given value dont exist");
        return false;
    }
    return true;
}

module.exports = {
    is_in_database,
}
