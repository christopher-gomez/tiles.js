import React from "react";
import { SpotifySearchResponse } from ".";
import { RouteMenuButton } from "../Components/UI/RoutesView";

export default ({
  searchResults,
  onClick,
}: {
  searchResults: SpotifySearchResponse;
  onClick?: (uri: string) => void;
}) => {
  if (!searchResults) return null;

  // Combine artist and track items
  const combinedResults = [
    // ...searchResults.artists.items.map((item) => ({ ...item, type: "artist" })),
    ...searchResults.tracks.items.map((item) => ({ ...item, type: "track" })),
  ];

  // Sort combined results based on some criteria (e.g., popularity)
  combinedResults.sort((a, b) => {
    // In this example, we're using popularity as the criteria.
    // Adjust as needed.
    return b.popularity - a.popularity;
  });

  return (
    <>
      {combinedResults.map((item, index) => (
        <RouteMenuButton
          noMove={true}
          onClick={() => {
            if (onClick) onClick(item.uri);
          }}
          key={index}
          style={{ color: "white" }}
        >
          {`${item.name} by ${item.artists
            .map((artist) => artist.name)
            .join(", ")}`}
        </RouteMenuButton>
      ))}
    </>
  );
};

// Usage:
// <SearchResultsList searchResults={searchResults} />
