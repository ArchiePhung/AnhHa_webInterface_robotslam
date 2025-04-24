import React, {useState, useEffect} from "react";
import Config from "../scripts/config";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Callme = props => {

    const [values, setValues] = useState({
        email: ''
    })

    // let isSendValue = false;
    const navigate = useNavigate()
    axios.defaults.withCredentials = true;

    useEffect(() => {
        console.log("Email nhận được từ body -> home:", props.email);
        setValues((prevValues) => ({
            ...prevValues,
            email: props.email // Cập nhật email từ API
        }));

    }, []); // Chỉ gọi API một lần khi component mount

    // when button 'call me' is clicked!
    const handleCmdRequest = async (event) => {
        event.preventDefault();

        // send request to server
        // console.log("Email nhận được từ body -> home:", values);

        axios.post("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/callme", values)
            .then(res => {
                if(res.data.Status === "Success") {
                    console.log("recv data from server");
                    // isSendValue = true;

                    // navigate to map for following robot
                    navigate('/map');

                    // reset account
                    // setValues({
                    //     email: ''
                    // });

                }

                else{
                    alert(res.data.Error);
                }
            })

    }

    // 

    return(
        <div>
            <button className="btn btn-info w-30 rounded-0" style={{ marginBottom: '20px' }} onClick={handleCmdRequest}>Call me</button>

        </div>
    );
}

export default Callme;