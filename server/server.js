#!/usr/bin/env node

'use strict';

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

// Require rosnodejs itself
const rosnodejs = require('rosnodejs');
// Requires the std_msgs message package
const move_base_msgs = rosnodejs.require('move_base_msgs').msg;
const std_msgs = rosnodejs.require('std_msgs').msg;

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
    host: process.env.SERVER_IP,
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
    host: process.env.SERVER_IP,
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
    host: process.env.SERVER_IP,
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

// Biến lưu trữ trạng thái từ ROS topic
let robotState = 0;
// Biến lưu trữ quy trình của hệ thống.
let step = 0;
let orders = [];
let id_send = 0;
let pre_step = 0;
let completed_wholeMission = 0;
let completed_moveMission = 0;
let completed_chargeMission = 1;
let room_id = 0;
let email_login = '';
let pwd = '';
// let currentClient = null; // Biến lưu client đang hoạt động
// let lockTimeout = null; // Timeout để mở khóa sau 10 giây

// ####################################################### process backend  ########################################################
rosnodejs.initNode('/server_node')
    .then(() => {
        console.log('ROS Node initialized');

        // Lấy ROS namespaces
        const nh = rosnodejs.nh;
        // ROS Publisher và Subscriber
        const pub = nh.advertise('/move_base/goal', move_base_msgs.MoveBaseActionGoal);
        const move_base_goal_data = new move_base_msgs.MoveBaseActionGoal;

        const sub = nh.subscribe('/robot_state', std_msgs.Int8, (msg) => {
            console.log(`Received message on /robot_state: ${msg.data}`);
            robotState = msg.data;
            // console.log(robotState);            
        });

        // function send command to robot
        const send_cmd = (result, pos) => {
            move_base_goal_data.goal_id.id = result[0].room_id;
            move_base_goal_data.goal.target_pose.header.frame_id = "map";
            move_base_goal_data.goal.target_pose.pose.position.x = result[0].x;
            move_base_goal_data.goal.target_pose.pose.position.y = result[0].y;
            move_base_goal_data.goal.target_pose.pose.position.z = parseFloat(pos);
            move_base_goal_data.goal.target_pose.pose.orientation.z = result[0].z;
            move_base_goal_data.goal.target_pose.pose.orientation.w = result[0].w;
            pub.publish(move_base_goal_data);    
        }

        // API cho client gửi yêu cầu
        // app.post("/connect", (req, res) => {
        //     const { clientId } = req.body;
        //     console.log("Client id is: ", clientId);
        
        //     // Nếu đã có client khác kết nối, trả về phản hồi ngắt kết nối cho client cũ
        //     if (currentClient !== clientId) {
        //         currentClient = clientId; // Cập nhật client mới
        //         clearTimeout(lockTimeout);
        //         lockTimeout = setTimeout(() => {
        //             currentClient = null;
        //         }, 10000); // Tự động mở khóa sau 10 giây
        
        //         return res.json({ status: "disconnect", message: "Previous client disconnected. You are now connected." });
        //     }
        
        //     // Nếu không có client khác, gán client này làm client hiện tại
        //     currentClient = clientId;
        //     clearTimeout(lockTimeout);
        //     lockTimeout = setTimeout(() => {
        //         currentClient = null;
        //     }, 10000);
        
        //     res.json({ status: "connected", message: "You are connected to the server." });
        // });

        app.post('/password', async (req, res) => {
            try {
                const query = 'SELECT * FROM users WHERE email = ?';
                db_signup.query(query, [req.body.email], (err, result) => {
                    console.log(result);
                    if (err) {
                        console.error('Get password error in server:', err.message);
                        return res.json({ Status: 'Nhận dữ liệu lỗi từ server' });
                    } else if (result.length === 0) {
                        return res.json({ Status: 'Email không tồn tại' });
                    } else {
                        // reset order
                        pwd = result[0].pwd;
                        console.log("Get password success", pwd);

                    }

                });

                // -- establish connection with nodemailer
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    host: 'smtp.gmail.com',
                    post: 587,
                    secure: false,
                    auth: {
                        // user: process.env.EMAIL_USER,
                        // pass: process.env.EMAIL_PASS,
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,

                    },
                });

                const mailOptions = {
                    from: {
                        name: 'Archie',
                        address: process.env.EMAIL_USER,
                        // address: order.from_email,
                    },  // sender address
                    to: req.body.email, 
                    subject: 'Email Password',
                    html: `
                            <div>
                                <p>Hello, This is your password</p>
                                <h3>PASSWORD: ${pwd}</h3>
                            </div>
                        `,
                };
                
                await transporter.sendMail(mailOptions);

                return res.json({ Status: 'Success'});
            }
            catch(error){
                console.error('Error find email:', error.message);
                return res.json({Status: "Find data get err in db"});        
            }
        });

        app.get('/getemail', async (req, res) => {
            return res.json({email: email_login});            
        });

        app.post('/confirm', async (req, res) => {
            const value = req.body;
            console.log("Thông tin pwd nhận được từ frontend là: ", value);

            if (orders.length === 1){
                if (value.state === true) {   // wait for confirm button
                    if (orders[0].position === '1' || orders[0].position === '2'){
                        if (value.pwd === orders[0].pwd){
                            console.log ("Đã hoàn thành xong nhiệm vụ trả hàng");
                            res.json({
                                status: "Success",
                            });
                            // reset
                            orders = [];
                            id_send = 0;
                            completed_moveMission = 1;
                            completed_chargeMission = 0;
                            step = 0;
                        }

                        else{
                            console.log ("Nhập sai mật khẩu");
                            res.json({
                                status: "Sai mật khẩu",
                            });
                        }
                    }
                    
                    else if (orders[0].position === '3'){
                        console.log ("Đã hoàn thành xong nhiệm vụ trả hàng");
                        res.json({
                            status: "Success",
                        });
                        // reset
                        orders = [];
                        id_send = 0; 
                        completed_moveMission = 1;
                        completed_chargeMission = 0;
                        step = 0;                                  
                    }
                }
            }
            else if (orders.length === 2) {  // recv 2 command
                if (value.state === true) {   // wait for confirm button
                    if (orders[0].position === '1' || orders[0].position === '2'){
                        if (value.pwd === orders[0].pwd){
                            console.log ("Đã hoàn thành xong nhiệm vụ trả hàng");
                            res.json({
                                status: "Success",
                            });
                            // reset
                            if (pre_step === 1){
                                console.log("--------------------------Done whole command ---------------------");
                                orders = [];
                                id_send = 0;
                                completed_moveMission = 1;
                                completed_chargeMission = 0;
                                step = 0;
                            }
                            else{
                                console.log("--------------------------move on to 2nd command ---------------------");
                                step = 1;
                            }
                        }

                        else{
                            console.log ("Nhập sai mật khẩu");
                            res.json({
                                status: "Sai mật khẩu",
                            });
                        }
                    }
                    
                    else if (orders[0].position === '3'){
                        console.log ("Đã hoàn thành xong nhiệm vụ trả hàng");
                        res.json({
                            status: "Success",
                        });
                        // reset
                        if (pre_step === 1){
                            orders = [];
                            id_send = 0;
                            completed_moveMission = 1;
                            completed_chargeMission = 0;
                            step = 0;
                        }
                        else{
                            step = 1;
                        }                               
                    }
                }
            }

        });

        app.get('/cancel', async (req, res) => {
            const rosTime = rosnodejs.Time.now();
            const seconds = rosTime.secs + rosTime.nsecs / 1e9;
            console.log(`---------- cancel ROS Time in seconds: ${seconds}-------------`);
            
            // move mission done
            completed_moveMission = 1;

            // cho phép sạc
            completed_chargeMission = 0;

            // reset step
            step = 0;

            //
            return res.json({
                status: "Hủy lệnh thành công!!!",
                data: 8,
            })            
        });

        // Endpoint HTTP GET để trả dữ liệu về frontend
        app.get('/getstate', async (req, res) => {

            // Lấy thời gian hiện tại từ ROS
            const rosTime = rosnodejs.Time.now();
            const seconds = rosTime.secs + rosTime.nsecs / 1e9;
            console.log(`---------- get state ROS Time in seconds: ${seconds}-------------`);

            if (completed_moveMission === 0){
                if (orders.length === 0) {
                    console.log("Robot state in case Call me is: ", robotState, id_send);
                    // system wait robot get in call position
                    if (robotState === id_send){
                        console.log("robot đã tớ vị trí lấy hàng");
                        return res.json({
                            status: "Robot đã tới vị trí lấy hàng",
                            data: 2,
                        });
                    }
                    else{
                        console.log("robot đang di chuyển tới vị trí lấy hàng");
                        return res.json({
                            status: "Robot đang di chuyển tới vị trí lấy hàng",
                            data: 1,
                        });                        
                    }
                }
                // for send data to robot and wait respond
                else if (orders.length === 1){   // has 1 command
                    console.log("Robot state in case 1 CMD is: ", robotState, id_send);
                    if (step === 0){        // send cmd
                        console.log("Email điểm đích thứ 1 là: ", orders[0].email)
                        const query = `SELECT * FROM clients WHERE email = ?`;

                        try {
                            db_client.query(query, [orders[0].email], (err, result) => {
                                console.log("Kết quả từ database: ", result);
                                if (err) {
                                    console.error('Get data error in server:', err.message);
                                    return res.json({ status: 'Nhận dữ liệu lỗi từ server', data: 7 });
                                } else if (result.length === 0) {
                                    return res.json({ status: 'Email không tồn tại', data: 6 });
                                } else {
                                    console.log("Đã gửi lệnh di chuyên thành công ------------------")
                                    step = 1;
                                    id_send = parseInt(result[0].room_id, 5);
                                    send_cmd(result, orders[0].position);
                                }
                            });
                        }
                        catch(error){
                            console.error('Error find data:', error.message);
                            return res.json({Error: "Find data get err in db"});        
                        }
                    
                    }
                    else if (step === 1){        // wait robot respond
                        if (robotState === id_send){
                            console.log("robot đã tới vị trí trả hàng");
                            res.json({
                                status: "Robot đã tới vị trí trả hàng",
                                data: 4,
                            });
                            // completed_moveMission = 1;
                            // step = 2;  // move on to check bt confirm 
                        }
                        else{
                            console.log("robot đang di chuyển tới vị trí trả hàng");
                            res.json({
                                status: "Robot đang di chuyển tới vị trí trả hàng",
                                data: 3,
                            });                        
                        }
                    }
                }

                else if (orders.length === 2){   // has 2 request
                    console.log("Robot state in case 2 CMD is: ", robotState, id_send);
                    if (step === 0){        // send cmd
                        pre_step = 0;
                        console.log("Email điểm đích thứ 1 là: ", orders[0].email)
                        const query = `SELECT * FROM clients WHERE email = ?`;

                        try {
                            db_client.query(query, [orders[0].email], (err, result) => {
                                console.log(result);
                                if (err) {
                                    console.error('Get data error in server:', err.message);
                                    return res.json({ status: 'Nhận dữ liệu lỗi từ server', data: 7 });
                                } else if (result.length === 0) {
                                    return res.json({ status: 'Email không tồn tại', data: 6 });
                                } else {
                                    console.log("Đã gửi lệnh số 1 thành công ------------------")
                                    step = 2;
                                    id_send = parseInt(result[0].room_id, 5);
                                    send_cmd(result, orders[0].position);
                                }
                            });
                        }
                        catch(error){
                            console.error('Error find data:', error.message);
                            return res.json({Error: "Find data get err in db"});        
                        }
                    
                    }

                    else if (step === 1){        // send cmd
                        pre_step = 1;
                        const query = `SELECT * FROM clients WHERE email = ?`;
                        console.log("Email điểm đích thứ 2 là: ", orders[1].email)
                        try {
                            db_client.query(query, [orders[1].email], (err, result) => {
                                console.log(result);
                                if (err) {
                                    console.error('Get data error in server:', err.message);
                                    return res.json({ status: 'Nhận dữ liệu lỗi từ server', data: 7 });
                                } else if (result.length === 0) {
                                    return res.json({ status: 'Email không tồn tại', data: 6 });
                                } else {
                                    console.log("Đã gửi lệnh số 2 thành công ------------------")
                                    step = 2;
                                    id_send = parseInt(result[0].room_id, 5);
                                    send_cmd(result, orders[1].position);
                                }
                            });
                        }
                        catch(error){
                            console.error('Error find data:', error.message);
                            return res.json({Error: "Find data get err in db"});        
                        }
                    
                    }

                    else{        // wait respond
                        // system wait robot get in call position
                        if (robotState === id_send){
                            console.log("robot đã tớ vị trí trả hàng");
                            res.json({
                                status: "Robot đã tới vị trí trả hàng",
                                data: 4,
                            });
                        }
                        else{
                            console.log("robot đang di chuyển tới vị trí trả hàng");
                            res.json({
                                status: "Robot đang di chuyển tới vị trí trả hàng",
                                data: 3,
                            });                        
                        }
                    }
                }

            }
            else{     // send robot to charger point
                if (completed_chargeMission === 0){                    
                    // get data sac from database
                    console.log("Robot state in case charger is: ", robotState, id_send);
                    if(step === 0){
                        const query = `SELECT * FROM clients WHERE email = ?`;

                        try {
                            db_client.query(query, [''], (err, result) => {
                                console.log(result);
                                if (err) {
                                    console.error('Get data error in server:', err.message);
                                    return res.json({ status: 'Nhận dữ liệu lỗi từ server', data: 7 });
                                } else if (result.length === 0) {
                                    return res.json({ status: 'Email không tồn tại', data: 6 });
                                } else {
                                    console.log("Đã gửi lệnh di chuyên thành công ------------------")
                                    step = 1;
                                    id_send = parseInt(result[0].room_id, 5);
                                    send_cmd(result, 0.0);
                                }
                            });
                        }
                        catch(error){
                            console.error('Error find data:', error.message);
                            return res.json({status: "Find data get err in db", data: 7});        
                        }
                    }

                    else if (step == 1){
                        // console.log("Robot state is: ", robotState);  
                        if (robotState === id_send){
                            console.log("Hoàn thành về sạc => Đợi lệnh mới");
                            completed_chargeMission = 1;
                            step = 0;  // move on to check bt confirm 
                            return res.json({
                                status: "Chờ lệnh mới",
                                data: 0,
                            });
                        }
                        else{
                            console.log("Gửi lệnh cho robot về sạc  ------------------");
                            return res.json({
                                status: "gửi lệnh cho robot về sạc",
                                data: 5,
                            });                     
                        }                        
                    }

                }
            }
        });

        // API kiểm tra email for call robot -> if email exist on db -> send request to robot.
        app.post('/callme', async (req, res) => {

            const rosTime = rosnodejs.Time.now();
            const seconds = rosTime.secs + rosTime.nsecs / 1e9;
            console.log(`---------- call me ROS Time in seconds: ${seconds}-------------`);
            
            if (completed_chargeMission === 1){
                const { email } = req.body;

                if (email === ''){
                    console.log('yêu cầu lỗi => vẫn gửi lệnh cho robot về sạc');
                    return res.json({ Status: 'Lỗi khi gọi robot'});
                }
                else{
                    const query = `SELECT * FROM clients WHERE email = ?`;

                    try {
                        db_client.query(query, [email], (err, result) => {
                            console.log(result);
                            if (err) {
                                console.error('Get data error in server:', err.message);
                                return res.json({ Status: 'Nhận dữ liệu lỗi từ server' });
                            } else if (result.length === 0) {
                                return res.json({ Status: 'Email không tồn tại' });
                            } else {
                                // reset order
                                console.log("Send call me cmd success");
                                orders = [];
                                id_send = parseInt(result[0].room_id, 5);
                                send_cmd(result, 0.0);
                                completed_chargeMission = 0;
                                completed_moveMission = 0;
                                return res.json({ Status: 'Success'});

                            }
                        });
                    }
                    catch(error){
                        console.error('Error find data:', error.message);
                        return res.json({Status: "Find data get err in db"});        
                    }
                }
            }
            else{
                return res.json({ Status: 'Success'});
            }
        });

        app.post('/order', async (req, res) => {
            console.log('Order information is:', req.body); // Kiểm tra dữ liệu từ frontend
            orders = req.body;

            if (!orders || !Array.isArray(orders) || orders.length === 0) {
                console.log("Invalid data");
                return res.json({Error: "Invalid data"});
            }

            try {
                for (const order of orders) {
                    // get room_id from email
                    const query = `SELECT * FROM clients WHERE email = ?`;

                    try {
                        db_client.query(query, [order.email], (err, result) => {
                            console.log(result);
                            if (err) {
                                console.error('Get data error in server:', err.message);
                                // return res.json({ Error: 'Nhận dữ liệu lỗi từ server' });
                            } else if (result.length === 0) {
                                // return res.json({ Error: 'Email không tồn tại' });
                                console.log("email ko tồn tại");
                            } else {
                                room_id = result[0].room_id, 5;
                            }
                        });
                    }
                    catch(error){
                        console.error('Error find data:', error.message);
                        // return res.json({Error: "Find data get err in db"});        
                    }

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
                                    <h3>ROOM: ${room_id}</h3>
                                    <h3>NOTE: ${order.note}</h3>
                                    <h3>PASSWORD: ${order.pwd}</h3>
                                </div>
                            `,
                    };
                    
                    // await transporter.sendMail(mailOptions);
                    
                    // write to history database
                    const currentTime = new Date();
                    const dateTime = `${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;
                    const sql = "INSERT INTO command (`doc_name`, `locker_pos`, `room_pos`, `email`, `create_time`) VALUES (?)";
                    const values = [
                        order.name,
                        order.position,
                        room_id,
                        order.email,
                        dateTime
                    ]

                    db_history.query(sql, [values], (err, result) => {
                        if(err) {
                            console.error('Error inserting data:', err.message);
                            // return res.json({Error: "Inserting data Error in server"});
                        }
                        
                        console.log('Inserting data success');
                        // return res.json({Status: "Success"});
    
                    })                    

                }
                // sendEmailSuccess = 1;
                completed_moveMission = 0;
                completed_chargeMission = 0;

                // insert data to 
                return res.json({Status: "Success"});
            }
            catch(error){
                console.error('Error inserting data:', error.message);
                return res.json({Error: "Send email fail"});        
            }

        });
        
        // API nhận dữ liệu từ database và phản hồi lại client
        app.get('/history', async (req, res) => {

            // Lấy thời gian hiện tại từ ROS
            const rosTime = rosnodejs.Time.now();
            const seconds = rosTime.secs + rosTime.nsecs / 1e9;
            console.log(`----------ROS Time in seconds: ${seconds}-------------`);

            db_history.query("SELECT * FROM command", (err, results, fields) => {
                if (err) {
                    console.error('Lỗi khi truy vấn dữ liệu: ', err);
                    return;
                }
            
                // console.log('Dữ liệu từ bảng:', results);
                res.json({ data: results});
            
                // Đóng kết nối sau khi xử lý xong
                // db_history.end((endErr) => {
                //     if (endErr) {
                //         console.error('Lỗi khi đóng kết nối: ', endErr);
                //     } else {
                //         console.log('Đã đóng kết nối!');
                //     }
                // });
            });            
        });

        app.get('/', verifyUser, (req, res) => {
            // console.log("Thực hiện verify usser");
            return res.json({Status: "Success", name: req.name});
        })

        app.post('/register', (req, res) => {
            const sql = "INSERT INTO users (`name`, `email`, `password`, `pwd`) VALUES (?)";
            bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
                if(err) return res.json({Error: "Error for hassing password"});

                const values = [
                    req.body.name,
                    req.body.email,
                    hash,
                    req.body.password
                ]

                db_signup.query(sql, [values], (err, result) => {
                    if(err) {
                        console.error('Error inserting data:', err.message);
                        return res.json({Status: "Inserting data Error in server"});
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
                            // update email is login -> send to pront end
                            email_login = req.body.email;
                            console.log("Current email is:", email_login);
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
            email_login= '';
            return res.json({Status: "Success"});
        })

        app.get('/', (req, res) => {
            console.log("From backend side");
            return res.json("From backend side");
        })

        const server = app.listen(process.env.SERVER_PORT, () => {
            console.log("Running...")
        });

        // Function cleanup để xóa cookies
        const cleanup = (req, res) => {
            console.log("Performing cleanup tasks...");
            
            // Xóa cookies nếu có request
            // res.cookie('token', "", { maxAge: 0 }); // Xóa cookie token
            console.log("Cookies cleared.");
        
            console.log("Cleanup complete. Exiting program.");
        };

        // Lắng nghe tín hiệu tắt (SIGINT hoặc SIGTERM)
        process.on("SIGINT", () => {
            console.log("Received SIGINT. Shutting down gracefully...");
            cleanup(); // Thực hiện cleanup
            server.close(() => {
                console.log("Server closed.");
                process.exit(0); // Thoát chương trình
            });
        });
        
        process.on("SIGTERM", () => {
            console.log("Received SIGTERM. Shutting down gracefully...");
            cleanup(); // Thực hiện cleanup
            server.close(() => {
                console.log("Server closed.");
                process.exit(0); // Thoát chương trình
            });
        });

    })
    .catch((err) => {
        console.error('Failed to initialize ROS node', err);
    });
