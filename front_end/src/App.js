import Footer from "./components/Footer";
import Header from "./components/Header";
import Body from "./components/Body";
import Image from './images/bg_image_hcmute.png';
// import {Route, BrowserRouter as Router, Routes} from "react-router-dom"
import { useState, useEffect} from "react";
import axios from "axios";
import Config from "./scripts/config"
// import { v4 as uuidv4 } from 'uuid';

function App() {
    const backgroundStyle = {
      backgroundImage: `url(${Image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: -1, // Send the background to the back
    };

    const contentStyle = {
        position: 'relative',
        zIndex: 1, // Place content above the background
        padding: '20px',
        height: '950px', // Ensure content takes full viewport height
        overflowY: "hidden",  // Allow content to scroll
    };

    // kiểm soát chỉ 1 client được kết nối
    // const clientId = uuidv4(); // Tạo ID duy nhất

    // const [status, setStatus] = useState("Not connected");
    // const [isConnected, setIsConnected] = useState(false);
  
    // const connectToServer = async () => {
    //   try {
    //     const response = await axios.post("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/connect", {
    //       clientId,
    //     });
  
    //     if (response.data.status === "connected") {
    //       setStatus(response.data.message);
    //       setIsConnected(true);
    //     } else if (response.data.status === "disconnect") {
    //       setStatus(response.data.message);
    //       setIsConnected(true);
    //     }
    //   } catch (error) {
    //       console.error("Error connecting to server:", error);
    //       setStatus("Connection failed");
    //   }
    // };


    const [email, setEmail] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const [lastFetchedData, setLastFetchedData] = useState(null); // Lưu dữ liệu lần fetch trước
    const pollingInterval = Config.WAIT_HISTORY_TIMER;

    // Hàm kiểm tra dữ liệu có thay đổi không
    const isDataChanged = (newData, oldData) => {
      return JSON.stringify(newData) !== JSON.stringify(oldData);
    };

    // Hàm GET dữ liệu
    const fetchData = async () => {
      try {
          const response = await axios.get("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/getemail")
          const fetchedData = response.data.email;
          // console.log("------ Email receive is -------------", fetchedData);
          // Chỉ cập nhật nếu dữ liệu thay đổi
          if (isDataChanged(fetchedData, lastFetchedData)) {
              // console.log("------ update data in app-------------", fetchedData);
              setEmail(fetchedData);
              setLastFetchedData(fetchedData);
          }

      } catch (error) {
          console.error("Error fetching data:", error);
      }
    };

    useEffect(() => {
        fetchData(); // Gọi lần đầu tiên khi component mount
        // connectToServer();

        const interval = setInterval(() => {
          fetchData();
        //   console.log(data);
        }, pollingInterval); // Lặp lại mỗi 5 giây
    
        return () => clearInterval(interval); // Xóa interval khi component unmount
    }, []);

    return (
      <div className="App">
          <div style={backgroundStyle}></div>
          <div style={contentStyle}>
            <Header email={email}/>
            <hr/>
            <Body email={email}></Body>
            {/* <Body setEmail={setEmail} setIsSuccess={setIsSuccess}></Body> */}
            <Footer />
          </div>
      </div>
    );
}

export default App;
