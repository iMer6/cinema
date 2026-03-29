const { runDBCommand } = require("../db/connection");

exports.getAllFilms = async (req, res) => {
    const query = `SELECT f.film_ID, f.title, f.release_year, f.rating,
        string_agg(DISTINCT g.genre_name, ', ') AS genre,
        string_agg(DISTINCT c.country_name, ', ') AS country
        FROM film f
        LEFT JOIN film_genre fg ON f.film_ID = fg.film_ID
        LEFT JOIN genre g ON fg.genre_ID = g.genre_ID
        LEFT JOIN film_country  fc ON f.film_ID = fc.film_ID
        LEFT JOIN country c ON fc.country_ID = c.country_ID
        WHERE f.is_active = TRUE
        GROUP BY f.film_ID;`;
    const data = await runDBCommand(query);
    res.render('film', { films: data.rows });
};

exports.getAddFilmPage = (req, res) => { res.render("add_film.ejs") };

exports.createFilm = async (req, res) => {
    try {
        const data = req.body;

        const genres = data.genre.split(',').map(g => g.trim()).filter(g => g !== "");
        const countries = data.country.split(',').map(c => c.trim()).filter(c => c !== "");

        const query = `WITH 
            prov_genres AS (
                INSERT INTO Genre (genre_name) SELECT unnest($4::text[])
                ON CONFLICT (genre_name) DO UPDATE SET genre_name = EXCLUDED.genre_name
                RETURNING genre_ID
            ),
            prov_countries AS (
                INSERT INTO Country (country_name) SELECT unnest($5::text[])
                ON CONFLICT (country_name) DO UPDATE SET country_name = EXCLUDED.country_name
                RETURNING country_ID
            ),
            inserted_film AS (
                INSERT INTO Film (title, original_title, description, duration, release_year, rating)
                VALUES ($1, $2, $3, $6, $7, $8)
                RETURNING film_ID
            ),
            link_genres AS (
                INSERT INTO Film_Genre (film_ID, genre_ID)
                SELECT if.film_ID, pg.genre_ID FROM inserted_film if, prov_genres pg
            )
            INSERT INTO Film_Country (film_ID, country_ID)
            SELECT if.film_ID, pc.country_ID FROM inserted_film if, prov_countries pc
            RETURNING (SELECT film_ID FROM inserted_film);`;
        
        const values = [data.title, data.original_title, data.description, genres, countries,
            parseInt(data.duration), parseInt(data.release_year), parseFloat(data.rating)];
        
        await runDBCommand(query, values);
        
        res.status(201).redirect('/film');
    } catch (err) {
        console.log(err);
        res.status(500).redirect('/film');
    }
};

exports.getFilmStatistic = async (req, res) => {
    try {
        const query = `SELECT f.film_ID, f.title, f.original_title, f.description, f.duration, f.release_year, f.rating,
            string_agg(DISTINCT g.genre_name, ', ') AS genres,
            string_agg(DISTINCT c.country_name, ', ') AS countries,
            COUNT(session.session_id) AS session_count
            FROM film f
            JOIN session ON f.film_ID = session.film_ID
            LEFT JOIN film_genre fg ON f.film_ID = fg.film_ID
            LEFT JOIN genre g ON fg.genre_ID = g.genre_ID
            LEFT JOIN film_country  fc ON f.film_ID = fc.film_ID
            LEFT JOIN country c ON fc.country_ID = c.country_ID
            GROUP BY f.film_ID
            ORDER BY session_count DESC
            LIMIT 5;`;

        const data = await runDBCommand(query);
        res.render('film_stat', { statistic: data.rows });
    } catch (err) {
        console.log(err);
        res.status(500).redirect(`/film`);
    }
};

exports.getFilmById = async (req, res) => {
    try {
        const film = await exports.fetchFilmData(req.params.id);
        res.render('film_info', { inform: film });
    } catch (err) {
        console.log(err);
        res.status(500).redirect(`/film`);
    }
};

exports.fetchFilmData = async (id) => {
    const query = `SELECT f.film_ID, f.title, f.original_title, f.description, f.duration, f.release_year, f.rating,
        string_agg(DISTINCT g.genre_name, ', ') AS genres,
        string_agg(DISTINCT c.country_name, ', ') AS countries
        FROM film f
        LEFT JOIN film_genre fg ON f.film_ID = fg.film_ID
        LEFT JOIN genre g ON fg.genre_ID = g.genre_ID
        LEFT JOIN film_country  fc ON f.film_ID = fc.film_ID
        LEFT JOIN country c ON fc.country_ID = c.country_ID
        WHERE f.film_ID = $1 AND f.is_active = TRUE
        GROUP BY f.film_ID;`;
    
    const data = await runDBCommand(query, [id]);
    return data.rows;
};

exports.getUpdatePage =  async (req, res) => {
    try {
        const query = `SELECT f.film_ID, f.title, f.original_title, f.description, f.duration, f.release_year, f.rating,
            string_agg(DISTINCT g.genre_name, ', ') AS genres,
            string_agg(DISTINCT c.country_name, ', ') AS countries
            FROM film f
            LEFT JOIN film_genre fg ON f.film_ID = fg.film_ID
            LEFT JOIN genre g ON fg.genre_ID = g.genre_ID
            LEFT JOIN film_country  fc ON f.film_ID = fc.film_ID
            LEFT JOIN country c ON fc.country_ID = c.country_ID
            WHERE f.film_ID = $1
            GROUP BY f.film_ID;`;
        const data = await runDBCommand(query, [req.params.id]);

        res.render('update_film', { films: data.rows[0] })
    } catch (err) {
        console.log(err);
        res.status(500).redirect('/film');
    }
};

exports.updateFilm = async (req, res) => {
    try {
        const data = req.body;

        const genres = (data.genre || "").toString().split(',')
            .map(g => g.trim()).filter(g => g !== "");

        const countries = (data.country || "").toString().split(',')
            .map(c => c.trim()).filter(c => c !== "");

        const query = `WITH
            updated_film AS (
                UPDATE Film
                SET title = $2, original_title = $3, description = $4, duration = $7, release_year = $8, rating = $9
                WHERE film_id = $1
                RETURNING film_id
            ),
            del_old_countries AS (
                DELETE FROM Film_Country WHERE film_id = $1 
                AND country_id NOT IN (SELECT country_id FROM Country WHERE country_name = ANY($6::text[]))
            ),
            ins_countries AS (
                INSERT INTO Film_Country (film_id, country_id)
                SELECT $1, country_id FROM Country
                WHERE country_name = ANY($6::text[])
                ON CONFLICT (film_id, country_id) DO NOTHING
            ),
            del_old_genres AS (
                DELETE FROM Film_Genre 
                WHERE film_id = $1 
                AND genre_id NOT IN (SELECT genre_id FROM Genre WHERE genre_name = ANY($5::text[]))
            )
            INSERT INTO Film_Genre (film_id, genre_id)
            SELECT $1, genre_id FROM Genre
            WHERE genre_name = ANY($5::text[])
            ON CONFLICT (film_id, genre_id) DO NOTHING;`;
        
        const values = [data.film_id, data.title, data.original_title, data.description, genres, countries,
            parseInt(data.duration), parseInt(data.release_year), parseFloat(data.rating)]; 

        await runDBCommand(query, values);

        res.status(200).json({ success: true, redirect: '/film' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, redirect: `/film/${req.body.film_id}/update`, message: "Internal server error" });
    }
};

exports.deleteFilm = async (req, res) => {
    try {
        const query = `UPDATE Film SET is_active = FALSE WHERE film_id = $1`;

        await runDBCommand(query, [req.params.id]);

        res.status(200).json({ success: true, message: "Film successfully deleted", redirect: '/film' });
    } catch(err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Delete error", redirect: `/film/${req.params.id}` });
    }
};
