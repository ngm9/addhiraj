import os
import time
import json
import requests
import whisper
import cv2
import pytesseract
import re
from yt_dlp import YoutubeDL
from moviepy.editor import VideoFileClip, concatenate_videoclips
from flask import Flask, request, jsonify, redirect, url_for, render_template
from flask_apscheduler import APScheduler
from pytube import YouTube
from flask_cors import CORS
from werkzeug.utils import secure_filename


app = Flask(__name__)
CORS(app)
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

api_key = os.getenv('OPENAI_API_KEY')
# Load Whisper model globally to avoid redundancy
MODEL = whisper.load_model("base")
app.config['UPLOAD_FOLDER'] = "/home/ubuntu/people+ai/data"
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}

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

def create_video_clips_from_gpt_output(gpt_output, source_video_path, output_dir):
    # Ensure the GPT output has the expected data structure
    if 'choices' not in gpt_output or not gpt_output['choices']:
        print("Error: The GPT response does not contain expected data.")
        return

    # Attempt to extract and parse the JSON content from the first choice
    try:
        topics_content = gpt_output['choices'][0]['message']['content']
        topics_data = json.loads(topics_content)
        if 'topics' not in topics_data:
            print("Error: No 'topics' key found in the JSON data.")
            return
        topics_data = topics_data['topics']
    except (IndexError, KeyError, json.JSONDecodeError) as e:
        print(f"Error processing GPT output: {e}")
        return

    # Ensure the output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Load the source video
    source_video = VideoFileClip(source_video_path)
    video_duration = source_video.duration

    # Process each topic to create clips
    for i, topic in enumerate(topics_data, start=1):
        try:
            topic_name = topic['topic']
            description = topic['description']
            timestamps = topic['timestamps']
        except KeyError as e:
            print(f"Missing expected key {e} in topic data. Skipping this topic...")
            continue

        subclips = []
        for timestamp_range in timestamps:
            try:
                start_str, end_str = timestamp_range['start'], timestamp_range['end']
                start = timestamp_to_seconds(start_str)
                end = timestamp_to_seconds(end_str)

                # Check for video duration bounds
                if start >= video_duration:
                    print(f"Start timestamp for clip {i} exceeds video duration. Skipping...")
                    continue
                if end > video_duration:
                    print(f"End timestamp for clip {i} exceeds video duration. Adjusting to video end.")
                    end = video_duration

                # Create and store subclip
                subclip = source_video.subclip(start, end)
                subclips.append(subclip)
            except ValueError as e:
                print(f"Error with timestamp conversion: {e}. Skipping this timestamp...")
                continue

        if not subclips:
            print(f"No valid clips for topic {i}. Skipping...")
            continue

        # Concatenate all valid subclips for the topic
        final_clip = concatenate_videoclips(subclips)
        output_path = os.path.join(output_dir, f"topic_{i}_{topic_name}.mp4")
        final_clip.write_videofile(output_path, codec="libx264", audio_codec="aac")
        print(f"Created clip for topic {i}: {output_path}")

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

def extract_text_from_video(video_path, output_dir, frame_interval=30):
    """
    Extracts text from video frames using Tesseract OCR and saves unique text.

    :param video_path: Path to the video file.
    :param output_dir: Directory to save extracted text.
    :param frame_interval: Interval to capture frames for OCR (in seconds).
    :return: List of unique text found in the video.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    unique_texts = set()
    video = VideoFileClip(video_path)
    duration = int(video.duration)

    for time in range(0, duration, frame_interval):
        frame = video.get_frame(time)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        text = pytesseract.image_to_string(gray)
        if text.strip() and text not in unique_texts:
            unique_texts.add(text.strip())

    return list(unique_texts)

def download_ydl(video_url, output_path):
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
        result = ydl.extract_info(video_url, download=True)
        print(f"downloading {result.get('title')} at {ydl.prepare_filename(result)}")
    return ydl.prepare_filename(result)

def process_video(video_path):
# Rename or move the downloaded file using os module if needed
    #original_filename = '/Users/namanbajpai/peopleplus/When a physics teacher knows his stuff !!.mp4'
    audio_path = extract_audio(video_path)
    transcript_segments = transcribe_with_timestamps(audio_path)
    analysis_json = analyze_transcript(transcript_segments, api_key)
    create_video_clips_from_gpt_output(extract_json_from_response(analysis_json), video_path, app.config['UPLOAD_FOLDER'])


    # Process the extracted text
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

@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({'message': 'Hello, World!'})


@app.route('/upload', methods=['POST'])
def upload_file():
    print("Request received: {request}")
    if 'file' not in request.files:
        return 'No file part'
    file = request.files['file']
    if file.filename == '':
        return 'No selected file'
    if file and allowed_video_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        print(f"attemptig to save {file.filename} to {file_path}")
        try:
            file.save(file_path)
            scheduler.add_job(func=process_file, args=[file_path], trigger='date', id='file_process_job')
            return f'File successfully uploaded to {file_path}'
        except Exception as e:
            return f'An error occurred while saving the file: {e}'
 

    else:
        return 'File type not allowed'

@app.route('/video_url', methods=['POST'])
def input_video():
    try:
        data = request.get_json()
        if 'url' in data:
            url = data['url']
            if is_valid_youtube_url(url):
                try:
                    yt = YouTube(url)
                    video_filepath = download_ydl(url, output_path=app.config['UPLOAD_FOLDER'])
                    scheduler.add_job(func=process_file, args=[video_filepath], trigger='date', id='file_process_job')
                    return jsonify({'message': 'Valid YouTube URL', 'title': yt.title}), 200
                except Exception as e:
                    return jsonify({'error': str(e)}), 400
            else:
                return jsonify({'error': 'Invalid YouTube URL'}), 400
        else:
            return jsonify({'error': 'URL not provided'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

