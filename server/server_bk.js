const nodemailer = require("nodemailer");
require("dotenv").config();
const path = require("path");

const express = require('express');
const { exec } = require("child_process");
const mysql = require('mysql');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const salt = 10;

const app = express();
app.use(express.json());
app.use(cors({
    // origin: ["http://192.168.1.29:3000"],
    origin: ["http://" + process.env.SERVER_IP + ":" + process.env.CLIENT_PORT + ""],
    methods: ["POST", "GET"],
    credentials: true
}));

app.use(cookieParser());
app.use(bodyParser.json()); // Đảm bảo body-parser xử lý JSON

// Establish the connection with databse signup
const db_signup  = mysql.createConnection({
    host: "192.168.1.41",
    user: "phpmyadmin",
    password: "000",
    database: 'signup'
});

// Check connection to database
db_signup.connect((err) => {
    if (err) {
      console.error('Error connecting to the database signup:', err.message);
      return;
    }
    console.log('Connected successfully to the database signup');
});

// Establish the connection with databse client
const db_client = mysql.createConnection({
    host: "192.168.1.41",
    user: "phpmyadmin",
    password: "000",
    database: 'client'
});

//Check connection to database
db_client.connect((err) => {
    if (err) {
      console.error('Error connecting to the database client:', err.message);
      return;
    }
    console.log('Connected successfully to the database client');
    
});

// Establish the connection with databse client
const db_history = mysql.createConnection({
    host: "192.168.1.41",
    user: "phpmyadmin",
    password: "000",
    database: 'history'
});

//Check connection to database
db_history.connect((err) => {
    if (err) {
      console.error('Error connecting to the database history:', err.message);
      return;
    }
    console.log('Connected successfully to the database history');
});

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;

    if(!token){
        return res.json({Error: "You are not authenticated"});
    }else{
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if(err){
                return res.json({Error: "Token is not okey"});
            } else{
                req.name = decoded.name;
                next();
            }
        })
    }
}

// ####################################################### process backend  ########################################################
// API kiểm tra email
app.post('/callme', (req, res) => {
    console.log("Need get data from email: ", req.body);
    const { email } = req.body;
    const query = `SELECT * FROM clients WHERE email = ?`;

    db_client.query(query, [email], (err, result) => {
        if (err) {
            console.error('Get data error in server:', err.message);
            return res.json({ Error: 'Nhận dữ liệu lỗi từ server' });
        } else if (result.length === 0) {
            return res.json({ Error: 'Email không tồn tại' });
        } else {
            res.json({ Status: 'Success', Data: result });
        }
    });
});

app.post('/order', async (req, res) => {
    console.log('Order information is:', req.body); // Kiểm tra dữ liệu từ frontend
    const orders = req.body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
        console.log("Invalid data");
        return res.json({Error: "Invalid data"});
    }

    try {
        for (const order of orders) {
            // -- establish connection with nodemailer
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                post: 587,
                secure: false,
                auth: {
                    // user: process.env.EMAIL_USER,
                    // pass: process.env.EMAIL_PASS,
                    user: order.from_email,
                    pass: process.env.EMAIL_PASS,

                },
            });

            const mailOptions = {
                from: {
                    name: 'Archie',
                    // address: process.env.EMAIL_USER,
                    address: order.from_email,
                },  // sender address
                to: order.email, // Gửi đến từng địa chỉ email trong orders
                subject: 'New Order Confirmation',
                html: `
                        <div>
                            <p>Hello, This is your order information</p>
                            <h3>DOCUMENT NAME: ${order.name}</h3>
                            <h3>DOCUMENT POSITION: ${order.position}</h3>
                            <h3>ROOM: ${order.room}</h3>
                            <h3>NOTE: ${order.note}</h3>
                            <h3>PASSWORD: ${order.pwd}</h3>
                        </div>
                    `,
            };
    
            await transporter.sendMail(mailOptions);
        }
        return res.json({Status: "Success"});
    }
    catch(error){
        console.error('Error inserting data:', error.message);
        return res.json({Error: "Send email fail"});        
    }

});

app.get('/', verifyUser, (req, res) => {
    return res.json({Status: "Success", name: req.name});
})

app.post('/register', (req, res) => {
    const sql = "INSERT INTO users (`name`, `email`, `password`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
        if(err) return res.json({Error: "Error for hassing password"});

        const values = [
            req.body.name,
            req.body.email,
            hash
        ]

        db_signup.query(sql, [values], (err, result) => {
            if(err) {
                console.error('Error inserting data:', err.message);
                return res.json({Error: "Inserting data Error in server"});
            }

            return res.json({Status: "Success"});

        })

    })
})

app.post('/login', (req, res) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db_signup.query(sql, [req.body.email], (err, data) => {
        if(err) {
            console.error('Login error in server:', err.message);
            return res.json({Error: "Login error in server"});
        }
        if(data.length > 0){
            bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
                if(err) return res.json({Error: "Password compare error"});

                if(response){
                    const name = data[0].name;
                    const token = jwt.sign({name}, "jwt-secret-key", {expiresIn: '1d'})
                    res.cookie('token', token);
                    return res.json({Status: "Success"});
                }else{
                    return res.json({Error: "Password not matched"});
                }
            })
        }else{
            return res.json({Error: "No email existed"});
        }
    })
})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({Status: "Success"});
})


app.get('/', (re, res) => {
    return res.json("From backend side");
})

app.listen(process.env.SERVER_PORT, () => {
    console.log("Running...")
})

