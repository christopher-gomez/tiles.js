import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Draggable from "react-draggable"; // Import the Draggable component
import AnimationManager from "../../lib/utils/AnimationManager";
import FPSCounter from "./FPSCounter";
import { Box, CardHeader, SxProps, Theme } from "@mui/material";
import * as THREE from "three";
import "./HoverCard.css";
import { PLAYER_CONTROLS_ZINDEX } from "../../Spotify/PlayerComponent";

export const HoverCardMenu = ({
  menus,
  curMenu = 0,
  open = true,
  height,
  width,
  canDrag = true,
  headerAction,
  allowOverflow = true,
}: {
  allowOverflow?: boolean;
  height?: number | string;
  width?: number | string;
  open?: boolean;
  menus: Array<{
    title?: string;
    content?: JSX.Element;
    body?: string;
    image?: string;
    actions?: Array<JSX.Element>;
    overrideAlign?: boolean;
    constainWidth?: boolean;
  }>;
  canDrag?: boolean;
  curMenu?: number;
  headerAction?:
    | string
    | number
    | boolean
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | React.ReactFragment
    | React.ReactPortal
    | (true &
        React.ReactElement<any, string | React.JSXElementConstructor<any>>)
    | (true & React.ReactFragment)
    | (true & React.ReactPortal);
}) => {
  // const [cur, setCur] = useState(0);
  // const [menus, setMenus] = useState([
  //   {
  //     title: "Menu 1",
  //     content: (
  //       <>
  //         <Typography>OK</Typography>
  //         <Typography>OK</Typography>
  //       </>
  //     ),
  //   },
  //   {
  //     title: "Menu 2",
  //     content: (
  //       <>
  //         <Typography>K</Typography>
  //       </>
  //     ),
  //   },
  // ]);

  if (!menus || menus.length === 0) return null;

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "absolute",
        justifyContent: "center",
        transition: "opacity 1s",
        pointerEvents: "all",
        display: "flex",
        alignContent: "center",
        alignItems: "center",
        justifyItems: "center",
        zIndex: PLAYER_CONTROLS_ZINDEX + 1,
      }}
    >
      <HoverCard
        allowOverflow={allowOverflow}
        autoHeight={true}
        headerAction={headerAction}
        canDrag={canDrag}
        height={height}
        width={width}
        open={open}
        canRotate={false}
        orient="horizontal"
        mediaWindowStyle="cover"
        image={menus[curMenu].image}
        title={menus[curMenu].title}
        cardContent={menus[curMenu].content}
        actions={menus[curMenu].actions}
        body={menus[curMenu].body}
        overrideBodyAlign={menus[curMenu].overrideAlign}
        constrainWidth={
          menus[curMenu].constainWidth === undefined
            ? undefined
            : menus[curMenu].constainWidth
        }
      />
    </div>
  );
};

const HoverCard = ({
  title,
  body,
  actions,
  open,
  setOpen,
  children,
  orient = "vertical",
  animationManager,
  image,
  mediaWindowStyle = "contain",
  canRotate = true,
  cardContent,
  overrideBodyAlign,
  constrainWidth,
  mediaWindowSX = {},
  backgroundShadow = "dark",
  borderColor = "dark",
  height,
  width,
  canDrag = false,
  headerAction,
  autoHeight = false,
  allowOverflow = false,
}: {
  allowOverflow?: boolean;
  autoHeight?: boolean;
  height?: number | string;
  width?: number | string;
  title?: string;
  body?: string;
  actions?: Array<JSX.Element>;
  open: boolean;
  setOpen?: (open: boolean) => void;
  children?: JSX.Element;
  orient?: "vertical" | "horizontal";
  animationManager?: AnimationManager;
  image?: string;
  mediaWindowStyle?: "cover" | "contain";
  canRotate?: boolean;
  cardContent?: JSX.Element;
  overrideBodyAlign?: boolean;
  constrainWidth?: boolean;
  mediaWindowSX?: SxProps<Theme>;
  backgroundShadow?: "light" | "dark" | "none";
  borderColor?: "light" | "dark" | "none";
  canDrag?: boolean;
  headerAction?:
    | string
    | number
    | boolean
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | React.ReactFragment
    | React.ReactPortal
    | (true &
        React.ReactElement<any, string | React.JSXElementConstructor<any>>)
    | (true & React.ReactFragment)
    | (true & React.ReactPortal);
}) => {
  if (!orient) orient = "vertical";
  if (!mediaWindowStyle) mediaWindowStyle = "contain";

  const cardRect = React.useRef(null);

  const animManRef = React.useRef<AnimationManager>(null);
  const rot = React.useRef({ x: 0, y: 0 });
  const prevRot = React.useRef(rot.current);
  const canRot = React.useRef(canRotate);

  useEffect(() => {
    if (canRotate === undefined && !canDrag) canRotate = true;

    canRot.current = canRotate;
  }, [canRotate]);

  const onAnim = (dt) => {
    if (cardRef.current && mouseEntered.current && !canDrag) {
      if (canRot.current) {
        const targetX = THREE.MathUtils.lerp(
          prevRot.current.x,
          rot.current.x,
          0.05
        );
        const targetY = THREE.MathUtils.lerp(
          prevRot.current.y,
          rot.current.y,
          0.05
        );
        cardRef.current.style.transform = `perspective(3000px) rotateX(${targetX}deg) rotateY(${targetY}deg) translateZ(100px)`;
      } else {
        cardRef.current.style.transform = `perspective(3000px) translateZ(100px)`;
      }
    }
  };

  const animID = React.useRef(null);
  React.useEffect(() => {
    animManRef.current = animationManager;

    if (animManRef.current) {
      animID.current = animManRef.current.addOnAnimateListener(onAnim);
    }

    return () => {
      if (animManRef.current) {
        animManRef.current.removeOnAnimateListener(animID.current);
      }
    };
  }, [animationManager]);

  React.useEffect(() => {
    return () => {
      if (animManRef.current) {
        animManRef.current.removeOnAnimateListener(animID.current);
      }
    };
  }, []);

  const handleMouseMove = (e) => {
    if (canDrag) return;

    if (!canRot.current) return;

    if (!cardRect.current) {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      cardRect.current = rect;
    }
    // Calculate cursor position relative to card center
    const x =
      (e.clientX - cardRect.current.left - cardRect.current.width / 2) /
      (cardRect.current.width / 2);
    const y =
      (e.clientY - cardRect.current.top - cardRect.current.height / 2) /
      (cardRect.current.height / 2);

    cardRef.current.style.transition = "transform 0s";
    if (cardRef.current && !animManRef.current) {
      cardRef.current.style.transform = `perspective(3000px) rotateX(${
        true ? -y * 10 : 0
      }deg) rotateY(${true ? x * 10 : 0}deg) translateZ(100px)`;
    } else {
      prevRot.current = rot.current;
      rot.current = { x: -y * 10, y: x * 10 };
    }

    // Use relative position to set rotation
    // setRotation({ x: -y * 10, y: x * 10 });
  };

  const mouseEntered = React.useRef(false);

  const handleMouseLeave = () => {
    // Reset rotation when the cursor leaves the card
    // setRotation({ x: 0, y: 0 });

    if (!canDrag) {
      mouseEntered.current = false;
      rot.current = { x: 0, y: 0 };
      prevRot.current = { x: 0, y: 0 };
      cardRef.current.style.transition = "transform 0.3s";
      cardRef.current.style.transform = `translateZ(0px)`;
    }
  };

  const cardRef = React.useRef<HTMLDivElement>(null);

  const [pos, setPos] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  if (height === undefined) {
    height = orient === "vertical" ? 275 : 200;
  }

  if (width === undefined) {
    width =
      constrainWidth !== undefined && constrainWidth === false
        ? "100%"
        : orient === "vertical"
        ? 200
        : 400;
  }

  return (
    <Draggable disabled={!canDrag} scale={1} bounds="body">
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => (mouseEntered.current = true)}
        onMouseOut={() => (mouseEntered.current = false)}
        ref={cardRef}
        onClick={() => {
          if (!open && setOpen !== undefined) setOpen(true);
        }}
        className={`card-flip ${
          open ? "flipped" : ""
        } shadow-${backgroundShadow} border-${borderColor} ${
          canDrag ? "draggable-cursor" : ""
        }`} // Apply CSS classes for flip animation
        style={{
          zIndex: 999999,

          width: width,
          maxWidth: width,
          minWidth: width,
          height: autoHeight ? "auto" : height,
          maxHeight: height,
          borderRadius: "1em",
          transform: `translateZ(0px)`,
          boxShadow: open ? "0px 0px 10px rgba(0, 0, 0, 1)" : "none", // Add a shadow on hover
          display: "flex",
          flexFlow: "column",
          padding: '0 !important'
        }}
      >
        {headerAction !== undefined && (
          <CardHeader action={headerAction} sx={{ paddingBottom: 0 }} />
        )}
        {allowOverflow && title !== undefined && (
          <Typography gutterBottom variant="h5" component="div">
            {title}
          </Typography>
        )}
        <div
          className="card-content card-front"
          style={{
            display: "flex",
            flexFlow: orient === "horizontal" ? "row" : "column",
            justifyContent: "center",
            alignItems: allowOverflow
              ? "start"
              : cardContent === undefined ||
                (cardContent !== undefined &&
                  overrideBodyAlign === undefined) ||
                (cardContent !== undefined &&
                  overrideBodyAlign !== undefined &&
                  overrideBodyAlign === false)
              ? "center"
              : "inherit",
            overflowY: allowOverflow
              ? "scroll"
              : cardContent !== undefined
              ? "visible"
              : "hidden",
          }}
        >
          {(children !== undefined || image !== undefined) && (
            <CardMedia
              sx={{
                padding: mediaWindowStyle === "contain" ? ".5em .75em" : 0,
                paddingBottom: 0,
                maxWidth:
                  orient === "vertical"
                    ? "100%"
                    : mediaWindowStyle === "contain"
                    ? "40%"
                    : body === undefined && title === undefined
                    ? "100%"
                    : "50%",
                minWidth:
                  orient === "vertical"
                    ? body === undefined && title === undefined
                      ? "100%"
                      : "auto"
                    : mediaWindowStyle === "contain"
                    ? "40%"
                    : body === undefined && title === undefined
                    ? "100%"
                    : "50%",
                minHeight: 137.5,
                maxHeight: mediaWindowStyle === "contain" ? "auto" : "100%",
                height: mediaWindowStyle === "contain" ? "auto" : "100%",
                // maxHeight: 137.5,
                objectFit: "contain",
                objectPosition: "center",
                overflow: "hidden",
                "> img": {
                  objectFit: mediaWindowStyle,
                  objectPosition: "center",
                  maxHeight: "100%",
                  maxWidth: "100%",
                  height: "100%",
                  width: "100%",
                  borderRadius:
                    mediaWindowStyle === "cover"
                      ? 0
                      : orient === "vertical"
                      ? "1em 1em .25em .25em"
                      : "1em",
                  border:
                    mediaWindowStyle === "contain" ? ".2em solid #000" : "none", // Add a border to create the inset effect
                  boxShadow:
                    mediaWindowStyle === "contain"
                      ? "inset 0 0 20px rgba(0, 0, 0, 1)"
                      : "none", // Add a subtle shadow
                  margin: orient === "vertical" ? "auto -50%" : "0",
                },
                "> canvas": {
                  maxHeight: "100%",
                  maxWidth: "100%",
                  height: "100%",
                  width: "100%",
                  borderRadius:
                    orient === "vertical" ? "1em" : "1em",
                  border:
                    mediaWindowStyle === "cover" ? "none" : ".2em solid #000", // Add a border to create the inset effect
                  background: "#0f0f0f", // Set a background color for the inset
                  boxShadow: "inset 0 0 20px rgba(0, 0, 0, 1)", // Add a subtle shadow
                  margin: orient === "vertical" ? "auto -50%" : "0",
                },
                ...mediaWindowSX,
              }}
            >
              {children !== undefined && children}
              {image !== undefined && <img src={image} draggable="false" />}
            </CardMedia>
          )}
          {(title !== undefined ||
            body !== undefined ||
            cardContent !== undefined) &&
            open && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flex: "1 1 auto",
                  overflowY: allowOverflow
                    ? "scroll"
                    : cardContent !== undefined
                    ? "visible"
                    : "hidden",
                }}
              >
                <CardContent
                  sx={{
                    flex: "1 0 auto",
                    margin: ".5em .75em !important",
                    borderRadius: "0em 0em 1em 1em",
                    overflowY: allowOverflow
                      ? "scroll"
                      : cardContent !== undefined
                      ? "visible"
                      : "hidden",
                    marginTop:
                      headerAction !== undefined ? "0 !important" : ".5em",
                    paddingTop: headerAction !== undefined ? 0 : "16px",
                    // border: ".2em solid #000", // Add a border to create the inset effect
                    // backgroundColor: "#ffffff", // Set a background color for the inset
                  }}
                >
                  {!allowOverflow && title !== undefined && (
                    <Typography gutterBottom variant="h5" component="div">
                      {title}
                    </Typography>
                  )}
                  {body !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      {body}
                    </Typography>
                  )}
                  {cardContent !== undefined && cardContent}
                </CardContent>
              </Box>
            )}
          {actions !== undefined && (
            <Box
              sx={{
                display: "flex",
                alignItems: "end",
                pl: 1,
                pb: 1,
                justifyContent: "center",
                justifyItems: "end",
              }}
            >
              <CardActions>
                {actions.map((action) => action)}
                {/* <Button size="small">Share</Button>
                <Button size="small">Learn More</Button> */}
              </CardActions>
            </Box>
          )}
        </div>
        {/* <div className="card-content card-back">
        <img src={cardBack} alt="Card Back" />
      </div> */}
      </div>
    </Draggable>
  );
};

export default HoverCard;
