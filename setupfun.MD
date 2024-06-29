# ADDhiraj Tool Documentation 🎥📚

## Overview 🚀
ADDhiraj is a tool aimed at providing video accessibility for individuals with Attention Deficit Disorders (ADD) and ADHD. This application leverages a combination of various libraries and services to download, process, transcribe, analyze, and generate video segments from YouTube videos and user-uploaded files.

## Features 🌟
- **Video Downloading** 📥: Downloads videos from YouTube using `yt-dlp`.
- **Audio Extraction** 🎧: Extracts audio from video files.
- **Transcription** 📝: Uses Whisper model for transcribing audio.
- **Text Extraction** 🖼️: Extracts text from video frames using Tesseract OCR.
- **Content Analysis** 📊: Analyzes transcript to identify key topics and generates video segments.
- **Chroma DB Integration** 💾: Stores and queries transcriptions and analyses using Chroma DB.
- **Web Interface** 🌐: Provides an API for uploading videos, transcribing audio, and interacting with the application.

## Installation 🛠️

### Requirements 📋
- Python 3.8+
- ffmpeg (for video processing)
- Tesseract OCR
- Whisper model
- AWS S3 credentials
- OpenAI API Key

### Libraries 📚
Install the required Python libraries using pip:
```bash
pip install -r requirements.txt
```
`requirements.txt` should include:
- os
- time
- json
- requests
- whisper
- cv2
- pytesseract
- re
- boto3
- yt-dlp
- moviepy
- flask
- flask_apscheduler
- pytube
- flask_cors
- werkzeug
- langchain_openai
- langchain_chroma
- langchain_experimental
- openai

## Configuration ⚙️

### Environment Variables 🌍
Set the following environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key

### Flask Configuration 🌐
Set the upload folder and allowed file extensions in `app.config`:
```python
app.config['UPLOAD_FOLDER'] = "/path/to/upload/folder"
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'm4a', 'flac'}
```

### AWS S3 Configuration ☁️
```python
S3_BUCKET = 'your-s3-bucket-name'
S3_REGION = 'your-s3-region'
```

## API Endpoints 🛣️

### /hello 👋
**GET**: Returns a greeting message.
```json
{
    "message": "Hello, World!"
}
```

### /upload 📤
**POST**: Uploads a video file for processing.
- **Request**: Multipart/form-data with the file parameter named `file`.
- **Response**: 
  - Success: 
  ```json
  {
      "message": "File successfully uploaded to /path/to/upload/folder/filename"
  }
  ```
  - Error:
  ```json
  {
      "error": "Error message"
  }
  ```

### /video_url 📹
**POST**: Processes a YouTube video URL for downloading and analysis.
- **Request**: JSON body with the URL parameter named `url`.
- **Response**: 
  - Success:
  ```json
  {
      "message": "Valid YouTube URL",
      "title": "Video Title"
  }
  ```
  - Error:
  ```json
  {
      "error": "Error message"
  }
  ```

### /transcribe_audio 🎤
**POST**: Transcribes an uploaded audio file.
- **Request**: Multipart/form-data with the file parameter named `file`.
- **Response**:
  - Success:
  ```json
  {
      "message": "Transcription and chat successful",
      "transcription": "Transcribed text",
      "chat_response": "Chat response"
  }
  ```
  - Error:
  ```json
  {
      "error": "Error message"
  }
  ```

### /get_details 📜
**GET**: Retrieves the analysis details JSON.
- **Response**:
  - Success:
  ```json
  {
      "details": "JSON content"
  }
  ```
  - Error:
  ```json
  {
      "error": "Details not found"
  }
  ```

### /chat 💬
**POST**: Sends a chat message to the virtual TA.
- **Request**: Form data with the message parameter named `chat_msg`.
- **Response**:
  - Success:
  ```json
  {
      "status": "success",
      "response": "Chatbot response"
  }
  ```
  - Error:
  ```json
  {
      "status": "error",
      "message": "Error message"
  }
  ```

## Functions 🔧

### `extract_audio(video_path)` 🎧
Extracts audio from a given video file and saves it as an mp3 file.

### `transcribe_with_timestamps(audio_path)` 🕒
Transcribes the given audio file using the Whisper model, including timestamps.

### `format_transcript(transcript_segments)` 📄
Formats transcript segments into a single string.

### `analyze_transcript(transcript, api_key)` 🧠
Analyzes the transcript to identify key topics and timestamps.

### `extract_json_from_response(response)` 📦
Extracts JSON data from the response.

### `create_video_clips_from_gpt_output(gpt_output, source_video_path, output_dir)` ✂️
Creates video clips from GPT output based on identified topics.

### `create_video_segments_from_data(data, source_video_path, output_dir)` 🎬
Creates video segments from the provided JSON data.

### `timestamp_to_seconds(timestamp)` ⏱️
Converts a timestamp string to seconds.

### `extract_text_from_video(video_path, output_dir, frame_interval=30)` 🖼️
Extracts text from video frames using Tesseract OCR and saves unique text.

### `download_ydl(video_url, output_path)` ⬇️
Downloads a video from YouTube.

### `process_video(video_path)` 🎞️
Processes a video by extracting audio, transcribing it, analyzing the transcript, and creating video segments.

### `is_valid_youtube_url(url)` 🔗
Validates a YouTube URL.

### `process_file(file_path)` 📂
Processes a file for transcription and analysis.

### `allowed_audio_file(filename)` 🔍
Checks if the audio file extension is allowed.

### `allowed_video_file(filename)` 🔍
Checks if the video file extension is allowed.

### `append_text_to_chromadb(text, persist_directory='chroma')` 🧩
Appends text to Chroma DB.

### `query_chatbot(query_text)` 🤖
Queries the chatbot with a provided text.

## Running the Application ▶️
Run the Flask application using the following command:
```bash
python app.py
```

The application will start and be accessible at `http://0.0.0.0:5000`.
