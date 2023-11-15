import React, { useState, useEffect } from "react";
import "./index.css";

function VideoCrossfader({ videos }: { videos: Array<string> }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % videos.length);
    }, 5000); // crossfade every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="video-container">
      {videos.map((video, index) => (
        <video
          key={video}
          src={video}
          autoPlay
          loop
          muted
          className={index === activeIndex ? "active" : ""}
        />
      ))}
    </div>
  );
}

export default VideoCrossfader;
