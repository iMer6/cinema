const { runDBCommand } = require("../db/connection");

exports.getAllCinemas = async (req, res) => {
    const query = `SELECT c.cinema_id, c.name, city.city_name AS "city", c.street, c.building, c.email 
        FROM Cinema c JOIN City ON city.city_id = c.city_id;`;
    const data = await runDBCommand(query);
    res.render('cinema', { cinemas: data.rows });
};

/*
exports.getAddCinemaPage = (req, res) => {res.render("add_cinema.ejs")};

exports.createCinema = async (req, res) => {
    try {
        const data = req.body;
        const query = `INSERT INTO Cinema(name, address, phone, email) VALUES ($1, $2, $3, $4);`
        
        const values = [data.name, data.address, data.phone, data.email];
        
        await runDBCommand(query, values);

        res.status(201).redirect('/cinema');
    } catch (err) {
        console.log(err);
        res.status(500).redirect('/cinema');
    }
};

exports.getCinemaById = async (req, res) => {
    try {
        const query = `SELECT name, address, phone, email FROM Cinema WHERE cinema.cinema_id = $1;`;
        const data = await runDBCommand(query, [req.params.id]);

        res.render('cinema_info', { inform: data.rows });
    } catch (err) {
        console.log(err);
        res.status(500).redirect(`/cinema`);
    }
};

exports.getUpdatePage = async (req, res) => {
    try {
        const query = `SELECT * FROM Cinema WHERE cinema_id = $1`;
        const data = await runDBCommand(query, [req.params.id]);

        res.render('update_cinema', { cinemas: data.rows[0] })
    } catch (err) {
        console.log(err);
        res.status(500).redirect('/cinema');
    }
};

exports.updateCinema = async (req, res) => {
    try {
        const data = req.body;
        const query = `UPDATE Cinema SET name = $2, address = $3, phone = $4, email = $5
            WHERE cinema_id = $1`;
        
        const values = [data.cinema_id, data.name, data.address, data.phone, data.email];

        await runDBCommand(query, values);

        res.status(200).json({ success: true, redirect: '/cinema' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false,
            redirect: `/cinema/${req.body.film_id}/update`,
            message: "Internal server error" });
    }
};

exports.deleteCinema = async (req, res) => {
    try {
        const query = `DELETE FROM Cinema WHERE cinema_id = $1`;
        const params = [req.params.id];
        await runDBCommand(query, params);

        res.status(200).json({ success: true, 
            redirect: '/cinema',
            message: "Cinema successfully deleted"});
    } catch(err) {
        console.log(err);
        res.status(500).json({ success: false,
            redirect: `/cinema/${req.params.id}`,
            message: "Delete error" });
    }
};
*/