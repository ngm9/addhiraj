import React, { useContext } from 'react';
import { Input, Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import VideoContext from './VideoContext';

const VideoForm = ({ handleSubmit, handleFileChange }) => {
  const { inputVideoUrl, setInputVideoUrl, loading } = useContext(VideoContext);

  const handleUrlChange = (event) => {
    setInputVideoUrl(event.target.value);
  };

  return (
    <form className="flex flex-col items-center" onSubmit={handleSubmit}>
    <div className="flex items-center mb-4">
      <Input
        placeholder="Enter video URL"
        className="mr-2"
        value={inputVideoUrl}
        onChange={handleUrlChange}
      />
      <span className="mx-2">or</span>
      <Upload
        accept="video/*"
        showUploadList={false}
        beforeUpload={(file) => {
          handleFileChange({ file });
          return false;
        }}
      >
        <Button icon={<UploadOutlined />}>Click to Upload</Button>
      </Upload>
    </div>
    <Button type="primary" htmlType="submit" loading={loading}>
      Submit
    </Button>
  </form>
  );
};

export default VideoForm;
