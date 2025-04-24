import React, {Component, useState, useEffect} from "react";
import Config from "../scripts/config";
import { Link } from "react-router-dom";
import Empty from "./Empty";
import userEvent from "@testing-library/user-event";
import axios from "axios";
// import { useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { send } from "@emailjs/browser";

const Map = props => {
    let ros = null;
    const [data, setData] = useState(false); // Lưu trữ dữ liệu từ server
    // const [load, setLoading] = useState(false);
    const [message, setMessage] = useState('aaa'); // Trạng thái đang tải
    // const [error, setError] = useState(null); // Lưu trữ lỗi (nếu có)
    const pollingInterval = Config.WAIT_ROBOTSTATE_TIMER;

    const [sendvalue, setsendValue] = useState({
        pwd: '',
        state: false
    });

    const [value, setValue] = useState({
        pwd: '',
    });

    const navigate = useNavigate();
    // const location = useLocation();
    // const {isSuccess} = location.state || {};

    // Hàm GET dữ liệu
    const fetchData = async () => {
        try {
            // setLoading(true); // Bắt đầu tải
            const response = await axios.get("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/getstate")
            setData(response.data.data);
            setMessage(response.data.status);
            // setError(null);
            // setLoading(false);
            console.log("dữ liệu phản hồi từ server là:", response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            // setError('Failed to fetch data');
            // setLoading(false);
        }
    };

    // Hàm POST dữ liệu
    const postData = async () => {
        // setIsPosting(true); // Đánh dấu trạng thái POST đang chạy
        try {
            const response = await axios.post("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/confirm", sendvalue);
            console.log("Post success:", response.data);

            if(response.data.status === "Success") {
                console.log("recv data from server");

                // reset value send
                setValue({pwd:""});
                setsendValue({pwd:"", state: false});
            }

            else{
                alert(response.data.status);
            }

        } catch (error) {
            console.error("Error posting data:", error);
        } finally {
            // setIsPosting(false); // Kết thúc trạng thái POST
            console.log("post data finally function --------------------");
        }
    };

    useEffect(() => {
        init_connection();
        view_map();
        // setsendValue({...sendvalue, pwd: '', state: false});
        fetchData(); // Gọi lần đầu tiên khi component mount

        const interval = setInterval(() => {
          fetchData();
        }, pollingInterval); // Lặp lại mỗi 5 giây
    
        return () => clearInterval(interval); // Xóa interval khi component unmount
    }, []);

    useEffect(() => {
        if (sendvalue.state === true){
            postData();
            console.log("Dữ liệu nút confirm gửi đi là: ", sendvalue);
        }
    }, [sendvalue]);

    const init_connection = () => {

        ros = new window.ROSLIB.Ros();

        try{
            ros.connect(
                "ws://" + 
                Config.ROSBRIDGE_SERVER_IP +
                ":" + 
                Config.ROSBRIDGE_SERVER_PORT +
                ""
            );
        } catch (error) {
            console.log(
                "ws://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.ROSBRIDGE_SERVER_PORT + ""
            );
            console.log("connection problem");
        }

    }

    const view_map = () => {
        var viewer = new window.ROS2D.Viewer({
            divID: "nav_div",
            width: 960,
            height: 900,
        });

        var navClient = new window.NAV2D.OccupancyGridClientNav({
            ros: ros,
            rootObject: viewer.scene,
            viewer: viewer,
            severName: "/move_base",
            withOrientation: true,
        });
    }

    // const handle_btConfirm = async (event) => {
    //     event.preventDefault();

    //     // set send value
    //     setsendValue((prev) => ({...prev, pwd: value.pwd, state: true}));
    //     console.log("Dữ liệu nút confirm gửi đi là: ", sendvalue);
    //     // Post data
    //     postData();
    // }

    const handle_btOrder = (event) => {
        event.preventDefault();
        console.log("Nut button order da duoc nhan")
        navigate('/order');
        // navigate('/order', {
        //     state: { email: props.email },
        // });
    }

    const handle_cancelMission = async (event) => {
        event.preventDefault();
        console.log("Nut Hủy lệnh đã được nhấn");
        try {
            // setLoading(true); // Bắt đầu tải
            const response = await axios.get("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/cancel")
            setData(response.data.data);
            setMessage(response.data.status);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    return(
        <div className="map-container">

            <div className="button-child-container">

                <button 
                    // to="/order" 
                    onClick={handle_btOrder} 
                    className="btn btn-info w-30 rounded-0" 
                    // style={{ marginRight: '20px', marginBottom: '10px'}}
                    disabled={data !== 2} 
                >Order</button>

                <button 
                    className='btn btn-warning' 
                    // onClick={handle_btConfirm} 
                    onClick={() => setsendValue({...sendvalue, pwd: value.pwd, state: true})}
                    // style={{ marginRight: '20px', marginBottom: '10px'}}
                    disabled={data !== 4}
                >Confirm</button>

                <input type="text" placeholder="Enter Password" 
                        name="password"
                        value={value.pwd}
                        onChange={(e) => setValue({ ...value, pwd: e.target.value})} 
                        className="form-control rounded-0"/>
                <button 
                    // to="/order" 
                    onClick={handle_cancelMission} 
                    className="btn btn-info w-30 rounded-0" 
                    // style={{ marginRight: '20px', marginBottom: '10px'}}
                    disabled={data === 0} 
                >Cancel</button>
            </div>

            <label>
                <span style={{ color: 'white', cursor: 'not-allowed', fontSize: '20px' }}>
                    {(() => {
                        if (data === 0) {
                            return 'Đợi lệnh mới!!!';
                        }
                        else if (data === 1) {
                            return 'Robot đang di chuyển tới điểm lấy hàng!!!';
                        } else if (data === 2) {
                            return 'Robot đã tới điểm lấy hàng!!!';
                        } else if (data === 3) {
                            return 'Robot đang di chuyển tới điểm trả hàng!!!';
                        } else if (data === 4) {
                            return 'Robot đã tới điểm trả hàng!!!';
                        } else if (data === 5) {
                            return 'Robot đang di chuyển về điểm sạc !!!';
                        } else if (data === 7) {
                            return 'Lỗi không truy suất được dữ liệu từ database';
                        } else if (data === 6) {
                            return 'Không tìm thấy email trong database';
                        } else if (data === 8) {
                            return 'Hủy lệnh thành công!!';
                        }                         
                    })()}
                </span>
            </label>            

            <h1 style={{ color: 'white' }} className="map_h1">MAP</h1>

            <div id="nav_div"></div>
        </div>
    );
}

export default Map;