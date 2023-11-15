import React from "react";
import "./styles.css";

export default ({
  children,
  rotateX = true,
  rotateY = true,
  translate,
  perspective = 1000,
  animDurSeconds = 1,
}: {
  children?: JSX.Element;
  rotateX?: boolean;
  rotateY?: boolean;
  translate?: number;
  perspective?: number;
  animDurSeconds?: number;
}) => {
  // const [rotation, setRotation] = React.useState({ x: 0, y: 0 });
  const [canRotate, setCanRotate] = React.useState(false);
  // const canUpdateRotation = React.useRef(true);
  // const rotationTimeoutID = React.useRef(null);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(mouseLeaveID.current);
      window.clearTimeout(timeRef.current);
    };
  }, []);

  const timeRef = React.useRef(null);
  const elRef = React.useRef(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    window.clearTimeout(mouseLeaveID.current);

    if (!canRotate && timeRef.current === null) {
      timeRef.current = window.setTimeout(() => {
        setCanRotate(true);
        timeRef.current = null;
      }, 300);

      return;
    }

    // if (!canUpdateRotation.current) {
    //   if (rotationTimeoutID.current) return;

    //   rotationTimeoutID.current = window.setTimeout(() => {
    //     rotationTimeoutID.current = null;
    //     canUpdateRotation.current = true;
    //   }, 150);

    //   return;
    // }

    const card = e.currentTarget;
    const cardRect = card.getBoundingClientRect();

    // Calculate cursor position relative to card center
    const x =
      (e.clientX - cardRect.left - cardRect.width / 2) / (cardRect.width / 2);
    const y =
      (e.clientY - cardRect.top - cardRect.height / 2) / (cardRect.height / 2);

    card.style.transform = `perspective(${perspective}px) rotateX(${
      rotateY ? Math.round(y * 10) : 0
    }deg) rotateY(${rotateX ? Math.round(x * 10) : 0}deg) translateZ(${
      translate === undefined ? cardRect.width / 3 : translate
    }px)`;
    elRef.current = card;
  };

  const mouseLeaveID = React.useRef(null);
  const handleMouseLeave = () => {
    window.clearTimeout(mouseLeaveID.current);

    mouseLeaveID.current = window.setTimeout(() => {
      window.clearTimeout(timeRef.current);
      timeRef.current = null;
      setCanRotate(false);
      if (elRef.current) elRef.current.style.transform = "translateZ(0px)";
    }, 100);
  };

  return (
    <React.Fragment>
      {React.cloneElement(children, {
        onMouseMove: handleMouseMove,
        onMouseLeave: handleMouseLeave,
        style: {
          padding: "1em",
          transition: `transform ${animDurSeconds}s ease .1s`,
          transform: "translateZ(0px)",
        },
      })}
    </React.Fragment>
  );
};
