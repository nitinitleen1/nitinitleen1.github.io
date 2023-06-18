---
title: How to upload a video using python script
date: 2023-06-18
description: Uploading a youtube video using a python script.
categories:
  - Automation and Useful Scripts
tags:
  - youtube
  - python
  - youtube-upload
  - google-oauth
  - youtube-v3-api
image: "/assets/yt.png"
---

# How to Upload a Video to YouTube using Python

Have you ever wanted to upload a video to YouTube programmatically using Python? In this tutorial, we'll walk through the steps to achieve just that. We'll be using the YouTube Data API and Python to authenticate with YouTube and upload a video.

## Prerequisites

Before getting started, make sure you have the following prerequisites:

- Python installed on your system
- `google-auth`, `google-auth-oauthlib`, `google-auth-httplib2`, and `google-api-python-client` packages installed

## Step 1: Create a Google Cloud Project and Enable the YouTube Data API

1. Go to the [Google Cloud Console](https://console.cloud.google.com) and create a new project.
2. Enable the YouTube Data API for your project. Search for "YouTube Data API v3" in the API library and enable it.
3. Create credentials for your project by following these steps:
   - Go to the "Credentials" tab in the Cloud Console.
   - Click on "Create Credentials" and select "OAuth client ID".
   - Choose "Desktop App" as the application type and give it a name.
   - Save the generated credentials file (`credentials.json`) to your working directory.

## Step 2: Authenticate and Upload the Video

Create a Python script (e.g., `upload_to_youtube.py`) and import the necessary modules:

```python
import os
import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
```

Authenticate with the YouTube Data API using your credentials:

```python
credentials, project = google.auth.default()
youtube = build('youtube', 'v3', credentials=credentials)
```

Define a function to upload the video:

```python
def upload_video(video_path, title, description, tags):
    request_body = {
        'snippet': {
            'title': title,
            'description': description,
            'tags': tags,
            'categoryId': '22'  # Set the category ID for the video (e.g., 22 for Entertainment)
        },
        'status': {
            'privacyStatus': 'public'  # Set the privacy status of the video (e.g., public, private)
        }
    }

    media = MediaFileUpload(video_path)

    response = youtube.videos().insert(
        part='snippet,status',
        body=request_body,
        media_body=media
    ).execute()

    return response
```

Call the upload_video function with the path to your video file, along with the title, description, and tags for the video:

```python
video_path = 'path/to/your/video.mp4'
title = 'My YouTube Video'
description = 'This is my first YouTube video!'
tags = ['python', 'tutorial']

response = upload_video(video_path, title, description, tags)
video_id = response['id']
print(f"Video uploaded! Video ID: {video_id}")
```

Run the Script:

Save the script and run it using the following command:

```
python upload_to_youtube.py
```

The script will authenticate with the YouTube Data API using your credentials, upload the video to YouTube, and print the video ID once the upload is complete.

That's it! You've successfully uploaded a video to YouTube using Python. You can modify the script to include additional features or handle error cases as needed.

Please ensure that you have the necessary permissions and rights to upload videos to YouTube. Additionally, refer to the YouTube Data API documentation for more details on available parameters and customization options.

If you have any further questions or need assistance, feel free to ask!

## References:

1. [Google Cloud Console](console.cloud.google.com)
2. [YouTube Data API](https://developers.google.com/youtube/v3)
3. [Python](https://www.python.org/)
4. [google-auth package](https://pypi.org/project/google-auth/)
5. [google-api-python-client package](https://pypi.org/project/google-api-python-client/)
6. [Markdown syntax](https://www.markdownguide.org/basic-syntax/)
