import React, {Component} from "react";
import { Joystick } from "react-joystick-component";
import Config from "../scripts/config";
// import ROSLIB from "roslib";

class Teleopeation extends Component {
    state = {ros:null};

    constructor() {
        super();
        this.init_connection();
        // add this for fix err: not use ros in handleMove() and handleStop()
        this.handleMove = this.handleMove.bind(this);
        this.handleStop = this.handleStop.bind(this);
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

    handleMove(event) {
        console.log("handle move");
        
        var cmd_vel = new window.ROSLIB.Topic({
            ros:this.state.ros,
            name: Config.CMD_VEL_TOPIC,
            messageType: "geometry_msgs/Twist",
        });

        // create new twist message
        var twist = new window.ROSLIB.Message({
            linear:{
                x: event.y,
                y: 0,
                z: 0,
            },
            angular:{
                x: 0,
                y: 0,
                z: -event.x,
            },
        })

        // publish the message
        cmd_vel.publish(twist);
    }
    handleStop(event) {
        console.log("handle stop");
        var cmd_vel = new window.ROSLIB.Topic({
            ros:this.state.ros,
            name: Config.CMD_VEL_TOPIC,
            messageType: "geometry_msgs/Twist",
        });

        // create new twist message
        var twist = new window.ROSLIB.Message({
            linear:{
                x: 0,
                y: 0,
                z: 0,
            },
            angular:{
                x: 0,
                y: 0,
                z: 0,
            },
        })

    }

    render() {
        return(
            <div>
                <Joystick
                    size={100}
                    baseColor="#EEEEEE"
                    stickColor="#BBBBBB"
                    move={this.handleMove}
                    stop={this.handleStop}
                />
            </div>
        );
    };
}

export default Teleopeation;