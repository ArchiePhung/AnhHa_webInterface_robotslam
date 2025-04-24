import React, {Component, useState, useEffect} from "react";
import Config from "../scripts/config";
import axios from "axios";
// import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";

const History = props => {
    const [data, setData] = useState([]); // State lưu dữ liệu bảng
    const [lastFetchedData, setLastFetchedData] = useState(null); // Lưu dữ liệu lần fetch trước
    const pollingInterval = Config.WAIT_HISTORY_TIMER;

    // Hàm kiểm tra dữ liệu có thay đổi không
    const isDataChanged = (newData, oldData) => {
        return JSON.stringify(newData) !== JSON.stringify(oldData);
    };

    const [dataTable, setDataTable] = useState([]);
    const [newData, setNewData] = useState([]);

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: "black",
                color: "white",
                fontSize: "17px",
                fontWeight: "bolder",
            }
        }
    }
    // Hàm GET dữ liệu
    const fetchData = async () => {
        try {
            const response = await axios.get("http://" + Config.ROSBRIDGE_SERVER_IP + ":" + Config.SERVER_PORT + "/history")
            // setData(response.data.data);
            const fetchedData = response.data.data;
            // length = response.data.data.length;
            // setMessage(response.data.status);
            console.log("------ update data -------------", fetchedData, lastFetchedData);
            // Chỉ cập nhật nếu dữ liệu thay đổi
            if (isDataChanged(fetchedData, lastFetchedData)) {
                // console.log("------ update data -------------");
                setData(fetchedData);
                setLastFetchedData(fetchedData);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData(); // Gọi lần đầu tiên khi component mount

        const interval = setInterval(() => {
          fetchData();
        //   console.log(data);
        }, pollingInterval); // Lặp lại mỗi 5 giây
    
        return () => clearInterval(interval); // Xóa interval khi component unmount
    }, []);

    const columns = [
        {
            name: 'Name',
            selector: row => row.doc_name,
            sortable: true
        },
        {
            name: 'Position',
            selector: row => row.locker_pos,
            sortable: true
        },
        {
            name: 'Room',
            selector: row => row.room_pos,
            sortable: true
        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true
        },
        {
            name: 'Date Created',
            selector: row => row.create_time,
            sortable: true
        }
        
    ];
    
    return(
        <div className="history-container mt5">
            <DataTable 
                columns={columns}
                data={data}
                customStyles={customStyles}
                fixedHeader
                pagination
                highlightOnHover
            ></DataTable>
        </div>
    );
}

export default History;