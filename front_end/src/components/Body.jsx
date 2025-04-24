import React, {useState, useEffect} from "react";
import {Container} from "react-bootstrap"
import {Route, BrowserRouter as Router, Routes} from "react-router-dom"
import Home from "./Home";
// import About from "./About";
import Map from "./Map";
import Login from "./Login";
import Register from "./Register";
import Order from "./Order";
import Empty from "./Empty";
import History from "./History";
import Password from "./Password";

const Body = props => {
    return (
        <Container className="container_body">
            <Router>
                <Routes>
                    <Route path="/" exact element={<Home email={props.email}/>} />
                    <Route path="/map" exact element={<Map email={props.email} />} />
                    <Route path="/history" exact element={<History />} />
                    <Route path="/login" exact element={<Login/>} />
                    <Route path="/register" exact element={<Register />} />
                    <Route path="/password" exact element={<Password />} />
                    <Route path="/order" exact element={<Order email={props.email}/>} />
                    <Route path="/empty" exact element={<Empty/>} />
                </Routes>
            </Router>
        </Container>
    )
}

export default Body;