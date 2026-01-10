"""
Supabase Storage Utility
Handles file uploads to Supabase Storage and generates public URLs
"""
from app.database.connection import supabase
from app.config import settings
import uuid
from typing import Optional

def ensure_bucket_exists(bucket_name: str = "photos", is_public: bool = True) -> bool:
    """
    Check if a storage bucket exists
    Note: Bucket must be created manually in Supabase Dashboard with public access
    
    Args:
        bucket_name: Name of the bucket
        is_public: Whether the bucket should be public (default: True)
    
    Returns:
        True if bucket exists, False otherwise
    """
    try:
        # List all buckets to check if our bucket exists
        # The response might be a list of dicts or a StorageBucketResponse object
        buckets_response = supabase.storage.list_buckets()
        
        # Handle different response formats
        buckets_list = []
        if isinstance(buckets_response, list):
            buckets_list = buckets_response
        elif hasattr(buckets_response, 'data'):
            buckets_list = buckets_response.data or []
        elif isinstance(buckets_response, dict) and 'data' in buckets_response:
            buckets_list = buckets_response['data'] or []
        
        # Check if bucket exists (buckets might be dicts with 'name' key or objects with .name attribute)
        bucket_exists = False
        for bucket in buckets_list:
            bucket_name_value = bucket.get('name') if isinstance(bucket, dict) else getattr(bucket, 'name', None)
            if bucket_name_value == bucket_name:
                bucket_exists = True
                break
        
        if not bucket_exists:
            print(f"[WARNING] Storage bucket '{bucket_name}' does not exist.")
            print(f"   Please create it manually in Supabase Dashboard:")
            print(f"   1. Go to Storage > New Bucket")
            print(f"   2. Name: {bucket_name}")
            print(f"   3. Public: {is_public}")
            print(f"   4. Create bucket")
            print(f"   Upload will still be attempted, but may fail if bucket doesn't exist.")
            return False
        
        print(f"[OK] Storage bucket '{bucket_name}' exists")
        return True
        
    except Exception as e:
        print(f"[WARNING] Failed to check bucket existence: {e}")
        print(f"   Upload will still be attempted. If it fails, create the bucket manually.")
        return False  # Return False to indicate we're not sure, but allow upload attempt

def upload_file_to_storage(
    file_content: bytes,
    filename: str,
    bucket_name: str = "photos",
    folder: str = "photos"
) -> Optional[str]:
    """
    Upload a file to Supabase Storage and return the public URL
    
    Args:
        file_content: File content as bytes
        filename: Original filename (will be made unique)
        bucket_name: Name of the Supabase Storage bucket (default: "photos")
        folder: Folder path within the bucket (default: "photos")
    
    Returns:
        Public URL string if successful, None if failed
    """
    try:
        # Check if bucket exists (warn if not, but continue to attempt upload)
        bucket_exists = ensure_bucket_exists(bucket_name, is_public=True)
        if not bucket_exists:
            print(f"[WARNING] Uploading to bucket '{bucket_name}' which may not exist. Upload may fail.")
        
        # Generate unique filename to avoid conflicts
        file_ext = filename.split('.')[-1] if '.' in filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        storage_path = f"{folder}/{unique_filename}"
        
        # Determine MIME type
        mime_type_map = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        }
        content_type = mime_type_map.get(file_ext.lower(), 'image/jpeg')
        
        # Upload to Supabase Storage
        # The supabase-py library's upload method: upload(path, file, file_options=None)
        # Returns a dict with "path" key on success, or raises an exception on error
        storage_bucket = supabase.storage.from_(bucket_name)
        
        try:
            # Try with file_options first (if supported)
            try:
                response = storage_bucket.upload(
                    path=storage_path,
                    file=file_content,
                    file_options={
                        "content-type": content_type,
                        "upsert": "false"
                    }
                )
            except (TypeError, AttributeError) as e:
                # If file_options not supported, try without it
                print(f"Upload with file_options failed ({e}), trying without options...")
                response = storage_bucket.upload(
                    path=storage_path,
                    file=file_content
                )
            
            # Check response - should be a dict with "path" key
            if isinstance(response, dict):
                if "error" in response:
                    raise Exception(f"Upload error: {response.get('error', 'Unknown error')}")
                if "path" not in response:
                    # Upload might have succeeded but response format is unexpected
                    print(f"Warning: Unexpected response format: {response}")
            elif response is None:
                raise Exception("Upload returned None - upload may have failed")
                
            print(f"Upload response: {response}")
            
        except Exception as upload_error:
            print(f"Upload error details: {upload_error}")
            raise
        
        # Construct public URL
        # Format: https://<project-id>.supabase.co/storage/v1/object/public/<bucket>/<path>
        # Extract project ID from SUPABASE_URL (e.g., https://akfskwfkmtbapzjetqpc.supabase.co)
        base_url = settings.SUPABASE_URL.rstrip('/')
        public_url = f"{base_url}/storage/v1/object/public/{bucket_name}/{storage_path}"
        
        print(f"[OK] File uploaded to Supabase Storage")
        print(f"  Storage path: {storage_path}")
        print(f"  Public URL: {public_url}")
        return public_url
        
    except Exception as e:
        print(f"[ERROR] Failed to upload file to Supabase Storage: {e}")
        import traceback
        print(traceback.format_exc())
        return None

def get_public_url(storage_path: str, bucket_name: str = "photos") -> str:
    """
    Generate a public URL for a file in Supabase Storage
    
    Args:
        storage_path: Path to the file in storage (e.g., "photos/abc123.jpg")
        bucket_name: Name of the Supabase Storage bucket (default: "photos")
    
    Returns:
        Public URL string
    """
    # Format: https://<project-id>.supabase.co/storage/v1/object/public/<bucket>/<path>
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{storage_path}"

def is_valid_image_url(url: Optional[str]) -> bool:
    """
    Check if a URL is a valid HTTPS image URL (not a local file path)
    
    Args:
        url: URL to validate
    
    Returns:
        True if valid HTTPS URL, False otherwise
    """
    if not url:
        return False
    
    # Reject local file paths
    if url.startswith("file://") or url.startswith("file:/"):
        return False
    
    # Reject Windows local paths (C:\, D:\, etc.)
    if ":/" in url and not url.startswith("http"):
        return False
    
    # Must be HTTPS URL
    if not url.startswith("https://"):
        return False
    
    # Should be a Supabase Storage URL or other valid image URL
    return True

