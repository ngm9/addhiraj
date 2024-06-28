import React,{useState,useEffect} from 'react';
import { BarsOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { List, Button } from 'antd';


const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [documents, setDocuments] = useState([]);
  
    const toggleCollapse = () => {
      setIsCollapsed(!isCollapsed);
    };
  
    // useEffect(() => {
    //   apiClient.get('/documents')
    //     .then(response => {
    //       setDocuments(response.data);
    //     })
    //     .catch(error => {
    //       console.error('Error fetching documents:', error);
    //     });
    // }, []);
  
    return (
      <div className={`flex flex-col ${isCollapsed ? 'w-16' : 'w-1/4'} transition-all duration-300 bg-gray-200`}>
        <div className="flex justify-between items-center p-4">
          {!isCollapsed && <h2 className="text-xl font-bold mb-4">All Chats</h2>}
          <button onClick={toggleCollapse} className="p-2 focus:outline-none">
            <BarsOutlined />
          </button>
        </div>
        {!isCollapsed && (
            <List
            dataSource={documents}
            renderItem={(doc) => (
              <List.Item>
                <Link to={`/chat-interface/${doc[0]}`} className="block w-full text-left p-2 hover:bg-gray-300">
                  {doc[1]}
                </Link>
              </List.Item>
            )}
            className="ml-4"
            />
        )}
      </div>
    );
  };  
  
  export default Sidebar;
  