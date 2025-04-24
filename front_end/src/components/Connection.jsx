import React, {Component} from "react";
// import ROSLIB from "roslib";
// import ROS2D from "ros2d";
import Alert from "react-bootstrap/Alert";
import Config from "../scripts/config"

class Connection extends Component{
    state = {
        connected: false,
        ros:null,
    };

    constructor() {
        super();
        this.init_connection();
    }

    init_connection(){

        this.state.ros = new window.ROSLIB.Ros();
        // console.log("Da khoi tao duoc ros");

        this.state.ros.on("connection", () => {
            // console.log("connection established!");
            this.setState({connected: true});
        });

        this.state.ros.on("close", () => {
            // console.log("connection is closed");
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

            // console.log(
            //     "ws://" + 
            //     Config.ROSBRIDGE_SERVER_IP +
            //     ":" + 
            //     Config.ROSBRIDGE_SERVER_PORT +
            //     ""
            // );
        } catch (error) {
            console.log("connection problem");
        }

    }

    render() {
        return (
            <div>
                <Alert className="text m-3"
                        variant={this.state.connected ? "success" : "danger"}>
                    {this.state.connected? "Robot Connected": "Robot Disconnected"}
                </Alert>
            </div>
        );
    }
}

export default Connection;
