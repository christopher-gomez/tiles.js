import React, { useState, useRef, useEffect } from "react";
import "./Dropdown.css";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { Paper, SvgIconTypeMap } from "@mui/material";

function Dropdown({
  options,
  style,
  children,
  color = "white",
  direction = "down",
  IconComponent = ExpandMoreIcon,
  toggleText = "Dropdown Toggle",
  noBlur = false,
  open = false,
  closeOnSelect = true,
}: {
  closeOnSelect?: boolean;
  noBlur?: boolean;
  color?: "white" | "black";
  direction?: "down" | "up";
  IconComponent?: OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
    muiName: string;
  };
  style?: React.CSSProperties;
  toggleText?: string;
  options?: Array<{ label: string | JSX.Element; onClick: () => void }>;
  children?: JSX.Element;
  open?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);

  useEffect(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      if (direction === "down" && rect.right > window.innerWidth) {
        dropdownRef.current.style.right = 0;
        dropdownRef.current.style.left = "auto";
      }
    }
  }, [isOpen, direction]);
  const dropdownClass = `${direction} ${isOpen ? "open" : "closed"} ${color} ${
    noBlur ? "no-blur" : ""
  }`;
  const textClass = `${isOpen ? "open" : "closed"} ${color}`;
  const toggleClass = `${isOpen ? "open" : "closed"} ${color} ${
    noBlur ? "no-blur" : ""
  }`;

  return (
    <Paper className={`dropdown ${dropdownClass}`} style={style}>
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={() => setIsOpen(!isOpen)}
        className={`dropdown-toggle ${toggleClass}`}
      >
        <span className={`toggle-text ${textClass}`}>{toggleText}</span>
        <IconComponent className={`icon ${dropdownClass}`} />
      </button>
      <div ref={dropdownRef} className={`dropdown-menu ${dropdownClass}`}>
        {options && (
          <ul>
            {options.map((opt) => (
              <li
                onClick={(e) => {
                  opt.onClick();

                  if (closeOnSelect) setIsOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
        {options === undefined && children === undefined && (
          <ul>
            <li
              onClick={() => {
                if (closeOnSelect) setIsOpen(false);
              }}
            >
              Option 1
            </li>
            <li
              onClick={() => {
                if (closeOnSelect) setIsOpen(false);
              }}
            >
              Option 2
            </li>
            <li
              onClick={() => {
                if (closeOnSelect) setIsOpen(false);
              }}
            >
              Option 3
            </li>
          </ul>
        )}
        {children}
      </div>
    </Paper>
  );
}

export default Dropdown;
