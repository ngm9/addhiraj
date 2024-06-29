import React, { useState,useContext  } from 'react';
import { Input, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadVideoUrl, uploadVideoFile,getDetails } from '../api/videoService';
import ReactPlayer from 'react-player';
import { VideoProvider }  from './sub-components/VideoContext';
import VideoContext   from './sub-components/VideoContext';
import VideoForm from './sub-components/VideoForm';
import VideoPlayer from './sub-components/VideoPlayer';
import { useTTS } from '../store/TTSContext';
import { useVideoDetails } from './sub-components/VideoDetailsContext';
import { VideoDetailsProvider } from './sub-components/VideoDetailsContext';
import FrameBar from './frames';

const MainVideo = () => {
    const {
      inputVideoUrl,
      setVideoUrl,
      videoFile,
      setVideoFile,
      setLoading,
    } = useContext(VideoContext);
    const { speakText } = useTTS(); // Use the TTS hook
    const [isUploaded, setIsUploaded] = useState(false); // State to track upload status
    const { videoDetails,setVideoDetails } = useVideoDetails(); // Use the video details context

    const fetchDetails = (fileName) => {
      getDetails(fileName)
        .then((res) => {
          console.log('Details:', res.data);
          // setFramesData(res.data); // Set frames data
          setVideoDetails(res.data); // Set video details in context
          // setLoadingFrames(false); // Set loading frames to false
        })
        .catch((error) => {
          console.error('Error getting details:', error);
          // setLoadingFrames(false); // Set loading frames to false
          message.error('Failed to get video details');
        });
    };

    // const handleFileChange = (info) => {
    //   const file = info.file;
    //   setIsUploaded(true); // Update state to hide the form

    //   if (file) {
    //     console.log(`Uploaded the file ${file}`)
    //     setVideoFile(file);
    //     uploadVideoFile(file)
    //       .then((response) => {
    //         if (response.status === 200) {
    //           message.success('Video uploaded successfully');
    //           speakText('Video uploaded successfully'); // Speak the response
    //           setIsUploaded(true); // Update state to hide the form
              
    //         } else {
    //           console.error('Failed to upload video file');
    //         }
    //       })
    //     setVideoUrl('');
    //   }
    // };
  
    // const handleSubmit = async (event) => {
    //   event.preventDefault();
    //   setLoading(true);
    //   setIsUploaded(true); // Update state to hide the form
    //   try {
    //     if (inputVideoUrl) {
    //       setVideoUrl(inputVideoUrl);
    //       setVideoFile(null);
  
    //       // Make the API call in the background
    //       uploadVideoUrl(inputVideoUrl)
    //       .then((response) => {
    //         const { title, message: responseMessage } = response.data;
    //         message.success(`${responseMessage}: ${title}`);
    //         speakText(`${responseMessage}: ${title}`, 'en-US'); 

    //       })
          
    //       .catch((error) => {
    //         console.error(error);
    //         message.error('Failed to upload video URL');
    //         speakText("Failed to upload the video", 'en-US'); 
    //       });

    //       getDetails()
    //       .then((res) => {
    //             console.log('Details:', res.data);
    //             // setLoadingFrames(false); // Set loading frames to false
    //             // Process and display frames based on response
    //       })
    //       .catch((error) => {
    //             console.error('Error getting details:', error);
    //             // setLoadingFrames(false); // Set loading frames to false
    //             message.error('Failed to get video details');

    //       });

          
    //     } else if (videoFile) {
    //       console.log(`This is the video file ${videoFile}`)
    //       uploadVideoFile(videoFile)
    //       .then((response) => {
    //         if (response.status === 200) {
              
    //           message.success('Video uploaded successfully');
    //           speakText('Video uploaded successfully'); // Speak the response
             
              
    //         } else {
    //           throw new Error('Failed to upload video file');
    //         }
    //       })
    //       .catch((error) => {
    //         console.error(error);
    //         message.error('Failed to upload video file');
    //         speakText("Failed to upload the video file", 'en-US'); 
    //       });

    //       getDetails()
    //       .then((res) => {
    //             console.log('Details:', res.data);
    //             // setLoadingFrames(false); // Set loading frames to false
    //             // Process and display frames based on response
    //       })
    //       .catch((error) => {
    //             console.error('Error getting details:', error);
    //             // setLoadingFrames(false); // Set loading frames to false
    //             message.error('Failed to get video details');
    //       });
    //     } 
    //     } catch (error) {
    //       console.error(error);
    //       message.error('Failed to upload video');
    //     } finally {
    //       setLoading(false);
    //     }
    //   };
    
    const handleFileChange = (info) => {
      const file = info.file;
      setIsUploaded(true); // Update state to hide the form
  
      if (file) {
        console.log(`Uploaded the file ${file}`);
        setVideoFile(file);
        // setLoadingFrames(true); // Set loading frames to true
        uploadVideoFile(file)
          .then((response) => {
            if (response.status === 200) {
              message.success('Video uploaded successfully');
              // speakText('Video uploaded successfully'); // Speak the response
              setIsUploaded(true); // Update state to hide the form
              // const fileName = response.data.filepath.split('.').slice(0, -1).join('.');
              console.log(response.data.filename);
              const fileName = response.data.filename;
              fetchDetails(fileName); // Fetch details after upload
            } else {
              console.error('Failed to upload video file');
              // setLoadingFrames(false); // Set loading frames to false
            }
          })
          .catch((error) => {
            console.error('Error uploading video file:', error);
            message.error('Failed to upload video file');
            speakText("Failed to upload the video file", 'en-US');
            // setLoadingFrames(false); // Set loading frames to false
          });
        setVideoUrl('');
      }
    };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setIsUploaded(true); // Update state to hide the form
    // setLoadingFrames(true); // Set loading frames to true
    try {
      if (inputVideoUrl) {
        setVideoUrl(inputVideoUrl);
        setVideoFile(null);

        // Make the API call in the background
        uploadVideoUrl(inputVideoUrl)
          .then((response) => {
            const { title, message: responseMessage } = response.data;
            message.success(`${responseMessage}: ${title}`);
            speakText(`${responseMessage}: ${title}`, 'en-US');
            // Assuming you get the file path from the URL response (needs to be adjusted according to actual response)
            const fileName = title.split('.').slice(0, -1).join('.');
            fetchDetails(fileName); // Fetch details after upload
          })
          .catch((error) => {
            console.error('Error uploading video URL:', error);
            message.error('Failed to upload video URL');
            speakText("Failed to upload the video", 'en-US');
            // setLoadingFrames(false); // Set loading frames to false
          });
      } else if (videoFile) {
        console.log(`This is the video file ${videoFile}`);
        uploadVideoFile(videoFile)
          .then((response) => {
            if (response.status === 200) {
              message.success('Video uploaded successfully');
              speakText('Video uploaded successfully'); // Speak the response
              const fileName = response.data.filepath;
              fetchDetails(fileName); // Fetch details after upload
            } else {
              throw new Error('Failed to upload video file');
            }
          })
          .catch((error) => {
            console.error('Error uploading video file:', error);
            message.error('Failed to upload video file');
            speakText("Failed to upload the video file", 'en-US');
            // setLoadingFrames(false); // Set loading frames to false
          });
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      message.error('Failed to upload video');
      // setLoadingFrames(false); // Set loading frames to false
    } finally {
      setLoading(false);
    }
  };
    return (
      <div>
        <div className="flex-grow p-5 rounded-lg flex flex-col justify-center items-center bg-gray-700 border border-gray-300">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Upload Video</h2>
        {!isUploaded && <VideoForm handleSubmit={handleSubmit} handleFileChange={handleFileChange} />}
        {(inputVideoUrl || videoFile) && <VideoPlayer />}
      </div>
      <div className="flex flex-col w-full ">
          {videoDetails && <FrameBar />} {/* Render FrameBar when videoDetails is populated */}
      </div>
      </div>

      
    );
  };
  
  export default () => (
    <VideoProvider>
      <VideoDetailsProvider>
        <MainVideo />
      </VideoDetailsProvider>
    </VideoProvider>
  );