import React, { useState, useEffect } from "react";

const CountdownTimer = ({ seconds }) => {
  const [timeRemaining, setTimeRemaining] = useState(seconds);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timerId = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timerId); // Cleanup the interval on component unmount
    }
  }, [timeRemaining]);

  return <div>{timeRemaining}</div>;
};

export default CountdownTimer;
