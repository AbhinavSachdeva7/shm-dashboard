import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.config import get_settings

settings = get_settings()


class ThingSpeakService:
    """Service for interacting with ThingSpeak API."""
    
    def __init__(self):
        self.base_url = settings.thingspeak_base_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def get_channel_info(
        self,
        channel_id: str,
        read_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get channel information from ThingSpeak.
        
        Returns channel metadata including field names.
        """
        try:
            url = f"{self.base_url}/channels/{channel_id}/feeds.json"
            params = {
                "api_key": read_key,
                "results": 0,  # Just get channel info, no data
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("channel", {})
        except httpx.HTTPError as e:
            print(f"Error fetching channel info: {e}")
            return None
    
    async def get_latest_feed(
        self,
        channel_id: str,
        read_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the latest feed entry from ThingSpeak.
        
        Returns the most recent sensor readings.
        """
        try:
            url = f"{self.base_url}/channels/{channel_id}/feeds/last.json"
            params = {
                "api_key": read_key,
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
        except httpx.HTTPError as e:
            print(f"Error fetching latest feed: {e}")
            return None
    
    async def get_feeds(
        self,
        channel_id: str,
        read_key: str,
        results: int = 100,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get multiple feed entries from ThingSpeak.
        
        Args:
            channel_id: ThingSpeak channel ID
            read_key: Channel read API key
            results: Number of results to fetch (max 8000)
            start: Start datetime for range query
            end: End datetime for range query
        
        Returns list of feed entries.
        """
        try:
            url = f"{self.base_url}/channels/{channel_id}/feeds.json"
            params = {
                "api_key": read_key,
                "results": min(results, 8000),
            }
            
            if start:
                params["start"] = start.strftime("%Y-%m-%d %H:%M:%S")
            if end:
                params["end"] = end.strftime("%Y-%m-%d %H:%M:%S")
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("feeds", [])
        except httpx.HTTPError as e:
            print(f"Error fetching feeds: {e}")
            return None
    
    async def test_connection(
        self,
        channel_id: str,
        read_key: str
    ) -> Dict[str, Any]:
        """
        Test connection to a ThingSpeak channel.
        
        Returns success status and channel info if successful.
        """
        channel_info = await self.get_channel_info(channel_id, read_key)
        
        if channel_info:
            # Count active fields
            field_count = 0
            for i in range(1, 9):
                if channel_info.get(f"field{i}"):
                    field_count += 1
            
            return {
                "success": True,
                "message": "Connection successful",
                "channel_name": channel_info.get("name", "Unknown"),
                "field_count": field_count,
            }
        else:
            return {
                "success": False,
                "message": "Failed to connect to ThingSpeak channel. Check channel ID and API key.",
                "channel_name": None,
                "field_count": None,
            }
    
    def parse_feed_entry(
        self,
        feed: Dict[str, Any],
        field_numbers: List[int]
    ) -> Dict[str, Any]:
        """
        Parse a feed entry and extract field values.
        
        Args:
            feed: Raw feed entry from ThingSpeak
            field_numbers: List of field numbers to extract
        
        Returns dict with field values and timestamp.
        """
        result = {
            "timestamp": feed.get("created_at"),
            "entry_id": feed.get("entry_id"),
            "values": {}
        }
        
        for field_num in field_numbers:
            field_key = f"field{field_num}"
            value = feed.get(field_key)
            if value is not None:
                try:
                    result["values"][field_num] = float(value)
                except (ValueError, TypeError):
                    result["values"][field_num] = None
            else:
                result["values"][field_num] = None
        
        return result


# Singleton instance
thingspeak_service = ThingSpeakService()

