import React, {Component, useEffect, useState} from "react";
import { Link } from "react-router-dom";
import axios from "axios";
// import Callme from "./Callme";
import Config from "../scripts/config";
import { useNavigate } from "react-router-dom";

const Home = props => {
    const [auth, setAuth] = useState(false);
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');

    const [values, setValues] = useState({
        email: ''
    })

    const navigate = useNavigate();
    axios.defaults.withCredentials = true;


    const [lastFetchedData, setLastFetchedData] = useState(null); // Lưu dữ liệu lần fetch trước
    const pollingInterval = Config.WAIT_HISTORY_TIMER;

    // Hàm kiểm tra dữ liệu có thay đổi không
    const isDataChanged = (newData, oldData) => {
      return JSON.stringify(newData) !== JSON.stringify(oldData);
    };

    // Hàm GET dữ liệu
    const fetchData = async () => {
        try {
            const response = await axios.get("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/getemail")
            const fetchedData = response.data.email;
            //   console.log("------ Email receive is -------------", fetchedData);
            // Chỉ cập nhật nếu dữ liệu thay đổi
            
            if (isDataChanged(fetchedData, lastFetchedData)) {
                //   console.log("------ update email in home -------------", fetchedData);
                //   setEmail(fetchedData);
                setValues({email: fetchedData});
                setLastFetchedData(fetchedData);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        // update email
        // console.log("Email nhận được từ body -> home:", props.email);
        // setValues((prevValues) => ({
        //     ...prevValues,
        //     email: props.email // Cập nhật email từ API
        // }));

        fetchData(); // Gọi lần đầu tiên khi component mount

        // check login in server
        axios.get("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "")
        .then(res => {
            if(res.data.Status === "Success") {
                setAuth(true);
                setName(res.data.name)
                // navigate('/login');
            }

            else{
                setAuth(false);
                setMessage(res.data.Error)
            }
        })

        const interval = setInterval(() => {
            fetchData();
          //   console.log(data);
          }, pollingInterval); // Lặp lại mỗi 5 giây
      
        return () => clearInterval(interval); // Xóa interval khi component unmount

    }, []);

    const handleDelete = () => {
        axios.get("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/logout")
        .then(res => {
            window.location.reload(true);
        }).catch(err => console.log(err));
    }

    // when button 'call me' is clicked!
    const handleCmdRequest = async (event) => {
        event.preventDefault();

        // send request to server
        // console.log("Email nhận được từ body -> home:", values);

        axios.post("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/callme", values)
            .then(res => {
                if(res.data.Status === "Success") {
                    console.log("recv data from server");
                    // navigate to map for following robot
                    navigate('/map');
                }

                else{
                    alert(res.data.Status);
                }
            })

    }


    return(
        <div className="home-container">
            <h2 style={{ color: 'white' }} className="greeting">Hi, EveryOne</h2>
            <h2 style={{ color: 'white' }} className="wlc">Welcome to</h2>
            <h1 style={{ color: '#87CEEB' }} className="title">Robot Webserver</h1>
            {/* <button type='submit' className="btn btn-info w-30 rounded-0">Call me</button> */}

            <div className="container mt-4">
            {
                auth ?
                <div >
                    <h3 style={{ color: 'white' }}>You are Authorized --- {name}</h3>
                    {/* <Link to='/map' className="btn btn-info w-30 rounded-0" style={{ marginRight: '20px' }} onClick={handle_RBcmdRequest}>Call me</Link> */}
                    {/* <Callme email={props.email}/>
                     */}
                    <div>
                        <button className="btn btn-info w-30 rounded-0" style={{ marginBottom: '20px' }} onClick={handleCmdRequest}>Call me</button>
                    </div>

                    <button className='btn btn-danger' onClick={handleDelete}>Logout</button>
                </div>
                :
                <div>
                    <h3 style={{ color: 'white' }}>{message}</h3>
                    {/* <h3 style={{ color: 'white' }}>Login Now</h3> */}
                    <Link to="/login" className='btn btn-warning'>Login</Link>
                </div>
            }
            </div>

        </div>
    );
}

export default Home;
