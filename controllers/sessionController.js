const { runDBCommand } = require("../db/connection");
const filmController = require('./filmController');

exports.getSessionStatistic = async (req, res) => {
    try {
        const query = `SELECT
            TO_CHAR(date_trunc('month', s.date), 'Month') AS month,
            COUNT(s.session_ID) AS sessions_count FROM Session s
            WHERE s.date >= date_trunc('year', CURRENT_DATE - INTERVAL '1 year')
            AND s.date < date_trunc('year', CURRENT_DATE)
            GROUP BY date_trunc('month', s.date)
            ORDER BY sessions_count DESC;`;
        const data = await runDBCommand(query);
        res.render('session_stat', { statistic: data.rows });
    } catch (err) {
        console.log(err);
        res.status(500).redirect(`/session`);
    }
};

exports.getFilmSessions = async (req, res) => {
    try {
        const filmData = await filmController.fetchFilmData(req.params.id);

        const query = `SELECT f.title AS ftitle, c.name AS cname, h.name AS hname,
            s.session_id, s.date, s.start_time, s.end_time,
            ROUND((t.base_price * t.multiplier), 2) AS price
            FROM Session s
            JOIN Film f ON s.film_ID = f.film_ID
            JOIN Hall h ON s.hall_ID = h.hall_ID
            JOIN Cinema c ON h.cinema_ID = c.cinema_ID
            JOIN Tariff t ON s.tariff_ID = t.tariff_ID
            WHERE f.film_ID = $1
            ORDER BY s.date, s.start_time;`;
    
        const data = await runDBCommand(query, [req.params.id]);
        res.render('film_sessions', { inform: filmData, filmSessions: data.rows });
    } catch (err) {
        console.error(err);
        res.status(500).redirect('/film');
    }
}