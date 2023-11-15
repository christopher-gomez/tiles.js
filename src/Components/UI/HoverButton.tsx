import { Button, ButtonProps, SxProps, Theme } from '@mui/material';
import React from 'react';

type props = Omit<ButtonProps, "variant">

export default ({ children, sx, fromVariant, toVariant, size, onClick, ...others }: { fromVariant?: "text" | "outlined" | "contained", toVariant?: "text" | "outlined" | "contained", size?: "small" | "medium" | "large", children: string | React.ReactNode | React.ReactNode[], sx?: SxProps<Theme>, onClick?: React.MouseEventHandler<HTMLButtonElement> } & props) => {
    const [hovered, setHovered] = React.useState(false);

    return (
        <Button {...others} disabled={others.disabled} onClick={onClick} variant={hovered ? toVariant ?? "contained" : fromVariant ?? "outlined"} onMouseEnter={(e) => { setHovered(true); if (others.onMouseEnter) others.onMouseEnter(e) }} onMouseLeave={(e) => { setHovered(false); if (others.onMouseLeave) others.onMouseLeave(e) }} sx={sx} size={size ?? "small"} >{children}</Button>
    )
}