import os
import time
import json
import requests
import whisper
import cv2
import pytesseract
import re
import boto3
from yt_dlp import YoutubeDL
from moviepy.editor import VideoFileClip, concatenate_videoclips
from flask import Flask, request, jsonify, redirect, url_for, render_template
from flask_apscheduler import APScheduler
from pytube import YouTube
from flask_cors import CORS
from werkzeug.utils import secure_filename
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_experimental.text_splitter import SemanticChunker
from openai import OpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import ChatPromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_openai.embeddings import OpenAIEmbeddings  # Updated import

app = Flask(__name__)
CORS(app)
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

api_key = os.getenv('OPENAI_API_KEY')
# Load Whisper model globally to avoid redundancy
MODEL = whisper.load_model("base")
app.config['UPLOAD_FOLDER'] = "/home/ubuntu/people+ai/data"
OCR_TEXT_SUFFIX = "_ocrtext.txt"
TRANSCRIPT_SUFFIX = "_transcript.txt"
DETAILS_SUFFIX = "_details.json"

ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}

ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'm4a', 'flac'}

# Set the Chroma DB path and OpenAI API key
CHROMA_PATH = "chroma"

# Initialize OpenAI client with provided settings
client = OpenAI(api_key=api_key)

# Prompt template for generating responses
PROMPT_TEMPLATE = """
You are a Virtual Teaching Assistant (TA) for a university-level course. Your responsibilities include assisting students with their coursework, answering questions, providing explanations and clarifications on various topics, and offering guidance on assignments and projects.

Your primary areas of expertise include only the context that is provided.

Stay strictly on course information, do not engage in conversations that are off topic

When responding to students, follow these guidelines:

Clarity: Provide clear and concise explanations.
Examples: Use examples to illustrate concepts whenever possible.
Step-by-Step Guidance: Break down complex problems into smaller, manageable steps.
Encouragement: Encourage students to think critically and explore alternative solutions.
Resources: Suggest additional resources or reading materials if relevant.
Please respond to the following student query as you would in your role as a Virtual TA:

{context}

---

Answer the question based on the above context: {question}
"""

# Initialize Chroma vector store with OpenAI embeddings
embedding_function = OpenAIEmbeddings(api_key=api_key)
db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

# AWS S3 Configuration
S3_BUCKET = 'addhiraj-videos'
S3_REGION = 'ap-south-1'  # e.g., 'us-west-1'
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

s3 = boto3.client('s3', region_name=S3_REGION,
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

def upload_to_s3(file_path):
    file_name = file_path.split('/')[-1]
    # Upload the file to S3
            
    try:
        s3.upload_file(file_path, S3_BUCKET, file_name, ExtraArgs={
                    'ContentType': 'binary/octet-stream',
                    'ContentDisposition': 'inline'})    
            # Construct the S3 URL
        s3_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{file_name}"
        print(f"Uploaded {file_name} to S3 bucket: {S3_BUCKET}")
        return s3_url
    except Exception as e:
        print(f"Error uploading {file_name} to S3: {e}")


def extract_audio(video_path):
    """
    Extracts audio from a given video file and saves it as an mp3 file.

    :param video_path: Path to the video file.
    :return: Path to the extracted audio file.
    """
    with VideoFileClip(video_path) as video:
        audio_path = f"{video_path}.mp3"
        video.audio.write_audiofile(audio_path)
    return audio_path

def transcribe_with_timestamps(audio_path):
    """
    Transcribes the given audio file using the Whisper model, including timestamps.

    :param audio_path: Path to the audio file.
    :return: A list of transcribed segments with timestamps.
    """
    result = MODEL.transcribe(audio_path, verbose=True, language='hi')

    return [f"{seg['start']} - {seg['end']}: {seg['text']}" for seg in result["segments"]]

def format_transcript(transcript_segments):
    """
    Formats transcript segments into a single string.

    :param transcript_segments: List of transcript segments.
    :return: Formatted transcript.
    """
    return "\n".join(transcript_segments).replace('\\n', ' ').strip()

def analyze_transcript(transcript, api_key):
    endpoint = "https://api.openai.com/v1/chat/completions"
    prompt = f"""
    You are a large language model trained to analyze lecture transcripts and identify key topics and give timestamps and timestamps only.

    Given the transcript below, focus exclusively on the professor's speech and identify 10 key topics discussed.

    Disregard any group discussions, audience questions, or interactions not directly related to the lecture's main content.
    For each topic:
    
    Title: Craft a clear and succinct title that encapsulates the content.

    Description: Summarize the key points addressed by the professor in 1-2 sentences. Highlight any intriguing details, unique viewpoints, or stimulating questions posed.
    Videos should be ticktock like fast-paced and smoothly edited. This is at most important level. It needs to go boom, boom, boom 

    Timestamps: Select and arrange clips from the transcript that focus on the discussed topic. Aim for 1 minute of total content, using multiple clips. Edit these clips by cutting, adding, or rearranging segments to maximize engagement and coherence. Ensure each edited segment is clear and focuses solely on the professor's delivery.

    Constraints:
        RESPOND IN JSON AND JSON ONLY MARKDOWN IS BAD
        The end result video should represent between 60 seconds of content.
        Avoid using clips shorter than 10 seconds in total.
        Output Format: Present the curated content in a structured JSON format, detailing the timestamps and summaries of each selected clip.

    JSON:
    {{
        "url": "youtube_url",
        "title": "",
        "description": "",
        "ts": [
            {{
                "seq": "",
                "ts_start": "",
                "ts_end": "",
                "short description": "",
                "mcqs": [
                    {{
                        "q": "question1",
                        "choices": ["", "", "", ""],
                        "ans": "index"
                    }},
                    {{
                        "q": "question2",
                        "choices": ["", "", "", ""],
                        "ans": "index"
                    }},
                    {{
                        "q": "question3",
                        "choices": ["", "", "", ""],
                        "ans": "index"
                    }}
                ]
            }},
            {{
                "seq": "",
                "ts_start": "",
                "ts_end": "",
                "short description": "",
                "mcqs": [
                    {{
                        "q": "question1",
                        "choices": ["", "", "", ""],
                        "ans": "index"
                    }},
                    {{
                        "q": "question2",
                        "choices": ["", "", "", ""],
                        "ans": "index"
                    }},
                    {{
                        "q": "question3",
                        "choices": ["", "", "", ""],
                        "ans": "index"
                    }}
                ]
            }},
            {{
                "seq": "",
                "ts_start": "",
                "ts_end": "",
                "short description": "",
                "mcqs": [
                    {{
                        "q": "question1",
                        "choices": ["", "", "", ""],
                        "ans": "index"
                    }},
                    {{
                        "q": "question2",
                        "choices": ["", "", "", ""],
                        "ans": "index"
                    }},
                    {{
                        "q": "question3",
                        "choices": ["", "", "", ""],
                        "ans": "index"
                    }}
                ]
            }}
        ]
    }}
    Use code with caution.
    Analyze the following transcript:

    {transcript}
    """

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    data = {
        "model": "gpt-4o",  # Specified model version
        "messages": [
            {"role": "system", "content": "You are a video editing software designed to return timestamps in JSON format"},
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(endpoint, headers=headers, json=data)

    if response.status_code == 200:
        try:
            return response.json()
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            return {"error": "Failed to parse JSON response"}
    else:
        print(f"Request failed with status code: {response.status_code}")
        return {"error": response.text}

def extract_json_from_response(response):
    # Extracting JSON from the string wrapped in code block (```)
    content = response['choices'][0]['message']['content']
    json_str = content.split('```json\n')[1].split('\n```')[0]
    return json.loads(json_str)

def create_video_segments_from_data(data, source_video_path, output_dir):
    video = VideoFileClip(source_video_path)

    # Process each timestamp segment in the JSON data
    for segment in data['ts']:
        ts_start = float(segment['ts_start'])
        ts_end = float(segment['ts_end'])
        description = segment['short description'].replace(' ', '_')
        
        # Create video clip for each segment
        clip = video.subclip(ts_start, ts_end)
        output_filename = f"{segment['seq']}_{description}.mp4"
        clip.write_videofile(f"{output_dir}/{output_filename}", codec="libx264", audio_codec="aac")
        print(f"Created clip {output_filename} at {f"{output_dir}/{output_filename}"}: {ts_start} to {ts_end}")

        s3_url = upload_to_s3(f"{output_dir}/{output_filename}")
        segment['s3_video_url'] = s3_url

def timestamp_to_seconds(timestamp):
    """
    Converts a timestamp string to seconds. Handles HH:MM:SS, MM:SS, and even just SS formats.
    """
    parts = timestamp.split(':')
    parts = [int(part) for part in parts]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    elif len(parts) == 2:
        return parts[0] * 60 + parts[1]
    elif len(parts) == 1:
        return parts[0]
    else:
        raise ValueError("Timestamp format is incorrect, should be HH:MM:SS, MM:SS, or SS")

def extract_text_from_video(video_path, frame_interval=30):
    """
    Extracts text from video frames using Tesseract OCR and saves unique text.

    :param video_path: Path to the video file.
    :param output_dir: Directory to save extracted text.
    :param frame_interval: Interval to capture frames for OCR (in seconds).
    :return: List of unique text found in the video.
    """
    print(f"attempting to extract text from {video_path}")

    unique_texts = set()
    video = VideoFileClip(video_path)
    duration = int(video.duration)

    print(f"Duration of video: {duration} seconds. which is type: {type(duration)}")
    print(f"Frame interval: {frame_interval} seconds which is type: {type(frame_interval)}")

    for time in range(0, duration, frame_interval):
        frame = video.get_frame(time)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        text = pytesseract.image_to_string(gray)
        if text.strip() and text not in unique_texts:
            unique_texts.add(text.strip())

    with open(f"{video_path}{OCR_TEXT_SUFFIX}", 'w') as file:
        file.writelines(list(unique_texts))

    return list(unique_texts)

def download_ydl(video_url, output_path):
    print(f"Downloading video from {video_url} to {output_path}")
    # Define download options
    ydl_opts = {
        'verbose': True,
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',  # Download best video and audio and merge them into an MP4 file
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s')  # Define output template
    }

    # URL of the video to download
    #video_url= 'https://www.youtube.com/watch?v=77ZF50ve6rs&t=44s&ab_channel=LecturesbyWalterLewin.Theywillmakeyou%E2%99%A5Physics.'
    # Download the video
    with YoutubeDL(ydl_opts) as ydl:
        print(f"attempting to extract video info from {video_url}")

        videoinfo = ydl.extract_info(video_url, download=False)
        video_filepath = ydl.prepare_filename(videoinfo)
        if os.path.exists(video_filepath):
            print(f"Video already exists at {video_filepath}. Not Downloading")
            return ydl.prepare_filename(videoinfo)
        
        print(f"downloading {videoinfo.get('title')} at {video_filepath}")
        result = ydl.extract_info(video_url, download=True)
        print(f"Processing: {ydl.prepare_filename(result)}")
        scheduler.add_job(func=process_file, args=[video_filepath], trigger='date', id='file_process_job')
    return ydl.prepare_filename(result)

def process_video(video_path):
# Rename or move the downloaded file using os module if needed
    audio_path = extract_audio(video_path)
    transcript_segments = transcribe_with_timestamps(audio_path)
    with open(f"{video_path}{TRANSCRIPT_SUFFIX}", 'w') as file:
        file.writelines(transcript_segments)
    extract_text_from_video(video_path)
    analysis_json = analyze_transcript(transcript_segments, api_key)
    add_to_chromadb(str(transcript_segments)+ str(analysis_json))

    data = extract_json_from_response(analysis_json)
    print(f"DATA: {data}")

    create_video_segments_from_data(data, video_path, app.config['UPLOAD_FOLDER'])
    print(f"DATA WITH S3_URL: {data}")
    videofile = video_path.split('/')[-1]
    details_json = f"{app.config['UPLOAD_FOLDER']}/{videofile}{DETAILS_SUFFIX}"  
    with open(details_json, 'w') as file:
            json.dump(data, file, indent=4) 

def is_valid_youtube_url(url):
    youtube_regex = re.compile(
        r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/.+$'
    )
    return youtube_regex.match(url)

def process_file(file_path):
    # Your file processing logic here
    print(f'Processing file: {file_path}')
    process_video(file_path)
    # Simulate a long processing task
    time.sleep(10)
    print('File processed!')

def allowed_video_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

def add_to_chromadb(text, persist_directory='chroma'):
    # Initialize embeddings model
    embeddings_model = OpenAIEmbeddings(openai_api_key=api_key)

    # Initialize SemanticChunker with OpenAI embeddings
    text_splitter = SemanticChunker(embeddings_model)

    # Create a document using text splitter
    doc = text_splitter.create_documents([text])[0]

    # Initialize or load ChromaDB from persist_directory
    if os.path.exists(persist_directory):
        db = Chroma(embedding_function=embeddings_model, persist_directory=persist_directory)
    else:
        db = Chroma.from_documents([doc], embeddings_model, persist_directory=persist_directory)

    # Append the document to ChromaDB
    db.aadd_documents([doc])
    # Save the updated database
    db.persist()
    
    print(f"Text appended to ChromaDB in {persist_directory}")

def query_chatbot(query_text):
    try:
        # Query the Chroma database
        results = db.similarity_search_with_score(query_text, k=7)
        context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
        
        # Create and format the prompt
        prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=context_text, question=query_text)
        
        # Generate a response using the OpenAI Chat model
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a virtual TA."},
                {"role": "user", "content": prompt}
            ],
            model="gpt-3.5-turbo"
        )
        
        # Extract and format the response
        if response and response.choices:
            choice = response.choices[0].message.content
            return choice
        
        raise Exception("Failed to generate a response")
    
    except Exception as e:
        print(f"Error: {e}")
        return str(e)

@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({'message': 'Hello, World!'})

@app.route('/upload', methods=['POST'])
def upload_file():
    print("Request received: {request}")
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_video_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        if not os.path.exists(file_path):
            print(f"attemptig to save {file.filename} to {file_path}")
            try:
                file.save(file_path)
                scheduler.add_job(func=process_file, args=[file_path], trigger='date', id='file_process_job')
                file_name = file_path.split('/')[-1]
                return jsonify({'filename': f"{file_name}"}), 200
            except Exception as e:
                return jsonify({'error': str(e)}), 502
        else:
            print(f"We have already processed this file - {filename}. Skipping processing and returning the details.")
            return jsonify({'filename': f"{filename}"}), 200
    else:
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/video_url', methods=['POST'])
def input_video():
    try:
        data = request.get_json()
        if 'url' in data:
            url = data['url']
            if is_valid_youtube_url(url):
                try:
                    video_filepath = download_ydl(url, output_path=app.config['UPLOAD_FOLDER'])
                    file_name = video_filepath.split('/')[-1]
                    print(f"We have already processed this file - {video_filepath}.")
                    return jsonify({'filename':file_name}), 200
                except Exception as e:
                    return jsonify({'error': str(e)}), 400
            else:
                return jsonify({'error': 'Invalid YouTube URL'}), 400
        else:
            return jsonify({'error': 'URL not provided'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/transcribe_audio', methods=['POST'])
def transcribe_audio():
    print("Request received: {request}")
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_audio_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # Transcribe the audio file
            result = MODEL.transcribe(file_path)
            transcription = result['text']
            
            # Post transcription to the /chat endpoint
            chat_endpoint = "http://localhost:5000/chat"  # Update with your actual /chat endpoint URL
            payload = {'chat_msg': transcription}
            response = requests.post(chat_endpoint, data=payload)
            
            if response.status_code == 200:
                chat_response = response.json()
                print("Transcription response : {chat_response}")
                return jsonify({'message': 'Transcription and chat successful', 'transcription': transcription, 'chat_response': chat_response}), 200
            else:
                return jsonify({'error': 'Failed to post transcription to chat', 'details': response.text}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/details', methods=['POST'])
def get_details():
    data = request.get_json()
    filename = data.get('filename') if data else None
    if filename:
        print(f"Received request for details of filename: {filename}")

    details_json = f"{app.config['UPLOAD_FOLDER']}/{filename}_details.json"
    print (f"Details JSON path: {details_json}")
    if os.path.exists(details_json):
        with open(details_json, 'r') as file:
            details = json.load(file)
            return jsonify(details)
    else:
        return jsonify({'error': 'Details not found'}), 404
    
@app.route('/chat', methods=['POST'])
def chat():
    chat_msg = request.form.get('chat_msg')
    if chat_msg:
        print(f"Received chat message: {chat_msg}")
        resp = query_chatbot(chat_msg)
        return jsonify({"status": "success", "response": f"{resp}"})
    else:
        return jsonify({"status": "error", "message": "No chat message received"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
