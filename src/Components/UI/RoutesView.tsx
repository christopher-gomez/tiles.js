/* eslint-disable */
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import LoadSpinner from "../../Components/UI/LoadSpinner";
import { Box, CircularProgress, Typography } from "@mui/material";
import Tools from "../../lib/utils/Tools";
import "./RoutesContainer.css";

// const routes = [
//   {
//     to: "/sandbox",
//     label: "Sandbox",
//     description: "Explore the library.",
//     href: undefined,
//   },
//   {
//     description: "Play Catan.",
//     to: "/catan",
//     label: "Catan",
//     href: undefined,
//   },
//   {
//     to: undefined,
//     label: "GitHub",
//     description: "Explore the codebase.",
//     href: "https://github.com/christophgomez/threejs-tilemap",
//   },
//   {
//     to: "/cards",
//     label: "Cards",
//     description: "Explore the Cards.",
//     href: undefined,
//   },
// ];

export const RouteMenuButton = ({
  to,
  href,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  children,
  style,
  noMove,
}: {
  onPointerLeave?: () => void;
  onPointerEnter?: (enterSide?: string) => void;
  onPointerMove?: (side?: string) => void;
  to?: string;
  href?: string;
  onClick?: () => void;
  children?: string | JSX.Element;
  style?: React.CSSProperties;
  noMove?: boolean;
}) => {
  const bounds = React.useRef<DOMRect>(null);
  const el = React.useRef<HTMLAnchorElement>(null);

  const [highlightSide, setHighlightSide] = React.useState("right");

  React.useEffect(() => {
    if (el.current) {
      bounds.current = el.current.getBoundingClientRect();
    }
  }, [el]);

  return (
    <>
      {to !== undefined && (
        <Link
          ref={el}
          className={
            "route-menu-button" +
            (to === undefined && href === undefined && onClick === undefined
              ? " disabled"
              : "") +
            " " +
            highlightSide +
            (noMove !== undefined && noMove === true
              ? " no-move"
              : noMove === undefined || noMove === false
              ? ""
              : "")
          }
          style={style}
          to={to}
          onPointerLeave={() => {
            setHighlightSide("");
            if (onPointerLeave) onPointerLeave();
          }}
          onPointerEnter={(event) => {
            let side = "";
            if (el.current) {
              const bounds = el.current.getBoundingClientRect();
              if (event.clientX < bounds.left + bounds.width / 2) {
                setHighlightSide("left");
                side = "left";
              } else {
                setHighlightSide("right");
                side = "right";
              }
            }
            if (onPointerEnter) onPointerEnter(side);
          }}
          onPointerMove={(event) => {
            let side = "";
            if (el.current) {
              const bounds = el.current.getBoundingClientRect();
              if (event.clientX < bounds.left + bounds.width / 2) {
                setHighlightSide("left");
                side = "left";
              } else {
                setHighlightSide("right");
                side = "right";
              }
            }
            if (onPointerMove) onPointerMove(side);
          }}
        >
          {children}
        </Link>
      )}
      {to === undefined && (
        <a
          ref={el}
          className={
            "route-menu-button" +
            (href === undefined && onClick === undefined ? " disabled" : "") +
            " " +
            highlightSide +
            (noMove !== undefined && noMove === true
              ? " no-move"
              : noMove === undefined || noMove === false
              ? ""
              : "")
          }
          style={style}
          onClick={() => {
            if (onClick) onClick();
          }}
          href={href}
          target={href ? "_blank" : undefined}
          rel={href ? "noopener noreferrer" : undefined}
          onPointerLeave={() => {
            setHighlightSide("");
            if (onPointerLeave) onPointerLeave();
          }}
          onPointerEnter={(event) => {
            let side = "";
            if (el.current && (onClick !== undefined || href !== undefined)) {
              const bounds = el.current.getBoundingClientRect();
              if (event.clientX < bounds.left + bounds.width / 2) {
                setHighlightSide("left");
                side = "left";
              } else {
                setHighlightSide("right");
                side = "right";
              }
            }
            if (onPointerEnter) onPointerEnter(side);
          }}
          onPointerMove={(event) => {
            let side = "";
            if (el.current && (onClick !== undefined || href !== undefined)) {
              const bounds = el.current.getBoundingClientRect();
              if (event.clientX < bounds.left + bounds.width / 2) {
                setHighlightSide("left");
                side = "left";
              } else {
                setHighlightSide("right");
                side = "right";
              }
            }
            if (onPointerMove) onPointerMove(side);
          }}
        >
          {children}
        </a>
      )}
    </>
  );
};

export default ({
  title = "Tiles.js",
  defaultDescription,
  onLinksSlideComplete,
  onInitialIntro,
  initialIntroLength = 500,
  onLoadSpinnerToggled,
  onPointerEnterLink,
  onPointerLeaveLink,
  routes,
  children,
  loading,
  animCompleteLinkSlideDelay = 250,
  containerBlur: blur = false,
  containerBackground: background = false,
  overlayBackground = false,
  overlayBlur = false,
  overlayBlurBackgroundStyle = {
    blurAmount: 20,
    backgroundColor: "rgba(0,0,0,.25)",
  },
  containerBlurBackgroundStyle = {
    blurAmount: 5,
    backgroundColor: "rgba(0,0,0,.25)",
  },
  containerWidth,
}: {
  defaultDescription: string;
  loading: boolean;
  onLinksSlideComplete?: () => void;
  onInitialIntro?: () => void;
  initialIntroLength?: number;
  onLoadSpinnerToggled?: (active: boolean) => void;
  onPointerEnterLink?: () => void;
  onPointerLeaveLink?: () => void;
  routes?: Array<{
    to?: string;
    label: string;
    description: string;
    href?: string;
    onClick?: () => void;
  }>;
  children?: JSX.Element;
  animCompleteLinkSlideDelay?: number;
  title?: string;
  overlayBlur?: boolean;
  overlayBackground?: boolean;
  overlayBlurBackgroundStyle?: {
    blurAmount: number;
    backgroundColor: string;
  };
  containerBlur?: boolean;
  containerBackground?: boolean;
  containerBlurBackgroundStyle?: {
    blurAmount: number;
    backgroundColor: string;
  };
  containerWidth?: number;
}) => {
  const [loadShowing, setLoadShowing] = React.useState(true);

  React.useEffect(() => {
    if (!loadShowing) {
      let i = 0;

      const setNextLink = () => {
        if (
          (routes === undefined && i >= 1) ||
          (routes !== undefined && i >= routes.length + 1)
        ) {
          if (onLinksSlideComplete !== undefined) onLinksSlideComplete();
          return;
        }

        const links = [...linkSlide];

        for (let j = 0; j <= i; j++) links[j] = true;

        setLinkSlide(links);

        if (i == 0) {
          window.setTimeout(() => {
            i++;

            if (onInitialIntro !== undefined) onInitialIntro();

            window.setTimeout(
              () => {
                setAnimOver(true);
                window.setTimeout(() => {
                  setNextLink();
                }, animCompleteLinkSlideDelay);
              },
              onInitialIntro === undefined ? 0 : initialIntroLength
            );
          }, 1000);
        } else {
          window.setTimeout(() => {
            i++;
            setNextLink();
          }, 275);
        }
      };

      setNextLink();
    } else {
      const _links = [...linkSlide];

      for (let i = 0; i < _links.length; i++) {
        _links[i] = false;
      }

      setLinkSlide(_links);
    }
  }, [loadShowing]);

  const [activeLink, setActiveLink] = React.useState(-1);
  const activeLinkRef = useRef(activeLink);

  React.useEffect(() => {
    activeLinkRef.current = activeLink;

    if (activeLink !== -1 && tRef.current) window.clearTimeout(tRef.current);
    else if (
      activeLink === -1 &&
      ((description !== defaultDescription && linkSlide[0]) || !linkSlide[0])
    ) {
      setDescription(defaultDescription);
    }
  }, [activeLink]);

  const [linkSlide, setLinkSlide] = React.useState(
    new Array<boolean>(routes === undefined ? 1 : routes.length + 1)
  );

  const tRef = React.useRef(null);

  const timeOutTime = 100;
  const setNoneActive = (withTime = true) => {
    window.clearTimeout(tRef.current);

    if (withTime) {
      tRef.current = window.setTimeout(() => {
        let noneHovered = true;

        let linkElements = document.querySelectorAll("div.link-text");

        linkElements.forEach((el) => {
          if (!noneHovered) return;

          if (el.matches(":hover")) {
            noneHovered = false;
            return;
          }
        });

        if (noneHovered) {
          linkElements = document.querySelectorAll("div.link-text>a");

          linkElements.forEach((el) => {
            if (!noneHovered) return;

            if (el.matches(":hover")) {
              noneHovered = false;
              return;
            }
          });
        }

        if (noneHovered) setActiveLink(-1);
      }, timeOutTime);
    } else {
      setActiveLink(-1);
    }
  };

  const [description, setDescription] = React.useState(defaultDescription);
  const descriptionRef = React.useRef(description);
  const [isSlid, setIsSlide] = React.useState(true);

  const dTO = React.useRef(null);
  React.useEffect(() => {
    if (dTO.current) window.clearTimeout(dTO.current);

    if (isSlid) {
      dTO.current = window.setTimeout(() => {
        setIsSlide(true);
        descriptionRef.current = description;
      }, 50);

      setIsSlide(false);
    } else {
      setIsSlide(true);
    }
  }, [description]);

  const [animOver, setAnimOver] = React.useState(false);

  React.useEffect(() => {
    setDescription(defaultDescription);
  }, [defaultDescription]);

  let _routes;
  if (routes === undefined) _routes = [];
  else _routes = routes;

  const routesRef = useRef<
    {
      to?: string;
      label: string;
      description: string;
      href?: string;
      onClick?: () => void;
    }[]
  >(null);

  useEffect(() => {
    if (routes !== undefined) routesRef.current = routes;
  }, [routes]);

  const [isMouse, setIsMouse] = React.useState(true);
  const isMouseRef = useRef(true);

  useEffect(() => {
    isMouseRef.current = isMouse;
  }, [isMouse]);

  React.useEffect(() => {
    const mouseListener = () => {
      if (!isMouseRef.current) setIsMouse(true);
    };
    document.addEventListener("mousemove", mouseListener);

    const inputListener = Tools.createOnDirectionalInputDownListener(
      () => {
        if (!routesRef.current || routesRef.current.length === 0) return;

        if (isMouseRef.current) setIsMouse(false);

        let cur = activeLinkRef.current;
        let nextLink = 0;
        do {
          nextLink = cur - 1;
          if (nextLink < 0) nextLink = routesRef.current.length - 1;
          cur = nextLink;
        } while (
          routesRef.current[nextLink].onClick === undefined &&
          routesRef.current[nextLink].href === undefined &&
          routesRef.current[nextLink].to === undefined
        );

        setActiveLink(nextLink);
      },
      () => {
        if (!routesRef.current || routesRef.current.length === 0) return;

        if (isMouseRef.current) setIsMouse(false);

        let cur = activeLinkRef.current;
        let nextLink = 0;
        do {
          nextLink = cur + 1;
          if (nextLink > routesRef.current.length - 1) nextLink = 0;
          cur = nextLink;
        } while (
          routesRef.current[nextLink].onClick === undefined &&
          routesRef.current[nextLink].href === undefined &&
          routesRef.current[nextLink].to === undefined
        );

        if (nextLink > routesRef.current.length - 1) nextLink = 0;
        setActiveLink(nextLink);
      }
    );

    document.addEventListener("keydown", inputListener);

    return () => {
      document.removeEventListener("keydown", inputListener);
      document.removeEventListener("mousemove", mouseListener);
    };
  }, []);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [_containerWidth, setContainerWidth] = React.useState(containerWidth);

  useEffect(() => {
    if (containerWidth !== undefined) setContainerWidth(containerWidth);
  }, [containerWidth]);

  useEffect(() => {
    if (containerRef.current) {
      if (containerWidth === undefined) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
    }
  }, [containerRef]);

  const [side, setSide] = React.useState("");

  return (
    <>
      <LoadSpinner
        loading={loading}
        onToggled={(active) => {
          if (onLoadSpinnerToggled !== undefined) onLoadSpinnerToggled(active);
          setLoadShowing(active);
        }}
      />
      <div
        className={`overlay ${isMouse ? "mouseInput" : "buttonInput"}`}
        style={{
          backdropFilter: overlayBlur
            ? `blur(${overlayBlurBackgroundStyle.blurAmount}px)`
            : "blur(0px)",
          backgroundColor: overlayBackground
            ? overlayBlurBackgroundStyle.backgroundColor
            : "rgba(0,0,0,0)",
        }}
      >
        <div
          ref={containerRef}
          onPointerLeave={() => {
            if (!linkSlide[linkSlide.length - 1]) return;

            setNoneActive(false);
            if (onPointerLeaveLink !== undefined) onPointerLeaveLink();
          }}
          onPointerEnter={() => {
            if (!linkSlide[linkSlide.length - 1]) return;

            if (onPointerEnterLink !== undefined) onPointerEnterLink();
          }}
          style={{
            display: "flex",
            flexFlow: "column",
            alignContent: "center",
            alignItems: "center",
            padding: "1em 2em",
            backdropFilter:
              animOver && blur
                ? `blur(${containerBlurBackgroundStyle.blurAmount}px)`
                : "blur(0px)",
            backgroundColor:
              animOver && background
                ? containerBlurBackgroundStyle.backgroundColor
                : "rgba(0,0,0,0)",
            borderRadius: "1em",
            transition:
              "all 1s, background-color 1s ease-in, backdrop-filter 1s ease-in",
            overflow: "hidden",
            width: _containerWidth ?? "auto",
            maxWidth: _containerWidth ?? "auto",
            minWidth: _containerWidth ?? "auto",
          }}
        >
          {/* Tile and Link Description */}
          <div style={{ width: "100%" }}>
            <h1
              className={`link-text ${
                linkSlide[0] ? "visible slide-fade-in" : "slide-fade-in"
              }`}
            >
              {title}
            </h1>
            <hr
              className={`link-text ${
                linkSlide[0] ? "visible slide-fade-in" : "slide-fade-in"
              }`}
            />
            <h3
              style={{ opacity: isSlid ? "1 !important" : "0 !important" }}
              className={`link-text ${
                linkSlide[0] && isSlid
                  ? "visible slide-fade-in"
                  : "slide-fade-in"
              }`}
            >
              {descriptionRef.current}
            </h3>
          </div>
          {/*Routes Container*/}
          {
            <div className={`routes-container ${animOver ? "" : "hidden"}`}>
              {_routes.map((link, i) => (
                <div
                  className={`link-text ${linkSlide[i + 1] ? "visible" : ""} ${
                    i === activeLink
                      ? "active"
                      : activeLink === -1
                      ? ""
                      : "not-active"
                  } ${isMouse ? "mouseInput" : "buttonInput"} ${side}`}
                  style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    justifyItems: "center",
                    alignContent: "center",
                    alignItems: "center",
                    flexFlow: "row",
                  }}
                  key={i}
                >
                  {/* {(side === "" || side === "right") && (
                    <CircularProgress
                      thickness={4}
                      color={"info"}
                      size={20}
                      sx={{
                        marginRight: "-.25em",
                        color:
                          i === activeLink
                            ? "white !important"
                            : "transparent !important",
                      }}
                      onPointerEnter={() => {
                        if (!linkSlide[linkSlide.length - 1]) return;
                        if (onPointerEnterLink !== undefined)
                          onPointerEnterLink();
                      }}
                    />
                  )} */}
                  <RouteMenuButton
                    key={"routes-button-" + i}
                    {...link}
                    onPointerLeave={() => {
                      if (!linkSlide[linkSlide.length - 1]) return;

                      window.clearTimeout(tRef.current);
                      setSide("");
                      setNoneActive();
                    }}
                    onPointerEnter={(side) => {
                      if (!linkSlide[linkSlide.length - 1]) return;

                      if (
                        link.to === undefined &&
                        link.href === undefined &&
                        link.onClick === undefined
                      )
                        return;

                      setActiveLink(i);
                      setDescription(link.description);
                      setSide(side);

                      if (onPointerEnterLink !== undefined)
                        onPointerEnterLink();
                    }}
                    onPointerMove={(side) => {
                      if (!linkSlide[linkSlide.length - 1]) return;

                      if (
                        link.to === undefined &&
                        link.href === undefined &&
                        link.onClick === undefined
                      )
                        return;

                      setSide(side);
                    }}
                  >
                    {link.label}
                  </RouteMenuButton>
                  {/* {side === "left" && (
                    <CircularProgress
                      thickness={4}
                      color={"info"}
                      size={20}
                      sx={{
                        marginRight: "-.25em",
                        color:
                          i === activeLink
                            ? "white !important"
                            : "transparent !important",
                      }}
                      onPointerEnter={() => {
                        if (!linkSlide[linkSlide.length - 1]) return;
                        if (onPointerEnterLink !== undefined)
                          onPointerEnterLink();
                      }}
                    />
                  )} */}
                  <br />
                </div>
              ))}
            </div>
          }
        </div>
        <br />
        {children}
      </div>
    </>
  );
};
