import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || 'trending';
    const limit = url.searchParams.get('limit') || '25';
    const offset = url.searchParams.get('offset') || '0';

    const apiKey = Deno.env.get('GIPHY_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Giphy API key not configured' }, { status: 500 });
    }

    // Use search or trending endpoint
    const endpoint = query === 'trending' 
      ? `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&offset=${offset}`
      : `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch from Giphy' }, { status: response.status });
    }

    return Response.json({
      gifs: data.data.map(gif => ({
        id: gif.id,
        title: gif.title,
        url: gif.images.original.url,
        preview: gif.images.fixed_height.url,
        width: gif.images.original.width,
        height: gif.images.original.height
      })),
      pagination: data.pagination
    });

  } catch (error) {
    console.error('Giphy search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});