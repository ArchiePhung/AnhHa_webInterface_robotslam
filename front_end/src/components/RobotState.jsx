import React, {Component} from "react";
import {Row, Col, Container, Button} from "react-bootstrap";
import Config from "../scripts/config";
// import ROSLIB from "roslib";

class RobotState extends Component {
    state = {
        ros: null,
        x: 0.0,
        y: 0.0,
        orientation: 0.0,
        linear_velocity: 0.0,
        angular_velocity: 0.0,

    };

    constructor() {
        super();
        this.init_connection();
    }

    init_connection(){

        this.state.ros = new window.ROSLIB.Ros();
        console.log("Da khoi tao duoc ros");

        this.state.ros.on("connection", () => {
            console.log("connection established in Teleoperation!");
            this.setState({connected: true});
        });

        this.state.ros.on("close", () => {
            console.log("connection is closed in Teleoperation!");
            this.setState({connected: false});

            // try to recconect every 3 seconds
            setTimeout(() => {
                try{
                    // this.state.ros.connect("ws://192.168.1.45:9090");
                    this.state.ros.connect(
                        "ws://" + 
                        Config.ROSBRIDGE_SERVER_IP +
                        ":" + 
                        Config.ROSBRIDGE_SERVER_PORT +
                        ""
                    );
                } catch (error) {
                    console.log("connection problem");
                }                
            }, Config.RECONNECTION_TIMER);
        });

        try{
            // this.state.ros.connect("ws://192.168.1.45:9090");
            this.state.ros.connect(
                "ws://" + 
                Config.ROSBRIDGE_SERVER_IP +
                ":" + 
                Config.ROSBRIDGE_SERVER_PORT +
                ""
            );

            console.log(
                "ws://" + 
                Config.ROSBRIDGE_SERVER_IP +
                ":" + 
                Config.ROSBRIDGE_SERVER_PORT +
                ""
            );
        } catch (error) {
            console.log("connection problem");
        }

    }

    componentDidMount() {
        this.getRobotState();
    }

    getRobotState(){
        var pose_subscriber = new window.ROSLIB.Topic({
            ros:this.state.ros,
            name: "/turtle1/pose",
            messageType: "turtlesim/Pose",
        });

        // create a pose callback
        pose_subscriber.subscribe((message) => {
            this.setState({x: message.x.toFixed(2)});
            this.setState({y: message.y.toFixed(2)});
            this.setState({orientation: message.theta.toFixed(2)});
            this.setState({linear_velocity: message.linear_velocity.toFixed(2)});
            this.setState({angular_velocity: message.angular_velocity.toFixed(2)});
            
        });
    }
    render() {
        return(
            <div>
                <Row>
                    <Col>
                        <h4 className="mt-4">Position</h4>
                        <p className="mt-0">x: {this.state.x}</p>
                        <p className="mt-0">y: {this.state.y}</p>
                        <p className="mt-0">Orientation: {this.state.orientation}</p>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <h4 className="mt-4">Velocities</h4>
                        <p className="mt-0">Linear Vel: {this.state.linear_velocity}</p>
                        <p className="mt-0">Angular Vel: {this.state.angular_velocity}</p>
                    </Col>
                </Row>

            </div>
        );
    }
}

export default RobotState;