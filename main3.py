import os
import json
import requests
import whisper
import cv2
import pytesseract
from yt_dlp import YoutubeDL
from moviepy.editor import VideoFileClip, concatenate_videoclips
import pytesseract
api_key = os.getenv('OPENAI_API_KEY')

# Load Whisper model globally to avoid redundancy
MODEL = whisper.load_model("base")

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
        "model": "gpt-4-0125-preview",  # Specified model version
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

def extract_text_from_video(video_path,  frame_interval=1):
    """
    Extracts text from video frames using Tesseract OCR and saves unique text.

    :param video_path: Path to the video file.
    :param output_dir: Directory to save extracted text.
    :param frame_interval: Interval to capture frames for OCR (in seconds).
    :return: List of unique text found in the video.
    """
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

def get_video_info(video_url):
    """
    Retrieves video information using yt_dlp.

    :param video_url: URL of the YouTube video.
    :return: A dictionary containing the video's title and file path.
    """
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',  # Download best video and audio and merge them into an MP4 file
        'outtmpl': '%(title)s.%(ext)s',  # Define output template
        'quiet': True
    }
    with YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(video_url, download=True)
        video_title = info_dict.get('title', None)
        video_filename = ydl.prepare_filename(info_dict)
        return video_filename





def extract_json_from_response(response):
    # Extracting JSON from the string wrapped in code block (```)
    content = response['choices'][0]['message']['content']
    json_str = content.split('```json\n')[1].split('\n```')[0]
    return json.loads(json_str)

def create_video_segments_from_data(data, source_video_path):
    video = VideoFileClip(source_video_path)
    
    # Process each timestamp segment in the JSON data
    for segment in data['ts']:
        ts_start = float(segment['ts_start'])
        ts_end = float(segment['ts_end'])
        description = segment['short description'].replace(' ', '_')
        
        # Create video clip for each segment
        clip = video.subclip(ts_start, ts_end)
        output_filename = f"{segment['seq']}_{description}.mp4"
        clip.write_videofile(output_filename, codec="libx264", audio_codec="aac")
        print(f"Created clip {output_filename}: {ts_start} to {ts_end}")




link = input("Paste Link here ")
    
original_filename =  get_video_info(link)
audio_path = extract_audio(original_filename)
transcript_segments = transcribe_with_timestamps(audio_path)
analyze_transcript(transcript_segments, api_key)
create_video_segments_from_data(extract_json_from_response(analyze_transcript,original_filename))




