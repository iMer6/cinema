const { runDBCommand } = require("../db/connection");

exports.getBookingPage = async (req, res) => {
    try {
        const sessionQuery = `SELECT s.session_id, s.date, s.start_time, s.end_time, f.title, h.name
            FROM Session s
            JOIN Film f ON s.film_id = f.film_id
            JOIN Hall h ON s.hall_id = h.hall_id
            WHERE s.session_id = $1`;

        const seatsQuery = `SELECT s.row_number, s.seat_number, s.seat_id,
            CASE 
                WHEN t.ticket_id IS NOT NULL THEN 'occupied' ELSE 'available' 
            END AS status
            FROM Seat s
            JOIN Session sess ON sess.hall_id = s.hall_id
            LEFT JOIN Ticket t ON s.seat_id = t.seat_id AND t.session_id = sess.session_id
            WHERE sess.session_id = $1
            ORDER BY s.row_number, s.seat_number;`;

        const session = await runDBCommand(sessionQuery, [req.params.id]);
        const seats = await runDBCommand(seatsQuery, [req.params.id]);
        if (session.rows.length == 0) { return res.status(404).send("Session isn't exist"); }
        res.render('seats', { session: session.rows[0], seats: seats.rows });

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

exports.getConfirmationPage = async (req, res) => {
    try {
        const { session, seats } = req.query;
        const sessionId = parseInt(session);
        const seatIds = seats ? seats.split(',').map(Number) : [];

        if (isNaN(sessionId) || seatIds.length == 0) {
            return res.status(400).send("Wrong booking data");
        }

        const fullInfoQuery = `SELECT f.title, f.duration,
            s.date, s.start_time, s.end_time,
            h.name AS hname, c.name AS cname, c.street, c.building,
            ct.city_name, (t.base_price * t.multiplier) AS price
            FROM session s
            JOIN film f ON s.film_id = f.film_id
            JOIN hall h ON s.hall_id = h.hall_id
            JOIN cinema c ON h.cinema_id = c.cinema_id
            JOIN city ct ON c.city_id = ct.city_id
            JOIN tariff t ON s.tariff_id = t.tariff_id
            WHERE s.session_ID = $1;`;

        const seatsQuery = `SELECT row_number, seat_number FROM Seat WHERE seat_id = ANY($1)`;

        const infoRes = await runDBCommand(fullInfoQuery, [sessionId]);
        const seatsRes = await runDBCommand(seatsQuery, [seatIds]);

        if (infoRes.rows.length === 0) { return res.status(404).send("Session isn't exist"); }

        res.render('confirmation', {
            details: infoRes.rows[0],
            seats: seatsRes.rows,
            totalSeats: seatIds.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};

exports.confirmBooking = async (req, res) => {
    const { sessionId, seatIds } = req.body;

    const userId = req.user ? req.user.user_id : 5;

    try {
        await runDBCommand('BEGIN');

        const priceQuery = `SELECT (t.base_price * t.multiplier) as price
            FROM session s JOIN tariff t ON s.tariff_id = t.tariff_id
            WHERE s.session_id = $1`;
        
        const priceRes = await runDBCommand(priceQuery, [sessionId]);

        const bookingRes = await runDBCommand(
            `INSERT INTO booking (user_id, created_at, total_amount, booking_status) 
             VALUES ($1, NOW(), $2, 'confirmed') RETURNING booking_id`,
            [userId, priceRes.rows[0].price * seatIds.length]
        );
        const bookingId = bookingRes.rows[0].booking_id;

        for (let seatId of seatIds) {
            await runDBCommand(
                `INSERT INTO ticket (session_id, seat_id, booking_id, ticket_status) 
                 VALUES ($1, $2, $3, 'occupied')`,
                [sessionId, seatId, bookingId]
            );
        }

        await runDBCommand('COMMIT');
        res.json({ success: true, bookingId });

    } catch (err) {
        await runDBCommand('ROLLBACK');
        console.error("Помилка при підтвердженні: ", err);
        res.status(500).json({ success: false, error: err.message });
    }
};