import React, {Component} from "react";
import Config from "../scripts/config";
import { Link } from "react-router-dom";
import Empty from "./Empty";

class Map_bk extends Component {
    state = {
        ros:null,
        robot_state: 0,
        bt_entercmd: 1,
        bt_confirm: 1,
        is_recv_data: 0,
    };

    constructor (props){
        super(props);
        this.view_map = this.view_map.bind(this);
    }

    init_connection(){

        this.state.ros = new window.ROSLIB.Ros();
        // console.log(this.state.ros);

        try{
            this.state.ros.connect(
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

    componentDidMount() {
        this.init_connection();
        this.view_map();
        this.getRobotState();
    }
    
    getRobotState(){
        var robotstate_subscriber = new window.ROSLIB.Topic({
            ros:this.state.ros,
            name: "/robot_state",
            messageType: "std_msgs/Int8",
        });

        // create a pose callback
        robotstate_subscriber.subscribe((message) => {
            this.setState({robot_state: message.data});
            this.setState({is_recv_data: 1})

            if (this.state.robot_state === 1){
                this.setState({bt_entercmd: 0});
                this.setState({bt_confirm: 1});
            }
            else if (this.state.robot_state === 2){
                this.setState({bt_entercmd: 0});
                this.setState({bt_confirm: 0});
            }
            else{
                this.setState({bt_entercmd: 1});
                this.setState({bt_confirm: 1});
            }
        });
    }

    view_map(){
        var viewer = new window.ROS2D.Viewer({
            divID: "nav_div",
            width: 960,
            height: 900,
        });

        var navClient = new window.NAV2D.OccupancyGridClientNav({
            ros: this.state.ros,
            rootObject: viewer.scene,
            viewer: viewer,
            severName: "/move_base",
            withOrientation: true,
        });
    }

    // handle_btConfirm(){
    //     console.log("Nut button confirm da duoc nhan")
    // }

    render() {

        return(
            <div>
                {
                    this.props.isSuccess ? 
                    (
                        <div>
                            <Empty></Empty>
                        </div>
                    ) 
                    : 
                    (
                        <div className="map-container">

                            <div>
                                <Link to="/order" className="btn btn-info w-30 rounded-0" style={{ marginRight: '20px', marginBottom: '10px'}} >Order</Link>
                                <buton className='btn btn-warning' onClick={this.handle_btConfirm} style={{ marginRight: '20px', marginBottom: '10px'}}>Confirm</buton>
                                <label>
                                    <span style={{ color: 'white', cursor: 'not-allowed', fontSize: '20px' }}>Display state of webserver here!</span>
                                </label>
                            </div>
            
                            <h1 style={{ color: 'white' }} className="map_h1">MAP</h1>
            
                            <div id="nav_div"></div>
                        </div>
                    )
                }
            </div>
        );
    }
}

export default Map_bk;