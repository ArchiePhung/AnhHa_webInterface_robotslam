import React, {useState} from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Config from "../scripts/config";

const Password = props => {
    const [values, setValues] = useState({
        email: ''
    })

    const navigate = useNavigate()
    axios.defaults.withCredentials = true;
    
    const handleSubmit = (event) => {

        event.preventDefault();
        axios.post("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/password", values)
        .then(res => {
            if(res.data.Status === "Success") {

                // navigate to home
                navigate('/login');

                // reset account
                setValues({
                    email: ''
                });

            }

            else{
                alert(res.data.Error);
            }
        })
    }

    return(
        <div className="d-flex justify-content-center align-items-center no-bg vh-100">
            <div className=" bg-white p-3 rounded w-50">
                <h2>Get Password</h2>

                <form onSubmit={handleSubmit}>

                    <div className="mb-3">
                        <label htmlFor="email"><strong>Email</strong></label>
                        <input type="email" placeholder="Enter Email" name="email" 
                        onChange={e => setValues({...values, email: e.target.value})} className="form-control rounded-0"/>
                    </div>

                    {/* <div className="mb-3">
                        <label htmlFor="password"><strong>Password</strong></label>
                        <input type="password" placeholder="Enter Password" name="password" 
                        onChange={e => setValues({...values, password: e.target.value})} className="form-control rounded-0"/>
                    </div> */}

                    <button type='submit' className="btn btn-success w-100 rounded-0">Get</button>
                    {/* <p>You are agreee to our terms and policies</p> */}
 
                    <Link to="/login" className="btn btn-default border w-100 bg-light rounded-0 text-decoration-none">Login</Link>
                </form>
            </div>
        </div>
    );
}

export default Password;