const express = require('express');
const app = express();
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const socketIo = require('socket.io');
PORT = 3000;
const sqlite3 = require('sqlite3');
path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const sessionMiddleware = session({
    store: new SQLiteStore,
    secret: 'skibidiragatheoppstoppa',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
});

const db = new sqlite3.Database('data/database.db', (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('db connected');
    }
});

function blackjack(req, res) {
    res.render('blackjack', { user: req.session.user, money: req.session.money });
}



function index(req, res) {
    res.render('index', { user: req.session.user });
}

function login(req, res) {
    console.log(req.session.user);
    if (req.query.token) {
        let tokenData = jwt.decode(req.query.token);
        req.session.token = tokenData;
        req.session.user = tokenData.username;
        res.redirect('/');
    } else {
        res.render('login', { user: req.session.user });
        console.log('req.session.user:', req.session.user);
    };
}

function loginPost(req, res) {

    console.log(req.body)
    if (req.body.user && req.body.pass) {
        db.get('SELECT * FROM users WHERE username=?;', req.body.user, (err, row) => {
            if (err) {
                console.error(err);
                res.send("Ther was an error: \n" + err);
            } else if (!row) {
                console.log('this is working bruh')
                const salt = crypto.randomBytes(16).toString('hex')

                //use the salt to 'hash' the password 
                crypto.pbkdf2(req.body.pass, salt, 1000, 64, 'sha512', (err, derivedKey) => {
                    if (err) {
                        res.send('error hashing password') + err
                    } else {
                        const hashedPassword = derivedKey.toString('hex')
                        db.run('INSERT INTO users (username, password, salt, money) VALUES (?, ?, ?,0);', [req.body.user, hashedPassword, salt], (err) => {
                            if (err) {
                                res.send('Database error: \n' + err)
                            } else {
                                res.redirect('/')
                            }
                        })
                    }
                })

            } else if (row) {

                // Compare stored password with provided password 
                crypto.pbkdf2(req.body.pass, row.salt, 1000, 64, 'sha512', (err, derivedKey) => {
                    if (err) {
                        res.send('Error hasing password')
                    } else {
                        hashedPassword = derivedKey.toString('hex')

                        if (row.password === hashedPassword) {
                            req.session.user = req.body.user
                            res.redirect('/')
                        } else {
                            res.send('incorrect password')
                        }
                    }
                })

            }
        })
    } else {
        res.send("You need a username and password");
    }



}

function logout(req, res) {
    res.send('You have been logged out click <a href="/">here</a> to go to the home page');
    req.session.destroy()
    console.log('logged out');

}

function chat(req, res) {
    res.render('chat', { user: req.session.user });
}

function casino(req, res) {
    res.render('casino', { user: req.session.user });
}

function ATT(req, res) {
    res.render('ATT', { user: req.session.user });
}

module.exports = {
    index,
    login,
    loginPost,
    logout,
    chat,
    casino,
    ATT,
    db,
    blackjack,
    
}