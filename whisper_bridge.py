#!/usr/bin/env python3
"""
Whisper Bridge Script for OpenScribe
Handles local speech-to-text processing using OpenAI's Whisper model
"""

import sys
import json
import tempfile
import os
import argparse
from pathlib import Path
import whisper

def load_model(model_name="base"):
    """Load Whisper model with error handling"""
    try:
        print(f"Loading Whisper model: {model_name}", file=sys.stderr)
        model = whisper.load_model(model_name)
        print(f"Model {model_name} loaded successfully", file=sys.stderr)
        return model
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        return None

def download_model(model_name="base"):
    """Download Whisper model and return download info"""
    try:
        print(f"Downloading Whisper model: {model_name}", file=sys.stderr)
        
        # This will download the model if it doesn't exist
        model = whisper.load_model(model_name)
        
        # Get model file info
        model_path = whisper._MODELS[model_name]
        cache_dir = os.path.expanduser("~/.cache/whisper")
        model_file = os.path.join(cache_dir, os.path.basename(model_path))
        
        file_size = 0
        if os.path.exists(model_file):
            file_size = os.path.getsize(model_file)
        
        return {
            "model": model_name,
            "downloaded": True,
            "path": model_file,
            "size_bytes": file_size,
            "size_mb": round(file_size / (1024 * 1024), 1),
            "success": True
        }
        
    except Exception as e:
        print(f"Error downloading model: {e}", file=sys.stderr)
        return {
            "model": model_name,
            "downloaded": False,
            "error": str(e),
            "success": False
        }

def check_model_status(model_name="base"):
    """Check if a model is already downloaded"""
    try:
        cache_dir = os.path.expanduser("~/.cache/whisper")
        model_url = whisper._MODELS[model_name]
        model_file = os.path.join(cache_dir, os.path.basename(model_url))
        
        if os.path.exists(model_file):
            file_size = os.path.getsize(model_file)
            return {
                "model": model_name,
                "downloaded": True,
                "path": model_file,
                "size_bytes": file_size,
                "size_mb": round(file_size / (1024 * 1024), 1),
                "success": True
            }
        else:
            return {
                "model": model_name,
                "downloaded": False,
                "success": True
            }
    except Exception as e:
        return {
            "model": model_name,
            "error": str(e),
            "success": False
        }

def list_models():
    """List all available models and their download status"""
    models = ["tiny", "base", "small", "medium", "large", "turbo"]
    model_info = []
    
    for model in models:
        status = check_model_status(model)
        model_info.append(status)
    
    return {
        "models": model_info,
        "cache_dir": os.path.expanduser("~/.cache/whisper"),
        "success": True
    }

def transcribe_audio(audio_path, model_name="base", language=None):
    """Transcribe audio file using Whisper"""
    try:
        # Load model
        model = load_model(model_name)
        if model is None:
            return {"error": "Failed to load Whisper model"}
        
        # Transcribe
        print(f"Transcribing audio file: {audio_path}", file=sys.stderr)
        
        # Set transcription options
        options = {}
        if language:
            options["language"] = language
            
        result = model.transcribe(audio_path, **options)
        
        # Return results
        return {
            "text": result["text"].strip(),
            "language": result.get("language", "unknown"),
            "segments": result.get("segments", []),
            "success": True
        }
        
    except Exception as e:
        print(f"Transcription error: {e}", file=sys.stderr)
        return {
            "error": str(e),
            "success": False
        }

def main():
    parser = argparse.ArgumentParser(description="Whisper Bridge for OpenScribe")
    parser.add_argument("--mode", default="transcribe", 
                       choices=["transcribe", "download", "check", "list"],
                       help="Operation mode (default: transcribe)")
    parser.add_argument("audio_file", nargs="?", help="Path to audio file to transcribe")
    parser.add_argument("--model", default="base", 
                       choices=["tiny", "base", "small", "medium", "large", "turbo"],
                       help="Whisper model to use (default: base)")
    parser.add_argument("--language", help="Language code (optional)")
    parser.add_argument("--output-format", default="json", 
                       choices=["json", "text"],
                       help="Output format (default: json)")
    
    args = parser.parse_args()
    
    # Handle different modes
    if args.mode == "download":
        result = download_model(args.model)
        print(json.dumps(result))
        return
    elif args.mode == "check":
        result = check_model_status(args.model)
        print(json.dumps(result))
        return
    elif args.mode == "list":
        result = list_models()
        print(json.dumps(result))
        return
    elif args.mode == "transcribe":
        # Check if audio file exists
        if not args.audio_file:
            error_result = {"error": "Audio file required for transcription mode", "success": False}
            print(json.dumps(error_result))
            sys.exit(1)
            
        if not os.path.exists(args.audio_file):
            error_result = {"error": f"Audio file not found: {args.audio_file}", "success": False}
            print(json.dumps(error_result))
            sys.exit(1)
        
        # Transcribe
        result = transcribe_audio(args.audio_file, args.model, args.language)
        
        # Output results
        if args.output_format == "json":
            print(json.dumps(result))
        else:
            if result.get("success"):
                print(result.get("text", ""))
            else:
                print(f"Error: {result.get('error', 'Unknown error')}", file=sys.stderr)
                sys.exit(1)

if __name__ == "__main__":
    main() 