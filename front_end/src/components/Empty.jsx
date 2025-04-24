import React from "react";
// import React, {useEffect, useState} from "react";
// import { Link } from "react-router-dom";
// import axios from "axios";
// import Callme from "./Callme";
// import Config from "../scripts/config";

const Empty = () => {
    // const [auth, setAuth] = useState(false);
    // const [message, setMessage] = useState('');
    // const [name, setName] = useState('');

    // axios.defaults.withCredentials = true;
    // useEffect(() => {
        
    //     // axios.get('http://192.168.1.29:8081')
    //     axios.get("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "")
    //     .then(res => {
    //         if(res.data.Status === "Success") {
    //             setAuth(true);
    //             setName(res.data.name)
    //             // navigate('/login');
    //         }

    //         else{
    //             setAuth(false);
    //             setMessage(res.data.Error)
    //         }
    //     })
    //     .then(err => console.log(err));
    // }, [])

    // const handleDelete = () => {
    //     // axios.get('http://192.168.1.29:8081/logout')
    //     axios.get("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/logout")
    //     .then(res => {
    //         window.location.reload(true);
    //     }).catch(err => console.log(err));
    // }

    return(
        <div className="home-container">
            <h2 style={{ color: 'orange' }} className="empty_warn">You need login first!!!!!!</h2>
            {/* <h2 style={{ color: 'white' }} className="wlc">login first</h2>
            <h1 style={{ color: '#87CEEB' }} className="title">Robot Webserver</h1> */}

            {/* <div className="container mt-4">
            {
                auth ?
                <div >
                    <h3 style={{ color: 'white' }}>You are Authorized --- {name}</h3>
                    <Callme/>
                    <buton className='btn btn-danger' onClick={handleDelete}>Logout</buton>
                </div>
                :
                <div>
                    <h3 style={{ color: 'white' }}>{message}</h3>
                    <Link to="/login" className='btn btn-warning'>Login</Link>
                </div>
            }
            </div> */}

        </div>
    );
}

export default Empty;
