/* eslint-disable */
import React from "react";
import { IconButton, SxProps, Theme, SvgIconProps, Box } from "@mui/material";
import { MenuTooltipText } from "./SceneSettings/MenuButton";

export default ({ sx, tips, actions, onPointerLeave, onPointerEnter }: { sx?: SxProps<Theme>, tips?: Array<{ title: string, body?: JSX.Element }>, actions: Array<{ icon: React.ReactElement<SvgIconProps>, title?: string | number | JSX.Element, onPointerDown?: () => void, onPointerUp?: () => void, disabled?: boolean, onClick?: () => void }>, onPointerLeave?: () => void, onPointerEnter?: () => void }) => {

    sx = sx ?? {};

    return (
        <Box
            component={"div"}
            sx={{
                display: 'flex',
                flexFlow: 'row',
                color: 'white',
                padding: 5,
                pt: 2,
                pb: 2,
                pointerEvents: "all",
                ...sx
            }}
            onPointerLeave={() => {
                if (onPointerLeave) onPointerLeave();
            }}
            onPointerEnter={() => {
                if (onPointerEnter) onPointerEnter();
            }}
        >
            {actions.map((action, i) => {
                const IconAction = (
                    <Box
                        sx={{ display: 'flex', flexFlow: 'column', ml: 1, mr: 1, p: 0, alignItems: 'center' }}>
                        <IconButton
                            size="large"
                            color="inherit"
                            sx={{ display: 'flex', flexFlow: 'column', width: '2em !important', height: '2em !important', p: 0, mb: .5, "&>*": { width: '2em !important', height: '2em !important', fontSize: '1.75rem' } }}
                            onPointerDown={() => {
                                if (action.onPointerDown) action.onPointerDown();
                            }}
                            onPointerUp={() => {
                                if (action.onPointerUp) action.onPointerUp();
                            }}
                            disabled={action.disabled !== undefined ? action.disabled : false}
                            onClick={() => {
                                if(action.onClick) action.onClick();
                            }}
                        >
                            {action.icon}
                        </IconButton>
                        {action.title ?? null}
                    </Box>
                )
                if (tips !== undefined && i < tips.length) {
                    return (
                        <MenuTooltipText
                            tip={
                                <Box sx={{ display: 'flex', flexFlow: 'column' }}>
                                    <Box>{tips[i].title}</Box>
                                    {tips[i].body}
                                </Box>
                            }
                            sx={{ mb: 0, width: 'unset'}}
                        >
                            {IconAction}
                        </MenuTooltipText>)
                } else {
                    return IconAction
                }
            })}
        </Box>
    )
}
