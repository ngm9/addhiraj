import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Avatar, List, Skeleton, Segmented } from 'antd';
import Summary from './video_summary'; // Import the Summary component
import { AudioRecorder } from 'react-audio-voice-recorder';
import { FaMicrophone } from "react-icons/fa";
import qs from 'qs';



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
      const res = await apiClient.post(`/chat`, qs.stringify({ chat_msg: question }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
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

  const handleAudioUpload = async (blob) => {
    console.log("HEY YOU STOPPED THE RECORDING ");
    const formData = new FormData();
    formData.append('file', blob, 'voice-recording.mp3');

    setLoading(true);

    try {
      const res = await apiClient.post(`/transcribe_audio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      // const responseMessage = { text: res.data.response, sender: 'bot' };
      const { transcription, chat_response } = res.data; // Extract transcription and chat response
      const { response, status } = chat_response; // Extract response and status from chat_response
      console.log("This is the response",response);
      const transcriptionMessage = { text: transcription, sender: 'bot' };
      const responseMessage = { text: response, sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, responseMessage]);
    } catch (error) {
      console.error('Error uploading audio:', error);
      const errorMessage = { text: 'Error processing audio.', sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md mx-auto p-4 border border-gray-300 rounded-lg shadow-lg h-full flex flex-col">
    <h2 className="text-2xl font-bold mb-4">Chat and Transcription</h2>
    <Segmented
      options={[
        { value: 'Summary', label: 'Transcription' },
        { value: 'Chat', label: 'Chat' }
      ]}
      value={activeTab}
      onChange={setActiveTab}
      className="mb-4 w-full"
      block
    />

    {activeTab === 'Summary' && <Summary summary={summary} loading={summaryLoading} />}

    {activeTab === 'Chat' && (
      <div className="flex-grow overflow-y-auto mb-4 border bg-slate-100 border-gray-200 rounded-md p-2 text-white">
        <List
            itemLayout="vertical"
            size="large"
            dataSource={messages}
            renderItem={(msg, index) => (
              <List.Item key={index} >
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
        <div className="relative w-full mb-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full h-16 p-2 border border-gray-300 rounded-md text-black"
          placeholder="Ask a question..."
        />
            <div className="absolute top-2 right-2">
              <AudioRecorder
                onRecordingComplete={handleAudioUpload}
                audioTrackConstraints={{
                  noiseSuppression: true,
                  echoCancellation: true,
                }}
                downloadOnSavePress={false}
                downloadFileExtension="mp3"
                render={({ startRecording, stopRecording }) => (
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    className="bg-red-600 text-white p-2 rounded-full"
                  >
                    <FaMicrophone size={24} />
                  </button>
                )}
              />
            </div>
          </div>
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
