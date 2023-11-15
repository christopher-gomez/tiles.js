export type SpotifyTrackResponse = {
  album: {
    album_type: string;
    artists: {
      external_urls: { [key: string]: string };
      href: string;
      id: string;
      name: string;
      type: string;
      uri: string;
    }[];
    available_markets: string[];
    external_urls: { [key: string]: string };
    href: string;
    id: string;
    images: {
      height: number;
      url: string;
      width: number;
    }[];
    name: string;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
    type: string;
    uri: string;
  };
  artists: {
    external_urls: { [key: string]: string };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: { [key: string]: string };
  external_urls: { [key: string]: string };
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: string;
  uri: string;
};

/**
 *
 * @param trackUri
 * @param accessToken
 * @returns {Promise<SpotifyTrackResponse>}
 */
export const getTrackInfo = async (trackUri, accessToken) => {
  // Extract the ID from the track URI
  const trackId = trackUri.split(":")[2];

  // Make the request to get the track details
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error fetching Spotify Track");
  }

  const data = await response.json();
  return data;
};

export type SpotifyAudioAnalysisBar = {
  start: number;
  duration: number;
  confidence: number;
};

export type SpotifyAudioAnalysisBeat = {
  start: number;
  duration: number;
  confidence: number;
};

export type SpotifyAudioAnalysisTatum = {
  start: number;
  duration: number;
  confidence: number;
};

export type SpotifyAudioAnalysisSegment = {
  start: number;
  duration: number;
  confidence: number;
  loudness_start: number;
  loudness_max_time: number;
  loudness_max: number;
  loudness_end: number;
  pitches: number[];
  timbre: number[];
};

export type SpotifyAudioAnalysisSection = {
  start: number;
  duration: number;
  confidence: number;
};

export type SpotifyAudioAnalysisTrack = {
  duration: number;
  sample_md5: string;
  offset_seconds: number;
  window_seconds: number;
  analysis_sample_rate: number;
  analysis_channels: number;
  end_of_fade_in: number;
  start_of_fade_out: number;
  loudness: number;
  tempo: number;
  tempo_confidence: number;
  time_signature: number;
  time_signature_confidence: number;
  key: number;
  key_confidence: number;
  mode: number;
  mode_confidence: number;
  codestring: string;
  code_version: number;
  echoprintstring: string;
  echoprint_version: number;
  synchstring: string;
  synch_version: number;
  rhythmstring: string;
  rhythm_version: number;
  uri: string;
};

export type SpotifyAudioAnalysisResponse = {
  bars: Array<SpotifyAudioAnalysisBar>;
  beats: Array<SpotifyAudioAnalysisBeat>;
  sections: Array<SpotifyAudioAnalysisSection>;
  segments: Array<SpotifyAudioAnalysisSegment>;
  tatums: Array<SpotifyAudioAnalysisTatum>;
  track: SpotifyAudioAnalysisTrack;
};

export const getTrackAudioAnalysis = async (
  trackUri,
  accessToken
): Promise<SpotifyAudioAnalysisResponse> => {
  if (!trackUri || !accessToken) return null;
  // Extract the ID from the track URI
  const trackId = trackUri.split(":")[2];

  // Make the request to get the track details
  const response = await fetch(
    `https://api.spotify.com/v1/audio-analysis/${trackId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error fetching Spotify Track Analysis");
  }

  const data = await response.json();
  data.track["uri"] = trackUri;

  return data;
};

export const findCurrentPropertyFromTime = (
  analysis: SpotifyAudioAnalysisResponse,
  prop: "bars" | "beats" | "sections" | "segments" | "tatums",
  currentTimeS: number
): {
  current:
    | SpotifyAudioAnalysisTatum
    | SpotifyAudioAnalysisBeat
    | SpotifyAudioAnalysisBar
    | SpotifyAudioAnalysisSegment
    | SpotifyAudioAnalysisSection;
  index: number;
  arr:
    | SpotifyAudioAnalysisTatum[]
    | SpotifyAudioAnalysisBeat[]
    | SpotifyAudioAnalysisBar[]
    | SpotifyAudioAnalysisSegment[]
    | SpotifyAudioAnalysisSection[];
} => {
  let propIndex = 0;
  const currentProp = analysis[prop].find((prop, index) => {
    const propEndTime = prop.start + prop.duration;
    propIndex = index;
    return prop.start <= currentTimeS && propEndTime > currentTimeS;
  });

  return {
    current: currentProp,
    index: propIndex,
    arr: analysis[prop],
  };
};

export const getTrackImageURL = async (trackUri, accessToken) => {
  const data = await getTrackInfo(trackUri, accessToken);
  if (data) {
    return data.album.images[0].url;
  } else {
    return "";
  }
};

export type SpotifyUserLibraryResponse = {
  href: string;
  items: Array<{ added_at: string; track: any }>;
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
};

export const getUserLibrary = async (
  accessToken,
  offset?: number
): Promise<SpotifyUserLibraryResponse> => {
  // Fetch the user's liked songs
  const res = await fetch(
    `https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset ?? 0}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok) {
    throw new Error("Error fetching library");
  }

  const data = await res.json();

  return data;
};

export type SpotifyUserPlaylistsResponse = {
  href: string;
  items: Array<{
    id: string;
    name: string;
    uri: string;
    tracks: { href: string; total: number } /* ...other properties */;
  }>;
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
};

export const getUserPlaylists = async (
  accessToken,
  offset?: number
): Promise<SpotifyUserPlaylistsResponse> => {
  // Fetch the user's playlists
  const res = await fetch(
    `https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset ?? 0}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok) {
    throw new Error("Error fetching playlists");
  }

  const data = await res.json();

  return data;
};

export const playTrack = async (trackUri, accessToken) => {
  // Send a request to the Spotify API to play the track
  await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uris: [trackUri], // Array of track URIs to play
    }),
  });
};

export const playPlaylist = async (playlistUri, accessToken) => {
  // Send a request to the Spotify API to play the track
  await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context_uri: playlistUri, // Array of track URIs to play
    }),
  });
};

export function calculatePagination(offset, limit, total) {
  const currentPage = Math.ceil((offset + 1) / limit);
  const totalPages = Math.ceil(total / limit);

  return {
    currentPage,
    totalPages,
  };
}

export type SpotifySearchResponse = {
  artists: {
    href: string;
    items: Array<{
      uri: string;
      name: string;
      external_urls: { [key: string]: string };
      popularity: number;
      // ... other artist properties
    }>;
    limit: number;
    next?: string;
    offset: number;
    previous?: string;
    total: number;
  };
  tracks: {
    href: string;
    items: Array<{
      uri: string;
      popularity: number;
      name: string;
      album: {
        album_type: string;
        // ... other album properties
      };
      artists: Array<{
        uri: string;
        name: string;
        external_urls: { [key: string]: string };
        popularity: number;
      }>;
      // ... other track properties
    }>;
    limit: number;
    next?: string;
    offset: number;
    previous?: string;
    total: number;
  };
};

export const searchSpotify = async (
  userInput: string,
  accessToken: string,
  offset?: number,
  limit: number = 20
): Promise<SpotifySearchResponse> => {
  const query = encodeURIComponent(userInput);
  const types = "track";

  // Make the request to search for tracks
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=${types}&offset=${
      offset ?? 0
    }&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error searching Spotify");
  }

  const data = await response.json();
  return data;
};
