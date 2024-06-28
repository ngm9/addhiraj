import React from 'react';
import { List, Skeleton } from 'antd';

const Summary = ({ summary, loading }) => {
    return (
      <div className="flex-grow overflow-y-auto mb-4 border border-gray-200 rounded-md p-2">
        <h3 className="text-xl font-bold mb-4">Transcription</h3>
        {loading ? (
          <Skeleton active />
        ) : (
          <List
            dataSource={summary}
            renderItem={(point, index) => (
              <List.Item key={index}>
                {point}
              </List.Item>
            )}
          />
        )}
      </div>
    );
  };
  
export default Summary;