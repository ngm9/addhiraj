import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Avatar, List, Skeleton, Segmented } from 'antd';
import Summary from './video_summary'; // Import the Summary component


const ChatWindow = () => {
  const { id } = useParams(); // Access the dynamic ID parameter from the route
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Chat');
  const [summary, setSummary] = useState([]);
  const [summaryFetched, setSummaryFetched] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false); // Separate loading state for summary



  useEffect(() => {
    if (activeTab === 'Summary') {
      fetchSummary();
    }
  }, [activeTab]);


  const handleAskQuestion = async () => {
    if (!question.trim()) return;
  
    const newMessage = { text: question, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setQuestion('');
    setLoading(true);
  
    try {
      const res = await apiClient.post(`/document_chat/chat`, {
        message: question,
        document_id: id,
      });
      const responseMessage = { text: res.data.response, sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, responseMessage]);
    } catch (error) {
      console.error('Error asking question:', error);
      const errorMessage = { text: 'Error retrieving response.', sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  
  const fetchSummary = async () => {
    if (summaryFetched) return;

    setLoading(true);
    setSummaryLoading(true);

    try {
      const res = await apiClient.post(`/document_chat/chat`, {
        message: "Generate a summary of the PDF in 5 points.",
        document_id: id
      });
      const summaryPoints = res.data.response.split('\n');
      setSummary(summaryPoints);
      setSummaryFetched(true);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
      setSummaryLoading(false);
    }
  };



  return (
    <div className="w-full max-w-md mx-auto p-4 border border-gray-300 rounded-lg shadow-lg h-full flex flex-col">
    <h2 className="text-2xl font-bold mb-4">Chat and Transcription</h2>
    <Segmented
      options={[
        { value: 'Summary', label: 'Summary' },
        { value: 'Chat', label: 'Chat' }
      ]}
      value={activeTab}
      onChange={setActiveTab}
      className="mb-4 w-full"
      block
    />

    {activeTab === 'Summary' && <Summary summary={summary} loading={summaryLoading} />}

    {activeTab === 'Chat' && (
      <div className="flex-grow overflow-y-auto mb-4 border border-gray-200 rounded-md p-2">
        <List
            itemLayout="vertical"
            size="large"
            dataSource={messages}
            renderItem={(msg, index) => (
              <List.Item key={index}>
                {msg.sender === 'bot' ? (
                  <Skeleton loading={loading && index === messages.length - 1} active>
                    <List.Item.Meta
                      title="Bot"
                      description={msg.text}
                    />
                  </Skeleton>
                ) : (
                  <List.Item.Meta
                    title="You"
                    description={msg.text}
                  />
                )}
              </List.Item>
            )}
          />
      </div>
    )}

    {activeTab === 'Chat' && (
      <>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full h-16 p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Ask a question..."
        />
        <button
          onClick={handleAskQuestion}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Ask
        </button>
      </>
    )}
  </div>
);
};

export default ChatWindow;
