import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const API_KEY = Deno.env.get("YOUTUBE_API_KEY");
const API_URL = "https://www.googleapis.com/youtube/v3/videos";

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const { videoId } = await req.json();

        if (!API_KEY) {
            return new Response(JSON.stringify({ error: "YouTube API key is not configured." }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        if (!videoId) {
            return new Response(JSON.stringify({ error: "videoId is required." }), { 
                status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const params = new URLSearchParams({
            part: 'snippet',
            id: videoId,
            key: API_KEY
        });

        const fullUrl = `${API_URL}?${params}`;
        console.log("Making YouTube API call to:", fullUrl.replace(API_KEY, "***API_KEY***"));

        // Add the referrer header to match your API key configuration
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Referer': 'https://eqoflow.app/',
                'User-Agent': 'EqoFlow/1.0'
            }
        });
        
        const data = await response.json();

        console.log("YouTube API response status:", response.status);
        console.log("YouTube API response data:", JSON.stringify(data, null, 2));

        if (!response.ok) {
            return new Response(JSON.stringify({ 
                error: "YouTube API error", 
                details: data,
                status: response.status 
            }), { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        if (data.items && data.items.length > 0) {
            const video = data.items[0];
            const snippet = video.snippet;
            
            // Find the best available thumbnail
            const thumbnail = snippet.thumbnails.maxres || 
                            snippet.thumbnails.standard || 
                            snippet.thumbnails.high || 
                            snippet.thumbnails.medium || 
                            snippet.thumbnails.default;

            const videoDetails = {
                title: snippet.title,
                thumbnail_url: thumbnail.url,
            };

            console.log("Successfully fetched video details:", videoDetails);

            return new Response(JSON.stringify(videoDetails), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*' 
                },
            });
        } else {
            console.log("No video items found in response");
            return new Response(JSON.stringify({ 
                error: "Video not found or not accessible", 
                videoId: videoId,
                responseItemsCount: data.items ? data.items.length : 0
            }), { 
                status: 404, 
                headers: { "Content-Type": "application/json" } 
            });
        }

    } catch (error) {
        console.error("Function error:", error);
        return new Response(JSON.stringify({ 
            error: "Internal server error", 
            details: error.message 
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
    }
});