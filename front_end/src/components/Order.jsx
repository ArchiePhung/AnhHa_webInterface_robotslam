import React, {useState} from "react";
import {useNavigate } from "react-router-dom";
import axios from 'axios';
import Config from "../scripts/config";

const Order = props => {
    const [order, setOrder] = useState([]);

    const [newOrder, setNewOrder] = useState({
        from_email: '',
        name: '',
        position: '',
        email: '',
        note: '',
        pwd: '',
    });

    // const [count, setCount] = useState(0);
    const navigate = useNavigate();
    // send cookie with http request
    axios.defaults.withCredentials = true;

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("Data send is:");
        console.log(typeof order);

        if (order.length === 0){
            alert("Gửi email lỗi! Hãy nhập thông tin về order");
        }
        else {
            try{
                if (Array.isArray(order)) {
                    console.log("Send mail to server");
                    axios.post("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/order", order)
                    .then(res => {
                        if(res.data.Status === "Success") {
                            setOrder([]);   // clear data
                            console.log("Send email successfully");
                            // go to map page
                            navigate('/map');
                        }
            
                        else{
                            alert(res.data.Error);
                            setOrder([]);
                        }
                        //console.log(res)
                    })
            
                    // .then(err => console.log(err));
                }
                else{
                    console.error('Orders should be a non-empty array');
                }
            }
            catch(error){
                console.error('Error sending orders:', error);
                alert('Error sending orders:', error);
                setOrder([]);
            }
        }

    }

    const handleAddOrder = (e) => {
        e.preventDefault();

        if (order.length < 2){
            if (newOrder.name && newOrder.position && newOrder.email && newOrder.note) {
                if (newOrder.position !== '1' && newOrder.position !== '2' && newOrder.position !== '3'){
                    alert("Hay nhap vi tri Locker la 1, 2 hoặc 3");
                    console.log("Hay nhap vi tri Locker la 1, 2 hoặc 3");
                    
                }
                else{
                    if (newOrder.email !== props.email){
                        if (newOrder.position === '1' || newOrder.position === '2'){
                            if(newOrder.pwd === ''){
                                alert("Ban can nhap mat khau cho vi tri locker nay");
                                console.log("Ban can nhap mat khau cho vi tri locker nay");
                            }
                            else{
                                setOrder([
                                    ...order,
                                    {
                                        from_email: props.email,
                                        name: newOrder.name,
                                        position: newOrder.position,
                                        email: newOrder.email,
                                        note: newOrder.note,
                                        pwd: newOrder.pwd,
                                    }
                                ]);
                                setNewOrder({ name: "", position: "", email: "", note: "", pwd:"" }); // Reset form sau khi thêm                                
                            }
                        }
                        else if (newOrder.position === '3'){
                            setOrder([
                                ...order,
                                {
                                    from_email: props.email,
                                    name: newOrder.name,
                                    position: newOrder.position,
                                    email: newOrder.email,
                                    note: newOrder.note,
                                    pwd: newOrder.pwd,
                                }
                            ]);
                            setNewOrder({ name: "", position: "", email: "", note: "", pwd:"" }); // Reset form sau khi thêm                             
                        }
                    }

                    else{
                        alert("Email bạn nhập trùng với email từ máy gói lệnh");
                        console.log("Email bạn nhập trùng với email từ máy gọi lệnh");                        
                    }

                }
            }
            else{
                alert("Thông tin bị thiếu hãy nhập đủ thông tin! Hãy nhập đầy đủ thông tin");
                console.log("Thông tin bị thiếu hãy nhập đủ thông tin! Hãy nhập đầy đủ thông tin");
            }
        }

        else{
            alert("Hệ thống cho phép tạo 2 lệnh tối đa");
            console.log("Hệ thống cho phép tạo 2 lệnh tối đa");
        }
    }

    return(
        <div className="d-flex justify-content-center align-items-center no-bg vh-1">
            <div className=" bg-white p-3 rounded w-100">
                <h2>Order</h2>

                <form>
                    <div className="mb-3">
                        <label htmlFor="name"><strong>Document Name</strong></label>
                        <input type="text" placeholder="Enter Document Name" 
                        name="name"
                        value={newOrder.name}
                        onChange={(e) => setNewOrder({ ...newOrder, name: e.target.value })} 
                        className="form-control rounded-0"/>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="name"><strong>Locker Position</strong></label>
                        <input type="text" placeholder="Enter position of locker" 
                        name="position"
                        value={newOrder.position}
                        onChange={(e) => setNewOrder({ ...newOrder, position: e.target.value })} 
                        className="form-control rounded-0"/>
                    </div>

                    {/* <div className="mb-3">
                        <label htmlFor="name"><strong>Room Position</strong></label>
                        <input type="text" placeholder="Enter room number" 
                        name="room"
                        value={newOrder.room}
                        onChange={(e) => setNewOrder({ ...newOrder, room: e.target.value })} 
                        className="form-control rounded-0"/>
                    </div> */}

                    <div className="mb-3">
                        <label htmlFor="email"><strong>Email</strong></label>
                        <input type="email" placeholder="Enter Email" 
                        name="email"
                        value={newOrder.email}
                        onChange={(e) => setNewOrder({ ...newOrder, email: e.target.value })} 
                        className="form-control rounded-0"/>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="email"><strong>Note</strong></label>
                        <input type="text" placeholder="Enter description" 
                        name="note"
                        value={newOrder.note}
                        onChange={(e) => setNewOrder({ ...newOrder, note: e.target.value })} 
                        className="form-control rounded-0"/>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password"><strong>Password</strong></label>
                        <input type="text" placeholder="Enter Password" 
                        name="pwd"
                        value={newOrder.pwd}
                        onChange={(e) => setNewOrder({ ...newOrder, pwd: e.target.value })}
                        className="form-control rounded-0"/>
                    </div>

                    <div>
                        <button 
                        className="btn btn-success w-50 rounded-0" 
                        style={{ border: '5px solid white', padding: '10px 20px', borderRadius: '5px' }} 
                        onClick={handleAddOrder}
                        >Add</button>

                        <button 
                        className="btn btn-success w-50 rounded-0" s
                        tyle={{ border: '5px solid white', padding: '10px 20px', borderRadius: '5px' }} 
                        onClick={handleSubmit}
                        >Submit</button>
                        
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Order;