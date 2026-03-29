const { runDBCommand } = require("../db/connection");
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    const { given_name, surname, email, password } = req.body;
    const role_id = 1;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO user_account (given_name, surname, email, password, role_id) VALUES ($1, $2, $3, $4, $5)`;

        await runDBCommand(query, [given_name, surname, email, hashedPassword, role_id]);

        res.status(200).json({ success: true, message: "Successfully registered" });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Email already exists or database error" });
    }
};

exports.login = async (req, res) => {
    const data = req.body;
    try {
        const query = `SELECT * FROM user_account WHERE email = $1`;
        const users = await runDBCommand(query, [data.email]);

        if (users.rows && users.rows.length > 0) {
            const user = users.rows[0];

            const isMatch = await bcrypt.compare(data.password, user.password);

            if (isMatch) {
                req.session.user = { id: user.user_id, name: user.given_name, role: user.role_id };

                req.session.createdAt = Date.now();

                return res.status(200).json({ success: true, name: user.given_name });
            }
        }
        res.json({ success: false, message: "Wrong email or password" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.logout = (req, res) => {
    if (!req.session) {
        return res.status(400).json({ success: false, message: "No session found" });
    }

    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error details:", err);
            res.clearCookie('connect.sid');
            return res.status(500).json({ success: false, message: "Error during destroy" });
        }
        res.clearCookie('connect.sid'); 
        return res.json({ success: true });
    });
};

exports.checkStatus = (req, res) => {
    if (req.session.user) {
        const day = 86_400_000;
        const now = Date.now();

        if (now - req.session.createdAt > day) {
            req.session.destroy();
            return res.json({ loggedIn: false });
        }
        res.json({ loggedIn: true, user: req.session.user });
    } else { res.json({ loggedIn: false }); }
};