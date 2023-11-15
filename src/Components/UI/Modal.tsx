import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  SxProps,
  Theme,
} from "@mui/material";

export default ({
  open,
  onClose,
  allowBackDropClose,
  title,
  children,
  actions,
  sx,
  onOpen,
  overlayEffect,
}: {
  open: boolean;
  onClose?: () => void;
  allowBackDropClose?: boolean;
  title?: string;
  children: JSX.Element | JSX.Element[] | string;
  actions?: JSX.Element[];
  sx?: SxProps<Theme>;
  onOpen?: () => void;
  overlayEffect?: boolean;
}) => {
  sx = sx ?? {};

  React.useEffect(() => {
    if (open !== undefined) {
      if (open) {
        if (onOpen) onOpen();
      } else {
        if (onClose) onClose();
      }
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (
          reason === "backdropClick" &&
          (allowBackDropClose === undefined || !allowBackDropClose)
        ) {
          return;
        }

        if (onClose) onClose();
      }}
      sx={{
        backgroundColor:
          overlayEffect == undefined || overlayEffect === true
            ? "rgba(0,0,0,.25) !important"
            : "none !important",
        backdropFilter:
          overlayEffect == undefined || overlayEffect === true
            ? "blur(5px) !important"
            : "none !important",
        textAlign: "left",
        pl: 2,
        pr: 2,
        "& label": {
          "::after": {
            color: "transparent",
            display: "block",
          },
        },
      }}
    >
      {title !== undefined && <DialogTitle>{title}</DialogTitle>}
      <DialogContent
        sx={{
          ...sx,
        }}
      >
        {children}
      </DialogContent>
      {actions !== undefined && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
};
