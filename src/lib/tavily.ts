/**
 * Tavily API client for web search
 */

const TAVILY_BASE_URL = 'https://api.tavily.com';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilySearchResponse {
  results: TavilySearchResult[];
}

export interface WebSearchResult {
  name: string;
  url: string;
  snippet: string;
}

/**
 * Search the web using Tavily API
 */
export async function webSearch(query: string, maxResults: number = 10): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY environment variable is not set');
  }

  const response = await fetch(`${TAVILY_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: 'basic',
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily search failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as TavilySearchResponse;
  
  return result.results.map((item) => ({
    name: item.title,
    url: item.url,
    snippet: item.content,
  }));
}