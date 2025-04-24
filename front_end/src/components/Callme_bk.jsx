import React, {Component} from "react";
import Config from "../scripts/config";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

class Callme_bk extends Component {
    state = {
        ros:null
    };

    constructor() {
        super();
        this.init_connection();
        this.handleCmdRequest = this.handleCmdRequest.bind(this);
    }

    init_connection(){

        this.state.ros = new window.ROSLIB.Ros();
        // console.log("Da khoi tao duoc ros");

        this.state.ros.on("connection", () => {
            // console.log("connection established in Teleoperation!");
            this.setState({connected: true});
        });

        this.state.ros.on("close", () => {
            // console.log("connection is closed in Teleoperation!");
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

        } catch (error) {
            console.log("connection problem");
        }

    }

    handleCmdRequest() {
        // console.log("handle command cmdrequest");

        
        // var cmd_goal = new window.ROSLIB.Topic({
        //     ros:this.state.ros,
        //     name: Config.CMD_GOAL_TOPIC,
        //     messageType: "move_base_msgs/MoveBaseActionGoal",
        // });

        // // create new twist message
        // var goal_data = new window.ROSLIB.Message({
        //     goal: {
        //         target_pose:{
        //             header:{
        //                 frame_id: "map",
        //             },
        //             pose:{
        //                 position:{
        //                     x: -0.504999858513474,
        //                     y: 0.4170668869972249,
        //                     z: 0.0,
        //                 },

        //                 orientation: {
        //                     x: 0.0,
        //                     y: 0.0,
        //                     z: 0.7723881905888328,
        //                     w: -0.6351507561507811,
        //                 },
        //             },
        //         },
        //     },
        // })

        // // publish the message
        // cmd_goal.publish(goal_data);
    }

    render() {
        return(
            <div>
                <button className="btn btn-info w-30 rounded-0" style={{ marginBottom: '20px' }} onClick={this.handleCmdRequest}>Call me</button>

            </div>
        );
    };
}

export default Callme_bk;