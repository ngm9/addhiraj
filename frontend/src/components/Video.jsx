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
    const [loading, setLoadingState] = useState(false); // State to track loading status
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
        setLoadingState(true); // Set loading state to true
        uploadVideoFile(file)
          .then((response) => {
            if (response.status === 200) {
              message.success('Video uploaded successfully');
              const fileName = response.data.filename;
              fetchDetails(fileName); // Fetch details after upload
            } else {
              console.error('Failed to upload video file');
            }
          })
          .catch((error) => {
            console.error('Error uploading video file:', error);
            message.error('Failed to upload video file');
            speakText("Failed to upload the video file", 'en-US');
          })
          .finally(() => {
            setLoadingState(false); // Set loading state to false
          });
        setVideoUrl('');
      }
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      setLoadingState(true); // Set loading state to true
      setIsUploaded(true); // Update state to hide the form
      try {
        if (inputVideoUrl) {
          setVideoUrl(inputVideoUrl);
          setVideoFile(null);
  
          uploadVideoUrl(inputVideoUrl)
            .then((response) => {
              const { title, message: responseMessage } = response.data;
              message.success(`${responseMessage}: ${title}`);
              speakText(`${responseMessage}: ${title}`, 'en-US');
              const fileName = title.split('.').slice(0, -1).join('.');
              fetchDetails(fileName); // Fetch details after upload
            })
            .catch((error) => {
              console.error('Error uploading video URL:', error);
              message.error('Failed to upload video URL');
              speakText("Failed to upload the video", 'en-US');
            })
            .finally(() => {
              setLoadingState(false); // Set loading state to false
            });
        } else if (videoFile) {
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
            })
            .finally(() => {
              setLoadingState(false); // Set loading state to false
            });
        }
      } catch (error) {
        console.error('Error uploading video:', error);
        message.error('Failed to upload video');
        setLoadingState(false); // Set loading state to false
      }
    };
    return (
      <div>
        <div className="flex-grow p-5 rounded-lg flex flex-col justify-center items-center text-black bg-customGray border border-gray-300">
        {loading ? (
          <div className="flex justify-center items-center flex-col">
            <h1 className='text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-4'>Uploading</h1>
            <img src="/Loading_gif.gif" alt="Loading..." className='w-100 h-100'/>
          </div>
        ):(
          <div className='flex items-center flex-col'>
            <h2 className=" text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-4">Upload Video</h2>
            {!isUploaded && !loading && <VideoForm handleSubmit={handleSubmit} handleFileChange={handleFileChange} />}
            {(inputVideoUrl || videoFile) && !loading && <VideoPlayer />}
          </div>
        )}
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