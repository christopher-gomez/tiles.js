import React, { useState } from "react";
import "./TextCarousel.css";

export default ({ texts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((currentIndex + 1) % texts.length);
  };

  const prev = () => {
    setCurrentIndex((currentIndex - 1 + texts.length) % texts.length);
  };

  return (
    <div className="carousel-container">
      <button onClick={prev}>Previous</button>
      <div className="carousel-content">
        <div className="text-item">{texts[currentIndex]}</div>
        <div className="next-item">
          {texts[(currentIndex + 1) % texts.length]}
        </div>
      </div>
      <button onClick={next}>Next</button>
    </div>
  );
};
